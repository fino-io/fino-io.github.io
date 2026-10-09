---
title: 1.5. 条件、循环与控制转移
description: 理解 switch、range、break、continue 与 goto 的边界。
pageClass: aip-article
---

# 1.5. 条件、循环与控制转移

学习前应能完成：[变量、常量、iota 与作用域](./variables)、[基本类型、数值与类型转换](./basics)。

本章把“可以写循环”推进到“能够证明循环结束且结果正确”。控制结构与数据规模、退出条件共同决定程序行为。

## if 初始化与 switch

if 可带初始化语句，变量只活在 if/else 范围。switch 没有隐式 fallthrough，可一次列多个 case；无表达式 switch 等价于按布尔条件依次匹配。

```go
package main

import "fmt"

func classify(n int) string {
	switch {
	case n < 0:
		return "负数"
	case n == 0:
		return "零"
	default:
		return "正数"
	}
}

func main() {
	for _, n := range []int{-1, 0, 3} {
		fmt.Println(classify(n))
	}
}
```

输出负数、零、正数。case 按顺序匹配，前面的宽条件可能吞掉后面的精细条件。fallthrough 不重新判断下一条 case，因此业务分类很少需要它。

## range 的值是复制

```go
package main

import "fmt"

type Item struct{ Done bool }

func main() {
	items := []Item{{}, {}}
	for _, item := range items {
		item.Done = true
	}
	fmt.Println(items) // [{false} {false}]
	for i := range items {
		items[i].Done = true
	}
	fmt.Println(items) // [{true} {true}]
}
```

range 的元素值是复制。若元素里包含引用，修改引用指向的数据又可能影响原对象，不能把这个例子推广为“range 里所有修改都无效”。Go 1.22 新循环变量规则由模块语言版本决定，使用 `:=` 声明的每轮变量独立；使用外部变量并通过 `=` 赋值仍共享。

map range 顺序不稳定；边遍历边增删 map 的规则不能当成任务队列，快照后处理更清楚。string range 得到字节索引和码点；索引不能视作第几个可见字符。

## break、continue 与标签

```go
package main

import "fmt"

func main() {
	grid := [][]int{{0, 2}, {3, 4}}
	row, column := -1, -1
Search:
	for i, cells := range grid {
		for j, value := range cells {
			if value == 0 {
				continue
			}
			row, column = i, j
			break Search
		}
	}
	fmt.Println(row, column) // 0 1
}
```

不带标签的 break 只退出最内层 for/switch/select；continue 跳到目标循环下一轮。goto 只能在同一函数内转移，不能跳入某些作用域并绕过声明。多数业务使用 return、break 或辅助函数更容易表达；路线中的 goto 是需要认识的工具，不是默认控制方式。

## 循环的不变量与复杂度

词频循环的不变量是“counts 包含此前已经处理的单词次数”；每轮消费一个输入，有限输入保证结束。分页循环要检查最大页数、重复游标和取消；重试循环要检查总次数与剩余预算。`for {}` 本身没有结束保证，把退出条件写成可测试的协议。

两个嵌套循环可能是 O(n²)，但二维数据遍历也可能只是访问 n 个单元；复杂度根据实际元素访问次数分析，不根据语法层数判断。大输入时用 map 查找替代重复线性扫描，先确认业务语义再优化。

## 学习实验与判定 {#lab}

1. 给二维查找测试空输入、全零、第一行命中和最后行命中。
2. range 一个结构体切片，分别修改值字段和指针字段，解释结果差别。
3. 用循环实现分页上限，重复游标应返回错误而非永不结束。

通过标准：每个循环说明不变量、终止条件与规模；能准确判断 break 退出了哪一层。参考：[控制语句规范](https://go.dev/ref/spec#Statements)。
