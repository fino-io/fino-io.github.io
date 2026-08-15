---
title: GKE 上的 gRPC 性能基准
date: 2022-03-01
authors:
  - name: Paulo Castello da Costa
    link: https://github.com/paulosjca
  - name: Jan Tattermusch
    link: https://github.com/jtattermusch
source_url: https://grpc.io/blog/performance-benchmarks-gke/
---

[gRPC 性能基准测试][基准测试] 现已转换为在 GKE 上运行，结果相似，但灵活性大大提高。

## 背景

gRPC 性能测试需要测试驱动程序和工作人员（一个或多个客户端和服务端），如 [gRPC 性能基准测试][基准测试] 中所述。每个测试可能有不同的配置或_scenario_，它被传递给驱动程序并指定为 JSON 文件。以前，驱动程序由持续集成流程运行，而工作线程则在长期运行的 GCE 虚拟机上运行。这带来了一些限制：

1. 测试按顺序运行并且很难并行化，因为它们是按顺序运行的
（相同）固定虚拟机。

1. 不保证虚拟机的状态在每次启动时都相同
测试。

1. 运行手动实验需要配置新的虚拟机，这是一个手动操作
进程或重用现有虚拟机，存在与其他用户发生冲突以及虚拟机处于未知状态的风险。

## Kubernetes 基准测试

当前框架的核心是一个[自定义控制器][]，用于管理[LoadTest][loadtest]类型的 Kubernetes 资源。必须先将此控制器部署到 Kubernetes 集群，然后才能在其上运行负载测试。控制器是用[kubebuilder][]实现的。控制器的代码存储在 [Test Infra][testinfra] 存储库中。有关各个 LoadTest 字段的更多文档，请参阅 [LoadTest 实现][loadtestimplementation]。

LoadTest 配置指定要为测试创建的驱动程序、客户端和服务端 Pod。将配置应用到集群后（例如，使用 `kubectl apply -f`），控制器将创建 Pod 并运行测试。如果将多个配置应用于集群，只要有可用资源，控制器就会创建 Pod，从而允许测试并行运行。

[示例][示例]包括可以直接应用的基本配置，以及需要额外步骤和参数替换的模板。

- 基本配置依赖**克隆**、**构建**和**运行时**工作者
与每个版本的控制器捆绑在一起的图像。克隆和构建映像用于构建传递到运行时容器的 gRPC 二进制文件。这些配置适合作为示例和一次性测试。

- 模板配置依赖于启动前构建的工作映像
测试。这些**预构建的映像**包括 gRPC 二进制文件，无需在每次测试之前进行克隆和构建。模板替换用于指向工作图像的位置。这些配置适用于在同一 gRPC 版本上运行一批测试，或重复运行相同的测试。

除了控制器之外，[Test Infra][testinfra]存储库还包含一组[工具][]，包括测试运行程序和用于构建和删除预构建工作映像的工具，以及[仪表板](#dashboard)实现。

与预构建工作人员相关的工具在内部使用 `gcloud` 并依赖于 GKE。除此之外，该框架的所有组件都是基于 Kubernetes 本身构建的，独立于 GKE。也就是说，应该可以在自定义 Kubernetes 集群或其他云提供商的 Kubernetes 产品上部署控制器并运行测试。

[自定义控制器]：
https://github.com/grpc/test-infra/blob/master/cmd/controller/main.go
[kubebuilder]: https://kubebuilder.io
[负载测试]：
https://github.com/grpc/test-infra/blob/master/config/crd/bases/e2etest.
[负载测试实现]：
https://github.com/grpc/test-infra/blob/master/api/v1/loadtest_types.go

## 集群设置

运行基准测试作业的集群必须配置节点池，该节点池的大小应根据其应支持的同时测试的数量确定。控制器使用 `pool` 作为各种 Pod 类型的节点选择器。 Worker Pod 之间具有反亲和性，因此每个 Pod 需要一个节点。

例如，我们的持续集成设置中使用的节点池配置如下：

|矿池名称|节点数|机器类型|Kubernetes 标签|
| :------------------- | ---------: | :------------- | :----------------------------------------- |
|系统|2|e2-标准-8|默认系统池：true，池：系统|
|驱动程序-ci|8|e2-标准-2|池：drivers-ci|
|工人-c2-8core-ci|8|c2-标准-8|池：workers-c2-8core-ci|
|工人-c2-30core-ci|8|c2-标准-30|池：workers-c2-30core-ci|

由于我们测试中的每个场景都需要一名驱动程序和两名工作人员，因此此配置支持在 8 核机器上同时进行四个测试，在 30 核机器上支持四个同时测试。驱动程序需要的资源很少，并且不具有相互反亲和性。我们发现将它们安排在节点数设置为所需驱动程序数量的双核机器上比在更大的共享机器上安排它们更方便，因为这允许驱动程序池与工作池一起调整大小。控制器本身被调度在 `system` 池中。

除了持续集成中使用的池之外，我们的集群还包含可用于临时测试的其他节点池：

|矿池名称|节点数|机器类型|Kubernetes 标签|
| :------------- | ---------: | :------------- | :------------------------------------------------ |
|司机|8|e2-标准-8|默认驱动程序池：true，池：驱动程序|
|工人8核|8|e2-标准-8|默认工作池：true，池：workers-8core|
|工人-32核|8|e2-标准-32|池：workers-32core|

有些池标有 `default-*-pool` 标签。如果 LoadTest 配置中未指定，这些标签指定要使用的池。通过上述配置，这些测试（例如，[示例][]中指定的测试）将使用 `drivers` 和 `workers-8core` 池，并且不会干扰持续集成作业。默认标签被定义为控制器构建的一部分：如果未设置它们，控制器将仅运行显式指定 `pool` 标签的测试。

## 控制器部署

[部署文档][]中描述了构建和部署控制器的步骤。

[部署文档]：
https://github.com/grpc/test-infra/blob/master/doc/deployment.md

## 持续集成

[gRPC Core] 存储库中的 [gRPC OSS 基准自述文件][] 中描述了我们的持续集成设置。主要的持续集成作业使用脚本 [grpc_e2e_performance_gke.sh][] 生成链接到 [gRPC 性能基准测试][基准测试] 页面的仪表板上显示的数据。

每个持续集成运行都分为三个阶段：

1. 生成测试配置。
1. 构建并推送worker镜像。
1. 运行测试。

每次持续集成运行使用 8 核工作池执行 122 个测试，使用 30 核工作池执行 98 个测试。每个测试运行一个测试场景。使用 C++、C#、Java 和 Python 工作线程的测试在两个池上运行。使用 Node.js、PHP 和 Ruby Worker 的测试仅在 8 核池上运行。所有这些组合的[配置生成](#config-generation) 所花费的时间可以忽略不计（~1 秒）。

持续集成中使用的配置需要包含要测试的 gRPC 二进制文件的工作程序映像。这些镜像仅取决于工作人员的语言，因此这些[预构建镜像](#prebuilt-images) 是提前构建的并推送到镜像存储库。此过程大约需要 20 分钟。

[测试运行程序](#test-runner) 管理将测试应用于集群的速率、收集测试结果和日志，并在成功完成后删除测试。每个池一次允许运行两个测试。此阶段大约需要 50 分钟才能完成。

每个测试场景配置为运行 30 秒，加上 5 秒的预热期（Java 为 15 秒）。这为运行每个测试所需的时间设置了下限。观察到的 8 核池中的 122 个测试（其中 16 个是 Java 测试）的运行时间，一次运行两个测试，这意味着 Pod 创建和删除带来的开销是适度的，每个测试约为 12.8 秒。

[grpc_e2e_performance_gke.sh]：
https://github.com/grpc/grpc/blob/master/tools/internal_ci/linux/grpc_e2e_performance_gke.sh

### 配置生成

由于我们正在运行数百个测试，这些测试大多共享相同的组件（各种语言的驱动程序和工作程序），因此有必要生成包含重复的驱动程序和工作程序配置的配置，并且仅在测试的场景中有所不同。此外，每个配置必须有一个唯一的名称，因为这是应用于 Kubernetes 集群的资源的要求。

我们通过使用工具[生成负载测试配置][]来处理这些问题。该工具存储在 [gRPC Core] 存储库中，其中还定义了测试场景。

【生成负载测试配置】：
https://github.com/grpc/grpc/blob/master/tools/run_tests/performance/README.md#generating-load-test-configurations

### 预建图像

为持续集成生成的配置使用一组预构建的映像。在运行测试之前，会构建这些映像并将其推送到映像存储库。每次测试运行结束时都会删除图像。

有关准备和删除镜像的工具的详细信息，请参阅[在 gRPC OSS 基准测试中使用预构建镜像][预构建]。

[预建]：
https://github.com/grpc/test-infra/blob/master/tools/README.md#using-prebuilt-images-with-grpc-oss-benchmarks

### 测试运行者

[测试运行程序][] 获取之前生成的测试配置，将每个配置应用到集群，轮询每个 LoadTest 资源是否完成，收集结果和 pod 日志等工件，并（可选）在每个测试成功完成后删除资源。

测试运行程序为需要集群上相同资源（例如 8 核或 30 核工作节点）的测试维护单独的队列。属于同一队列的测试配置不会立即应用于集群，而是根据为每个队列设置的并发级别。我们的持续集成测试在两个队列中运行（对应8核和30核工作节点）。每个队列的并发级别设置为2。

将配置应用到集群后，控制器将创建客户端、驱动程序和服务端 Pod 来运行测试、监视测试执行并更新 LoadTest 资源的状态。

测试运行器的设计可以解释如下：

1.使用测试运行器可以让持续集成作业等待
要完成的所有测试、收集测试工件并准备包含结果的报告。

1. 单独队列的使用（每个测试中用注释表示）
配置）允许不需要相同集群资源的测试彼此独立地进行管理。

1. 使用有限的并发级别减少了应用的测试数量
一次集群。这样做有几个好处：

1. 减少了测试运行器的负载，因为 LoadTest 较少
集群上的资源一次，运行程序定期轮询这些资源以完成。我们持续集成中的轮询间隔设置为5s。

1. 控制器上的负载减少，因为 LoadTest 较少
一次资源供其控制。

1. 每个测试可以有更短的超时时间，因为测试所花费的时间
控制器启动每个测试更加可预测。需要超时来解决客户端或服务端 Pod 挂起并阻止测试完成的错误情况。这些情况很少见，但可能会累积并消耗集群资源，从而阻止其他测试运行。我们的持续集成测试的超时时间为 15 分钟。

1.并发级别可以设置低于集群的容量，
允许用户运行一批测试，而不阻止其他用户同时运行测试。

1. 成功完成后（以及之后）删除每个测试的选项
收集结果和日志）可以更好地控制每个测试的生命周期。

1. 控制器的默认行为是保留 LoadTest 资源并
集群上关联的 Pod 直到达到设定的 TTL，然后将其删除。我们的持续集成为每个测试指定 24 小时的 TTL。

1. 属于已完成的 LoadTest 的 Pod 处于终止状态，因此
不消耗集群资源。但是，终止的 Pod 可以随时进行垃圾收集。

1. 如果我们让属于所有已完成测试的 Pod 留在我们的连续
集成集群，我们发现它们在一小时内就被垃圾回收了。

1. 如果我们删除成功完成的测试的 LoadTest 资源，
关联的 pod 也会被删除。在这种情况下，属于“不成功”测试的 Pod（数量很少且可能对调试有用）会保留在集群上，直到达到 24 小时 TTL。

[测试运行者]：
https://github.com/grpc/test-infra/blob/master/tools/README.md#test-runner

### 仪表板

持续集成的测试结果保存到 [BigQuery][bigquery]。然后，存储在 BigQuery 中的数据会被复制到 Postgres 数据库，以便在仪表板上进行可视化。

仪表板的代码以及主要持续集成仪表板的配置存储在 [Test Infra][testinfra] 存储库中。这带来了以下好处：

1. 通过更新存储的配置来维护主仪表板，
而不是直接在 UI 中更新它。

1. 用户可以使用自己的配置部署自己的仪表板。

这与之前使用 Perfkit Explorer 构建的基准测试仪表板形成鲜明对比，后者是通过直接在 UI 中更新来维护的，并且用户无法轻松复制。

有关详细信息，请参阅[仪表板实现][]。

[![仪表板快照][快照]<span class="hk-no-external-icon"></span>](https://grafana-dot-grpc-testing.appspot.com)

[bigquery]: https://cloud.google.com/bigquery
[仪表板实施]：
https://github.com/grpc/test-infra/tree/master/dashboard/README.md
[快照]：https://grpc.io/img/blog/performance-benchmarks-gke/dashboard.png

## 结果

根据 GKE 上 gRPC 基准测试的结果和用户体验，可以得出以下观察结果：

1. 性能指标（延迟、QPS 等）产生相同或更好的结果
作为 GCE 的旧基准。

1. GKE中每个测试的pod创建和删除的开销很小（更少
超过 15 秒）在我们的基准测试集群中。

1.测试镜像被docker化并为每个测试重新启动，导致
几个好处：

1.结果更加一致。

1. 运行时错误很少见。

1.系统被分成明确定义的组件，从而更简单
升级。

1. 测试可以轻松并行化，从而加快执行时间。

1.实验更容易进行。

从实验中得出的最佳实践和见解的示例：

1. 对客户端和服务端使用 `c2` 实例（实例类型对于
观察到的延迟及其方差以及测量的吞吐量）。

1. GKE Pod 到 Pod 网络的开销比原始 GCE 的开销非常小
联网。您可以通过为基准 Pod 设置 `hostnetworking:true` 来获得原始 GCE 网络性能。

1、对于Docker下的Java，JVM可能无法检测到数量
自动可用的处理器。这可能会导致非常悲观的结果，因为 gRPC 使用检测到的处理器数量来调整处理事件的线程池的大小。解决方法是显式设置处理器数量。此解决方法在[此处](https://github.com/grpc/test-infra/pull/231) 实施。

## 运行你自己的

[Test Infra][testinfra] 存储库中的代码允许任何用户创建集群、部署控制器、运行 gRPC 基准测试并在自己的仪表板上显示结果。如果您对性能感兴趣并运行自己的基准测试，[让我们知道！][g/grpc-io]

[基准测试]：https://grpc.io/docs/guides/benchmarking
[示例]：
https://github.com/grpc/test-infra/blob/master/config/samples/README.md
[g/grpc-io]: https://groups.google.com/g/grpc-io
[grpc core]: https://github.com/grpc/grpc
[grpc oss 基准测试自述文件]：
https://github.com/grpc/grpc/blob/master/tools/run_tests/performance/README.md#grpc-oss-benchmarks
[testinfra]: https://github.com/grpc/test-infra
[tools]: https://github.com/grpc/test-infra/blob/master/tools/README.md
