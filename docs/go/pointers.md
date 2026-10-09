---
title: 2.2. 指针、别名与内存概览
description: 用实验解释结构体、map、切片的值复制和共享。
pageClass: aip-article
---

# 2.2. 指针、别名与内存概览

学习前应能完成：[函数、闭包与调用语义](./functions)、[结构体、Tag 与嵌入](./types)。

指针的核心是别名与生命周期。Go 的参数仍按值复制；复制地址后，两个变量能访问同一对象。把指针理解成“引用传参”会漏掉指针变量自身也被复制的事实。

## 修改对象和替换指针不是一回事

```go
package main

import "fmt"

type Task struct{ Title string }

func replace(p *Task) { p = &Task{Title: "replacement"} }
func update(p *Task)  { p.Title = "updated" }

func main() {
	task := Task{Title: "original"}
	replace(&task)
	fmt.Println(task.Title) // original
	update(&task)
	fmt.Println(task.Title) // updated
}
```

replace 只改变局部地址值；update 修改地址所指对象。需要替换调用方指针时可返回新指针，通常比 `**Task` 更好读。`new(T)` 返回指向零值 T 的指针；`&T{...}` 可同时初始化字段；`make` 则初始化 slice/map/channel，返回的是相应值。

## map 与切片的复制模型

```go
package main

import "fmt"

func change(values []int) {
	values[0] = 9
	values = append(values, 7)
	fmt.Println("内部", values) // [9 7]
}

func main() {
	values := make([]int, 1, 3)
	change(values)
	fmt.Println("外部", values, len(values)) // [9] 1
	fmt.Println(values[:2])                // [9 7]：底层数组中已有新元素
}
```

传入的是切片描述符的复制，元素存储共享；append 返回的新长度只属于局部描述符。容量足够时新增元素写入原底层数组，容量不足则可能换数组，不能依靠偶然扩容做正确性。map 值复制同样共享数据，重新给局部 map 赋新 map 不替换调用方变量。

所以 API 必须写清楚“原地修改”“返回新集合”或“只读”。单纯把参数改成 `*[]T` 并不会自动改善设计。返回新切片即可表达 append 后的结果。

## 地址安全与内存管理概览

Go 允许函数返回局部变量地址。编译器分析引用是否可能逃出作用域，必要时把对象放到堆上；不必按 C 的规则判断为悬垂地址。GC 跟踪可达对象，可达并不等于业务仍需要：全局 map、缓存或切片仍引用的对象不能释放。

指针减少大型值复制，但引入共享和堆分配的可能性，选型先看语义再测成本。Go 没有普通指针算术；nil 指针不能解引用。指针字段用于可选状态时，先定义 nil 与零值的业务区别，比如 nil 表示未提供，指向 false 表示显式关闭。

## 资源不是对象内存

GC 管内存，不能替你及时关闭文件、数据库结果、socket 或 goroutine。文件在读完后关闭，Context 在完成后 cancel，并发任务有明确结束条件。finalizer 不能当作可靠的普通资源释放协议。深入 GC 与逃逸实验见 [内存管理](./memory)。

## 学习实验与判定 {#lab}

1. 把第二例容量从 3 改成 1，解释 append 后为什么仍可修改第一个元素但新数组与原数组关系不同。
2. 实现 `appendValue([]int, int) []int`，调用者显式接收返回值；测试 nil 与满容量。
3. 返回局部结构体地址，并用 `go build -gcflags='-m'` 找到逃逸证据，不把它误判为内存错误。

通过标准：能画出值、地址与底层存储的关系，解释每一处修改影响谁。参考：[指针规范](https://go.dev/ref/spec#Pointer_types)、[逃逸与栈的 FAQ](https://go.dev/doc/faq#stack_or_heap)。
