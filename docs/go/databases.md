---
title: 15 · SQL、连接池与事务
description: Go 中文学习指南：SQL、连接池与事务，包含概念、示例、练习与验收。
pageClass: aip-article
---

# 15 · SQL、连接池与事务

本章目标：可靠地访问关系数据库，理解连接池、参数化查询与事务一致性。

## SQL 基础先于 ORM

先掌握表、主键、唯一约束、外键、索引、JOIN 和事务。Go 的 `database/sql` 提供统一接口与连接池，具体协议由驱动实现。PostgreSQL 可复用 [pgx](https://github.com/jackc/pgx)，它既支持原生 API/连接池，也提供 database/sql 适配；ORM 适合已有团队约定，不能替代 SQL 和执行计划知识。

`sql.Open` 通常不立即建立连接，启动时用有截止时间的 PingContext 验证可达性。一个长生命周期 DB 通常供整个服务复用，不能每次请求 Open/Close。设置最大打开连接、空闲连接和生命周期时考虑数据库总连接预算与服务实例数。参考：[database/sql](https://pkg.go.dev/database/sql)。

## 参数化查询与结果关闭

下面是 PostgreSQL `database/sql` 片段，db 与 ctx 已由调用方提供，需要引入 pgx/stdlib 驱动：

```go
rows, err := db.QueryContext(ctx,
    "SELECT id, title, done FROM tasks WHERE id > $1 ORDER BY id LIMIT $2",
    afterID, limit,
)
if err != nil {
    return nil, fmt.Errorf("查询任务: %w", err)
}
defer rows.Close()
var tasks []Task
for rows.Next() {
    var task Task
    if err := rows.Scan(&task.ID, &task.Title, &task.Done); err != nil {
        return nil, fmt.Errorf("读取任务行: %w", err)
    }
    tasks = append(tasks, task)
}
if err := rows.Err(); err != nil {
    return nil, fmt.Errorf("遍历任务: %w", err)
}
return tasks, nil
```

占位符保护值，不保护动态表名、列名与排序方向；动态标识符必须来自白名单。`QueryRowContext(...).Scan(...)` 可返回 sql.ErrNoRows，将其转换为业务 ErrNotFound。可空字段使用 sql.NullString 等类型或明确的可选模型，避免丢失 null 与空字符串的区别。

忘记 Close 可能占用连接，忘记 rows.Err 可能把中途失败当成完整结果。UPDATE/DELETE 检查 RowsAffected；创建记录的 ID 使用数据库对应的 RETURNING 等能力，不假设所有驱动都支持 LastInsertId。

## 一次事务内完成一致性操作

片段，转账金额已校验为正数且使用最小单位整数；账户表有 `CHECK (balance >= 0)`：

```go
tx, err := db.BeginTx(ctx, nil)
if err != nil { return err }
defer tx.Rollback()
result, err := tx.ExecContext(ctx,
    "UPDATE accounts SET balance = balance - $1 WHERE id = $2 AND balance >= $1",
    amount, fromID,
)
if err != nil { return err }
changed, err := result.RowsAffected()
if err != nil { return err }
if changed != 1 { return fmt.Errorf("账户不存在或余额不足") }
result, err = tx.ExecContext(ctx,
    "UPDATE accounts SET balance = balance + $1 WHERE id = $2", amount, toID,
)
if err != nil { return err }
changed, err = result.RowsAffected()
if err != nil { return err }
if changed != 1 { return fmt.Errorf("收款账户不存在") }
if err := tx.Commit(); err != nil { return err }
return nil
```

同一事务内所有语句都通过 tx 执行，不能夹杂 db 上的查询而离开事务连接。defer Rollback 用于失败清理，成功 Commit 后的 Rollback 可忽略。真实转账还需幂等请求号、隔离级别、死锁处理、账本与审计，以上仅解释事务边界。参见 [官方事务指南](https://go.dev/doc/database/execute-transactions)。

## 迁移、分页与测试

表结构变更使用版本化迁移，不在每次请求中自动修改。大数据集优先评估游标分页并建立相应索引；offset 分页简单，但大偏移可能昂贵且遇到并发新增时不稳定。唯一约束在数据库中表达，不能只依赖“先查有没有”。

集成测试使用隔离数据库，执行真实迁移，验证唯一约束、回滚与查询边界。mock 可验证调用，但不能发现 SQL 与数据库真实行为差异。

## 练习与验收

1. 将任务 API 的内存存储替换成 PostgreSQL，保留 HTTP 契约。
2. 在事务第二步制造失败，确认第一步没有持久化。
3. 用 EXPLAIN 分析分页查询，确认索引选择。

验收：所有查询有 Context，连接及时释放，数据约束与事务均有真实数据库验证。
