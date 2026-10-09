---
title: 2.7. 错误模型、包装与恢复
description: 错误链、自定义类型、哨兵、panic、recover 与堆栈。
pageClass: aip-article
---

# 2.7. 错误模型、包装与恢复

学习前应能完成：[接口、断言与动态类型](./interfaces)、[函数、闭包与调用语义](./functions)。

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

## 自定义错误与 errors.As

```go
package main

import (
	"errors"
	"fmt"
)

type ValidationError struct{ Field, Message string }

func (e *ValidationError) Error() string { return e.Field + ": " + e.Message }

func validate(title string) error {
	if title == "" {
		return &ValidationError{Field: "title", Message: "不能为空"}
	}
	return nil
}

func main() {
	err := fmt.Errorf("创建任务: %w", validate(""))
	var invalid *ValidationError
	if errors.As(err, &invalid) {
		fmt.Println(invalid.Field, invalid.Message)
	}
}
```

As 的目标是一个非 nil 指针，指向可以承接错误的变量，因此是 `&invalid`，不是未初始化 invalid 自身。错误文字给人读，字段/哨兵/类型给程序识别。包装暴露底层错误意味着调用方可能依赖它，公共包要考虑兼容性；不想公开驱动细节时转换为业务错误。

## 多个错误与清理策略

`errors.Unwrap` 处理普通单错误链，`errors.Is/As` 还能遍历实现多错误展开的链，`errors.Join` 用于保留多个失败。Write 失败后 Close 也可能失败，报告主错误并保留清理错误；不要先记录同一失败再层层包装又打印三次。

运行边界有三种选择：终止当前操作、有限重试、降级返回部分结果。每种都需接口约定；错误发生不等于程序一定崩溃，也不等于应该无条件继续。

## recover 的局部性与堆栈

```go
package main

import (
	"fmt"
	"runtime/debug"
)

func guarded() {
	defer func() {
		if value := recover(); value != nil {
			fmt.Printf("panic=%v\n", value)
			stack := debug.Stack()
			fmt.Println(len(stack) > 0) // true
		}
	}()
	panic("内部不变量失败")
}
func main() { guarded(); fmt.Println("调用方继续") }
```

recover 结束正在展开的 panic 后，guarded 返回，不从 panic 那一行继续执行。只能在该 goroutine 的 deferred 调用中直接恢复；父 goroutine 的 recover 不覆盖子任务。堆栈有诊断价值，不直接返回给外部客户端。普通 error 值不会自动带完整堆栈，错误上下文应在必要边界补齐，调试可用 Delve 和运行日志。

## 练习与验收 {#lab}

1. 为标题校验返回 ErrInvalidTitle，在入口给出中文提示。
2. 将文件错误包装两次，确认 errors.Is 仍能识别不存在。
3. 写一个返回字段名的校验错误，用 errors.As 取出字段。

验收：正常与失败路径都能测试，外层不依赖错误字符串，日志只在合适边界记录。参考：[Go 错误包装说明](https://go.dev/blog/go1.13-errors)、[errors 包](https://pkg.go.dev/errors)。
