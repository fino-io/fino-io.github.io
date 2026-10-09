---
title: 9.4. pgx、SQL、连接池与 GORM
description: 数据库查询、事务、约束、迁移和 ORM 边界。
pageClass: aip-article go-course
---

# 9.4. pgx、SQL、连接池与 GORM

先修建议：[HTTP 服务与 Web 框架](./web)、[Context、截止时间与取消](./context)。

## 连接、约束和事务分别保护什么 {#concept-1}

连接池让请求复用数据库连接；数据库约束保证数据规则；事务让一组操作按一致边界提交。它们解决不同问题，不能用“ORM 帮我处理了”概括所有保证。

```mermaid
flowchart LR
  B["业务操作与 Context"] --> P["连接池获取可用连接"] --> Q["参数化 SQL"]
  Q --> C["数据库约束与事务"] --> R["读取结果或提交失败"] --> F["归还连接"]
```

查询 rows、事务与连接都需结束协议。事务中的所有相关 SQL 通过同一个 tx 执行；外部 HTTP 副作用不因此自动加入数据库事务。先在真实数据库测试回滚与唯一约束，再选择 pgx 或 GORM 的访问表达。

## SQL 基础先于 ORM {#concept-2}

先掌握表、主键、唯一约束、外键、索引、JOIN 和事务。Go 的 `database/sql` 提供统一接口与连接池，具体协议由驱动实现。PostgreSQL 可复用 [pgx](https://github.com/jackc/pgx)，它既支持原生 API/连接池，也提供 database/sql 适配；ORM 适合已有团队约定，不能替代 SQL 和执行计划知识。

`sql.Open` 通常不立即建立连接，启动时用有截止时间的 PingContext 验证可达性。一个长生命周期 DB 通常供整个服务复用，不能每次请求 Open/Close。设置最大打开连接、空闲连接和生命周期时考虑数据库总连接预算与服务实例数。参考：[database/sql](https://pkg.go.dev/database/sql)。

## 参数化查询与结果关闭 {#concept-3}

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

## 一次事务内完成一致性操作 {#concept-4}

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

## 迁移、分页与测试 {#concept-5}

表结构变更使用版本化迁移，不在每次请求中自动修改。大数据集优先评估游标分页并建立相应索引；offset 分页简单，但大偏移可能昂贵且遇到并发新增时不稳定。唯一约束在数据库中表达，不能只依赖“先查有没有”。

集成测试使用隔离数据库，执行真实迁移，验证唯一约束、回滚与查询边界。mock 可验证调用，但不能发现 SQL 与数据库真实行为差异。

## pgx 原生连接池与 database/sql 选择 {#concept-6}

PostgreSQL 专用程序可直接用 pgxpool，利用 PostgreSQL 类型与协议能力；需要 database/sql 统一接口或已有中间层时用 pgx/stdlib。二者选一套主要池管理，不为同一逻辑重复建两个池。设置连接预算考虑实例数：每实例 20 个连接、10 实例就是最多约 200，不能只按单进程吞吐调大。

pgxpool 片段，ctx 与 DSN 来自启动配置：

```go
pool, err := pgxpool.New(ctx, dsn)
if err != nil { return err }
defer pool.Close()
if err := pool.Ping(ctx); err != nil { return err }
var title string
err = pool.QueryRow(ctx, "SELECT title FROM tasks WHERE id=$1", id).Scan(&title)
if errors.Is(err, pgx.ErrNoRows) { return ErrNotFound }
if err != nil { return fmt.Errorf("查任务: %w", err) }
```

运行前创建 tasks 表并插入 fixture，不把没建表的片段宣称可直接运行。启动连接与每次请求共享服务生命周期；关闭池晚于在途请求收拢。

## GORM 的明确查询与错误 {#concept-7}

GORM 是对象映射和查询构造工具，不消除 SQL、约束和事务知识。用结构体映射时写明主键、列与关系；对用户输入选择允许更新的列，避免把请求对象直接全量 Save。

片段，需要已配置 db 与 Task 模型：

```go
var task Task
err := db.WithContext(ctx).First(&task, id).Error
if errors.Is(err, gorm.ErrRecordNotFound) { return ErrNotFound }
if err != nil { return err }
result := db.WithContext(ctx).Model(&Task{}).Where("id = ?", id).
    Updates(map[string]any{"title": title, "done": false})
if result.Error != nil { return result.Error }
if result.RowsAffected != 1 { return ErrNotFound }
```

结构体 Updates 默认可能忽略零值，显式 map 或 Select 才能表达更新 done=false；这属于 ORM 与 API 契约交界，必须测试。AutoMigrate 不能替代经过审查的生产迁移，删除列、回填数据和回滚方案需要显式设计。参考：[GORM 更新](https://gorm.io/docs/update.html)。

## N+1、执行计划和数据库约束 {#concept-8}

列表里逐任务查询用户会产生 N+1 次调用；通过 JOIN 或适当批量加载解决，测试查询数量与执行计划。索引并非越多越好，写入维护与空间也有代价。用户归属和游标列按查询模式建立组合索引，EXPLAIN 用真实量级验证。

应用检查唯一性仍可能在并发中冲突，数据库 UNIQUE 才是最终约束；捕获唯一冲突后映射业务冲突。事务无法自动保证外部 HTTP 副作用一致，需 outbox 或其他明确流程，别在持锁事务里等待不可控网络。

## 练习与验收 {#lab}

1. 将任务 API 的内存存储替换成 PostgreSQL，保留 HTTP 契约。
2. 在事务第二步制造失败，确认第一步没有持久化。
3. 用 EXPLAIN 分析分页查询，确认索引选择。

验收：所有查询有 Context，连接及时释放，数据约束与事务均有真实数据库验证。
