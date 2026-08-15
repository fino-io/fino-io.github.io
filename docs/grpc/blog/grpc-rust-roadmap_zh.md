---
title: gRPC-Rust 路线图
date: 2026-06-02
source_url: https://grpc.io/blog/grpc-rust-roadmap/
---

# gRPC-Rust 路线图

作者：Doug Fawley（Google）｜2026 年 6 月 2 日

客户端预览版发布后，gRPC-Rust 团队介绍了下一阶段的工作重点。

## 正在进行

最重要的工作是服务端 API。它将自然扩展现有的客户端 API，并在可能时复用类型；准备就绪后会发布新的预览公告。

团队也在开发客户端功能，包括集成式[健康检查](https://github.com/grpc/proposal/blob/master/A17-client-side-health-checking.md)、[消息压缩](https://github.com/grpc/grpc/blob/master/doc/compression.md)，并完善 gRPC 互操作测试套件，以让 gRPC-Rust 达到可用于生产的标准。

## 下一步

- 逐步提供重试、二进制日志、Channelz 调试、Keepalive、授权等重要特性。
- 长期重点是完整的 xDS 支持，既服务于 Proxyless Service Mesh，也支持 Google Cloud 服务的直接连接。
- 计划以共享的 Rust RPC 状态类型替代自有的 gRPC Status，并等待 Rust `Try` trait 稳定以获得更自然的错误处理体验。
- 在功能完善后进行性能调优，包括降低整体与单连接内存占用、支持零拷贝以及采用更低层的 HTTP/2 实现，以提升吞吐量、延迟和并行能力。

## 参加 gRPConf 2026

今年的 gRPC 开发者大会将于 2026 年 9 月 3 日在美国加州山景城的 Computer History Museum 举办。

- [活动网站](https://events.linuxfoundation.org/grpconf/)
- [征集演讲](https://events.linuxfoundation.org/grpconf/program/cfp/)
