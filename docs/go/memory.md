---
title: 35 · 逃逸、GC 与内存预算
description: 存活集、分配速率、逃逸实验、GOGC 与 GOMEMLIMIT。
pageClass: aip-article
---

# 35 · 逃逸、GC 与内存预算

学习前应能完成：[指针、别名与内存概览](./pointers)、[pprof、Trace 与调试](./performance)。

内存优化先区分分配量与存活量，再理解逃逸和 GC。减少所有指针或调大 GOGC 都不是通用答案。

## 栈、堆与逃逸实验

保存为 main.go：

```go
package main

import "fmt"

type Item struct{ Value int }

var retained *Item

func local() int    { item := Item{Value: 7}; return item.Value }
func escape() *Item { item := Item{Value: 9}; return &item }

func main() {
	retained = escape()
	fmt.Println(local(), retained.Value) // 7 9
}
```

```sh
go build -gcflags='-m' .
```

观察 item 在 escape 中可能需要堆存储；内联、优化与版本会改变诊断措辞和决策，教材不把某条固定输出当契约。返回地址是安全的，编译器安排存储；逃逸说明生命周期需求，不是泄漏本身。fmt 的接口参数也可能影响分配，测一个局部操作时把输出移到测量路径外。

## 分配速率、存活集与可达性

分配速率表示每秒产生多少新对象，存活集表示 GC 后仍可达的对象。循环生成许多临时字符串可能高分配而低存活；全局缓存保留很少新增但大量对象可能低分配而高存活。优化方法不同：前者减少中间复制，后者限制缓存、释放引用和避免保留大数组。

示意：从 100 MiB []byte 截一个 16 字节子切片，长期保存它可能使整块数组仍可达。只保留需要内容时 `bytes.Clone` 或复制这 16 字节；如果确实需要原数据，多复制反而浪费。heap profile 结合 inuse_space 与 alloc_space 判断保留和分配，不能只看一次内存峰值。

## GC 的工作与参数

GC 基于可达性追踪对象，包含并发工作与必要的运行时停顿，CPU 成本和堆大小之间有取舍。GOGC 表达相对堆增长目标；调大可能减少收集频率却增加内存，调小相反。GOMEMLIMIT 是运行时管理内存的软预算，不涵盖所有进程内存，也不是禁止超过阈值的硬上限。

cgo 分配、映射文件、OS 栈等还可能增加进程 RSS。容器限额需要预留余量，以真实指标判断，不能把 GOMEMLIMIT 设置成容器上限就保证安全。参见 [官方 GC 指南](https://go.dev/doc/gc-guide)。

## 复用、池与数据布局

优先减少不必要的转换、循环字符串拼接和无限增长队列；预分配已知规模容器。sync.Pool 可以复用短寿命临时对象，内容可被 GC 丢弃，使用者不能保留别人的可变 buffer。归还前清理引用与敏感数据，避免大对象长期保留；无 profile 证据时不先加池。

字段含指针会影响扫描工作，数组值与指针数组权衡复制、局部性和可达性。不要为减少几个 padding 字节破坏模型可读性，先确定实例数量与真实内存占比。unsafe.Sizeof 测浅层布局，不包含切片背后所有数据。

## 学习实验与判定 {#lab}

1. 编译逃逸实验，记录工具链和优化条件；解释为什么返回局部地址不悬垂。
2. 比较保留大切片子片段和复制小片段的 heap profile，验证存活量差异。
3. 在固定负载下改变 GOGC，记录 CPU、堆峰值和延迟，不能只报告一个指标。
4. 为缓存设置容量或失效策略，测试不随输入无限增长。

通过标准：能分别说明分配、保留、GC 与 RSS；每次优化基于 profile 和负载证据。
