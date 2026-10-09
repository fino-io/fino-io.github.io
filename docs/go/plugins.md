---
title: 7.4. 插件与动态加载
description: buildmode=plugin、ABI 限制与进程通信替代方案。
pageClass: aip-article
---

# 7.4. 插件与动态加载

学习前应能完成：[接口、断言与动态类型](./interfaces)、[代码生成与构建约束](./generation)、[可执行文件、交叉编译与部署](./deployment)。

动态加载允许运行时加入 Go 编译的实现，但它存在工具链和平台边界。先完成一个最小加载实验，再评估是否适合真实扩展系统。

## 两个模块目录的最小实验

在一个模块下建立：

```text
plugin-demo/
  go.mod
  plugin/main.go
  host/main.go
```

plugin/main.go：

```go
package main

func Greet(name string) string { return "你好，" + name }
```

host/main.go：

```go
package main

import (
	"fmt"
	"plugin"
)

func main() {
	p, err := plugin.Open("greeter.so")
	if err != nil {
		panic(err)
	}
	symbol, err := p.Lookup("Greet")
	if err != nil {
		panic(err)
	}
	greet, ok := symbol.(func(string) string)
	if !ok {
		panic("插件签名不匹配")
	}
	fmt.Println(greet("Go")) // 你好，Go
}
```

在项目根执行：

```sh
go build -buildmode=plugin -o greeter.so ./plugin
go build -o host-app ./host
./host-app
```

仅在支持的操作系统、架构和工具链条件下运行，按照 [plugin 官方文档](https://pkg.go.dev/plugin)核对。Windows 等不支持的平台不要用“文件改成 .dll”假装实现跨平台。主程序和插件要用兼容工具链、构建标签与共同依赖版本构建。

## Symbol 与生命周期

Lookup 返回 Symbol，调用前断言精确函数签名。插件的 init 在加载过程中执行，加载不是只读取数据，插件代码拥有进程权限。只加载可信、经过构建审查的产物，外部用户输入不能任意指定共享库路径。

同一插件通常只初始化一次，标准插件机制不提供正常的卸载与热替换隔离。不同共同包构建内容或版本不一致可能导致失败；不能把 Go plugin 视作稳定跨版本 ABI。race 检测在插件场景也有局限，需要独立验证。

## 扩展点的替代方案

| 方案 | 强项 | 代价 |
| --- | --- | --- |
| 编译时接口实现 | 类型检查与部署简单 | 更新扩展需要重建主程序。 |
| Go plugin | 同进程动态代码 | 平台、版本耦合、卸载与安全边界。 |
| 子进程 + JSON/stdio | 故障隔离、语言独立 | 生命周期、消息协议与进程管理。 |
| gRPC 独立服务 | 跨语言与部署独立 | 网络、认证、超时和运维成本。 |

真正需求只是选择多个实现时使用配置 + 编译时注册；需要强隔离时选择进程边界。不要为“可扩展”提前增加插件架构。进程通信可复用成熟 RPC/插件库，先定义版本、能力和失败协议。

## 学习实验与判定 {#lab}

1. 运行示例，再改变函数签名，主程序必须检测断言失败而非盲目调用。
2. 用不同共同依赖/构建标签构建，记录兼容失败条件。
3. 写一份扩展需求，对照四种方案选择并说明故障隔离要求。

通过标准：理解平台与 ABI 耦合，动态加载不被误当成通用热更新或权限隔离。
