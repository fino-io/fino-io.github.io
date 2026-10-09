---
title: 1.4. 基本类型、数值与类型转换
description: 掌握整数、浮点、复数、布尔、rune 与转换边界。
pageClass: aip-article go-course
---

# 1.4. 基本类型、数值与类型转换

先修建议：[变量、常量、iota 与作用域](./variables)。

本章用可观察的边界讲清基本类型。重点不是背类型列表，而是知道表达范围、运算语义和转换何时丢失信息。

## 先按需要保存的信息选择类型 {#concept-1}

类型选择从问题开始：索引是否随平台变化，协议是否要求固定范围，小数是否必须精确，输入是在描述数字还是文本？这些问题比“越大的类型越保险”更具体。

| 想保存的信息 | 常用起点 | 需要继续确认 |
| --- | --- | --- |
| 索引、长度、一般循环计数 | int | 外部协议是否要求固定宽度。 |
| 固定范围的 ID 或协议整数 | int64 等明确宽度 | 输入范围、负数和转换是否允许。 |
| 数值近似计算 | float64 | 误差、NaN/Inf 与比较规则。 |
| 实部与虚部 | complex128 | 分量精度与数学算法。 |
| 条件状态 | bool | 是否还需要“未提供”的状态。 |
| Unicode 码点 | rune | 与 UTF-8 字节数、完整字形的区别。 |

下面的 255 回绕、300 截断和浮点误差实验，分别展示范围、转换与表示方式造成的结果。运行前先预测，再从类型规则解释；不要把它们归为同一种“精度问题”。

## 整数与固定宽度 {#concept-2}

int/uint 的宽度依平台而定；int8 至 int64、uint8 至 uint64 明确宽度。byte 是 uint8 别名，rune 是 int32 别名。索引通常用 int，协议中的固定范围字段用明确宽度；int64 转 int 不能假设每个平台都安全。

```go
package main

import "fmt"

func main() {
	var small uint8 = 255
	small++
	fmt.Println(small) // 0：无符号运算按位宽回绕
	value := int64(300)
	fmt.Println(uint8(value))    // 44：转换保留低位，不报告错误
	fmt.Println(7/3, -7/3, -7%3) // 2 -2 -1：整数除法向零截断
}
```

运行时整数溢出与常量溢出不同：`var n uint8 = 256` 在编译时就拒绝。外部数字转换先检查范围；只读到一个整数并不代表业务值合法。移位、位掩码用于协议时明确有符号还是无符号，避免靠位宽猜测结果。

## 浮点：表示误差与比较 {#concept-3}

float32、float64 表示二进制浮点数，大量十进制小数不能精确表示。不能用格式化后的样子判断内部值相等。

```go
package main

import (
	"fmt"
	"math"
)

func main() {
	a, b := 0.1, 0.2
	fmt.Printf("%.17f\n", a+b)               // 可观察舍入误差
	fmt.Println(math.Abs((a+b)-0.3) < 1e-12) // true
	nan := math.NaN()
	fmt.Println(nan == nan, math.IsNaN(nan)) // false true
}
```

容差来自量级与业务要求，不使用一个万能 epsilon。较大和较小数值可结合相对误差和绝对误差。NaN、Inf 是数值状态，需要在传感数据和 JSON 边界处理；标准 JSON 编码不接受非有限浮点值。金额使用整数最小单位，带精度规则的业务再复用成熟十进制库。

## 复数、布尔与 rune {#concept-4}

complex64 由两个 float32 分量组成，complex128 由两个 float64 分量组成。`complex(real, imag)` 构造，`real(z)`、`imag(z)` 取分量；傅里叶等数值工作可用成熟数学库，不自己写复杂算法。

```go
package main

import "fmt"

func main() {
	z := complex(2.0, 3.0)
	fmt.Println(z*z, real(z), imag(z)) // (-5+12i) 2 3
	var enabled bool
	fmt.Println(enabled, !enabled) // false true
	r := '中'
	fmt.Printf("%T %U %c\n", r, r, r) // int32 U+4E2D 中
}
```

布尔不隐式转换为整数，if 条件必须是 bool。rune 是整数码点，不是独立的字符串；`string(65)` 得到 A，`strconv.Itoa(65)` 得到 "65"。从字符串解析整数用 strconv.Atoi/ParseInt，不能用类型转换代替解析。

## 命名类型与别名 {#concept-5}

片段：`type UserID int64` 定义不同类型，`type Identifier = int64` 只是别名。新的类型有助于防止把 UserID 和 OrderID 混传；相同底层类型仍可能显式转换，类型不能取代有效性校验。把领域单位放进类型名，比如 Duration、Bytes，能让边界清楚。

## 学习实验与判定 {#lab}

1. 写一个 int64 到 uint8 的安全转换，输入 -1、0、255、256、300，结果应只允许 0–255。
2. 比较 float64 变量的 0.1+0.2 与无类型常量表达式，解释为什么输出可能不同。
3. 将 "中" 的字节数、码点数与 rune 值写成三个测试断言。

通过标准：能解释整数截断、浮点特殊值、复数分量和码点转换；所有外部数值有范围检查。参考：[类型与转换规范](https://go.dev/ref/spec#Types)、[strconv](https://pkg.go.dev/strconv)、[math](https://pkg.go.dev/math)。
