---
title: 17 · 从练习到完整项目
description: 通过可运行的文本检索 CLI 与 HTTP 服务起点，把语言知识连成可验证的工程能力。
pageClass: aip-article rust-article
---

# 17 · 从练习到完整项目

本章目标：完成一个从输入到结果、从正常路径到失败路径的小闭环。先把简单项目做完整，再添加新功能；每个依赖与模块都应有明确用途。

## 项目一：文本检索 CLI

实现 `note-search <query> <path>`：读取小型 UTF-8 文本文件，打印包含查询内容的行与行号。使用 clap 解析参数，anyhow 增加错误上下文，核心算法借用输入，不读取文件也不打印。

### 创建与依赖

```sh
cargo new note-search
cd note-search
cargo add clap@4 --features derive
cargo add anyhow@1
```

保留生成的 Cargo.toml，确认 edition 为 2024。本例采用 clap 4 与 anyhow 1 的接口系列，Cargo.lock 记录实际解析出的版本。将以下代码分别保存到对应文件。

### src/lib.rs：核心算法与测试

```rust
pub fn find_lines<'a>(query: &str, text: &'a str) -> Vec<(usize, &'a str)> {
    text.lines()
        .enumerate()
        .filter(|(_, line)| line.contains(query))
        .map(|(index, line)| (index + 1, line))
        .collect()
}

#[cfg(test)]
mod tests {
    use super::find_lines;

    #[test]
    fn returns_matching_lines_with_numbers() {
        let text = "rust ownership\ngo channels\nrust async";
        assert_eq!(find_lines("rust", text),
            vec![(1, "rust ownership"), (3, "rust async")]);
    }

    #[test]
    fn handles_empty_text_and_no_match() {
        assert!(find_lines("rust", "").is_empty());
        assert!(find_lines("rust", "cargo").is_empty());
    }

    #[test]
    fn matches_chinese_text() {
        assert_eq!(find_lines("借用", "所有权\n共享借用"),
            vec![(2, "共享借用")]);
    }

    #[test]
    fn empty_query_matches_every_line() {
        assert_eq!(find_lines("", "a\nb"), vec![(1, "a"), (2, "b")]);
    }
}
```

输出行引用 text，与 query 的生命周期无关。库算法遵循字符串 contains 的空查询语义；CLI 在边界拒绝空查询，给用户明确提示。这种区别要在接口说明与测试中写清楚。

### src/main.rs：应用入口

```rust
use anyhow::{Context, Result, ensure};
use clap::Parser;
use std::path::PathBuf;

#[derive(Parser)]
#[command(about = "在 UTF-8 文本文件中查找内容")]
struct Args {
    query: String,
    path: PathBuf,
}

fn main() -> Result<()> {
    let args = Args::parse();
    ensure!(!args.query.is_empty(), "查询内容不能为空");
    let text = std::fs::read_to_string(&args.path)
        .with_context(|| format!("读取 {} 失败", args.path.display()))?;
    for (line_number, line) in note_search::find_lines(&args.query, &text) {
        println!("{line_number}: {line}");
    }
    Ok(())
}
```

Package 名 `note-search` 在 Rust 导入路径中对应 `note_search`。PathBuf 适合保存文件路径；文件读取和参数校验放在入口，库函数保持纯粹。这里无匹配时正常退出，文件错误或空查询时失败退出；若要模仿 grep 的退出码，应作为独立行为补充实现与测试。

### 运行与验收

在项目目录创建 **sample.txt**：

```text
rust ownership
go channels
rust async
```

```sh
cargo fmt
cargo test
cargo run -- rust sample.txt
cargo run -- --help
cargo run -- rust missing.txt
cargo run -- "" sample.txt
```

第一条检索输出 `1: rust ownership` 与 `3: rust async`。帮助信息应由 clap 生成。缺失文件和空查询应得到说明清楚的错误，不能静默返回空结果。

本例一次读取整个文件，只适用于可接受的文件规模。下一步可使用 BufReader 逐行读取，处理每行读取错误；再按需求增加忽略大小写或 JSON 输出。搜索能力已有成熟实现时，可参考 [ripgrep](https://github.com/BurntSushi/ripgrep) 的设计；本例保留一个小算法用于练习语言基础。

## 项目二：HTTP 服务起点

完成 CLI 后，再创建独立项目，认识运行时、路由、JSON 响应和监听错误。先提供一个 `GET /health` 端点，验证本地服务循环。

```sh
cargo new learning-api
cd learning-api
cargo add axum@0.8
cargo add tokio@1 --features macros,rt-multi-thread,net
cargo add serde@1 --features derive
```

将以下代码放入 **src/main.rs**：

```rust
use axum::{Json, Router, routing::get};
use serde::Serialize;

#[derive(Serialize)]
struct Health {
    status: &'static str,
}

async fn health() -> Json<Health> {
    Json(Health { status: "ok" })
}

#[tokio::main]
async fn main() -> std::io::Result<()> {
    let app = Router::new().route("/health", get(health));
    let listener = tokio::net::TcpListener::bind("127.0.0.1:3000").await?;
    axum::serve(listener, app).await
}
```

执行 `cargo run`，在另一个终端运行 `curl http://127.0.0.1:3000/health`，应得到 `{"status":"ok"}`。本例绑定本地地址，用于开发验证。健康端点在这里只表示服务能响应；真实系统的 readiness 还需要体现关键依赖是否可用。

### 逐步扩展为学习记录 API

| 顺序 | 新能力 | 验收标准 |
| --- | --- | --- |
| 1 | 定义学习记录与输入 DTO | 校验标题与时长，错误返回明确的 4xx。 |
| 2 | 添加创建与查询路由 | POST 返回新记录；不存在的记录返回 404。 |
| 3 | 引入 SQLite 或 PostgreSQL | 参数绑定、迁移、连接池和必要事务可验证。 |
| 4 | 错误映射与 tracing | 客户端得到稳定错误码，内部保留错误链与请求上下文。 |
| 5 | 超时与优雅关闭 | 停止接收新请求后，已接收工作按约定结束。 |
| 6 | 集成测试 | 覆盖成功、非法输入、缺失记录和数据库失败。 |

只在处理逻辑明显增长时拆成路由、业务与存储模块；存在替换实现需求时再引入 Trait。需要分页、资源名称与兼容性设计时，结合 [Google AIPs](/aip/general/) 学习接口语义。

## 项目完成清单

- 从干净目录按 README 的步骤构建和运行。
- 正常输入、边界输入和主要失败路径都有验证。
- 关键错误包含上下文，所有后台任务有结束方式。
- 格式化、Clippy、测试通过；依赖和 features 有明确用途。
- 能解释数据所有者、模块边界与主要取舍。

参考：[clap 文档](https://docs.rs/clap/latest/clap/)、[anyhow 文档](https://docs.rs/anyhow/latest/anyhow/)、[axum 文档](https://docs.rs/axum/latest/axum/)、[Tokio Tutorial](https://tokio.rs/tokio/tutorial)。
