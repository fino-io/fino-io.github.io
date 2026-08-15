---
title: 自定义后端指标
description: 'gRPC 库中的一种机制，允许用户在 gRPC 服务端注入自定义指标，并在 gRPC 客户端使用这些指标制定自定义负载均衡算法。'
source_url: https://grpc.io/docs/guides/custom-backend-metrics/
---


### 概述
可以通过考虑后端负载（例如 CPU）的本地或全局知识来做出简单的负载均衡决策。通过特定于应用程序的知识，例如，可以做出更复杂的负载均衡决策。队列深度，或通过组合多个指标。

自定义后端指标功能公开 API，允许用户在负载策略中实现指标反馈。

### 用例
该功能主要适用于高级用例，其中使用自定义 LB 策略将流量更智能地路由到后端服务端列表以提高路由性能，例如加权循环 LB 策略。

gRPC 传统上允许用户插入自己的负载均衡策略，请参阅[指南][自定义负载均衡指南]。对于xDS用户，可以配置【自定义负载均衡器】来选择自定义LB策略。

### 指标报告
开放请求成本聚合 ([ORCA]) 是用于传达后端指标信息的开放标准。 gRPC 使用 ORCA 服务和指标标准，并支持两种指标报告机制：

* 每个查询指标报告：后端服务端附加注入的自定义
当相应的 RPC 完成时，跟踪元数据中的指标。这对于诸如一元调用之类的短 RPC 通常很有用。


* 带外指标报告：后端服务端定期推送指标
数据，例如向客户端提供 CPU 和内存利用率。这对于所有情况都很有用：一元调用、流式调用中的长 RPC 或无 RPC。但是，带外指标报告不会发送查询成本指标。指标发射频率是用户可配置的，并且此配置驻留在自定义负载均衡策略中。

该图显示了用户创建自己的负载均衡策略来实现后端指标反馈的架构。


![gRPC 后端指标图](https://grpc.io/img/backend_metrics.svg)


### 执行

有关更多详细信息，请参阅 gRPC [提案 A51]。


### 语言支持

|语言|例子|
|----------|------------------|
|Java|[Java 示例]|
|Go|[Go 示例]|
|C++|即将推出的示例|

[proposal A51]: https://github.com/grpc/proposal/blob/master/A51-custom-backend-metrics.md
[ORCA]: https://github.com/cncf/xds/blob/main/xds/data/orca/v3/orca_load_report.proto
[Java example]: https://github.com/grpc/grpc-java/tree/master/examples/example-orca
[Go example]: https://github.com/grpc/grpc-go/tree/master/examples/features/orca
[自定义负载均衡指南](https://grpc.io/docs/guides/custom-load-balancing/)
[custom load balancer]: https://github.com/grpc/proposal/blob/master/A52-xds-custom-lb-policies.md
