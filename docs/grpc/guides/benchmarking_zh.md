---
title: 性能基准测试
description: 'gRPC 旨在支持多种语言的高性能开源 RPC。本页描述了性能基准测试工具、测试考虑的场景以及测试基础设施。'
source_url: https://grpc.io/docs/guides/benchmarking/
---

### 概述

gRPC 专为分布式应用程序的高性能和高生产力设计而设计。持续性能基准测试是 gRPC 开发工作流程的关键部分。多语言性能测试每隔几个小时针对主分支运行一次，这些数字将报告到仪表板以进行可视化。

- [多语言性能仪表板@master（最新开发版本）](https://grafana-dot-grpc-testing.appspot.com/)
- [旧版仪表板（与上述数据相同）](https://performance-dot-grpc-testing.appspot.com/explore?dashboard=5180705743044608)

### 性能测试设计

每种语言都实现了一个性能测试工作线程，该工作线程实现了 gRPC [WorkerService](https://github.com/grpc/grpc/blob/master/src/proto/grpc/testing/worker_service.proto)。此服务指示工作线程充当实际基准测试的客户端或服务端，表示为 [BenchmarkService](https://github.com/grpc/grpc/blob/master/src/proto/grpc/testing/benchmark_service.proto)。该服务有两种方法：

- UnaryCall – 指定字节数的简单请求的一元 RPC
在响应中返回。
- StreamingCall – 一种流式 RPC，允许重复请求和
类似于 UnaryCall 的响应消息。

![gRPC 性能测试工作人员图](https://grpc.io/img/testing_framework.png)

这些工作进程由 [驱动程序](https://github.com/grpc/grpc/blob/master/test/cpp/qps/qps_json_driver.cc) 控制，该驱动程序将场景描述（JSON 格式）和指定每个工作进程的主机：端口的环境变量作为输入。

### 测试语言

以下语言作为主控客户端和服务端进行持续性能测试：

- C++
- Java
- 去
- C#
- 节点.js
- Python
- 红宝石

除了作为性能测试的客户端和服务端运行之外，所有语言都作为客户端针对 C++ 服务端进行测试，以及作为服务端针对 C++ 客户端进行测试。此测试旨在提供给定语言的客户端或服务端实现的当前性能上限，而不测试另一端。

尽管 PHP 或移动环境不支持 gRPC 服务端（这是我们性能测试所必需的），但可以使用用另一种语言编写的代理 WorkerService 对它们的客户端性能进行基准测试。该代码是针对 PHP 实现的，但尚未处于持续测试模式。

### 测试场景

有几个重要的场景正在测试并显示在上面的仪表板中，包括以下内容：

- 无争用延迟 – 仅使用时看到的中值和尾部响应延迟
1 个客户端使用 StreamingCall 一次发送一条消息。
- QPS – 有 2 个客户端、总共 64 个时的消息/秒速率
通道，每个通道一次有 100 条使用 StreamingCall 发送的未完成消息。
- 可扩展性（针对选定的语言）——每秒消息数
服务端核心。

大多数性能测试都使用安全通信和 protobuf。一些 C++ 测试还使用不安全的通信和通用（非 protobuf）API 来显示峰值性能。将来可能会添加其他场景。

### 测试基础设施

所有性能基准测试都在我们的专用 GKE 集群中运行，其中每个基准测试工作线程（客户端或服务端）都被安排到我们工作池之一中的不同 GKE 节点（每个 GKE 节点是一个单独的 GCE 虚拟机）。我们使用的基准测试框架的源代码可在 [test-infra github 存储库](https://github.com/grpc/test-infra) 中公开获取。

大多数测试实例都是 8 核系统，这些系统用于延迟和 QPS 测量。对于 C++ 和 Java，我们还支持 32 核系统上的 QPS 测试。所有 QPS 测试对每个服务端都使用 2 个相同的客户端计算机，以确保 QPS 测量不受客户端限制。
