---
title: 14 · HTTP 服务与接口设计
description: Go 中文学习指南：HTTP 服务与接口设计，包含概念、示例、练习与验收。
pageClass: aip-article
---

# 14 · HTTP 服务与接口设计

本章目标：使用标准库构建请求边界清楚的服务，区分校验、业务与响应职责。

## 最小 HTTP 服务

Go 1.22+ 的 ServeMux 支持方法和路径参数。保存为 `main.go`：

```go
package main

import (
	"encoding/json"
	"log"
	"net/http"
	"time"
)

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /hello/{name}", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		if err := json.NewEncoder(w).Encode(map[string]string{
			"message": "你好，" + r.PathValue("name"),
		}); err != nil {
			log.Printf("写响应失败: %v", err)
		}
	})
	server := &http.Server{
		Addr: ":8080", Handler: mux,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      10 * time.Second,
		IdleTimeout:       60 * time.Second,
	}
	log.Fatal(server.ListenAndServe())
}
```

访问 `http://localhost:8080/hello/Go` 得到 JSON。这个例子专注路由与响应，完整关闭流程见 [任务 API 项目](./project-api)。`GET /hello/{name}` 也匹配 HEAD；精确根路径使用 `GET /{$}`，避免把所有未知路径都匹配到首页。参考：[ServeMux](https://pkg.go.dev/net/http#ServeMux)。

## 请求处理的顺序

1. 限制 body 大小，检查 Content-Type 与格式。
2. 解码为请求结构体，检查未知字段和额外 JSON。
3. 做业务字段校验，例如标题长度、ID 范围。
4. 调用业务操作，传递 `r.Context()`。
5. 将已知业务错误映射为稳定状态码，返回公开错误信息。
6. 在服务边界记录内部错误，避免将数据库或堆栈细节暴露给调用方。

解码请求与数据库模型可以分开，避免把用户可写字段与内部字段混在一起。body 的缺失字段、零值与显式 null 是否等价必须明确；PATCH 往往使用指针或专门可选值模型表达“未提供”。

## 常用接口约定

| 场景 | 常见状态 |
| --- | --- |
| 获取成功 | 200 |
| 创建成功 | 201，配合 Location |
| 删除成功且无 body | 204 |
| 格式或字段错误 | 400 |
| 未认证 / 无权限 | 401 / 403 |
| 资源不存在 | 404 |
| 唯一键或版本冲突 | 409 |
| body 过大 / 类型不支持 | 413 / 415 |
| 服务内部错误 | 500，公开信息保持通用 |

响应头和状态必须在写入 body 前设置；第一次 Write 会隐式发送 200，此后再改状态无效。成功写出部分响应后编码失败，通常只能记录错误，不能再追加一个新的 JSON 错误对象。

## 中间件与生命周期

中间件是 `func(http.Handler) http.Handler` 形式的包装，适合请求 ID、日志、认证与恢复。顺序影响行为，恢复与访问日志应覆盖业务处理；认证检查身份，授权判断能否操作具体资源，两者分开。使用成熟认证协议和库，不自制密码加密或 token 算法。

关闭流程：收到信号 → 停止接收新请求 → 用独立超时 Context 调用 Shutdown → 收拢后台任务与依赖 → 超时后必要时 Close。Shutdown 不自动管理 hijacked 连接或业务后台 goroutine，需要额外跟踪。长连接与流式响应需要针对场景调整超时。

## 练习与验收

1. 增加任务查询接口，分别测试有效 ID、非法 ID 与不存在。
2. 用 httptest 验证状态码、Content-Type 和错误 body。
3. 发出慢请求期间触发关闭，观察请求完成与关闭超时。

验收：请求边界一致，没有未限制的 body，业务逻辑可以脱离 HTTP 测试。API 设计可结合 [AIP 资源设计](/aip/general/0121_zh)。
