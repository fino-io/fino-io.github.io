---
title: 1.4. 结构体、枚举与模式匹配
description: 使用结构体和枚举表达有效状态，掌握方法、Option 与模式匹配。
pageClass: aip-article rust-article
---

# 1.4. 结构体、枚举与模式匹配

本章目标：用类型表达业务含义，减少依靠字符串、布尔标记和注释维持的约定。

## 结构体与方法

结构体将有名字的字段组合起来。通过 `impl` 定义关联函数和方法：没有 self 的 `new` 常用于构造；`&self` 读取；`&mut self` 修改；`self` 接管实例。

```rust
#[derive(Debug, PartialEq)]
struct ReadingPlan {
    topic: String,
    completed: bool,
}

impl ReadingPlan {
    fn new(topic: impl Into<String>) -> Self {
        Self { topic: topic.into(), completed: false }
    }

    fn finish(&mut self) {
        self.completed = true;
    }
}

fn main() {
    let mut plan = ReadingPlan::new("模式匹配");
    plan.finish();
    assert!(plan.completed);
    println!("{plan:?}");
}
```

`derive` 为适用的类型生成常见 Trait 实现，例如 Debug 用于调试输出，PartialEq 用于相等比较。有约束的数据通常通过构造函数创建，避免外部随意构造无效值。

## 枚举表达互斥状态

枚举的每个变体可携带不同数据。当请求处于排队、执行中、完成之一时，枚举把状态与对应数据绑定起来。

```rust
enum JobState {
    Queued,
    Running { progress: u8 },
    Finished(String),
}

fn describe(state: &JobState) -> String {
    match state {
        JobState::Queued => "等待中".into(),
        JobState::Running { progress } => format!("进度 {progress}%"),
        JobState::Finished(result) => format!("完成：{result}"),
    }
}

fn main() {
    let states = [
        JobState::Queued,
        JobState::Running { progress: 50 },
        JobState::Finished("报告已生成".into()),
    ];
    for state in &states {
        println!("{}", describe(state));
    }
}
```

新增变体后，穷尽的 match 会提醒你更新所有分支。`_` 兜底也可能让新增状态被静默忽略；需要逐一处理的业务状态应保留显式分支。

## Option 与缺失值

Option 有 `Some(T)` 和 `None`，表达值可能不存在。Result 有 `Ok(T)` 和 `Err(E)`，表达操作可能失败。缺失和失败应在接口上分开表达。

```rust
fn main() {
    let names = ["Cargo", "Clippy"];
    match names.get(2) {
        Some(name) => println!("工具：{name}"),
        None => println!("没有第三个工具"),
    }
    if let Some(name) = names.first() {
        println!("第一个是 {name}");
    }
}
```

只关心一种模式时用 `if let`。匹配失败后立即退出时，可使用 `let Some(value) = input else { return; };`，else 分支必须离开当前流程。转换 Option 可用 `map`，提供默认值用 `unwrap_or` 或惰性的 `unwrap_or_else`。

## 解构与匹配的细节

模式可解构元组、结构体和枚举，也支持范围、多个候选模式和守卫条件。匹配拥有的数据时，字段可能被移动；匹配 `&value` 时通常借用字段。`_` 忽略值，`_name` 仍是一个实际绑定，可能移动所有权。

模式用于让状态关系更清楚。如果一个模式承载太多条件，先给业务判断起一个有含义的函数名，减少嵌套。

## 练习与验收

为订单定义待支付、已支付、已取消三种状态，让已支付状态携带流水号。编写描述函数与合法状态转换函数。另给集合查找函数返回 Option，禁止用空字符串代替不存在。

能解释为什么枚举可减少「已取消但仍带支付成功标记」之类的矛盾状态，就抓住了重点。参考：[结构体](https://doc.rust-lang.org/book/ch05-01-defining-structs.html)、[枚举](https://doc.rust-lang.org/book/ch06-00-enums.html)、[模式与匹配](https://doc.rust-lang.org/book/ch19-00-patterns.html)。
