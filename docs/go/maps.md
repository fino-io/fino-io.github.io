---
title: 1.7. Map、集合与逗号 ok
description: 键的可比较性、读写、删除、排序与集合运算。
pageClass: aip-article
---

# 1.7. Map、集合与逗号 ok

学习前应能完成：[字符串、数组与切片模型](./collections)。

Map 提供键到值的查找，不提供有序遍历。学习目标是区分“值不存在”和“值存在但为零”，并掌握键、共享、更新与并发边界。

## 创建、读取、更新与删除

```go
package main

import "fmt"

func main() {
	var missing map[string]int
	fmt.Println(len(missing), missing["Go"]) // 0 0
	scores := make(map[string]int)
	scores["Go"] = 0
	value, exists := scores["Go"]
	fmt.Println(value, exists) // 0 true
	_, exists = scores["Rust"]
	fmt.Println(exists) // false
	delete(scores, "Go")
	fmt.Println(len(scores)) // 0
}
```

nil map 可读、删除和遍历，但写入 panic。`make(map[K]V, hint)` 的第二参数是容量提示，不是固定上限。逗号 ok 还用于类型断言与 channel 接收，在不同场景分别表达类型是否匹配、channel 是否仍有值。

## 可比较的键与动态类型陷阱

数字、字符串、指针及字段全部可比较的结构体可用作键。切片、map、函数不可作为普通键。`map[any]V` 编译可通过，但放入动态类型不可比较的值，例如 `[]int`，仍会在运行时 panic；不能把 any 当成“什么键都支持”。

浮点 NaN 与自身不相等，作为键会产生难以按同一值回查的行为；业务 ID 优先用稳定字符串或整数。指针键比较地址，两个内容相同的独立对象仍是不同键。

## Map 元素不可取地址

片段中的 `users[id].Name = "new"` 不能直接修改 map 里的结构体字段。先取出结构体值、修改、再写回；或者把指针放进 map，但这引入可变对象共享，须明确所有权。

```go
package main

import "fmt"

type User struct{ Name string }

func main() {
	users := map[int]User{1: {Name: "old"}}
	user := users[1]
	user.Name = "new"
	users[1] = user
	alias := users
	delete(alias, 1)
	fmt.Println(len(users)) // 0：map 值复制后共享数据
}
```

## 集合与确定性输出

`map[T]struct{}` 表达集合，空结构体没有业务值；交集遍历较小集合并查询较大集合，平均 O(n)。标准 map 不保证顺序，输出时复制键后排序。浅复制只复制键和值；值包含指针或切片时，内部引用依然共享。

普通 map 的共享访问遵循统一锁策略，包括 len、遍历、读和写。并发只读且无写入可以安全共享；发生任何并发写就要同步。不要默认换 sync.Map，其适用负载和 API 与普通 map 不同。

## 学习实验与判定 {#lab}

1. 实现集合交集，输入重复值、空集合和无交集，输出必须排序。
2. 写一个缓存查询 `(value, found)`，允许缓存合法零值。
3. 用 struct 与 *struct 两种 map 值比较更新效果，说明哪种会共享可变对象。

通过标准：能说明键的约束、逗号 ok 与共享状态，无顺序依赖或漏掉保护的访问。参考：[Map 规范](https://go.dev/ref/spec#Map_types)、[Go maps in action](https://go.dev/blog/maps)。
