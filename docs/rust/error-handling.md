---
title: 1.6. 错误处理
description: 使用 Result、问号运算符与错误上下文，设计可维护的失败路径。
pageClass: aip-article rust-article
---

# 1.6. 错误处理

本章目标：将可预期失败写进函数类型，提供足够上下文，避免把正常的用户输入错误升级为程序崩溃。

## Result、Option 与 panic

Result 表达操作成功或失败，例如读文件、解析配置和数据库访问。Option 表达值可能缺失，例如查不到缓存。panic 用于无法继续维护的不变量或明确不可恢复的缺陷；它不是普通输入校验的默认方式。

`unwrap` 和 `expect` 都可能 panic。教学中的固定断言、测试和经过证明的不变量可以使用它们；外部输入的失败通常通过 Result 返回。`expect` 的文字应说明为什么该操作必须成功。

## 问号运算符与传播

`?` 在成功时取出值，在失败时提前返回，并按目标错误类型执行可用的转换。它减少重复分支，但调用者仍需要理解哪里可能失败。

```rust
use std::num::ParseIntError;

fn parse_port(input: &str) -> Result<u16, ParseIntError> {
    let port = input.trim().parse::<u16>()?;
    Ok(port)
}

fn main() {
    match parse_port("8080") {
        Ok(port) => println!("端口：{port}"),
        Err(error) => eprintln!("端口格式错误：{error}"),
    }
    assert!(parse_port("70000").is_err());
}
```

`?` 只能用于支持相应返回语义的上下文。Option 函数中的 `?` 传播 None；它不会自动把 None 转换成任意错误，必要时用 `ok_or` 或 `ok_or_else`。

## 按接口层次选择错误类型

| 场景 | 常见选择 |
| --- | --- |
| 只存在一种底层错误 | 直接返回 io::Error、ParseIntError 等已有类型。 |
| 可复用库、业务模块 | 定义明确的错误枚举，让调用者能按类别处理。 |
| CLI 或服务的最外层 | 用 anyhow 汇总错误并追加操作上下文。 |

[thiserror](https://docs.rs/thiserror/latest/thiserror/) 可生成 Display、Error 与转换实现；[anyhow](https://docs.rs/anyhow/latest/anyhow/) 适合应用层传播多种错误。先复用成熟库，不需要手工实现一套错误框架。

下面是**需要添加依赖的完整示例**。创建项目后执行 `cargo add anyhow`，再替换 `src/main.rs`：

```rust
use anyhow::{Context, Result};

fn main() -> Result<()> {
    let path = "settings.txt";
    let content = std::fs::read_to_string(path)
        .with_context(|| format!("读取配置文件 {path} 失败"))?;
    println!("读取到 {} 字节", content.len());
    Ok(())
}
```

错误链应保留底层原因，并补充正在做什么。对外返回错误时区分面向用户的信息与内部诊断，避免把敏感配置直接拼入响应。

## 恢复策略需要业务语义

格式错误通常要求用户修改输入；文件不存在可能允许创建默认文件；网络暂时失败可能允许重试。重试还要考虑次数、退避、截止时间和幂等性。权限不足或输入不合法通常无法通过重复同一操作恢复。

`map_err` 用于改变错误类型或补充信息；`and_then` 用于串接可能失败的步骤。若链式表达已经难读，使用局部变量与 `?` 保持流程清楚。

## 练习与验收

编写配置读取函数，区分不存在、无权限、无效 UTF-8 和解析错误。给业务调用者提供可判断的错误分类，在 CLI 入口增加文件路径上下文。至少为有效输入、缺失文件和无效内容各验证一次。

能说明哪些错误应返回、哪些可以恢复、哪里必须保留错误来源，就掌握了重点。参考：[Rust Book：错误处理](https://doc.rust-lang.org/book/ch09-00-error-handling.html)、[std::error::Error](https://doc.rust-lang.org/std/error/trait.Error.html)。
