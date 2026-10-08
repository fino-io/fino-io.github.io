---
title: 09 · 函数、闭包与调用语义
description: 多返回值、可变参数、命名返回与闭包捕获。
pageClass: aip-article
---

# 09 · 函数、闭包与调用语义

学习前应能完成：[条件、循环与控制转移](./control-flow)、[字符串、数组与切片模型](./collections)。

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

## 可变参数与共享切片

```go
package main

import "fmt"

func mark(values ...int) {
	if len(values) > 0 {
		values[0] = 99
	}
}

func main() {
	items := []int{1, 2}
	mark(items...)
	fmt.Println(items) // [99 2]：展开后的底层存储共享
}
```

可变参数在函数中是切片，调用 `mark(1,2)` 与 `mark(items...)` 的共享关系不同。只读接口不应偷偷修改可变参数；需要原地修改在命名和文档中表达。空可变参数必须与空切片一样可处理。

## 闭包是状态，不只是匿名语法

```go
package main

import "fmt"

func counter() func() int {
	next := 0
	return func() int { next++; return next }
}

func main() {
	a, b := counter(), counter()
	fmt.Println(a(), a(), b()) // 1 2 1
}
```

同一个返回闭包共享同一捕获变量，不同工厂调用各有独立状态；多 goroutine 调用 a 仍会发生竞争。返回闭包延长捕获变量生命周期。匿名函数适合局部一次性操作，复杂条件与多个调用点改为具名函数，避免回调层层嵌套。

## 命名返回值与 defer 的交互

```go
package main

import "fmt"

func named() (result int) {
	defer func() { result++ }()
	return 10
}
func unnamed() int {
	result := 10
	defer func() { result++ }()
	return result
}
func main() { fmt.Println(named(), unnamed()) } // 11 10
```

return 先设置返回值，再执行 defer。命名返回变量可在 defer 修改；普通局部变量不是已经确定的返回值。命名返回在处理 Write/Close 两个失败原因时有用，但隐藏修改会降低可读性，优先用显式返回与少量清理逻辑。

## 函数契约写进签名与测试

输入是否允许 nil，函数是否修改输入，空结果是否为 nil，哪些错误公开，依赖时间或随机数如何注入，都应有具体断言。函数拆分以完整职责为准，不把每一条语句过程化，也不把所有业务塞进 main。

## 练习与验收 {#lab}

1. 分别用结构体值和指针调用修改函数，比较原变量是否改变。
2. 写 `readFile(path) ([]byte, error)`，打开失败不调用 Close。
3. 在循环中读三个文件，确保每次迭代及时关闭资源。

验收：能说明修改从哪里发生，并预测多个 defer 的输出顺序。参考：[Tour 的函数与指针](https://go.dev/tour/moretypes/1)、[defer 官方说明](https://go.dev/blog/defer-panic-and-recover)。
