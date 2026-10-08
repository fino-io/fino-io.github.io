---
title: 17 · 实战：任务管理 API
description: 用 FastAPI、Pydantic 和 SQLite 实现有持久化、输入校验、分页与测试的任务管理接口。
pageClass: aip-article
---

# 17 · 实战：任务管理 API

本项目复用 FastAPI、Pydantic 和 SQLite，完成一个可运行的小型任务服务。前置知识：第 09–14 章。它是本地单用户学习项目，扩展为公开服务前再加入用户身份、资源权限和部署配置。

## 接口与数据约定

| 请求 | 行为 | 关键结果 |
| --- | --- | --- |
| `POST /tasks` | 创建任务 | 201，返回 id、title、done。 |
| `GET /tasks?limit=20&offset=0` | 按 id 升序分页 | 200，limit 为 1–100。 |
| `PATCH /tasks/{id}` | 更新完成状态 | 200；不存在为 404。 |

标题去空白后长度为 1–200，done 必须为 JSON 布尔值。SQLite 文件重启后保留；参数化 SQL 与数据库约束共同守住输入边界。

## 安装与完整服务

```sh
python -m pip install "fastapi[standard]" httpx pytest
```

保存为 `app.py`：

```python
from contextlib import asynccontextmanager, closing
from pathlib import Path
import sqlite3

from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, ConfigDict, Field, field_validator


class TaskCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    title: str = Field(min_length=1, max_length=200)

    @field_validator("title", mode="before")
    @classmethod
    def clean_title(cls, value):
        if isinstance(value, str):
            value = value.strip()
            if not value:
                raise ValueError("标题不能为空")
        return value


class TaskUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)
    done: bool


class Task(BaseModel):
    id: int
    title: str
    done: bool


def create_app(database: Path = Path("tasks.db")) -> FastAPI:
    def connect():
        connection = sqlite3.connect(database, timeout=5)
        connection.row_factory = sqlite3.Row
        return connection

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        with closing(connect()) as connection, connection:
            connection.execute("""
                CREATE TABLE IF NOT EXISTS tasks (
                    id INTEGER PRIMARY KEY,
                    title TEXT NOT NULL CHECK(length(trim(title)) BETWEEN 1 AND 200),
                    done INTEGER NOT NULL DEFAULT 0 CHECK(done IN (0, 1))
                )
            """)
        yield

    app = FastAPI(title="任务管理 API", lifespan=lifespan)

    @app.post("/tasks", response_model=Task, status_code=201)
    def create_task(task: TaskCreate):
        with closing(connect()) as connection, connection:
            cursor = connection.execute("INSERT INTO tasks(title) VALUES (?)", (task.title,))
            return {"id": cursor.lastrowid, "title": task.title, "done": False}

    @app.get("/tasks", response_model=list[Task])
    def list_tasks(limit: int = Query(20, ge=1, le=100), offset: int = Query(0, ge=0)):
        with closing(connect()) as connection:
            return [dict(row) for row in connection.execute(
                "SELECT id, title, done FROM tasks ORDER BY id LIMIT ? OFFSET ?", (limit, offset)
            )]

    @app.patch("/tasks/{task_id}", response_model=Task)
    def update_task(task_id: int, update: TaskUpdate):
        with closing(connect()) as connection, connection:
            cursor = connection.execute("UPDATE tasks SET done = ? WHERE id = ?", (update.done, task_id))
            if cursor.rowcount == 0:
                raise HTTPException(status_code=404, detail="任务不存在")
            row = connection.execute("SELECT id, title, done FROM tasks WHERE id = ?", (task_id,)).fetchone()
            return dict(row)

    return app


app = create_app()
```

每次同步路由请求创建和关闭自己的连接，不共享全局 SQLite 连接。小项目直接把 SQL 放在路由附近便于阅读，规则增长后再提取业务函数。连接上下文退出时提交，随后关闭；HTTPException 导致更新事务回滚。数据库错误应由日志定位，后续可为预期的锁冲突配置明确的重试或失败策略。

## 运行与手动验收

```sh
fastapi dev app.py
```

打开 `http://127.0.0.1:8000/docs` 创建 `{"title":"学习 Python"}`，记住返回 id；GET 应看到该记录，PATCH 发送 `{"done":true}` 后应更新。停止服务并重新启动，再 GET，记录仍然存在。

## 可执行的接口测试

保存为 `test_app.py`：

```python
from fastapi.testclient import TestClient
from app import create_app


def test_task_lifecycle(tmp_path):
    database = tmp_path / "tasks.db"
    with TestClient(create_app(database)) as client:
        created = client.post("/tasks", json={"title": "  学习 Python  "})
        assert created.status_code == 201
        task = created.json()
        assert task["title"] == "学习 Python"
        assert task["done"] is False
        assert client.patch(f"/tasks/{task['id']}", json={"done": True}).json()["done"] is True
        assert client.patch("/tasks/9999", json={"done": True}).status_code == 404
        for payload in [{"title": " "}, {"title": "x" * 201}, {"title": "ok", "other": 1}]:
            assert client.post("/tasks", json=payload).status_code == 422
        assert client.patch(f"/tasks/{task['id']}", json={"done": "true"}).status_code == 422
        assert client.get("/tasks?limit=101").status_code == 422
        assert client.get("/tasks?offset=-1").status_code == 422
    with TestClient(create_app(database)) as client:
        assert client.get("/tasks").json() == [{**task, "done": True}]
```

运行 `python -m pytest -q`。TestClient 上下文触发生命周期，临时目录隔离数据库；第二次创建应用模拟服务重启。

## 里程碑与升级

第一步跑通创建和查询，第二步加入更新和输入校验，第三步验证重启与测试。完成后再增加删除、按状态过滤和游标分页，每一步补相应接口测试。

公开部署前需要用户身份与逐条资源授权、日志与健康检查、备份、数据库迁移，以及合理的并发容量。高写入并发可迁移 PostgreSQL 与 SQLAlchemy；不要把本地演示数据库无限扩展成生产存储。容器镜像保留明确依赖版本，数据存放持久化卷，开发 reload 不用于正式启动。

参考：[FastAPI 请求模型](https://fastapi.tiangolo.com/tutorial/body/)、[FastAPI 测试](https://fastapi.tiangolo.com/tutorial/testing/)、[Pydantic 校验器](https://docs.pydantic.dev/latest/concepts/validators/)。
