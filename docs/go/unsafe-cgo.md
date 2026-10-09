---
title: 7.3. Unsafe、cgo 与边界约束
description: 布局、指针生命周期、C 内存与跨平台构建。
pageClass: aip-article
---

# 7.3. Unsafe、cgo 与边界约束

学习前应能完成：[逃逸、GC 与内存预算](./memory)、[代码生成与构建约束](./generation)。

roadmap 的 Unsafe 和 CGO 是进阶边界。本章提供可控布局与 C 互操作实验，并说明适用约束，避免把不安全优化当成日常技巧。

## unsafe 观察浅层布局

```go
package main

import (
	"fmt"
	"unsafe"
)

type Layout struct {
	Flag  bool
	Count int64
	Code  byte
}

func main() {
	var v Layout
	fmt.Println("size", unsafe.Sizeof(v))
	fmt.Println("align", unsafe.Alignof(v))
	fmt.Println("count offset", unsafe.Offsetof(v.Count))
	fmt.Println("slice header", unsafe.Sizeof([]byte{}))
}
```

具体数值依平台 ABI、字段布局与架构而定，不做跨平台固定断言。Sizeof 包含结构体 padding，只测切片/字符串描述符，不包含背后数据。学习输出用于解释对齐与浅层大小，不用于把内存块直接作为网络协议。

## Pointer 与 uintptr 的关键区别

unsafe.Pointer 是可指向对象的特殊指针值，uintptr 是整数，不保证对象仍可达，也不随地址变化更新。把指针转整数保存后再恢复可能违背生命周期规则；即使在某次运行有效，也不能认为受 Go 兼容承诺保护。

合法转换须严格遵循 [unsafe 文档](https://pkg.go.dev/unsafe)中的模式。不要手工构造反射字符串/切片头来制造零复制视图，持有方修改和生命周期容易破坏不可变字符串语义。先复用 bytes、strings、encoding/binary 与成熟解析库，有测量且无法满足需求再审查 unsafe。

`go test -race` 与 `-gcflags=all=-d=checkptr=2` 可辅助查部分问题，不是内存安全证明。将 unsafe 封装在极小边界，写清对象寿命、对齐、长度和所有权，覆盖目标平台。

## cgo 最小实验

需要本机 C 编译器并启用 cgo，保存 main.go：

```go
package main

/*
#include <stdlib.h>
static int add(int a, int b) { return a + b; }
*/
import "C"

import "fmt"

func main() {
	result := C.add(C.int(2), C.int(3))
	fmt.Println(int(result)) // 5
}
```

C 的声明注释紧邻 import "C"。调用涉及 Go/C 类型转换、编译与链接，不能假设 `CGO_ENABLED=0` 后还能构建。这里只调用无外部状态的标量函数，复杂互操作应使用成熟绑定。

## C 内存与 Go 指针规则

C.CString 创建 C 内存，需要 C.free 释放；Go GC 不替它回收。C 分配可能不计入 Go heap profile，观察进程 RSS 与库侧指标。C 持有 Go 指针受到严格限制，尤其涉及包含其他 Go 指针的内存；某些固定寿命可使用 runtime.Pinner，但它不等于解除所有规则，按 cgo 文档逐条检查。

C 调用与回调可能影响线程与调度，外部库要求固定线程时了解 runtime.LockOSThread 和库自身约束。不要以每元素跨边界调用做高频数据处理，必要时批量减少调用开销并测量。

## 构建与动态库

交叉编译 cgo 需要目标平台的 C 工具链与库，不能只设 GOOS/GOARCH 就完成。链接时检查头文件、库搜索路径、静态/动态依赖与部署镜像。依赖安全修复同时关注 Go 与 C 库版本，不能只扫 go.mod。

## 学习实验与判定 {#lab}

1. 在两种架构观察布局差异，解释 padding，不把某个大小当协议。
2. 运行 cgo 加法，关闭 CGO_ENABLED 后验证构建失败原因。
3. 写 C.CString 的配对释放实验，说明谁分配、谁释放、何时释放。
4. 将一个 unsafe 转换需求改用安全标准库，比较性能与维护成本。

通过标准：能证明数据寿命、所有权与平台条件，知道 Go GC 不管理 C 内存。参考：[cgo](https://pkg.go.dev/cmd/cgo)、[unsafe](https://pkg.go.dev/unsafe)。
