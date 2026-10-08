---
title: 26 · HTTP 服务与 Web 框架
description: 请求边界与 Gin、Echo、Fiber、Beego 的差异。
pageClass: aip-article
---

# 26 · HTTP 服务与 Web 框架

学习前应能完成：[文件、流式 I/O 与 JSON](./io)、[Context、截止时间与取消](./context)、[表驱动、替身与 HTTP 测试](./testing)。

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

## 框架节点逐项对照

| 框架 | 具体入口 | 与标准库关系 / 迁移点 |
| --- | --- | --- |
| [Gin](https://gin-gonic.com/en/docs/) | gin.New、GET/POST、ShouldBindJSON | 基于 net/http；Context 负责请求绑定与响应，业务仍传 context.Context。 |
| [Echo](https://echo.labstack.com/docs/) | echo.New、GET、Context.Bind | 基于 net/http；统一错误处理器与中间件，绑定后仍做业务校验。 |
| [Fiber](https://docs.gofiber.io/) | fiber.New、路由与版本对应 Context | 基于 fasthttp，不能假定 net/http 中间件、请求生命周期和 buffer 语义直接兼容。 |
| [Beego](https://beegodoc.com/) | Controller、Router 与配套工具 | 提供更多约定与组件，需理解框架装配、生成和隐式行为。 |

路线上把框架标为 Optional，不要求四个都精通。标准库建立 HTTP 概念后，只选择与你项目和团队一致的框架。比较维度是协议兼容、中间件、测试方式、API 版本和维护成本，不凭合成路由吞吐断言“更适合所有项目”。

## 一个 Gin 路由怎样保持职责清楚

片段，需要已安装 gin-gonic/gin，放入装配函数：

```go
router := gin.New()
router.Use(gin.Recovery())
router.POST("/tasks", func(c *gin.Context) {
    var input struct { Title string `json:"title"` }
    if err := c.ShouldBindJSON(&input); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "JSON 无效"})
        return
    }
    title := strings.TrimSpace(input.Title)
    if title == "" {
        c.JSON(http.StatusBadRequest, gin.H{"error": "标题不能为空"})
        return
    }
    // 真实项目调用 createTask(c.Request.Context(), title)。
    c.JSON(http.StatusCreated, gin.H{"title": title})
})
```

这段展示路由/绑定 API，没有持久化和完整严格解码策略。body 大小限制在进入绑定前设置，未知字段策略按所选版本配置；成功绑定不代表授权或数据规则验证成功。用 handler + httptest 测状态、字段、空输入与超限，在不同框架中复用相同契约断言。

## 路由、中间件与响应提交

中间件前半段在业务前执行，后半段可能在返回后执行；恢复、日志、请求 ID、认证和授权顺序影响结果。外层日志应记录最终状态和持续时间；不能每层都无条件再写响应。标准 ResponseWriter 默认不允许写完再改变状态，包装它时还要保留流式、Hijacker 等可选接口，复用成熟中间件避免自行实现宽泛封装。

请求超时不等于业务副作用取消：已经提交的数据库操作无法“倒退”，创建请求要配幂等与事务。认证确认身份，授权确认该身份能否操作该任务；列表同样过滤归属，不只检查单条读取。

## 练习与验收 {#lab}

1. 增加任务查询接口，分别测试有效 ID、非法 ID 与不存在。
2. 用 httptest 验证状态码、Content-Type 和错误 body。
3. 发出慢请求期间触发关闭，观察请求完成与关闭超时。

验收：请求边界一致，没有未限制的 body，业务逻辑可以脱离 HTTP 测试。API 设计可结合 [AIP 资源设计](/aip/general/0121_zh)。
