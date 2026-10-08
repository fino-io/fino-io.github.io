---
title: 08 · 结构体、Tag 与嵌入
description: 字段建模、JSON、组合与方法提升的真实语义。
pageClass: aip-article
---

# 08 · 结构体、Tag 与嵌入

学习前应能完成：[基本类型、数值与类型转换](./basics)、[Map、集合与逗号 ok](./maps)。

本章目标：用结构体表达数据，用小接口表达协作行为，保持依赖清楚。

## 结构体、方法与组合

结构体字段可带 tag，例如 `json:"name"`，tag 是供编码等工具读取的元数据。方法是带接收者的函数；需要修改接收者或避免大对象复制时用指针接收者。含 Mutex 的结构体不能在使用后复制，方法通常都用指针接收者。

```go
package main

import "fmt"

type Task struct {
	ID    int    `json:"id"`
	Title string `json:"title"`
	Done  bool   `json:"done"`
}

func (t *Task) Complete()      { t.Done = true }
func (t Task) Summary() string { return fmt.Sprintf("%d: %s", t.ID, t.Title) }

type Summarizer interface{ Summary() string }

func printSummary(s Summarizer) { fmt.Println(s.Summary()) }

func main() {
	task := Task{ID: 1, Title: "学习 Go"}
	task.Complete()
	printSummary(task)
	fmt.Println(task.Done) // true
}
```

接口由行为决定，类型不需要显式 implements。`T` 的方法集包含值接收者方法，`*T` 包含值接收者和指针接收者方法；接口赋值按方法集检查。普通方法调用可能自动取地址，但不能据此推断某个值实现了接口。

组合可以使用具名字段，也可以使用嵌入提升方法。嵌入不是传统继承，没有自动的“子类替换父类”关系；需要明确控制调用时优先具名字段。

## 小接口放在使用方

假设业务只需要读内容，依赖 `io.Reader` 比依赖某个具体文件类型更方便测试。接口通常在调用者所在包定义，只列真正需要的操作。具体实现可以直接返回结构体或指针，不必给每个类型配一个接口。

数据库、网络等边界适合接口；纯数据模型、私有辅助函数通常不需要。避免 `Manager`、`BaseService` 等含糊抽象，使用 `TaskStore`、`Notifier` 这样清楚的职责名。

## 接口值为什么可能不等于 nil

```go
package main

import "fmt"

type Problem struct{}

func (*Problem) Error() string { return "出了问题" }

func main() {
	var p *Problem
	var err error = p
	fmt.Println(p == nil, err == nil) // true false
}
```

接口同时携带动态类型和动态值。即使动态值是 nil 指针，只要动态类型存在，接口就不等于 nil。返回 error 时成功路径直接 `return nil`，避免将未初始化的具体错误指针装进接口。

`any` 是空接口别名，意味着调用方要在运行时解释类型；普通业务优先具体类型。类型断言用 `v, ok := x.(T)` 避免意外 panic，多个候选类型用 type switch。

## Tag、字段可见性与 JSON 的真实关系

Tag 不改变 Go 的字段类型或内存布局，是供反射和编码器解释的文本。只有导出字段可被 encoding/json 正常编码。`json:"name,omitempty"` 表达编码名与省略规则，但 omitempty 对 false、0、空字符串等零值会省略，不能表达所有“未提供”的需求。

```go
package main

import (
	"encoding/json"
	"fmt"
)

type Options struct {
	Enabled *bool  `json:"enabled,omitempty"`
	Label   string `json:"label,omitempty"`
	secret  string
}

func main() {
	no := false
	absent, _ := json.Marshal(Options{})
	explicit, _ := json.Marshal(Options{Enabled: &no, secret: "hidden"})
	fmt.Println(string(absent))   // {}
	fmt.Println(string(explicit)) // {"enabled":false}
}
```

这里省略 Marshal 错误是因为结构体字段集合固定且全部可编码；真实编码任意值时处理错误。指针只区分 nil 与非 nil；如果还要区分 null 和字段缺失，需专门 presence 模型或自定义解码，不能假设指针自动保留三态。

## 嵌入是方法提升，不是继承

```go
package main

import "fmt"

type Base struct{ Name string }

func (b Base) Describe() string { return "base: " + b.Name }

type Page struct {
	Base
	Title string
}

func main() {
	p := Page{Base: Base{Name: "Go"}, Title: "课程"}
	fmt.Println(p.Describe())        // base: Go，提升方法
	fmt.Println(p.Name, p.Base.Name) // Go Go，指向同一字段
}
```

结构体字面量不能直接写提升字段 `Page{Name:"Go"}`，要初始化 Base 字段。两个嵌入字段提升同名方法时可能歧义，显式 `p.Left.Method()` 选择，不用它构建复杂继承层次。内嵌方法调用接收者依然是原内嵌类型，不会动态派发到外层同名方法。

## 可比较性与值语义

结构体只有所有字段可比较才可用 `==` 或 map 键。含 []string 的 Task 不能直接比较，含指针字段时比较的是地址；两个内容一样的对象不因此相等。领域等价单独写清楚：ID 相同、所有业务字段相同、或对象身份相同，三者不要混用。

内存布局可能含 padding，字段排序影响大小但不保证序列化布局。网络数据使用 encoding/binary、JSON 或 Protobuf，不把 unsafe.Sizeof 与结构体内存直接当 wire format。

## 练习与验收 {#lab}

1. 给 Task 添加只读描述方法，解释值与指针方法集的差别。
2. 写一个接受 `io.Reader` 的解析函数，分别用文件和 strings.Reader 调用。
3. 构造带类型 nil 的 error，再改成真正的 nil 返回。

验收：接口只包含调用方需要的行为，能解释隐式实现和 nil 陷阱。参考：[Tour 的方法与接口](https://go.dev/tour/methods/1)。
