---
title: 03 · 字符串、切片与映射
description: Go 中文学习指南：字符串、切片与映射，包含概念、示例、练习与验收。
pageClass: aip-article
---

# 03 · 字符串、切片与映射

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

## 练习与验收

1. 给词频结果按次数降序排序，相同次数按词排序。
2. 实验 append 前后的共享情况，再用 Clone 消除相互影响。
3. 对空切片、nil 切片与空 map 分别运行 len、range 和写操作。

验收：能解释 len/cap、浅复制与 map 的逗号 ok 用法，输出顺序可复现。参考：[Tour 的复合类型](https://go.dev/tour/moretypes/1)、[slices 文档](https://pkg.go.dev/slices)。
