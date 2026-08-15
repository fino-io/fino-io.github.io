---
title: 服务配置
description: '服务所有者如何使用服务配置来控制客户端行为。'
source_url: https://grpc.io/docs/guides/service-config/
---

### 概述

服务配置指定 gRPC 客户端在与 gRPC 服务端交互时应如何表现。服务所有者可以提供包含所有服务客户端的预期行为的服务配置。服务配置中的设置始终应用于特定的目标字符串（例如“api.myapp.com”），而不是全局。

### 由服务配置控制的行为

服务配置中的设置会影响客户端负载均衡、调用行为和运行状况检查。

本页概述了服务配置中的选项，但完整的服务配置数据结构是用 [protobuf 定义] 记录的。

#### 负载均衡

服务可以由多个服务端组成，负载均衡配置指定如何在这些服务端之间分配来自客户端的调用。默认情况下，使用 `pick_first` 负载均衡策略，但可以在服务配置中指定另一个策略。例如。指定 `round_robin` 策略将使客户端轮流使用服务端，而不是重复使用第一个服务端。

#### 调用行为

RPC 可以通过多种方式进行配置：

- 启用[wait-for-ready]后，如果客户端无法连接到后端，
RPC 将被延迟而不是立即失败。
- 可以提供一个调用[timeout]，表示客户端的最大时间
在放弃 RPC 之前应该等待。
- 以下之一：
- [重试]策略（最大尝试次数、退避设置、可重试状态码）
- [Hedging] 策略（最大尝试次数、延迟、非致命状态码）
这些调用行为设置可以限制为单个服务或方法。

可以通过设置“重试限制策略”来进一步调整重试和请求对冲策略，但它将适用于所有服务和方法。
#### 健康检查

可以将客户端配置为通过提供运行状况检查名称来执行[运行状况检查]。然后客户端将使用标准的 gRPC 健康检查服务。

### 获取服务配置

服务配置可以通过名称解析或由客户端应用程序以编程方式提供给客户端。

#### 名称解析

gRPC [名称解析机制] 允许可插入名称解析器实现。这些实现返回与名称关联的地址以及关联的服务配置。服务所有者可以使用这种机制将其服务配置分发给一组 gRPC 客户端。

- xDS 名称解析器转换从
控制平面到相应的服务配置。
- Go实现中的标准DNS名称解析器支持服务
名称服务端上的配置[存储为 TXT 记录]。
尽管服务配置结构是用 protobuf 定义记录的，但客户端中的内部表示形式是 JSON。名称解析器实现可以自由地以它们喜欢的任何方式存储服务配置信息，只要它们在名称解析时以 JSON 格式提供即可。
#### 以编程方式

gRPC 客户端 API 提供了一种以 JSON 格式指定服务配置的方法。这用于提供默认服务配置，该配置将在名称解析器不提供服务配置的情况下使用。它在某些测试情况下也很有用。

### 服务配置示例

下面的示例执行以下操作：

- 启用 `round_robin` 负载均衡策略。
- 设置默认调用超时 1 秒，适用于所有方法
服务。
- 将 `foo` 服务中的 `bar` 方法的超时覆盖为 2 秒，如下所示
以及 `baz` 服务中的所有方法。


```json
{
  "loadBalancingConfig": [ { "round_robin": {} } ],
  "methodConfig": [
    {
      "name": [{}],
      "timeout": "1s"
    },
    {
      "name": [
        { "service": "foo", "method": "bar" },
        { "service": "baz" }
      ],
      "timeout": "2s"
    }
  ]
}
```

[protobuf definition]:https://github.com/grpc/grpc-proto/blob/master/grpc/service_config/service_config.proto
[超时]：https://grpc.io/docs/guides/deadlines/
[Retry]:https://grpc.io/docs/guides/retry/
[健康检查]：https://grpc.io/docs/guides/health-checking/
[请求对冲]：https://grpc.io/docs/guides/request-hedging/
[等待就绪]：https://grpc.io/docs/guides/等待就绪/
[name resolution mechanism]:https://github.com/grpc/grpc/blob/master/doc/naming.md
[stored as TXT records]:https://github.com/grpc/proposal/blob/master/A2-service-configs-in-dns.md
