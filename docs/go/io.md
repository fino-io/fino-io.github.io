---
title: 08 · 文件、JSON 与标准库
description: Go 中文学习指南：文件、JSON 与标准库，包含概念、示例、练习与验收。
pageClass: aip-article
---

# 08 · 文件、JSON 与标准库

本章目标：用标准库处理文件和结构化数据，主动控制内存、输入大小与资源生命周期。

## 用 Reader 与 Writer 统一 I/O

`io.Reader` 和 `io.Writer` 允许同一逻辑处理文件、内存与网络。小文件可用 os.ReadFile；大文件或流式输入使用 bufio、io.Copy 或 Decoder，避免一次读入整个内容。

Read 可以同时返回 `n > 0` 与错误，调用方应先处理读到的字节，再处理错误；多数情况优先使用 io.Copy 等已有工具。bufio.Scanner 方便逐行读取，但默认 token 大小有限，必要时显式设置 Buffer 与最大长度，循环后检查 Scanner.Err。详见 [io 文档](https://pkg.go.dev/io)、[bufio 文档](https://pkg.go.dev/bufio)。

## 一个严格 JSON 解码器

保存为 `main.go`，无需第三方依赖：

```go
package main

import (
	"encoding/json"
	"fmt"
	"io"
	"strings"
)

type Config struct {
	Port int `json:"port"`
}

func decodeConfig(r io.Reader) (Config, error) {
	var c Config
	dec := json.NewDecoder(r)
	dec.DisallowUnknownFields()
	if err := dec.Decode(&c); err != nil {
		return c, fmt.Errorf("解析配置: %w", err)
	}
	var extra any
	if err := dec.Decode(&extra); err != io.EOF {
		return c, fmt.Errorf("配置必须只包含一个 JSON 值")
	}
	if c.Port < 1 || c.Port > 65535 {
		return c, fmt.Errorf("port 必须在 1–65535 之间")
	}
	return c, nil
}

func main() {
	c, err := decodeConfig(strings.NewReader(`{"port":8080}`))
	if err != nil {
		fmt.Println(err)
		return
	}
	fmt.Println(c.Port) // 8080
}
```

这是严格字段检查，不是完整 JSON Schema 校验。encoding/json 默认对重复键采用后值覆盖等行为，对结构体字段匹配也可能忽略大小写；若协议要求禁止重复键，需要专门检测或使用已有严格解析方案。外部 JSON 不要先全部放进 map[string]any 再到处断言，优先具名结构体。

Decoder 不自动限制输入大小。HTTP 使用 MaxBytesReader，文件可先检查大小并在流式读取时继续限制。仅用 LimitReader 截断后解码可能把尾部数据隐藏掉，判断超限应读取“限额 + 1”字节或使用能明确返回超限的机制。详见 [encoding/json](https://pkg.go.dev/encoding/json)。

## 常用标准库与约定

| 需求 | 优先工具 | 关键边界 |
| --- | --- | --- |
| 路径拼接 | filepath.Join | 文件路径与 URL 路径分开。 |
| 时间与截止点 | time.Time、time.Duration | 接口格式用 RFC3339，明确时区。 |
| 结构化日志 | log/slog | 使用稳定字段，避免记录凭据。 |
| 命令行参数 | flag | 参数错误与运行错误使用明确退出码。 |
| 打包静态文件 | embed | 文件在编译时嵌入，修改后需重新构建。 |
| CSV | encoding/csv | 不手写按逗号分割，字段可能含引号与换行。 |

日志示例片段：`slog.Info("任务创建", "task_id", id)`；时间示例片段：`time.Parse(time.RFC3339, value)`。时间运算避免自己计算月份天数，日志与时间 API 参考 [slog](https://pkg.go.dev/log/slog)、[time](https://pkg.go.dev/time)。

## 练习与验收

1. 给配置增加地址字段，验证未知字段、缺失 port、两段 JSON 与非法范围。
2. 用 Scanner 处理长行和读取失败，不能只测试正常文件。
3. 从 CSV 读取含逗号与换行的字段，观察专用解析器的优势。

验收：输入大小有限、文件及时关闭、解析与业务校验分开，错误含足够上下文。
