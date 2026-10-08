---
title: 29 · gRPC 与 Protocol Buffers
description: 契约、生成、状态码、Deadline 与流式 RPC。
pageClass: aip-article
---

# 29 · gRPC 与 Protocol Buffers

学习前应能完成：[包、模块、依赖与发布](./modules)、[HTTP 服务与 Web 框架](./web)、[Context、截止时间与取消](./context)。

本章实现 gRPC 契约与生成流程，区分 wire 编码、服务签名和运行协议。它适合明确类型的服务间调用，不是所有 HTTP API 的自动替代。

## 定义契约与生成路径

项目模块为 `example.com/tasks`，保存 `proto/task/v1/task.proto`：

```proto
syntax = "proto3";
package learning.task.v1;
option go_package = "example.com/tasks/gen/task/v1;taskv1";

service TaskService {
  rpc GetTask(GetTaskRequest) returns (Task);
  rpc WatchTasks(WatchTasksRequest) returns (stream Task);
}
message GetTaskRequest { int64 id = 1; }
message WatchTasksRequest { int64 after_id = 1; }
message Task {
  int64 id = 1;
  string title = 2;
  bool done = 3;
}
```

按照 [gRPC Go Quick start](https://grpc.io/docs/languages/go/quickstart/)安装 protoc 和两个 Go 生成插件，工具版本写入项目记录，生成输出路径与 go_package 一致：

```sh
protoc -I proto --go_out=. --go_opt=module=example.com/tasks --go-grpc_out=. --go-grpc_opt=module=example.com/tasks proto/task/v1/task.proto
```

生成 `gen/task/v1` 中的消息与服务绑定。`go_package` 是 Go 导入路径，proto package 是协议名称，两者不等价。生成文件不手改，修改契约后重新生成并检查差异。

## 服务实现与错误映射

片段，taskv1 为生成包，findTask 为业务方法：

```go
type Server struct { taskv1.UnimplementedTaskServiceServer }

func (s *Server) GetTask(ctx context.Context, req *taskv1.GetTaskRequest) (*taskv1.Task, error) {
    if req.GetId() <= 0 { return nil, status.Error(codes.InvalidArgument, "id 必须为正整数") }
    task, err := findTask(ctx, req.GetId())
    if errors.Is(err, ErrNotFound) { return nil, status.Error(codes.NotFound, "任务不存在") }
    if err != nil { return nil, status.Error(codes.Internal, "读取失败") }
    return &taskv1.Task{Id: task.ID, Title: task.Title, Done: task.Done}, nil
}
```

生成结构体与业务模型分开，不让存储层返回 gRPC status。调用方使用 Context deadline，服务向数据库传递同一个 ctx。Internal 响应隐藏驱动细节，日志保留关联 ID；测试 InvalidArgument、NotFound 与依赖失败的状态码。

## 兼容性：编号、存在性与枚举

删除字段后 reserved 原编号与名称，不能重新给其他含义使用。添加字段一般可兼容 wire 格式，仍需看业务语义。普通 proto3 标量默认值不总能表达是否提供；optional 保留存在性，oneof 表达互斥选择，字段掩码可表达局部更新。枚举 0 定义 UNSPECIFIED，客户端需考虑未来未知值。

不要把 int64 的 JSON 表现、protobuf 二进制和 Go int64 混为一谈；跨语言客户端尤其检查编号范围、时间与金额单位。协议版本写在包名中，Go 模块大版本是另一套发布维度。

## 流式 RPC 与回压

WatchTasks 是服务器流：服务持续 Send，客户端持续 Recv，结束时 EOF/错误。Send 可能阻塞于网络和流控，不在锁内持有整个存储状态；用快照或订阅机制释放锁再发送。客户端慢、断开或取消都需要使订阅退出。

流式消息不是可靠消息队列，断连重连需要游标/事件序号与回放策略。身份使用 TLS 与认证 metadata，interceptor 统一观测与认证；不要用明文教学配置交付生产。站内 [deadline](/grpc/guides/deadlines_zh)与 [错误](/grpc/guides/error_zh)提供延伸资料。

## 测试与学习实验 {#lab}

1. 生成代码并构建，在公开契约不变时替换业务存储。
2. 使用 gRPC bufconn 做本机内存连接测试，验证状态映射、deadline 与取消。
3. 删除 title 后 reserved 编号 2，新增字段使用新编号，解释兼容策略。
4. 给 WatchTasks 设计 after_id 语义，测试客户端断开不会留下订阅 goroutine。

通过标准：生成可复现、业务不依赖传输状态类型、取消传递到真实工作。参考：[gRPC Go 基础](https://grpc.io/docs/languages/go/basics/)、[Protobuf Go 生成](https://protobuf.dev/reference/go/go-generated/)。
