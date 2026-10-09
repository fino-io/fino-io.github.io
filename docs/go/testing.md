---
title: 4.3. 表驱动、替身与 HTTP 测试
description: 隔离、Mock/Stub、httptest、覆盖率与 Fuzz。
pageClass: aip-article
---

# 4.3. 表驱动、替身与 HTTP 测试

学习前应能完成：[接口、断言与动态类型](./interfaces)、[错误模型、包装与恢复](./errors)。

本章目标：用测试固定行为，覆盖边界与失败路径，让并发和重构有可验证的依据。

## 从表驱动测试开始

在独立模块中保存 `title.go`：

```go
package title

import "strings"

func Normalize(s string) string { return strings.TrimSpace(s) }
```

保存 `title_test.go`：

```go
package title

import "testing"

func TestNormalize(t *testing.T) {
	cases := []struct{ name, input, want string }{
		{"普通标题", "学习 Go", "学习 Go"},
		{"前后空白", "  学习 Go\n", "学习 Go"},
		{"只有空白", " \t ", ""},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := Normalize(tc.input); got != tc.want {
				t.Fatalf("Normalize(%q) = %q，期望 %q", tc.input, got, tc.want)
			}
		})
	}
}
```

```sh
go test ./...
go test -run TestNormalize -v .
go test -cover ./...
go test -race ./...
```

测试文件以 `_test.go` 结尾，测试函数以 Test 开头、接收 `*testing.T`。`t.Helper()` 用于标识测试辅助函数，`t.Cleanup()` 清理资源，`t.TempDir()` 隔离临时文件。覆盖率只显示代码执行到哪里，不证明断言充分。

## 测试边界而非模仿实现

核心计算直接用值测试；文件测试用临时目录；HTTP 服务用 httptest.NewRecorder 或 NewServer；数据库测试使用隔离数据库与迁移。替身只替换不稳定的边界，不给每个私有函数做 mock。时间依赖可注入时钟函数，避免靠 sleep 猜测任务何时结束。

并行测试不能共享可变全局变量、同一个固定端口或数据库数据。`t.Parallel()` 前先明确隔离方式。race 检测只发现实际执行路径中的数据竞争，还需要足够的并发覆盖；它不证明没有死锁或 goroutine 泄漏。参见 [竞态检测器](https://go.dev/doc/articles/race_detector)。

## Fuzz：寻找没想到的输入

在上述测试文件追加：

```go
func FuzzNormalize(f *testing.F) {
    f.Add("  Go ")
    f.Add("")
    f.Fuzz(func(t *testing.T, s string) {
        once := Normalize(s)
        if twice := Normalize(once); twice != once {
            t.Fatalf("重复归一化改变结果: %q -> %q", once, twice)
        }
    })
}
```

```sh
go test -fuzz=FuzzNormalize -fuzztime=10s .
```

这里验证幂等性，不能替代“正确去除空白”的固定用例。模糊测试适合解析器、编解码和输入归一化；目标要确定、快速、无外部网络副作用。失败样本加入回归测试。参考：[官方 Fuzz 教程](https://go.dev/doc/tutorial/fuzz)。

## 最小质量流程

格式化 → 单元与集成测试 → race（适用平台）→ vet → 构建。需要更强静态分析时再加入 Staticcheck 或组织已有的 golangci-lint 配置，避免同时打开大量未理解的规则。HTTP 示例的行为测试见 [任务 API 实战](./project-api)。

## Stub 与 Mock：替身验证什么

Stub 提供固定结果，Mock 还验证互动契约。业务只关心读到什么时用 stub；真的要求“只有成功后通知一次”时才验证调用次数。不要用 mock 复制每个内部函数的调用顺序，否则重构实现会迫使测试一起改而没有保护行为。

下面独立文件演示消费者接口与失败路径测试，可保存为 `notify_test.go`：

```go
package notify

import (
	"context"
	"errors"
	"testing"
)

type Sender interface {
	Send(context.Context, string) error
}

func Notify(ctx context.Context, s Sender, name string) error {
	if name == "" {
		return errors.New("名字不能为空")
	}
	return s.Send(ctx, "你好，"+name)
}

type senderStub struct {
	message string
	failure error
	calls   int
}

func (s *senderStub) Send(_ context.Context, message string) error {
	s.calls++
	s.message = message
	return s.failure
}

func TestNotify(t *testing.T) {
	failure := errors.New("上游不可用")
	s := &senderStub{failure: failure}
	if err := Notify(context.Background(), s, "Go"); !errors.Is(err, failure) {
		t.Fatalf("错误未传播: %v", err)
	}
	if s.message != "你好，Go" || s.calls != 1 {
		t.Fatalf("调用不符合契约: %+v", s)
	}
	if err := Notify(context.Background(), s, ""); err == nil {
		t.Fatal("空名字应失败")
	}
	if s.calls != 1 {
		t.Fatal("非法输入不应调用上游")
	}
}
```

## Recorder 与真实测试 Server 的区别

Recorder 直接调用 handler，不开 TCP，适合状态码、头和 body；NewServer 建本机服务，可验证 Client 的重定向、超时和响应体行为。Recorder 不完全模拟真实网络、连接断开与流式行为，别把一次 Recorder 测试当成完整系统测试。

覆盖率命令 `go test -coverprofile=coverage.out ./...`，用 `go tool cover -html=coverage.out` 找遗漏。100% 行覆盖仍可漏掉边界断言；高风险输入和失败路径优先。模糊测试必须定义性质，例如编码解码往返、幂等与不 panic，不能只调用函数没有断言。

## 练习与验收 {#lab}

1. 为标题添加最大码点长度约束，测试边界值与中文。
2. 给错误路径写断言，不只判断“调用成功”。
3. 故意移除并发保护，观察 race 报告，再恢复保护。

验收：测试稳定、可隔离重跑，失败信息能定位输入与期望。参考：[testing 包](https://pkg.go.dev/testing)。
