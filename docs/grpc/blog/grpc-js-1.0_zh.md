---
title: 宣布 gRPC-JS 1.0
date: 2020-04-20
author:
  name: Michael Lumish
  link: https://github.com/murgatroid99
source_url: https://grpc.io/blog/grpc-js-1.0/
---

我们很高兴地宣布发布 [**gRPC-JS** (@grpc/grpc-js)][grpc-js] 1.0 版，它是原始 [Node gRPC 库，grpc][grpc] 的纯 TypeScript 重新实现。

## 特征

gRPC-JS 支持以下功能，应该涵盖大多数用例：

- 客户
- 自动重新连接
- 服务端
- 流媒体
- 元数据
- 部分压缩支持：客户端可以解压缩响应消息
- 选择优先和循环负载均衡策略
- 客户端拦截器
- 连接保持活动
- HTTP 连接支持（代理）

## 我应该使用@grpc/grpc-js 还是 grpc？

原始 Node gRPC 库（[grpc][]）将不再接收功能更新，我们计划在一年内弃用它，因此我们建议您使用 gRPC-JS，[@grpc/grpc-js][grpc-js]。

然而，一些高级功能尚未移植到 gRPC-JS，例如完整压缩支持或对其他负载均衡策略的支持。如果您需要其中一项功能，您应该使用 [grpc][] 库，但通过 gRPC-JS 打开 [功能请求][]，让我们知道您最缺少哪些功能。

[feature request]: https://github.com/grpc/grpc-node/issues/new?template=feature_request.md
[grpc]: https://www.npmjs.com/package/grpc
[grpc-js]: https://www.npmjs.com/package/@grpc/grpc-js
