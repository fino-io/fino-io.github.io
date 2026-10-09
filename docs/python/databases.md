---
title: 3.2. SQL、SQLite 与持久化
description: Python 中文学习指南：SQL、SQLite 与持久化，包含概念、代码示例、练习与验收。
pageClass: aip-article
---

# 3.2. SQL、SQLite 与持久化

本章目标：理解表、约束和事务，用参数化 SQL 保存数据，避免把数据库当成字典文件。

## 从模型到表

关系型表由行和列组成。主键标识记录，NOT NULL 保证字段存在，UNIQUE 保证唯一，CHECK 表达值域约束。应用校验提供友好错误，数据库约束守住最终一致性。

```python
import sqlite3
from contextlib import closing

with closing(sqlite3.connect("tasks.db")) as connection:
    connection.row_factory = sqlite3.Row
    with connection:
        connection.execute("""
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY,
                title TEXT NOT NULL CHECK(length(trim(title)) > 0),
                done INTEGER NOT NULL DEFAULT 0 CHECK(done IN (0, 1))
            )
        """)
        connection.execute("INSERT INTO tasks(title) VALUES (?)", ("学习事务",))
    rows = connection.execute("SELECT id, title FROM tasks WHERE done = ? ORDER BY id", (0,)).fetchall()
    for row in rows:
        print(row["id"], row["title"])
```

SQL 值使用占位符，不用 f-string 拼用户输入。表名和排序字段不能直接当值绑定，动态字段应走固定允许列表。单元素元组要有逗号。

## 事务与连接生命周期

事务把多个修改作为一个整体提交；失败回滚，避免只写入一半。上面的 `with connection` 管理提交与回滚，**不会关闭连接**，因此外层使用 `closing`。示例依赖 sqlite3 默认事务行为，复杂应用应按 Python 版本明确配置 autocommit 策略。

SQLite 适合本地工具和小型服务，写并发、长事务和网络共享文件都需要谨慎。更新后检查 rowcount 区分“成功”和“记录不存在”。分页用确定性排序；大型数据可采用基于 id 的游标，避免无限增长的 OFFSET。

## 索引、迁移与 ORM

学习 SELECT、WHERE、ORDER BY、JOIN、GROUP BY 和聚合函数，再接入 ORM。索引提升匹配查询的速度，也增加写入与存储成本；用查询计划确认实际收益，不要给每列建索引。

Python 服务可选 SQLAlchemy，数据库迁移可选 Alembic；Django 项目优先用自身 ORM 与迁移。迁移应可审查、可在测试库演练，并备份重要数据。不要在正式环境每次启动时随意改变表结构。

## 练习与验收

1. 增加任务、标记完成并按状态分页查询。
2. 插入带引号的标题，确认参数化 SQL 正常工作。
3. 在同一事务写两条记录，让第二条失败，确认第一条未保存。

验收：连接关闭、失败回滚、输入不能改变 SQL 结构。参考：[sqlite3 文档](https://docs.python.org/3/library/sqlite3.html)、[SQLAlchemy 教程](https://docs.sqlalchemy.org/en/20/tutorial/)。
