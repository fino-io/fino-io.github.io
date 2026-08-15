---
title: 使用 Kubernetes Gateway API 配置无代理 gRPC 和 Cloud Service Mesh 的 OpenTelemetry 指标现已提供预览版
date: 2024-09-12
source_url: https://grpc.io/blog/proxyless-grpc/
---

我们很高兴地宣布，使用 Kubernetes Gateway API 配置无代理 gRPC 和 Cloud Service Mesh 的 OpenTelemetry 指标现已作为预览功能提供。通过这种集成，您可以利用 Kubernetes Gateway API 的强大功能来管理 Cloud Service Mesh 环境中 gRPC 服务的流量，以及 gRPC OpenTelemetry 指标的额外优势，以增强可观察性。
### 什么是新的：
- **Kubernetes Gateway API 集成**：现在您可以使用 Kubernetes Gateway API 来定义和管理云服务网格中运行的服务的流量路由。这提供了一种更加标准化和灵活的方法来管理 Kubernetes 集群内的入口和流量管理。
- **云服务网格的 gRPC OpenTelemetry 指标**：通过集成的 OpenTelemetry 指标更深入地了解您的 gRPC 服务，为监控和故障排除提供有价值的可观测性数据。

### 好处：
- **简化流量管理**：Kubernetes Gateway API 提供了一种声明式方式来管理流量路由，使您可以更轻松地配置和管理服务的入口。
- **增强的可观察性**：Cloud Service Mesh 的 gRPC OpenTelemetry 指标提供有关 gRPC 服务的性能和运行状况的宝贵见解，有助于监控和故障排除。

### 开始：
要了解有关如何使用 Kubernetes Gateway API 配置 Cloud Service Mesh 并尝试此新功能的更多信息，请查看我们的[文档和教程](https://cloud.google.com/service-mesh/docs/gateway/proxyless-grpc-mesh)。有关云服务网格 OpenTelemetry Metrics 的更多信息，请参阅我们的[文档](https://cloud.google.com/service-mesh/docs/service-routing/observability-proxyless-grpc)。

我们渴望听到您对这些新功能的反馈。请通过我们的社区渠道分享您的想法和经验。
