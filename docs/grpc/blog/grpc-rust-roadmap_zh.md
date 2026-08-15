---
title: gRPC-Rust 路线图
date: 2026-06-02
spelling: cSpell:ignore
author:
  name: Doug Fawley
  position: Google
source_url: https://grpc.io/blog/grpc-rust-roadmap/
---

随着[客户端预览版的发布](https://grpc.io/blog/grpc-rust-announcement) 的完成，我想花一些时间讨论一下您接下来可以从 gRPC-Rust 团队看到的内容。

## 进行中

正在积极开发的最大、最重要的东西是服务端 API。这将是客户端 API 的自然扩展，尽可能共享类型。  准备好后，期待看到另一个预览公告！

此外，我们已经在努力开发更多客户端功能，例如集成的[运行状况检查](https://github.com/grpc/proposal/blob/master/A17-client-side-health-checking.md) 和[消息压缩](https://github.com/grpc/grpc/blob/master/doc/compression.md)。

最后，我们正在努力加强测试并实现完整的 [gRPC 互操作测试套件](https://github.com/grpc/grpc/blob/master/doc/interop-test-descriptions.md)，以便 gRPC-Rust 可以被宣布为具有生产价值。

## 接下来

展望未来，还有许多其他功能和更改正在计划中：

* 重要的 gRPC 功能：
[重试](https://github.com/grpc/proposal/blob/master/A6-client-retries.md)、[二进制日志记录](https://github.com/grpc/proposal/blob/master/A16-binary-logging.md)、[通道调试](https://github.com/grpc/proposal/blob/master/A14-channelz.md)、[Keepalive 支持](https://github.com/grpc/proposal/blob/master/A8-client-side-keepalive.md)、[授权](https://github.com/grpc/proposal/blob/master/A43-grpc-authorization-api.md) 等。这些功能将在发布后发布可用。

* 完整的 xDS ([Envoy](https://www.envoyproxy.io/)) 支持是一个长期目标
该团队将在接下来的几个月中重点关注。  除了[无代理服务网格](https://docs.cloud.google.com/service-mesh/legacy/load-balancing-apis/proxyless-configure-advanced-traffic-management) (PSM) 使用案例之外，此功能还为 Google Cloud 服务启用[直接连接](https://docs.cloud.google.com/storage/docs/direct-connectivity)。

* gRPC Status -> Abseil Status：[gRPC 状态类型]
C++](https://grpc.github.io/grpc/cpp/classgrpc_1_1_status.html) 与 [`absl::Status`](https://abseil.io/docs/cpp/guides/status) 非常相似，这并非偶然 - 但它们的微小*内部*差异引起了一些痛苦。   我们打算标准化共享的 Rust RPC 状态类型，而不是使用我们自己的状态类型。  我们热切地等待 [Try 特性](https://github.com/rust-lang/rust-project-goals/blob/main/src/2026/stabilize-try.md) 的稳定，这将使这种新型能够符合人体工程学地提供一些非常有用的功能。  有关该更改的更多详细信息将在可用时发布。

* 性能调整：虽然我们最初专注于“把事情做好”，
我们还将研究如何提高预览版提供的性能。  我们将考虑减少内存使用（总体和每个连接）、零复制支持和较低级别的 HTTP/2 实现，从而实现更高的吞吐量、更低的延迟和更多的并行性。

## 加入我们的 gRPConf 2026！

如果您有兴趣与 gRPC 团队会面、与业内其他人讨论相关主题，或者甚至在演讲中分享您自己的经验或建议，请将您的日历标记为**9 月 3 日星期四**，届时我们将在加利福尼亚州山景城的[计算机历史博物馆](https://computerhistory.org/) 举办今年的 gRPC 开发者大会。

* **活动地点：** [gRPConf](https://events.linuxfoundation.org/grpconf/)
* **CFP 开放：** [提交您的演讲！](https://events.linuxfoundation.org/grpconf/program/cfp/)
