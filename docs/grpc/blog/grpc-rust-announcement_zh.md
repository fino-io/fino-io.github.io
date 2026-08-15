---
title: gRPC-Rust 预览版
date: 2026-05-28
spelling: cSpell:ignore Tokio
author:
  name: Doug Fawley
  position: Google
source_url: https://grpc.io/blog/grpc-rust-announcement/
---

今天，gRPC 项目很高兴分享其第一个 gRPC-Rust 预览版。  它可以在 [crates.io/crates/grpc](https://crates.io/crates/grpc) 中找到。  文档可在我们的网站 [grpc.io](https://grpc.io/docs/languages/rust) 上获取。  目前不建议将此版本用于生产用途，但会在早期阶段发布，以便为 Rust 程序员提供试验 API 的机会，并确保它们能够满足他们的需求。

## 包含什么

此版本包括：

* **gRPC 客户端 API**。  包括所有 RPC 类型，包括一元和流式传输。
* gRPC 服务端支持即将推出。

* **Protobuf 支持** 使用 Google 的 [Protobuf-Rust
库](https://github.com/protocolbuffers/protobuf) 和工具。

* 消息是通过 `protoc` 从 Protobuf-Rust 生成的。
* gRPC 使用我们的 `protoc` 插件生成 RPC 代码。

* **低级 RPC API** 用于创建拦截器并执行 RPC，无需
需要protobuf生成代码。

* 支持 **[Tokio](https://tokio.rs/)** [异步
运行时](https://rust-lang.github.io/async-book/08_ecosystem/00_chapter.html#async-runtimes)。
* 未来的 gRPC-Rust 版本打算与任何运行时一起使用；然而，对于这个
预览我们只针对东京。

## 了解更多

有关此 gRPC-Rust 预览版的文档可以在 [grpc.io](https://grpc.io/docs/languages/rust/) 上找到。  可以使用以下资源：

* [生成代码参考](https://grpc.io/docs/languages/rust/generated-code)
* [快速入门指南](https://grpc.io/docs/languages/rust/quickstart)
* [基础教程](https://grpc.io/docs/languages/rust/basics) 涵盖了每个
四种 RPC 类型中的一个。

## 联系团队

如果您有任何反馈或遇到任何问题，请联系团队：

* 错误/功能请求：[Github 存储库](https://github.com/grpc/grpc-rust)
* 讨论：[Google 群组](https://groups.google.com/g/grpc-io)

## 加入我们的 gRPConf 2026！

如果您有兴趣与 gRPC 团队会面、与业内其他人讨论相关主题，或者甚至在演讲中分享您自己的经验或建议，请将您的日历标记为**9 月 3 日星期四**，届时我们将在加利福尼亚州山景城的[计算机历史博物馆](https://computerhistory.org/) 举办今年的 gRPC 开发者大会。

* **活动地点：** [gRPConf](https://events.linuxfoundation.org/grpconf/)
* **CFP 开放：** [提交您的演讲！](https://events.linuxfoundation.org/grpconf/program/cfp/)
