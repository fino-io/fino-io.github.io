---
title: gRPC 发布 Beta 版，为生产环境使用打开大门
date: 2015-10-26
author:
  name: Mugur Marculescu
source_url: https://grpc.io/blog/beta-release/
---

gRPC 团队很高兴地宣布 gRPC Beta 立即可用。此版本标志着 API 稳定性的一个重要点，并且未来大多数 API 更改预计将是附加的。这一里程碑为 gRPC 在生产环境中的使用打开了大门。

我们在改进安装过程方面也向前迈出了一大步。在过去的几周里，我们已将 gRPC 软件包推出到 <a href="https://packages.debian.org/jessie-backports/libgrpc0">Debian Stable/Backports</a>。现在，大多数情况下的安装是使用 Debian 软件包和可用语言特定软件包管理器的两行安装（<a href="https://search.maven.org/#artifactdetails%7Cio.grpc%7Cgrpc-core%7C0.9.0%7Cjar">maven</a>、<a href="https://pypi.python.org/pypi/grpcio">pip</a>、<a href="https://rubygems.org/gems/grpc">gem</a>、 <a href="https://packagist.org/packages/grpc/grpc">作曲家</a>、<a href="https://pecl.php.net/package/gRPC">pecl</a>、<a href="https://www.npmjs.com/package/grpc">npm</a>、<a href="https://www.nuget.org/packages/Grpc/">nuget</a>、 [pod](https://cocoapods.org/pods/gRPC))。此外，[gRPC docker 镜像](https://hub.docker.com/r/grpc) 现已在 Docker Hub 上提供。


我们更新了 grpc.io 上的[文档](https://grpc.io/docs/)，以反映最新更改，并发布了其他特定于语言的[参考文档](https://grpc.io/docs/languages/)。请参阅 GitHub 上针对 [Java](https://github.com/grpc/grpc-java/releases/tag/v0.9.0)、[Go](https://godoc.org/google.golang.org/grpc) 和 [所有其他](https://github.com/grpc/grpc/releases/tag/release-0_11_0) 语言的发行说明中查看 Beta 版本的更改。

为了符合我们的[原则](https://grpc.io/blog/principles/) 以及在 HTTP/2 之上实现高性能和可扩展的 API 和微服务的目标，在接下来的几个月中，gRPC 项目的重点将是不断提高性能和稳定性，并为生产用例添加精心挑选的功能。文档也将得到澄清，并将通过新的示例和指南继续改进。


我们非常高兴看到社区对 gRPC 的响应以及开始使用它的各个项目（[etcd v3 实验性 API](https://coreos.com/blog/etcd-2.2)、[grpc-gateway](https://github.com/gengo/grpc-gateway) 用于 RESTful API 等）。

我们衷心感谢所有贡献代码、进行演示、采用技术和参与社区的人。在您的帮助支持下我们期待1.0！
