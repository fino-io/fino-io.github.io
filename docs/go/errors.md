---
title: 06 · 错误处理与边界设计
description: Go 中文学习指南：错误处理与边界设计，包含概念、示例、练习与验收。
pageClass: aip-article
---

# 06 · 错误处理与边界设计

本章目标：让失败路径与正常路径一样明确，调用方能稳定识别并处理错误。

## 先处理错误，再继续工作

错误是普通值，`error` 接口只有 `Error() string`。文件不存在、用户输入无效、网络超时都是可预期失败，返回 error 即可。不要把错误赋给 `_`，除非确实决定忽略且能说明理由。

```go
package main

import (
	"errors"
	"fmt"
	"os"
)

func load(path string) ([]byte, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("读取配置 %q: %w", path, err)
	}
	return data, nil
}

func main() {
	_, err := load("missing-config.json")
	if errors.Is(err, os.ErrNotExist) {
		fmt.Println("配置文件不存在")
		return
	}
	if err != nil {
		fmt.Println(err)
	}
}
```

`%w` 保留底层错误链，`errors.Is` 检查链中的目标，`errors.As` 获取指定错误类型。不要用错误字符串比较控制业务流程。包装信息应说明操作和必要标识，同时避免把密码、token 或整个请求体写入错误。

## 分清错误的职责

| 场景 | 建议 |
| --- | --- |
| 调用者只需区分一种失败 | 使用稳定的哨兵错误，如 ErrNotFound。 |
| 需要携带字段或状态 | 定义具名错误类型，使用 errors.As。 |
| 为底层错误补充操作上下文 | fmt.Errorf 配合 %w。 |
| 同时发生多个清理错误 | 必要时用 errors.Join 保留多个原因。 |
| 输入或依赖失败 | 返回 error，由入口映射输出或响应。 |
| 程序内部不变量被破坏 | 评估 panic；先考虑能否通过类型和校验避免。 |

底层返回错误，入口决定日志或响应，避免每一层都重复记录同一错误。HTTP 层可以把 ErrNotFound 映射为 404，但数据库层不应该知道 HTTP 状态码。调用方真正需要处理的错误才成为公开契约。

## panic、recover 与清理

panic 会沿调用栈展开并执行 defer。recover 只有在同一 goroutine 的 deferred 函数中直接调用才可有效捕获 panic，不能在父 goroutine 捕获另一个 goroutine 的 panic。框架边界可做恢复以保护进程，但恢复不能把已损坏状态自动修好，更不能拿它替代常规错误处理。

文件写入要同时关注 Write 与 Close 的失败；读文件通常主要关注读取错误。事务 Commit、HTTP 编码等影响结果的操作不能一律忽略。

## 练习与验收

1. 为标题校验返回 ErrInvalidTitle，在入口给出中文提示。
2. 将文件错误包装两次，确认 errors.Is 仍能识别不存在。
3. 写一个返回字段名的校验错误，用 errors.As 取出字段。

验收：正常与失败路径都能测试，外层不依赖错误字符串，日志只在合适边界记录。参考：[Go 错误包装说明](https://go.dev/blog/go1.13-errors)、[errors 包](https://pkg.go.dev/errors)。
