---
title: 39 · 实战：日志统计 CLI
description: 完整源码、合成输入、错误路径与升级任务。
pageClass: aip-article
---

# 39 · 实战：日志统计 CLI

学习前应能完成：[文件、流式 I/O 与 JSON](./io)、[Map、集合与逗号 ok](./maps)、[表驱动、替身与 HTTP 测试](./testing)。

本章目标：交付一个可从文件或标准输入读取日志的 CLI，具备稳定输出、错误行号与测试。

## 需求与输入契约

输入为 JSON Lines，每个非空行只有一个对象，字段只有 `level`，值为 INFO、WARN 或 ERROR。允许字段值周围空白和小写，归一化后计数；空行忽略；语法错误、未知字段或未知级别直接失败并给出行号。输出顺序固定为 INFO、WARN、ERROR。

这是合成日志的统计练习，不承担生产日志采集；单行限制为 1 MiB。退出码：0 成功，1 读取或内容失败，2 命令行用法错误。支持 `-file 路径`，不提供时读标准输入。

## 创建项目

```sh
mkdir logstats
cd logstats
go mod init example.com/logstats
```

只创建两个文件：`main.go` 和 `main_test.go`，无第三方依赖。

## main.go

```go
package main

import (
	"bufio"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"os"
	"strings"
)

type Record struct {
	Level string `json:"level"`
}

func parseRecord(line string) (string, error) {
	dec := json.NewDecoder(strings.NewReader(line))
	dec.DisallowUnknownFields()
	var record Record
	if err := dec.Decode(&record); err != nil {
		return "", fmt.Errorf("JSON 无效: %w", err)
	}
	var extra any
	if err := dec.Decode(&extra); err != io.EOF {
		return "", fmt.Errorf("一行只能包含一个 JSON 值")
	}
	level := strings.ToUpper(strings.TrimSpace(record.Level))
	switch level {
	case "INFO", "WARN", "ERROR":
		return level, nil
	default:
		return "", fmt.Errorf("未知或缺失 level: %q", record.Level)
	}
}

func summarize(r io.Reader) (map[string]int, error) {
	counts := map[string]int{"INFO": 0, "WARN": 0, "ERROR": 0}
	scanner := bufio.NewScanner(r)
	scanner.Buffer(make([]byte, 64*1024), (1<<20)+2)
	lineNo := 0
	for scanner.Scan() {
		lineNo++
		line := scanner.Text()
		if len(line) > 1<<20 {
			return nil, fmt.Errorf("第 %d 行超过 1 MiB", lineNo)
		}
		if strings.TrimSpace(line) == "" {
			continue
		}
		level, err := parseRecord(line)
		if err != nil {
			return nil, fmt.Errorf("第 %d 行: %w", lineNo, err)
		}
		counts[level]++
	}
	if err := scanner.Err(); err != nil {
		return nil, fmt.Errorf("读取第 %d 行失败（单行限 1 MiB）: %w", lineNo+1, err)
	}
	return counts, nil
}

func run(args []string, stdin io.Reader, stdout, stderr io.Writer) int {
	flags := flag.NewFlagSet("logstats", flag.ContinueOnError)
	flags.SetOutput(stderr)
	path := flags.String("file", "", "JSON Lines 文件路径，默认读标准输入")
	if err := flags.Parse(args); err != nil {
		if err == flag.ErrHelp {
			return 0
		}
		return 2
	}
	if flags.NArg() != 0 {
		fmt.Fprintln(stderr, "不接受位置参数，请使用 -file")
		return 2
	}
	input := stdin
	if *path != "" {
		file, err := os.Open(*path)
		if err != nil {
			fmt.Fprintf(stderr, "打开文件: %v\n", err)
			return 1
		}
		defer file.Close()
		input = file
	}
	counts, err := summarize(input)
	if err != nil {
		fmt.Fprintln(stderr, err)
		return 1
	}
	for _, level := range []string{"INFO", "WARN", "ERROR"} {
		if _, err := fmt.Fprintf(stdout, "%s %d\n", level, counts[level]); err != nil {
			fmt.Fprintf(stderr, "输出失败: %v\n", err)
			return 1
		}
	}
	return 0
}

func main() { os.Exit(run(os.Args[1:], os.Stdin, os.Stdout, os.Stderr)) }
```

解析与汇总函数不依赖文件名和终端，run 负责边界与退出码。只在全部解析成功后输出，避免坏行出现前已经输出部分统计结果；输出设备故障仍可能造成部分写入，应由调用方按退出码判断成功。

这里使用 encoding/json 的标准字段匹配与重复键规则，若用于严格协议需额外处理重复键。更复杂的多子命令、补全与帮助系统可复用 Cobra，不在这个单命令工具中自行实现。

## main_test.go

```go
package main

import (
	"bytes"
	"errors"
	"strings"
	"testing"
)

type brokenReader struct{}

func (brokenReader) Read([]byte) (int, error) { return 0, errors.New("模拟读取失败") }

func TestSummarize(t *testing.T) {
	input := "{\"level\":\"info\"}\n\n{\"level\":\"WARN\"}\n{\"level\":\"INFO\"}\n"
	got, err := summarize(strings.NewReader(input))
	if err != nil {
		t.Fatal(err)
	}
	if got["INFO"] != 2 || got["WARN"] != 1 || got["ERROR"] != 0 {
		t.Fatalf("错误统计: %v", got)
	}
}

func TestInvalidInput(t *testing.T) {
	cases := []struct{ name, input, want string }{
		{"未知级别", "{\"level\":\"DEBUG\"}\n", "第 1 行"},
		{"坏 JSON", "\n{\n", "第 2 行"},
		{"未知字段", "{\"level\":\"INFO\",\"extra\":1}\n", "第 1 行"},
		{"多值", "{\"level\":\"INFO\"} {}\n", "一个 JSON 值"},
		{"长行", strings.Repeat("x", (1<<20)+1), "1 MiB"},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			_, err := summarize(strings.NewReader(tc.input))
			if err == nil || !strings.Contains(err.Error(), tc.want) {
				t.Fatalf("期望包含 %q 的错误，实际 %v", tc.want, err)
			}
		})
	}
}

func TestReadFailure(t *testing.T) {
	if _, err := summarize(brokenReader{}); err == nil {
		t.Fatal("读取失败必须返回错误")
	}
}

func TestRun(t *testing.T) {
	var out, diagnostics bytes.Buffer
	code := run(nil, strings.NewReader("{\"level\":\"ERROR\"}\n"), &out, &diagnostics)
	if code != 0 || out.String() != "INFO 0\nWARN 0\nERROR 1\n" {
		t.Fatalf("code=%d out=%q err=%q", code, out.String(), diagnostics.String())
	}
	out.Reset()
	diagnostics.Reset()
	if code := run([]string{"unexpected"}, strings.NewReader(""), &out, &diagnostics); code != 2 {
		t.Fatalf("用法错误退出码 = %d", code)
	}
	out.Reset()
	diagnostics.Reset()
	if code := run(nil, strings.NewReader("bad JSON"), &out, &diagnostics); code != 1 || out.Len() != 0 {
		t.Fatalf("内容错误退出码=%d，输出=%q", code, out.String())
	}
}
```

## 运行与结果

保存 `sample.jsonl`：

```jsonl
{"level":"INFO"}
{"level":"warn"}
{"level":"INFO"}
{"level":"ERROR"}
```

```sh
go fmt ./...
go test ./...
go vet ./...
go build -o logstats .
./logstats -file sample.jsonl
cat sample.jsonl | ./logstats
```

两种调用预期都输出：

```text
INFO 2
WARN 1
ERROR 1
```

验证退出码应使用编译后的程序；`go run` 对子进程失败的呈现不等于直接调用程序。Windows 在 PowerShell 可用 `Get-Content sample.jsonl | ./logstats.exe`，构建时指定 `.exe`。

## 与路线节点的关系

这个项目综合 Reader、bufio、JSON、map、flag、error 与 testing。不是读完例子即毕业：要能改变输入协议并维护错误契约。

使用 <a href="/go/data/logs-valid.jsonl" download>正常数据</a>与 <a href="/go/data/logs-invalid.jsonl" download>失败数据</a>验证。失败数据第 3 行 DEBUG 不被接受，应退出 1，stderr 含行号，stdout 空。把标准输入读取失败、输出设备失败、未知参数各写成独立断言，覆盖资源边界而非只测 counts。

升级任务：核心 summarize 不变，Cobra 包装 stats 子命令；新增 JSON 输出由具名响应结构体定义；增日期字段前定义 RFC3339 与业务时区。保持旧输入是否兼容是显式决策，不靠“解析成功就接受所有字段”。

## 扩展与验收 {#lab}

1. 增加 `-format json`，输出具名结构体，并测试稳定字段。
2. 支持按日期聚合时先定义输入时间格式与时区，不仅按字符串切片。
3. 加入错误输出 Writer 测试，验证输出设备故障退出 1。

验收：正常、空输入、坏行、长行、读取失败和用法错误均可说明；README 写明输入契约、退出码、单行限额与示例命令。
