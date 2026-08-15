---
title: Helm 中的 gRPC
date: 2017-05-15
author:
  name: Brian Hardock
  position: Software engineer at [DEIS](https://deis.com), working on the [Helm](https://helm.sh) project
  guest: true
thumbnail: https://gabrtv.github.io/deis-dockercon-2014/img/DeisLogo.png
source_url: https://grpc.io/blog/helm-grpc/
---

Helm 是 Kubernetes 的包管理器。 Helm 为其用户提供了一种可定制的机制，用于管理分布式应用程序并控制其部署。

我有幸成为杰出的开源 Kubernetes Helm 社区的一员，并担任核心贡献者。我与 Helm 团队合作的第一天就是为下一代 Helm 构建架构原型。到那天结束时，我们已经获得了初步的 RPC 协议数据模型，用于实现 Helm 与其集群内服务端组件 Tiller 之间的通信。

<!--more-->

我们选择使用协议缓冲区（gRPC 用于序列化和无线传输的默认框架）作为我们的数据定义语言。在与 Helm 团队的第一天黑客活动结束时，事实证明 gRPC 和协议缓冲区是一个强大的组合。我们使用 protobuf 和 gRPC 服务定义生成的代码成功实现了 Helm 客户端和 Tiller 服务端之间的通信。作为个人偏好，我们发现与 Swagger 之类的东西相比，protobuf 文件和生成的 gRPC 代码提供了一种美观、近乎自记录的开发人员体验。

几天之内，Helm 团队就为我们的用户确定了范围并实现了功能。通过选择 gRPC/Proto，我们减少了自行车停放所花费的典型时间，一般来说，这些时间不可避免地从 API 建模和制作样板服务端代码中演变而来。如果我们没有从第一天开始就获得 gRPC/protobuf 的好处，我们就会花费更多的时间在堆栈上上下移动，而不是把注意力集中在重要的事情上：用户和他们请求的功能。

除了充当 Helm/Tiller 通信协议之外，协议缓冲区更有趣的应用之一是我们使用它来对 Kubernetes 术语中所说的“图表”进行建模。图表是 Kubernetes 清单的封装，使您能够定义、安装和升级 Kubernetes 应用程序。对于更复杂的 Kubernetes 应用程序，清单集可能很大。凭借其固有的压缩功能，协议缓冲区和 gRPC 使我们能够减轻传输庞大且庞大的 Kubernetes 清单的麻烦。

更深入地了解：

- Helm 原型，请参阅：<https://github.com/kubernetes/helm/tree/master/_proto/hapi>
- 其生成的对应项，请参阅：<https://github.com/kubernetes/helm/tree/master/pkg/proto/hapi>
- 我们的 Helm 客户端的接口，请参阅：<https://github.com/kubernetes/helm/tree/master/pkg/helm>

总之，protobuf 和 gRPC 为 Helm 提供了：

* 明确定义客户端和服务端通信的消息和协议语义。
* 通过减少花在样板服务端代码/API 建模上的时间来增加功能开发。
* 通过生成代码和压缩实现高性能数据传输。
* 最小化从 0 到客户端/服务端通信所花费的认知周期。
