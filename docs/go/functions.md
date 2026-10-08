---
title: 04 · 函数、指针与 defer
description: Go 中文学习指南：函数、指针与 defer，包含概念、示例、练习与验收。
pageClass: aip-article
---

# 04 · 函数、指针与 defer

本章目标：把操作表达为明确的函数，理解值复制、指针与资源生命周期。

## 参数始终按值传递

Go 复制参数值。传结构体时复制结构体；传指针时复制地址；传切片时复制描述符；传 map 时复制指向相关数据的值。后几种依然可能访问共享数据，不能把“值传递”理解为“所有内容都是独立副本”。

```go
package main

import "fmt"

type Counter struct{ Value int }

func increment(c *Counter) { c.Value++ }

func divide(a, b int) (int, error) {
	if b == 0 {
		return 0, fmt.Errorf("除数不能为零")
	}
	return a / b, nil
}

func main() {
	c := Counter{}
	increment(&c)
	result, err := divide(8, 2)
	if err != nil {
		fmt.Println(err)
		return
	}
	fmt.Println(c.Value, result) // 1 4
}
```

`&x` 获取地址，`*p` 解引用。这里指针表达修改同一个 Counter 的意图；小型不可变数据直接传值更容易理解。Go 没有一般指针算术，返回局部变量的地址是安全的，其存储位置由编译器与运行时处理。

多个返回值常用于 `(结果, error)`。命名返回值可说明语义，但长函数避免裸 return，让返回内容可直接看到。可变参数 `...T` 在函数内表现为切片，已有切片可以用 `values...` 展开。

## defer 的执行顺序

```go
package main

import "fmt"

func main() {
	value := 1
	defer fmt.Println("参数立即求值:", value)
	defer func() { fmt.Println("闭包执行时读取:", value) }()
	value = 2
	fmt.Println("函数主体结束")
}
```

输出顺序是主体、闭包 2、参数 1。defer 在所属函数返回时执行，后注册的先执行，调用参数在注册时求值。打开文件后先检查错误，再 `defer file.Close()`。循环中不断 defer 会把资源保留到整个函数结束，逐项处理可拆成一个负责完整生命周期的辅助函数。

`os.Exit` 不执行 defer。因此 CLI 把主要工作放进返回退出码的 `run`，最后在 main 调用 os.Exit；清理逻辑放在 run 内。

## 函数值与闭包

函数可以传给其他函数或返回。闭包可捕获外层变量，适合少量局部状态；多个 goroutine 共享闭包变量仍须同步。回调参数和返回值先保持简单，不为一个调用点引入多层工厂。计算与 I/O 分开，让核心逻辑能用普通值测试。

## 练习与验收

1. 分别用结构体值和指针调用修改函数，比较原变量是否改变。
2. 写 `readFile(path) ([]byte, error)`，打开失败不调用 Close。
3. 在循环中读三个文件，确保每次迭代及时关闭资源。

验收：能说明修改从哪里发生，并预测多个 defer 的输出顺序。参考：[Tour 的函数与指针](https://go.dev/tour/moretypes/1)、[defer 官方说明](https://go.dev/blog/defer-panic-and-recover)。
