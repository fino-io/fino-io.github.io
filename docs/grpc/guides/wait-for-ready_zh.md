---
title: 等待就绪
description: '解释如何配置 RPC，使其在发送请求前等待服务端准备就绪。'
source_url: https://grpc.io/docs/guides/wait-for-ready/
---

### 概述

这是一个可以在存根上使用的功能，它会导致 RPC 在发送请求之前等待服务端变得可用。  这允许强大的批处理工作流程，因为暂时的服务端问题不会导致故障。截止时间仍然适用，因此如果超过截止时间，等待将被中断。

当创建RPC时通道连接服务端失败，如果没有Wait-for-Ready会立即返回失败；使用等待就绪，它将简单地排队直到连接准备好。  默认为**无**等待就绪。

有关详细语义，请参阅[this][grpc doc]。

### 如何使用等待就绪

您可以为存根指定是否应使用 Wait-for-Ready，它将在创建 RPC 时自动传递。
除了服务端未准备好之外，RPC 仍然可能因其他原因而失败，因此错误处理仍然是必要的。
下面显示了当客户端向服务端发送消息时发生的事件序列，具体取决于通道状态以及是否设置了 Wait-for-Ready。
```mermaid
sequenceDiagram
participant A as Application
participant RPC
participant CH as Channel
participant S as Server 
A->>RPC: Create RPC using stub
RPC->>CH: Initiate Communication
alt channel state: READY
  CH->>S: Send message
else Channel state: IDLE or CONNECTING
  CH-->>CH: Wait for state change
else Channel state: TRANSIENT_FAILURE
  alt with Wait-for-Ready
    CH-->>CH: Wait for channel<br>becoming READY<br>(or a permanent failure)
    CH->>S: Send message
  else without Wait-for-Ready
    CH->>A: Failure
  end
else Channel state is a Permanent Failure
    CH->>A: Failure
end
```
以下是基于状态的视图
```mermaid
stateDiagram-v2
   state "Initiating Communication" as IC
   state "Channel State" as CS
   IC-->CS: Check Channel State
   state CS {
      state "Permanent Failure" as PF
      state "TRANSIENT_FAILURE" as TF
      IDLE --> CONNECTING
      CONNECTING --> READY
      READY-->[*]
      CONNECTING-->TF
      CONNECTING-->PF
      TF-->READY
      TF -->[*]: without\n wait-for-ready
      TF-->PF
      PF-->[*]
   }
  state "MSG sent" as MS
  state "RPC Failed" as RF
  CS-->WAIT:From IDLE /\nCONNECTING
  CS-->WAIT:From Transient\nFailure with\nWait-for-Ready
  WAIT-->CS:State Change 
  CS-->MS: From READY
  CS-->RF: From Permanent failure or\nTransient Failure without\nWait-for-Ready
  MS-->[*]
  RF-->[*]
```

### 替代方案

- 循环（使用指数退避）直到 RPC 停止返回瞬态故障。
- 为了提高效率，可以将其与实现 `onReady` 处理程序结合起来
_（对于支持此功能的语言）_。
- 接受可能通过等待避免的失败，因为你想
快速失败

### 语言支持

|语言|例子|
|----------|-------------------|
|Java|[Java 示例]|
|Go|[Go 示例]|
|Python|[Python 示例]|

[Java 示例]: https://github.com/grpc/grpc-java/blob/master/examples/src/main/java/io/grpc/examples/waitforready/WaitForReadyClient.java
[Go 示例]: https://github.com/grpc/grpc-go/tree/master/examples/features/wait_for_ready
[Python 示例]: https://github.com/grpc/grpc/tree/master/examples/python/wait_for_ready
[grpc doc]: https://github.com/grpc/grpc/blob/master/doc/wait-for-ready.md
