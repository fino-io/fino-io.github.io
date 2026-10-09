---
title: 1.6. 字符串、数组与切片模型
description: 通过容量、共享存储和转换实验理解容器语义。
pageClass: aip-article
---

# 1.6. 字符串、数组与切片模型

学习前应能完成：[基本类型、数值与类型转换](./basics)、[条件、循环与控制转移](./control-flow)。

本章目标：按访问方式选择容器，理解字符串与切片的数据表示，避免共享存储导致的意外修改。

## 容器怎么选

| 类型 | 适合 | 要注意 |
| --- | --- | --- |
| `[N]T` 数组 | 长度固定的数据 | 长度属于类型，赋值复制整个数组。 |
| `[]T` 切片 | 变长有序集合 | 复制切片描述符会共享底层数组。 |
| `map[K]V` | 按键查询与聚合 | 写入前初始化，顺序不稳定，不能无保护并发读写。 |
| `string` | 不可变文本或字节串 | len 返回字节数，不是字符数。 |

切片由指针、长度和容量组成。`append` 返回新的切片描述符；容量足够时可能复用旧数组，不足时会分配新数组，因此必须接收返回值。函数收到切片后修改元素会影响调用者，但函数内 append 后的长度不会自动同步到调用者。

## 看清共享与复制

```go
package main

import (
	"fmt"
	"slices"
)

func main() {
	original := []int{10, 20, 30}
	shared := original[:2]
	shared[0] = 99
	copied := slices.Clone(original)
	copied[0] = 1
	fmt.Println(original) // [99 20 30]
	fmt.Println(copied)   // [1 20 30]
}
```

`Clone` 是浅复制：元素如果包含指针、map 或切片，内部引用仍共享。`s[:len(s):len(s)]` 可以限制 append 复用后续空间，但不能防止修改已有元素。长时间保留大切片的很小子切片会保留底层大数组，需要时复制真正要保留的部分。

nil 切片与空切片都能 len、range、append，但 JSON 编码可能分别得到 null 和 []，对外接口要明确约定。map 查询用 `value, ok := m[key]` 区分不存在和存在但为零值。map 的键须可比较，不能用切片作键。

## 中文文本与有序词频

```go
package main

import (
	"fmt"
	"slices"
	"strings"
	"unicode/utf8"
)

func main() {
	text := "Go Go 中文"
	counts := make(map[string]int)
	for _, word := range strings.Fields(text) {
		counts[word]++
	}
	keys := make([]string, 0, len(counts))
	for key := range counts {
		keys = append(keys, key)
	}
	slices.Sort(keys)
	for _, key := range keys {
		fmt.Printf("%s: %d\n", key, counts[key])
	}
	fmt.Println(len("中文"), utf8.RuneCountInString("中文")) // 6 2
}
```

`for range` 遍历字符串产生字节索引和 rune。rune 是 Unicode 码点，仍不等于用户看到的一个完整字形，例如组合字符和部分 emoji 由多个码点构成。按字节切中文可能得到无效 UTF-8；按码点操作时先转 `[]rune`，涉及真实文本分词、规范化或字形边界时使用成熟库。

## 原始字符串与解释字符串

反引号字面量保留多数内容，常用于多行文本和正则；双引号解释 `\n`、`\t` 与 Unicode 转义。字符串不可变，索引得到一个 byte，不是 rune；转为 []byte/[]rune 再修改是显式的数据转换。

反引号中的 a、反斜线、n、b 保持四个字符；双引号中的 `"a\nb"` 会把转义解释成换行。raw string 中的反引号不能直接嵌入，需要拼接或换一种字面量。不要用 rune 数量推断字形长度，Unicode 规范化和分词另用成熟库。

## 容量增长与三索引切片实验

```go
package main

import "fmt"

func main() {
	data := []int{1, 2, 3, 4}
	shared := data[:2]
	shared = append(shared, 99)
	fmt.Println(data) // [1 2 99 4]
	limited := data[:2:2]
	limited = append(limited, 88)
	fmt.Println(data, limited) // [1 2 99 4] [1 2 88]
}
```

三索引 `low:high:max` 把容量限制到 max-low；append 超过该容量需要新数组。它保护后续 append 不覆盖原切片尾部，不隔离已有元素修改。`append` 的具体增长倍率是实现细节，不用“总是翻倍”设计协议或容量预测。

预分配 `make([]T, 0, n)` 表示长度为零、预留容量；`make([]T, n)` 已有 n 个零值元素，随后 append 会增加到 n+1 而不是填第一个位置。这个区别要通过测试固定，而不是仅在性能分析时注意。

## 数组与切片的双向转换

```go
package main

import "fmt"

func main() {
	a := [3]int{1, 2, 3}
	s := a[:]
	s[0] = 9
	copied := [3]int(s)   // Go 1.20+，数组值复制
	alias := (*[3]int)(s) // Go 1.17+，指向原数组
	copied[1] = 8
	alias[2] = 7
	fmt.Println(a, copied) // [9 2 7] [9 8 3]
}
```

数组转切片共享该数组，切片转数组值复制 N 个元素，转数组指针共享存储。切片长度小于目标 N 时会 panic，即使 capacity 足够也不行；先检查 len。路线要求认识这些转换，常规业务优先使用更直接的切片 API。

## 一个容器实验该验证什么

修改来源、len/cap、是否换底层数组、浅复制元素内部是否仍共享，四项都要说清楚。对 nil 与 [] 的 JSON 形状、空输入、一个元素和长度不足建立断言，才能发现“看起来差不多”背后的契约差异。

## 练习与验收 {#lab}

1. 给词频结果按次数降序排序，相同次数按词排序。
2. 实验 append 前后的共享情况，再用 Clone 消除相互影响。
3. 对空切片、nil 切片与空 map 分别运行 len、range 和写操作。

验收：能解释 len/cap、浅复制与 map 的逗号 ok 用法，输出顺序可复现。参考：[Tour 的复合类型](https://go.dev/tour/moretypes/1)、[slices 文档](https://pkg.go.dev/slices)。
