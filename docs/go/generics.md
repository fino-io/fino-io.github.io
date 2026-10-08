---
title: 09 · 泛型与常用容器算法
description: Go 中文学习指南：泛型与常用容器算法，包含概念、示例、练习与验收。
pageClass: aip-article
---

# 09 · 泛型与常用容器算法

本章目标：理解类型参数解决的问题，优先使用已有算法，避免把普通业务写成复杂泛型框架。

## 重复来自类型时才考虑泛型

接口抽象行为，泛型复用对多种类型执行相同操作的算法。容器查找、排序与集合操作适合泛型；HTTP 请求流程、业务规则与存储事务通常先使用具体类型和小接口。

```go
package main

import (
	"fmt"
	"slices"
)

func Unique[T comparable](values []T) []T {
	seen := make(map[T]struct{}, len(values))
	result := make([]T, 0, len(values))
	for _, value := range values {
		if _, ok := seen[value]; ok {
			continue
		}
		seen[value] = struct{}{}
		result = append(result, value)
	}
	return result
}

func main() {
	names := Unique([]string{"Go", "Rust", "Go"})
	fmt.Println(names)                        // [Go Rust]
	fmt.Println(slices.Contains(names, "Go")) // true
}
```

`T` 是类型参数，`comparable` 约束使它可用作 map 键。调用通常自动推断类型。空输入得到空结果且顺序按第一次出现保留，算法平均时间复杂度 O(n)，额外空间 O(n)。这是练习算法，实际需求先看标准库是否已有直接可用操作。

## 约束与类型集合

片段：`type Number interface { ~int | ~int64 | ~float64 }`。`~int` 包括底层类型为 int 的命名类型；没有 `~` 时只包含精确的 int 类型。约束应只要求实现算法必需的能力，不把所有数字都随意纳入，尤其注意溢出、NaN 与精度。

`any` 不允许对任意值直接执行加法、排序等操作。含类型集合的约束接口主要用于类型参数约束，不能像普通行为接口一样到处当作变量类型。Go 的普通方法不能自行声明新的类型参数；可使用泛型类型上的方法，或独立泛型函数。

## 复用标准库

- `slices.Sort`、`SortFunc`：原地排序；需要保留原输入时先 Clone。
- `slices.Contains`、`Index`：线性查找，不适合对大集合高频查找。
- `slices.Equal`：元素比较；nil 与空切片被视为相等。
- `maps.Clone`：浅复制 map，不产生并发保护。
- `cmp.Compare`：实现排序比较时表达有序关系。

示例以 Go 1.22 为基线，因此不依赖后来引入的迭代器 API。查询标准库时注意对应 API 的版本标记。

## 练习与验收

1. 给 Unique 添加整数与自定义 UserID 的测试。
2. 用 SortFunc 按任务标题长度排序，同长按标题排序。
3. 判断“发送通知”“切片去重”“保存订单”分别适合接口还是泛型。

验收：能解释每个约束的必要性，选型来自真实复用需求。参考：[官方泛型教程](https://go.dev/doc/tutorial/generics)、[slices](https://pkg.go.dev/slices)、[maps](https://pkg.go.dev/maps)。
