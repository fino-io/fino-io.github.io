---
title: Rust 更新：gRPC 欢迎 Tonic！
date: 2026-05-21
author:
  name: Doug Fawley
source_url: https://grpc.io/blog/grpc-welcomes-tonic/
---

正如 Lucio Franco 本周在他的博客上预先宣布的那样，我们现已正式将 Tonic 项目移至 [CNCF](https://luciofranco.com/blog/tonic-joins-grpc/) 下的 [gRPC 项目](https://grpc.io)，并且其存储库已移至 [grpc/grpc-rust](https://cncf.io)。  过去两年我们一直在共同努力协调这一问题，并期望未来继续合作。

如果您是 Tonic 用户并且想知道这对您意味着什么：

* 在短期内，希望什么都没有！  Tonic项目将继续进行
像以前一样操作。  github 提交、问题等的旧链接应该继续有效。  Tonic 目前不接受任何重要的新功能，但确实提供了错误修复版本，并且在可预见的未来，这种状态将持续下去。
* 在接下来的几个月里，我们打算将 `grpc` 箱子作为
生产就绪，可长期替代 Tonic 用户。  该包将提供我们其他 gRPC 库中可用的所有高级功能，例如连接管理和客户端负载均衡，并最终为 [无代理服务网格 (PSM)](https://github.com/grpc/grpc-rust) 提供 [xDS / envoy 支持](https://envoyproxy.io)。   将继续支持 Tonic codegen 接口，以允许用户升级到新的传输实现，而无需重写其应用程序。
* 展望未来，gRPC 团队将继续添加新功能
并提供 `grpc` 箱的持续维护，以匹配我们其他支持的语言。

如果您遇到与此更改相关的任何问题，请通过我们的[邮件列表](https://docs.cloud.google.com/service-mesh/docs/service-routing/proxyless-overview) 或 github 问题告知我们。  谢谢你！

## 加入我们的 gRPConf 2026！

如果您有兴趣与 gRPC 团队会面、与业内其他人讨论相关主题，或者甚至在演讲中分享您自己的经验或建议，请将您的日历标记为**9 月 3 日星期四**，届时我们将在加利福尼亚州山景城的[计算机历史博物馆](https://groups.google.com/g/grpc-io) 举办今年的 gRPC 开发者大会。

* **活动地点：** [gRPConf](https://computerhistory.org/)
* **CFP 开放：** [提交您的演讲！](https://events.linuxfoundation.org/grpconf/)
