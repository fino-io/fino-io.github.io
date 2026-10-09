---
title: 4.1. 文件、流式 I/O 与 JSON
description: Read/Write 契约、扫描、限额、解码和数据边界。
pageClass: aip-article
---

# 4.1. 文件、流式 I/O 与 JSON

学习前应能完成：[接口、断言与动态类型](./interfaces)、[错误模型、包装与恢复](./errors)。

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

## Reader 的 n 与 err 要同时处理

```go
package main

import (
	"fmt"
	"io"
)

type lastReader struct{ data []byte }

func (r *lastReader) Read(p []byte) (int, error) {
	if len(p) == 0 {
		return 0, nil
	}
	if len(r.data) == 0 {
		return 0, io.EOF
	}
	n := copy(p, r.data)
	r.data = r.data[n:]
	if len(r.data) == 0 {
		return n, io.EOF
	}
	return n, nil
}
func main() {
	buffer := make([]byte, 8)
	n, err := (&lastReader{data: []byte("Go")}).Read(buffer)
	fmt.Printf("%q %v\n", buffer[:n], err) // "Go" EOF
}
```

这个 Reader 保存尚未读出的内容，只有最后一段才同时返回数据与 EOF；小缓冲会分次读取。调用方若先看到 err 就丢弃 n，会丢最后一段数据。一般优先 io.Copy/io.ReadAll；自己写循环时先消费 buffer[:n]，再判断错误。Reader 不能假设每次填满缓冲，Writer 也要考虑短写与失败。

## 文件写入与替换

写配置时采用“同目录临时文件 → 完整写入 → 按需求 Sync → Close → Rename”的明确协议，失败删除临时文件。Rename 的原子性和目标替换语义与操作系统/文件系统有关，不能宣称跨平台无条件原子和持久。需要强持久保证时还要考虑目录同步、权限和崩溃恢复，复用成熟存储方案。

文件名来自外部输入时限制根目录与可接受名称，Join 不自动阻止 `..` 越界；跨平台路径校验需考虑符号链接和实际打开策略。教育文件样例不接收任意服务器路径。

## JSON 数字、null 与未知字段

```go
package main

import (
	"encoding/json"
	"fmt"
	"strings"
)

func main() {
	dec := json.NewDecoder(strings.NewReader(`{"id":9007199254740993}`))
	dec.UseNumber()
	var value map[string]any
	if err := dec.Decode(&value); err != nil {
		panic(err)
	}
	number := value["id"].(json.Number)
	id, err := number.Int64()
	fmt.Println(id, err) // 9007199254740993 <nil>
}
```

默认解码到 any 时 JSON 数字通常进入 float64，超过整数精确范围可能丢失；具名 int64 字段或 UseNumber 可保持整数边界。`DisallowUnknownFields` 只约束结构体未知字段，不拒绝所有重复键和大小写匹配；对外协议需要更严格策略时明确选择。

Decoder 可以流式读多个 JSON 值，单请求只允许一个时必须二次 Decode 确認 EOF。nil 切片编码 null，空非 nil 切片编码 []，分页 API 的空集合应通过测试固定。

## 练习与验收 {#lab}

1. 给配置增加地址字段，验证未知字段、缺失 port、两段 JSON 与非法范围。
2. 用 Scanner 处理长行和读取失败，不能只测试正常文件。
3. 从 CSV 读取含逗号与换行的字段，观察专用解析器的优势。

验收：输入大小有限、文件及时关闭、解析与业务校验分开，错误含足够上下文。
