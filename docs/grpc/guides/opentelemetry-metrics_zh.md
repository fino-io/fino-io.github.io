---
title: OpenTelemetry 指标
description: 'gRPC 中可用的 OpenTelemetry 指标'
source_url: https://grpc.io/docs/guides/opentelemetry-metrics/
---

## 概述

gRPC 提供对 OpenTelemetry 插件的支持，该插件提供的指标可以帮助您：

* 排除系统故障
* 迭代提高系统性能
* 设置连续监控和警报。
## 背景

OpenTelemetry 是一个用于创建和管理遥测数据的可观察性框架。 gRPC 之前通过 OpenCensus 提供可观测性支持，但现在已被 OpenTelemetry 取代。

## 仪器

gRPC OpenTelemetry 插件接受 [MeterProvider] 并依赖 [OpenTelemetry API] 创建一个 [Meter] 来标识正在使用的 gRPC 库，例如版本 `1.57.1` 的 `grpc-c++`。下面列出的仪器是使用该仪表创建的。用户应使用[OpenTelemetry SDK]来自定义OpenTelemetry导出的视图。

越来越多的 gRPC 组件正在被用来实现可观察性。目前，我们已经检测了以下组件：

* 每次调用：观察 RPC 本身（例如，延迟。）
* Client Per-Call（稳定，默认开启）：观察客户端调用
* Client Per-Attempt（客户端每次尝试）（稳定，默认开启）：观察尝试
客户端调用，因为由于重试或请求对冲，调用可能会进行多次尝试。
* Client Per-Call Retry（实验性）：观察重试、透明重试
和请求对冲，
* 服务端：观察服务端收到的调用。
* LB策略：遵守各种负载均衡策略
* 加权循环法（实验性）
* 选择优先（实验性）
* XdsClient（实验性）

> _**注意**__ 有些仪器默认关闭，需要明确设置
> 从 gRPC OpenTelemetry 插件 API 启用。实验指标是
> 默认情况下始终关闭。
> ([参考 C++ API](https://github.com/grpc/grpc/blob/ccfc163607a15faa16aea179e0a0ea673c2353c6/include/grpcpp/ext/otel_plugin.h#L139))

### 每次调用指标

#### 客户端每次调用指标

名称                      | 类型      | 单位 |标签（必填）| 描述
------------------------- | --------- | ---- | ------------------------------------------------------------------------- | -----------
grpc.client.call.duration| 直方图 | s    |grpc.method、grpc.target、grpc.status、grpc.client.call.custom（可选）|该指标旨在从应用程序的角度衡量 gRPC 库完成 RPC 所需的端到端时间。

详细信息请参阅[A66：OpenTelemetry Metrics]。

#### 客户端每次尝试指标

名称                                                       | 类型      | 单位      |标签（处置）| 描述
---------------------------------------------------------- | --------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -----------
grpc.client.attempt.<br>started| 计数器   | {attempt} |grpc.method（必需）、grpc.target（必需）、grpc.client.call.custom（可选）|已启动的 RPC 尝试总数，包括尚未完成的尝试。
grpc.client.attempt.<br>duration| 直方图 | s         |grpc.method（必需）、grpc.target（必需）、grpc.status（必需）、grpc.lb.locality（可选）、grpc.lb.backend_service（可选）、grpc.client.call.custom（可选）|完成 RPC 尝试所需的端到端时间，包括选择子通道所需的时间。
grpc.client.attempt.<br>sent_total_compressed_message_size| 直方图 | By        |grpc.method（必需）、grpc.target（必需）、grpc.status（必需）、grpc.lb.locality（可选）、grpc.lb.backend_service（可选）、grpc.client.call.custom（可选）|每次 RPC 尝试在所有请求消息（不包括元数据）中发送的总字节数（压缩但未加密）；不包括 grpc 或传输帧字节。
grpc.client.attempt.<br>rcvd_total_compressed_message_size| 直方图 | By        |grpc.method（必需）、grpc.target（必需）、grpc.status（必需）、grpc.lb.locality（可选）、grpc.lb.backend_service（可选）、grpc.client.call.custom（可选）|每次 RPC 尝试的所有响应消息（不包括元数据）接收到的总字节数（压缩但未加密）；不包括 grpc 或传输帧字节。

详细信息请参阅[A66：OpenTelemetry Metrics]。

#### 客户端每次调用重试指标

名称                                 | 类型      | 单位                |标签（必填）| 描述
------------------------------------ | --------- | ------------------- | ------------------------------------------------------------ | -----------
grpc.client.call.retries| 直方图 | {retry}             |grpc.method、grpc.target、grpc.client.call.custom（可选）|客户端调用期间的重试次数。如果没有重试，则不会报告 0。
grpc.client.call.transparent_retries| 直方图 | {transparent_retry} |grpc.method、grpc.target、grpc.client.call.custom（可选）|客户端调用期间的透明重试次数。如果没有透明重试，则不会报告 0。
grpc.client.call.hedges| 直方图 | {hedge}             |grpc.method、grpc.target、grpc.client.call.custom（可选）|客户通话期间的请求对冲次数。如果没有请求对冲，则不报告 0。
grpc.client.call.retry_delay| 直方图 | s                   |grpc.method、grpc.target、grpc.client.call.custom（可选）|客户端调用期间没有活动尝试时的总延迟时间。

有关详细信息，请参阅[A96：重试的 OTel 指标]。

#### 服务端仪器

名称                                                    | 类型      | 单位   |标签（必填）| 描述
------------------------------------------------------- | --------- | ------ | ------------------------ | -----------
grpc.server.call.<br>started| 计数器   | {call} |grpc.method|已启动的 RPC 总数，包括尚未完成的 RPC。
grpc.server.call.<br>sent_total_compressed_message_size| 直方图 | By     |grpc.method、grpc.status|每个 RPC 所有响应消息（不包括元数据）发送的总字节数（压缩但未加密）；不包括 grpc 或传输帧字节。
grpc.server.call.<br>rcvd_total_compressed_message_size| 直方图 | By     |grpc.method、grpc.status|每个 RPC 所有请求消息（不包括元数据）接收到的总字节数（压缩但未加密）；不包括 grpc 或传输帧字节。
grpc.server.call.<br>duration| 直方图 | s      |grpc.method、grpc.status|该指标旨在从服务端传输（HTTP2/inproc）的角度衡量 RPC 所花费的端到端时间。

详细信息请参阅[A66：OpenTelemetry Metrics]。

### LB 策略指标

#### 加权循环 LB 策略指标

名称                                           | 类型      | 单位       |标签（处置）| 描述
---------------------------------------------- | --------- | ---------- | --------------------------------------------------------------------------------------- | -----------
grpc.lb.wrr.<br>rr_fallback| 计数器   | {update}   |grpc.target（必需）、grpc.lb.locality（可选）、grpc.lb.backend_service（可选）|实验：调度程序更新的数量，其中没有足够的具有有效权重的端点，这导致 WRR 策略回退到 RR 行为。
grpc.lb.wrr.<br>endpoint_weight_not_yet_usable| 计数器   | {endpoint} |grpc.target（必需）、grpc.lb.locality（可选）、grpc.lb.backend_service（可选）|实验：来自每个调度程序更新的尚未具有可用权重信息的端点数量（即尚未收到负载报告，或者处于中断期内）。
grpc.lb.wrr.<br>endpoint_weight_stale| 计数器   | {endpoint} |grpc.target（必需）、grpc.lb.locality（可选）、grpc.lb.backend_service（可选）|实验：来自每个调度程序更新的最新权重早于过期期限的端点数量。
grpc.lb.wrr.<br>endpoint_weights| 直方图 | {weight}   |grpc.target（必需）、grpc.lb.locality（可选）、grpc.lb.backend_service（可选）|实验：记录每次调度程序更新的端点权重。

有关详细信息，请参阅 [A78：WRR、Pick First 和 XdsClient 的 gRPC OTel 指标]。

#### Pick-First LB 策略指标

名称                                                 | 类型    | 单位            |标签（必填）| 描述
---------------------------------------------------- | ------- | --------------- | ----------------- | -----------
grpc.lb.pick_first.<br>disconnections| 计数器 | {disconnection} |grpc.target|实验：所选子通道断开连接的次数。
grpc.lb.pick_first.<br>connection_attempts_succeeded| 计数器 | {attempt}       |grpc.target|实验：成功连接尝试的次数。
grpc.lb.pick_first.<br>connection_attempts_failed| 计数器 | {attempt}       |grpc.target|实验：连接尝试失败的次数。

有关详细信息，请参阅 [A78：WRR、Pick First 和 XdsClient 的 gRPC OTel 指标]。

### XdsClient 仪器

名称                                         | 类型    | 单位       |标签（必填）| 描述
-------------------------------------------- | ------- | ---------- | ----------------------------------------------------------------------------- | -----------
grpc.xds_client.<br>connected| 仪表   | {bool}     |grpc.target、grpc.xds.server|实验：xDS 客户端当前是否有到 xDS 服务端的工作 ADS 流。
grpc.xds_client.<br>server_failure| 计数器 | {failure}  |grpc.target、grpc.xds.server|实验：xDS 服务端从健康状态变为不健康状态的计数器。
grpc.xds_client.<br>resource_updates_valid| 计数器 | {resource} |grpc.target、grpc.xds.server、grpc.xds.resource_type|实验性：接收到的资源的计数器，即使未更改，也被认为是有效的。
grpc.xds_client.<br>resource_updates_invalid| 计数器 | {resource} |grpc.target、grpc.xds.server、grpc.xds.resource_type|实验：收到的被视为无效的资源的计数器。
grpc.xds_client.<br>resources| 仪表   | {resource} |grpc.target、grpc.xds.authority、grpc.xds.cache_state、grpc.xds.resource_type|实验：xDS 资源的数量。

有关详细信息，请参阅 [A78：WRR、Pick First 和 XdsClient 的 gRPC OTel 指标]。

### 标签/属性

通过记录仪器的测量结果，gRPC 可能会提供一些附加信息作为属性或标签。例如，`grpc.client.attempt.started` 具有标签 `grpc.method` 和 `grpc.target` 以及每个测量，这些测量告诉我们与正在观察的 RPC 尝试相关的方法和目标。

> _**注意**__ 仪器上的某些属性被标记为可选。这些
> 需要从 gRPC OpenTelemetry 插件 API 显式启用。
> ([参考 C++ API](https://github.com/grpc/grpc/blob/ccfc163607a15faa16aea179e0a0ea673c2353c6/include/grpcpp/ext/otel_plugin.h#L151))

名称                    | 描述
----------------------- | -----------
grpc.method|完整的 gRPC 方法名称，包括包、服务和方法，例如“google.bigtable.v2.Bigtable/CheckAndMutateRow”。
grpc.status|收到 gRPC 服务端状态码，例如“确定”、“取消”、“DEADLINE_EXCEEDED”。
grpc.target|创建 gRPC Channel 时使用的规范化目标 URI，例如“dns:///pubsub.googleapis.com:443”、“xds:///helloworld-gke:8000”。
grpc.client.call.custom|实验：客户端提供的字符串供自定义应用程序使用
grpc.lb.backend_service|流量发送到的后端服务。当单个通道目标可以发送到不同的服务端组时，这是相关的。使用 xDS 时，这将是集群名称。当不相关时，该值将为空字符串。
grpc.lb.locality|流量发送到的位置。
grpc.xds.server|对于客户端，指示使用 XdsClient 的 gRPC 通道的目标。对于服务端，将是字符串“#server”。
grpc.xds.authority|xDS 权威。对于旧式非 xdstp 资源名称，该值将为“#old”。
grpc.xds.cache_state|指示 xDS 资源的缓存状态（“requested”、“does_not_exist”、“acked”、“nacked”、“nacked_but_cached”）。
grpc.xds.resource_type|xDS 资源类型，例如“envoy.config.listener.v3.Listener”。

## 常问问题

#### 问：如何获得吞吐量或 QPS（每秒查询数）？

对延迟直方图指标使用计数聚合：`grpc.client.attempt.duration` / `grpc.client.call.duration`（对于客户端）或 `grpc.server.call.duration`（对于服务端）。

#### 问：如何获取 RPC 的错误率？

可以通过对延迟直方图指标 `grpc.client.attempt.duration` / `grpc.client.call.duration`（对于客户端）或 `grpc.server.call.duration`（对于服务端）使用过滤器 `grpc.status != OK` 值来计算错误计数。

## 语言示例

语言|例子
-------- | ----------------
C++|[C++ 示例]
Go|[Go 示例]
Java|[Java 示例]
Python|[Python 示例]

### 其他资源

* [A66：OpenTelemetry 指标]
* [A78：WRR、Pick First 和 XdsClient 的 gRPC OTel 指标]
* [A79：非每次调用指标架构]
* [A96：重试的 OTel 指标]

[sunsetted]: https://opentelemetry.io/blog/2023/sunsetting-opencensus/
[MeterProvider]: https://opentelemetry.io/docs/specs/otel/metrics/api/#meterprovider
[OpenTelemetry API]: https://opentelemetry.io/docs/specs/otel/overview/#api
[Meter]: https://opentelemetry.io/docs/specs/otel/metrics/api/#get-a-meter
[OpenTelemetry SDK]: https://opentelemetry.io/docs/specs/otel/overview/#sdk
[C++ 示例]: https://github.com/grpc/grpc/tree/master/examples/cpp/otel
[Go 示例]: https://github.com/grpc/grpc-go/tree/master/examples/features/opentelemetry
[Java 示例]: https://github.com/grpc/grpc-java/tree/master/examples/example-opentelemetry
[Python 示例]: https://github.com/grpc/grpc/tree/master/examples/python/observability
[A66: OpenTelemetry Metrics]: https://github.com/grpc/proposal/blob/master/A66-otel-stats.md
[A78: gRPC OTel Metrics for WRR, Pick First, and XdsClient]: https://github.com/grpc/proposal/blob/master/A78-grpc-metrics-wrr-pf-xds.md
[A79: Non-per-call Metrics Architecture]: https://github.com/grpc/proposal/blob/master/A79-non-per-call-metrics-architecture.md#a79-non-per-call-metrics-architecture
[A89: Backend Service Metric Label]: https://github.com/grpc/proposal/blob/master/A89-backend-service-metric-label.md
[A96: OTel Metrics for Retries]: https://github.com/grpc/proposal/blob/master/A96-retry-otel-stats.md
[A66：OpenTelemetry Metrics]: https://github.com/grpc/proposal/blob/master/A66-otel-stats.md
[A66：OpenTelemetry 指标]: https://github.com/grpc/proposal/blob/master/A66-otel-stats.md
[A78：WRR、Pick First 和 XdsClient 的 gRPC OTel 指标]: https://github.com/grpc/proposal/blob/master/A78-grpc-metrics-wrr-pf-xds.md
[A79：非每次调用指标架构]: https://github.com/grpc/proposal/blob/master/A79-non-per-call-metrics-architecture.md#a79-non-per-call-metrics-architecture
[A96：重试的 OTel 指标]: https://github.com/grpc/proposal/blob/master/A96-retry-otel-stats.md
