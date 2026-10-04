---
title: 15 · 常用生态与技术选型
description: 用成熟 crate 处理 CLI、JSON、HTTP、数据库、RPC 与观测，保持依赖和架构简单。
pageClass: aip-article rust-article
---

# 15 · 常用生态与技术选型

本章目标：用已有库完成通用能力，把自己的代码集中在业务规则与必要的集成上。以下是常见起点；加入依赖时，以其当前官方文档、版本与平台要求为准。

## 按任务选择成熟库

| 需求 | 可优先了解 | 适用方向 |
| --- | --- | --- |
| 命令行参数 | [clap](https://docs.rs/clap/latest/clap/) | 自动生成帮助、校验参数、组织子命令。 |
| 序列化 | [Serde](https://serde.rs/)、[serde_json](https://docs.rs/serde_json/latest/serde_json/) | 类型与 JSON 等数据格式之间转换。 |
| 应用错误 | [anyhow](https://docs.rs/anyhow/latest/anyhow/) | 为多种错误保留来源并补充上下文。 |
| 库错误类型 | [thiserror](https://docs.rs/thiserror/latest/thiserror/) | 为明确错误枚举生成标准实现。 |
| 异步运行时 | [Tokio](https://tokio.rs/tokio/tutorial) | 网络 I/O、异步任务、通道与时间工具。 |
| HTTP 客户端 | [reqwest](https://docs.rs/reqwest/latest/reqwest/) | HTTP 请求、连接复用、TLS 与 JSON。 |
| HTTP 服务 | [axum](https://docs.rs/axum/latest/axum/) | 路由、提取器、共享状态与响应类型。 |
| 数据库 | [SQLx](https://docs.rs/sqlx/latest/sqlx/)、[Diesel](https://diesel.rs/) | 按 SQL 使用习惯、同步或异步需求与团队经验选择。 |
| gRPC | [tonic](https://docs.rs/tonic/latest/tonic/)、[prost](https://docs.rs/prost/latest/prost/) | gRPC 服务与 Protocol Buffers 类型。 |
| 结构化观测 | [tracing](https://docs.rs/tracing/latest/tracing/) | 事件、span 和跨异步任务的上下文。 |
| CPU 并行 | [Rayon](https://docs.rs/rayon/latest/rayon/) | 数据并行和受控的计算任务。 |

避免在同一小项目中为了比较而引入多个功能重叠的框架。先根据实际任务选择一个，做出可验证的小闭环。

## Serde：从数据模型开始

新建项目后执行 `cargo add serde --features derive` 和 `cargo add serde_json`，以下为完整的 **src/main.rs**：

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
struct ReadingConfig {
    topic: String,
    minutes: u32,
}

fn main() -> Result<(), serde_json::Error> {
    let input = r#"{"topic":"Rust","minutes":30}"#;
    let config: ReadingConfig = serde_json::from_str(input)?;
    println!("{}", serde_json::to_string_pretty(&config)?);
    Ok(())
}
```

Serde 负责表示形式与 Rust 类型的转换，业务约束还需单独检查，例如学习时长是否合理。字段兼容策略可用 `default`、`rename` 等属性表达；是否拒绝未知字段由接口兼容性需求决定。

## HTTP 与数据库的边界

HTTP 客户端通常应复用 Client，配置超时，并限制响应体的处理规模。不能仅认为得到响应就代表成功，还要处理状态码、协议错误和解析失败。服务端的提取器负责参数解码，业务校验与授权仍要在适当位置完成。

数据库访问应使用参数绑定，避免字符串拼接 SQL。连接池需要容量、获取超时和生命周期；多个相关写入用事务表达一致性。SQLx 的查询宏可做编译期检查，但可能需要构建时数据库或预生成的离线元数据；不要把本地存在数据库当成 CI 的默认条件。

gRPC 项目可结合站内 [gRPC Guides](/grpc/guides/) 学习 deadline、取消、错误与重试；资源设计可参考 [Google AIPs](/aip/general/)。语言库的选择并不能替代这些接口语义。

## 技术选型的检查点

1. 是否解决已有需求，API 是否易于和当前代码整合。
2. 是否维护活跃，文档、示例和许可是否明确。
3. MSRV、平台、运行时与 TLS 等 features 是否匹配。
4. 是否引入大量重复依赖，失败时能否给出清楚的诊断。
5. 是否已有标准库方案可以满足简单场景。

为依赖记录用途，使用 `cargo tree` 了解实际引入内容。版本升级后重新运行关键行为测试；生产应用还应结合 [RustSec](https://rustsec.org/) 等成熟工具管理已知漏洞信息。

## 练习与验收

给 CLI 增加 clap 参数与 JSON 配置。再做一个使用 reqwest 的本地 API 客户端，明确超时、状态码处理和日志。用一段简短文字解释每个依赖的作用，移除没有被实际使用的依赖。
