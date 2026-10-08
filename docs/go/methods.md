---
title: 11 · 方法集、值与指针接收者
description: 区分普通调用的自动取地址和接口方法集。
pageClass: aip-article
---

# 11 · 方法集、值与指针接收者

学习前应能完成：[指针、别名与内存概览](./pointers)。

本章区分两套规则：普通方法调用允许某些自动解引用/取地址；接口实现严格检查方法集。二者混为一谈，是接收者问题最常见的来源。

## 值接收者与指针接收者

```go
package main

import "fmt"

type Counter struct{ N int }

func (c Counter) CopyAdd()   { c.N++ }
func (c *Counter) Add()      { c.N++ }
func (c Counter) Value() int { return c.N }

type Valuer interface{ Value() int }
type Adder interface{ Add() }

var _ Valuer = Counter{}
var _ Valuer = (*Counter)(nil)
var _ Adder = (*Counter)(nil)

func main() {
	c := Counter{}
	c.CopyAdd()
	c.Add()                // c 可寻址，自动按 (&c).Add() 调用
	fmt.Println(c.Value()) // 1
}
```

如果添加 `var _ Adder = Counter{}` 会编译失败。值 Counter 没有指针接收者的 Add 方法；自动取地址是普通调用便利，不会扩大值类型实现的接口集合。

| 类型 | 方法集 |
| --- | --- |
| T | 接收者为 T 的方法。 |
| *T | 接收者为 T 和 *T 的方法。 |
| 接口 | 接口声明、嵌入与类型集合允许的行为；赋值时检查。 |

map 元素、临时返回值通常不可寻址，不能任意使用自动取地址调用指针方法。片段 `map[int]Counter{1: {}}[1].Add()` 不合法；取出值修改再写回，或存 *Counter 并明确共享规则。

## 为什么不能只按“对象大小”选接收者

需要修改状态、含 Mutex、身份语义或对象较大时使用指针接收者；小而不可变的值可用值接收者。值接收者对内部切片/map 仍是浅复制，方法修改它们的元素可能影响原对象，因此“值接收者没有副作用”并不成立。

同一类型尽量使用一致的接收者策略。带锁类型用指针，不在使用后复制；time.Time 是常见适合值语义的例子。nil 指针接收者可以被调用，但方法访问字段前要有明确 nil 处理，不能把这当成所有类型都允许 nil 的约定。

## 方法值与方法表达式

```go
package main

import "fmt"

type Meter struct{ N int }

func (m Meter) Read() int  { return m.N }
func (m *Meter) Increase() { m.N++ }

func main() {
	m := Meter{N: 3}
	read := m.Read         // 捕获当前接收者值的复制
	increase := m.Increase // 捕获指向 m 的地址
	increase()
	fmt.Println(read(), m.Read()) // 3 4
	fmt.Println(Meter.Read(m))    // 方法表达式，接收者成为显式首参数
}
```

方法值绑定接收者，适合回调；方法表达式不绑定实例，接收者成为函数参数。生命周期与并发访问依然要考虑，回调持有指针会延长对象可达时间。

## 学习实验与判定 {#lab}

1. 删除/恢复 Counter 的接口编译断言，解释每次是否满足方法集。
2. 在 map[ID]Counter 与 map[ID]*Counter 上分别调用 Add，说明可寻址与别名问题。
3. 让值接收者修改内部切片元素，用测试证明调用方是否改变。

通过标准：能在运行前判断接口赋值是否编译、接收者是否复制、方法值捕获哪个状态。参考：[方法集规范](https://go.dev/ref/spec#Method_sets)、[Tour 接收者](https://go.dev/tour/methods/4)。
