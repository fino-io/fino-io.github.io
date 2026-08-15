---
title: 机器人如何说话：使用 gRPC 和 WebRTC 构建分布式机器人
date: 2025-06-18
author:
  name: Joyce Lin
  position: Viam
  link: https://www.linkedin.com/in/joyce-lin/
  guest: true
source_url: https://grpc.io/blog/robotics/
---

如果您正在构建任何类型的分布式机器，例如机器人、无人机或物联网设备，那么很快就会出现两个问题：

- 如何有效地发送结构化命令和数据？
- 当网络不可靠时，如何保持通信弹性？

在本文中，我将分享我们在 [Viam](https://www.viam.com/) 中使用的方法，这是一个开源机器人平台，结合了用于结构化 RPC 的 gRPC 和用于点对点流式传输的 WebRTC。即使您不构建机器人，相同的架构思想也可以帮助您设计更具可扩展性和适应性的系统。

## 弥合实验室级机器人与现实世界系统之间的差距

[ROS](https://en.wikipedia.org/wiki/Robot_Operating_System)（机器人操作系统）长期以来一直是构建和原型设计机器人系统的首选框架，特别是在研究和学术界。它在可信的本地网络上运行良好，因为这就是它的设计目的。

但今天的机器人不再停留在严格监管的实验室工作台上。它们部署在工厂车间、海上或偏远地区，这些地方的网络状况不可预测，可靠性至关重要。

ROS 不处理开箱即用的网络通信。如果您需要通过互联网与机器人交谈，您就需要自己构建解决方案。现代机器人技术需要的不仅仅是本地 LAN 协议。它需要云就绪、点对点、有弹性的通信堆栈。

Viam 没有依赖 MQTT 等分布式消息传递堆栈或通过云中继命令，而是使用 gRPC 和 WebRTC 来为其机器人平台提供支持(https://docs.viam.com/#platform)。这些协议一起使用，提供了一种现代替代方案，补充了 ROS 的优势。 gRPC 提供结构化、与语言无关的 API 以及快速、高效的 Protobuf 序列化。 WebRTC 增加了低延迟、点对点连接，非常适合在机器之间传输传感器数据或实时视频。

一些机器人制造商还在 ROS 之上分层 gRPC 接口，将 ROS 丰富的生态系统与 gRPC 的现代传输和可扩展性融合在一起。

## 为什么 gRPC 对机器人有意义

现代机器人不再是固定环境中的单一用途机器。它们是移动的、多部分的系统，需要与传感器、感知服务和控制循环进行协作，而且通常是实时的。

gRPC 通过几个关键方式支持这些需求：

- **低延迟、实时控制**：gRPC 支持连续、双向流，允许系统向机械臂发送实时姿态更新，同时接收遥测数据，而不会产生额外的往返延迟。
- **跨平台、多语言一致性**：gRPC 自动为 Python、Go、C++ 等语言生成客户端库（存根），从而可以更轻松地通过一致的接口桥接不同的设备、SDK 和环境。
- **轻量级且高效的序列化**：gRPC 还可以在带宽受限的环境或嵌入式设备上提供帮助，这得益于 Protobuf 的轻量级二进制编码。
- **安全优势**：gRPC 的设计内置了端到端加密（默认为 TLS）和认证功能，可确保机器部件之间的安全通信，无论是跨本地网络还是公共互联网，而无需开发人员附加单独的安全层。
- **机器部件的服务抽象**：使用 gRPC 和 Protobuf，机器人的每个部件，从电机到摄像头再到传感器，都可以建模为标准化的、与语言无关的服务。
![每个机器人部件都成为封装的、与语言无关的服务](https://docs.viam.com/#platform)

在[Viam的公共API](https://grpc.io/img/blog/robotics/component-protos.png)中，每个机器人组件都使用Protobuf定义为gRPC服务。手臂、相机和传感器等组件公开了可以远程调用的类型化方法。以下是 [`arm.proto`](https://github.com/viamrobotics/api) 文件的摘录，该文件定义了机械臂的基本运动和姿势检索方法：

```proto
// An ArmService services all arms associated with a robot
service ArmService {
  rpc MoveToPosition (MoveToPositionRequest) returns (MoveToPositionResponse);
  rpc GetEndPosition (GetEndPositionRequest) returns (GetEndPositionResponse);
  rpc GetJointPositions(GetJointPositionsRequest) returns (GetJointPositionsResponse);
}
```

然后，这些原型服务可以生成 [SDK](https://github.com/viamrobotics/api/blob/main/proto/viam/component/arm/v1/arm.proto) 来帮助您使用您的机器。此示例使用 Python SDK 来移动手臂。在底层，gRPC 将命令编码为 Protobuf 消息并通过 HTTP/2（或 WebRTC，具体取决于环境）发送。

```python
from viam.components.arm import ArmClient

arm = ArmClient.from_robot(robot=robot, name="my-arm")

# Move the arm to a target 3D position
arm.move_to_position(x=0.1, y=0.2, z=0.3, orientation=None, world_state=None)
```

## 为什么 WebRTC 也是其中的一部分

乍一看，gRPC 和 WebRTC 似乎有些多余。两者都可以传输数据并发送结构化消息。但它们解决了机器人技术中截然不同的挑战。

WebRTC 擅长直接的点对点连接，这在以下情况下至关重要：

- 设备位于本地网络或受 NAT/防火墙限制
- 您想要绕过中央中继或云服务端
- 您在机器之间传输高带宽传感器数据（例如实时视频或激光雷达）

Viam 使用 gRPC 进行编排，使用 WebRTC 作为底层传输，将它们结合起来以最小的路由开销实现快速、结构化的消息传递。

## 使用 gRPC 的灵活传输层

虽然 WebRTC 支持分布式机器中的点对点通信，但 gRPC 还提供交换底层传输层的灵活性。

以下是[通过 WebRTC 和其他传输协议运行的 gRPC 服务端示例](https://docs.viam.com/dev/reference/sdks/)。 Viam 还使用 Unix 域套接字 (UDS) 在 `viam-server` 和内部模块之间进行本地消息传递，使用蓝牙来配置机器或代理网络流量，以及用于嵌入式外围设备的串行端口。

由于 gRPC 在 API 层定义了一致的接口，因此我们可以根据环境或设备更改传输，而无需重写客户端逻辑，这在构建跨云、本地和受限网络的系统时具有巨大优势。

## 一个现实世界的例子：协调爪子游戏

想象一下遥控夹娃娃机，就像您在街机中看到的那样。它有两个主要组件：相机和机械臂。用户界面（例如 [Web 应用程序](https://github.com/viamrobotics/goutils/tree/main/rpc/examples/echo) 或 [移动应用程序](https://docs.viam.com/dev/reference/sdks/#frontend-sdks)）发送控制命令并接收实时视频流，以帮助引导爪子获得奖品。

![Viam 封闭式机械臂在会议上作为爪子游戏](https://docs.viam.com/dev/reference/sdks/#mobile-sdk)

以下是 gRPC 和 WebRTC 在幕后如何协同工作的：

- **初始化**：系统使用 gRPC over HTTP/2 建立控制通道。每个组件注册其服务（例如 `ArmService`、`CameraService`）。
- **连接**：gRPC 协调对等元数据和信令的交换，以在 SDK 和机器部件之间建立 WebRTC 会话。
- **实时操作**：WebRTC 现在直接处理对等点之间的媒体和数据流。命令使用 gRPC 方法调用发送，并通过 WebRTC 传输进行路由。视频和传感器流以相反的方式流动。

![在此机器人夹爪游戏中，Viam 使用 gRPC 初始化连接并使用 WebRTC 进行点对点通信](https://grpc.io/img/blog/robotics/viam-enclosed-robotic-arm.jpg)

即使在不可预测的网络条件下，这种双协议方法也可以实现实时交互、流畅的流传输和弹性回退行为。

## 为什么这种模式对更广泛的社区很重要

gRPC 的结构和 WebRTC 的灵活性的结合为新型分布式系统打开了大门，不仅在机器人领域，而且在您需要的任何地方：

- 松耦合系统之间的实时、双向通信
- 跨语言和设备的类型化、版本化 API
- 与传输无关的灵活性，可以在需要时选择点对点

gRPC 构建对话。 WebRTC 通过网络传输它。

## Viam 用于实时机器人控制

gRPC 的发展已经远远超出了简单的请求/响应 API。在机器人以外的许多行业中，机器通信的方式比以往任何时候都更加重要。 gRPC 和 WebRTC 不仅仅是更快的协议，它们还是下一代分布式、弹性和智能机器的有影响力的构建块。

如果您正在构建需要跨设备、环境和网络相互通信的系统，那么可能是时候探索更具可扩展性和适应性的通信层了。

虽然您可以自己设计类似的堆栈，但 [Viam](https://grpc.io/img/blog/robotics/grpc-and-webrtc.png) 提供了开箱即用的这些功能。机上功能是开源的并且可以免费操作，当您扩展到车队时，可以在基于使用的模型上使用可选的云服务。

_[Nick Hehr](https://www.viam.com/) 的技术审查 (Viam)_
