---
spelling: cSpell:ignore addressbook Chalin Huang pcapng Qiangxiong subdissectors tcpdump Wireshark
title: 使用 Wireshark 分析 gRPC 消息
date: 2021-02-03
authors:
- name: Huang Qiangxiong
  link: https://github.com/huangqiangxiong
- name: Patrice Chalin (editor)
  link: https://github.com/chalin
source_url: https://grpc.io/blog/wireshark/
---

[Wireshark](https://www.wireshark.org) 是一款开源网络协议分析器，可用于协议开发、网络故障排除和教育。 Wireshark 可让您分析通过网络传输的 gRPC 消息，并了解这些消息的二进制格式。

在本文中，您将学习如何配置和使用 Wireshark [gRPC 解析器][] 和 [协议缓冲区 (Protobuf) 解析器][pbd]，它们是特定于协议的组件，允许您使用 Wireshark 分析 gRPC 消息。

## 特征

gRPC 和 Protobuf 解析器的主要功能如下：

- 支持剖析（解码）序列化的 gRPC 消息
[协议缓冲区线格式][] 或 JSON

- 支持解析一元、服务端流、客户端流的 gRPC 消息，
和双向流 RPC 调用

- 通过允许增强对序列化协议缓冲区数据的解析
您需要执行以下操作：
- 加载相关`.proto`文件
- 为 `byte` 类型的协议缓冲区字段注册您自己的子解析器或
`string`

## 捕获 gRPC 流量

这篇文章重点分析捕获的 gRPC 消息。要了解如何在_捕获文件_中存储网络流量，请参阅[Wireshark 用户指南][]中的[捕获实时网络数据][]。
目前，Wireshark 只能解析**纯文本** gRPC 消息。虽然 [Wireshark 支持 TLS 解析][]，但它需要每个会话的密钥。截至撰写本文时，唯一的 [Go gRPC][] 支持导出此类密钥。   要了解如何使用 Go gRPC 以及可用的其他语言导出密钥，请参阅[如何导出 gRPC 的 TLS 主密钥][]。

[Go gRPC](https://grpc.io/docs/languages/go)
  [How to Export TLS Master keys of gRPC]: https://gitlab.com/wireshark/wireshark/-/wikis/How-to-Export-TLS-Master-keys-of-gRPC
[语言](https://grpc.io/docs/languages/)
  [Wireshark supports TLS dissection]: https://gitlab.com/wireshark/wireshark/-/wikis/tls
## 例子

让我们逐步完成分析先前捕获的消息所需的设置，这些消息是由[协议缓冲区教程][]中使用的地址簿应用程序的稍微扩展版本生成的。

### 地址簿 `.proto` 文件

该应用程序的主协议文件是 `addressbook.proto`：

```protobuf
syntax = "proto3";
package tutorial;
import "google/protobuf/timestamp.proto";

message Person {
  string name = 1;
  int32 id = 2;  // Unique ID number for this person.
  string email = 3;

  enum PhoneType {
    MOBILE = 0;
    HOME = 1;
    WORK = 2;
  }

  message PhoneNumber {
    string number = 1;
    PhoneType type = 2;
  }

  repeated PhoneNumber phone = 4;
  google.protobuf.Timestamp last_updated = 5;
  bytes portrait_image = 6;
}

message AddressBook {
  repeated Person people = 1;
}
```

该文件与 [协议缓冲区教程版本][pb-ab.proto] 相同，除了附加的 `portrait_image` 字段。

请注意文件顶部的 `import` 语句，它用于导入 `Timestamp`，它是众多[协议缓冲区众所周知的类型][]之一。

我们的应用程序变体还定义了_person-search_服务，可用于根据选定的 `Person` 属性搜索地址簿条目。该服务在 `person_search_service.proto` 中定义：

```protobuf
syntax = "proto3";
package tutorial;
import "addressbook.proto";

message PersonSearchRequest {
  repeated string name = 1;
  repeated int32 id = 2;
  repeated string phoneNumber = 3;
}

service PersonSearchService {
  rpc Search (PersonSearchRequest) returns (stream Person) {}
}
```

由于该服务使用 `addressbook.proto` 中定义的 `Person` 类型，因此地址簿 `.proto` 会在文件开头导入。

### 设置 protobuf 搜索路径

当 Wireshark 了解您正在分析其消息的应用程序使用的 `.proto` 文件时，它会提供最有意义的解码。

您可以通过设置首选项中的 **Protobuf 搜索路径**，告诉 Wireshark 在哪里可以找到 `.proto` 文件，该首选项可通过 **首选项 \> 协议 \> Protobuf** 下的 **编辑** 菜单访问。

如果我们的示例应用程序的 `.proto` 文件位于 `d:/protos/my_proto_files` 目录中，并且官方 Protobuf 库目录是 `d:/protos/protobuf-3.4.1/include`，则将这两个路径添加为_源目录_，如下所示：

![Protobuf-搜索路径对话框](https://grpc.io/img/blog/wireshark/protobuf_search_paths.png)

通过为应用程序的协议目录选择 **加载所有文件** 选项，您可以从 `addressbook.proto` 和 `person_search_service.proto` 文件预加载消息定义。

### 加载捕获文件

从 Wireshark [SampleCaptures 页面][]，下载通过运行应用程序并发出搜索请求创建的以下示例 gRPC 捕获文件：[grpc_person_search_protobuf_with_image.pcapng][]。

从 **文件** 菜单中选择 **打开** 以在 Wireshark 中加载捕获文件。 Wireshark 在窗口顶部的**数据包列表窗格**中按顺序显示来自捕获文件的所有网络流量。

从数据包列表窗格中选择一个条目，Wireshark 将对其进行解码并在下部窗格中显示其详细信息，如下所示：

![数据包列表和数据包详细信息窗格](https://grpc.io/img/blog/wireshark/after_file_load.png)

从详细信息窗格中选择一个条目以查看与该条目对应的字节序列：

![数据包字节](https://grpc.io/img/blog/wireshark/packet_bytes.png)

### 设置端口流量类型

该应用程序的服务端端口为 50051。客户端端口（每个 RPC 调用都不同）在示例捕获文件中为 51035。

您需要告诉 Wireshark 这些端口正在承载 HTTP2 流量。通过 **解码为** 对话框执行此操作，您可以从 **分析** 菜单访问该对话框（或右键单击数据包列表窗格中的条目）。您只需要注册服务端端口：

![解码为对话框](https://grpc.io/img/blog/wireshark/decode_as_dialog.png)

查看数据包列表窗格，您将看到 Wireshark 现在正在解码 HTTP2 和 gRPC 消息：

![数据包被解码为 HTTP2 和 gRPC 消息](https://grpc.io/img/blog/wireshark/http2_grpc.png)


### 解码搜索请求消息

选择发送到端口 50051 的第一条 gRPC 消息，它对应于示例的服务请求消息。这是 Wireshark 解析 gRPC 请求的方式：

![解码的搜索请求](https://grpc.io/img/blog/wireshark/grpc_protobuf_search_request.png)

通过检查 HTTP2 消息标头 `path` 字段，您将看到应用程序服务的 URL (`/tutorial.PersonSearchService`)，后跟调用的 RPC 的名称 (`Search`)。

`content-type` 由 gRPC 库设置，通知 Wireshark HTTP2 消息内容是 gRPC 消息。通过检查示例 gRPC 请求的已解码 Protocol Buffers 消息，您可以看到搜索请求针对名称“Jason”和“Lily”。

### 解码服务端流式响应

由于 `Search` RPC 响应是服务端流式传输，因此 `Person` 对象可以一个接一个地返回给客户端。

选择响应流中返回的第二条 `Person` 消息以查看其详细信息：

![解码的搜索响应](https://grpc.io/img/blog/wireshark/grpc_protobuf_search_response.png)

通过注册子解析器，您可以让 Wireshark 进一步解码 `byte` 或 `string` 类型的字段。例如，要了解如何为 `portrait_image` 字段注册 PNG 解码器，请参阅 [Protobuf 字段细分器][]。

## gRPC 和 Protocol Buffers 支持的历史

以下是 Wireshark 版本的简要注释列表，因为它们与 gRPC 和 Protocol Buffers 的支持相关：

- v2.6.0：gRPC 和 Protobuf 解析器的第一个版本，没有
支持 `.proto` 文件或流式 RPC。
- v3.2.0：改进了基于序列化协议缓冲区数据的解析
`.proto` 文件，并支持流式 RPC。
- v3.3.0：改进和增强了 `.proto` 文件支持，例如 capture-file
搜索协议缓冲区字段值。
- v3.4.0：协议缓冲区[时间戳][]时间显示为区域设置日期时间
细绳。

## 了解更多

有兴趣了解更多吗？从 [Wireshark 用户指南][] 开始。有关本文中使用的示例以及包含 gRPC 消息的其他示例捕获文件的更多详细信息，请参阅 [gRPC 解析器][] 和 [协议缓冲区解析器][pbd] wiki 页面。

[Capturing Live Network Data]: https://www.wireshark.org/docs/wsug_html_chunked/ChapterCapture.html
[gRPC dissector]: https://gitlab.com/wireshark/wireshark/-/wikis/gRPC
[grpc_person_search_protobuf_with_image.pcapng]: https://gitlab.com/wireshark/wireshark/-/wikis/uploads/f6fcdceb0248669c0b057bd15d45ab6f/grpc_person_search_protobuf_with_image.pcapng
[pb-ab.proto]: https://github.com/protocolbuffers/protobuf/blob/master/examples/addressbook.proto
[protocol buffer wire format]: https://protobuf.dev/programming-guides/encoding/
[pbd]: https://gitlab.com/wireshark/wireshark/-/wikis/Protobuf
[Protocol Buffers tutorials]: https://protobuf.dev/getting-started/
[Protocol Buffers Well-Known Types]: https://protobuf.dev/reference/protobuf/google.protobuf/
[Protobuf field subdissectors]: https://gitlab.com/wireshark/wireshark/-/wikis/Protobuf#protobuf-field-subdissectors
[SampleCaptures page]: https://gitlab.com/wireshark/wireshark/-/wikis/SampleCaptures
[Timestamp]: https://protobuf.dev/reference/protobuf/google.protobuf#google.protobuf.Timestamp
[Wireshark User’s Guide]: https://www.wireshark.org/docs/wsug_html_chunked/
