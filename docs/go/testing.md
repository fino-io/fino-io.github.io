---
title: 10 · 测试、模糊测试与质量检查
description: Go 中文学习指南：测试、模糊测试与质量检查，包含概念、示例、练习与验收。
pageClass: aip-article
---

# 10 · 测试、模糊测试与质量检查

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

## 练习与验收

1. 为标题添加最大码点长度约束，测试边界值与中文。
2. 给错误路径写断言，不只判断“调用成功”。
3. 故意移除并发保护，观察 race 报告，再恢复保护。

验收：测试稳定、可隔离重跑，失败信息能定位输入与期望。参考：[testing 包](https://pkg.go.dev/testing)。
