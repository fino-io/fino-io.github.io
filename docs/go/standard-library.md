---
title: 22 · flag、time、regexp 与 embed
description: 参数、时间、正则与编译期资源的具体使用。
pageClass: aip-article
---

# 22 · flag、time、regexp 与 embed

学习前应能完成：[文件、流式 I/O 与 JSON](./io)。

本章为 roadmap 中 flag、time、regexp 和 go:embed 建立具体实验。文件、os、bufio 与 JSON 见 [I/O](./io)，slog 见 [日志与实时通信](./logging-realtime)。

## flag：解析与退出分离

```go
package main

import (
	"flag"
	"fmt"
	"io"
)

func parse(args []string) (int, error) {
	fs := flag.NewFlagSet("scan", flag.ContinueOnError)
	fs.SetOutput(io.Discard)
	workers := fs.Int("workers", 4, "worker 数量")
	if err := fs.Parse(args); err != nil {
		return 0, err
	}
	if fs.NArg() != 0 || *workers < 1 || *workers > 32 {
		return 0, fmt.Errorf("只接受 -workers 1–32")
	}
	return *workers, nil
}
func main() {
	n, err := parse([]string{"-workers", "8"})
	fmt.Println(n, err) // 8 <nil>
}
```

FlagSet 避免污染全局 flags，可独立测试。`--` 结束选项解析，标准 flag 通常在遇到首个非 flag 参数后停止；复杂子命令使用成熟 CLI 库。帮助错误、解析错误和运行错误在入口映射不同退出码，不能让解析函数内部 os.Exit。

## time：时间点、时长与时区

```go
package main

import (
	"fmt"
	"time"
)

func main() {
	deadline, err := time.Parse(time.RFC3339, "2026-10-08T09:00:00+08:00")
	if err != nil {
		panic(err)
	}
	fmt.Println(deadline.UTC().Format(time.RFC3339)) // 2026-10-08T01:00:00Z
	duration, err := time.ParseDuration("1m30s")
	if err != nil {
		panic(err)
	}
	fmt.Println(duration.Seconds()) // 90
}
```

格式模板使用 Go 的参考日期，不能把 YYYY-MM-DD 字符串当模板。Elapsed 用 time.Since；由 time.Now 得到的值可携带单调时钟部分，序列化后通常丢失，跨进程计算仍要考虑墙钟漂移。业务日历用目标时区和 AddDate，不用“一个月等于 30 天”。ticker 在不用后 Stop，不能假设停止会关闭 C；等待仍要观察 Context。

## regexp：编译、匹配与数据提取

```go
package main

import (
	"fmt"
	"regexp"
)

var codePattern = regexp.MustCompile(`^TASK-([0-9]+)$`)

func main() {
	parts := codePattern.FindStringSubmatch("TASK-42")
	fmt.Println(parts)                               // [TASK-42 42]
	fmt.Println(codePattern.MatchString("xTASK-42")) // false
}
```

固定开发者字面量可 MustCompile，用户输入模式用 Compile 并返回错误。`^`、`$` 明确全串边界；提取前检查切片长度。Go regexp 不支持某些 PCRE 特性如回溯引用，设计为有限制的线性匹配；仍要限制输入大小和返回结果数量。CSV、JSON、HTML 使用专用解析器，不把格式协议都变成正则。

## embed：编译时资源

独立目录保存 `main.go`：

```go
package main

import (
	"embed"
	"fmt"
)

//go:embed fixtures/*.json
var fixtures embed.FS

func main() {
	data, err := fixtures.ReadFile("fixtures/task.json")
	if err != nil {
		panic(err)
	}
	fmt.Println(string(data))
}
```

另外创建 `fixtures/task.json` 内容 `{"title":"学习 Go"}`。go:embed 在包目录下匹配资源，不允许通过 `..` 随意嵌入外部目录；匹配不到会构建失败。资源变化需重新 build，适合模板、默认配置和测试样本，不嵌入 secret 或频繁变化业务数据。只嵌入 string/[]byte 而不使用 embed.FS 时 import `_ "embed"`。

## 学习实验与判定 {#lab}

1. flag 测试非法数字、0、33、未知选项和位置参数，结果都要有明确错误。
2. 将固定时区时间转 UTC，验证输出；对不含时区的业务日期使用 ParseInLocation。
3. 正则输入 TASK-42、TASK-x、xTASK-42，只有第一项成功，并解释边界作用。
4. 构建 embed 程序后修改 JSON，不重建时输出仍为旧内容。

通过标准：四项工具都能独立测试，输入与资源生命周期清楚。参考：[flag](https://pkg.go.dev/flag)、[time](https://pkg.go.dev/time)、[regexp](https://pkg.go.dev/regexp)、[embed](https://pkg.go.dev/embed)。
