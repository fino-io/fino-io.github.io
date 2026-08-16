---
title: 调试
description: '讲解使用grpcdebug调试gRPC应用程序的过程'
source_url: https://grpc.io/docs/guides/debugging/
---

### 概述
[grpcdebug]是gRPC生态系统中的一个命令行工具，旨在帮助开发人员对gRPC服务进行调试和故障排除。 grpcdebug 通过 gRPC 协议从应用程序获取 gRPC 库的内部状态，并提供一个人性化的用户体验来浏览它们。目前，它支持[Channelz]/[Health]检查/CSDS（又名[管理服务]）。换句话说，它可以获取有关给定 gRPC 通道上已发送或失败的 RPC 数量的统计信息，它可以检查地址解析结果，它可以转储指导 RPC 路由的活动 xDS 配置。

### 语言示例

|语言|例子|笔记|
|----------|------------------|------------------------------------------------------------------|
|C++|[C++ 示例]|                                                                  |
|Go|[Go 示例]|[Go 测试服务端实现 grpcdebug 文档中的管理服务]|
|Java|[Java 示例]|                                                                  |

### 参考

* [grpcdebug安装]
* 【grpcdebug快速入门】


[grpcdebug]: https://github.com/grpc-ecosystem/grpcdebug
[Health]:https://github.com/grpc/grpc/blob/master/src/proto/grpc/health/v1/health.proto
[Channelz]: https://github.com/grpc/proposal/blob/master/A14-channelz.md
[admin services]: https://github.com/grpc/proposal/blob/master/A38-admin-interface-api.md
[C++ 示例]: https://github.com/grpc/grpc/tree/master/examples/cpp/debugging#using-grpcdebug
[Go 示例]: https://github.com/grpc-ecosystem/grpcdebug?tab=readme-ov-file#quick-start
[Java 示例]: https://github.com/grpc/grpc-java/tree/master/examples/example-debug#using-grpcdebug
[grpcdebug installation]: https://github.com/grpc-ecosystem/grpcdebug?tab=readme-ov-file#installation
[grpcdebug quick start]: https://github.com/grpc-ecosystem/grpcdebug?tab=readme-ov-file#quick-start
[Go test server implementing admin services from grpcdebug docs]: https://github.com/grpc-ecosystem/grpcdebug/tree/main/internal/testing/testserver
