---
title: 13 · HTTP 客户端与可靠调用
description: Go 中文学习指南：HTTP 客户端与可靠调用，包含概念、示例、练习与验收。
pageClass: aip-article
---

# 13 · HTTP 客户端与可靠调用

本章目标：让外部 HTTP 调用有超时、大小限制和可诊断错误，理解连接复用与重试的边界。

## 复用 Client，传递 Context

Client 与 Transport 可以并发复用，不要每次请求都创建新的 Transport。`http.Get` 使用的默认客户端没有总超时，应用通常显式配置。URL 查询参数使用 url.Values，路径参数按协议编码，不把任意字符串直接拼接成 URL。

下面以本地测试服务验证完整调用，保存为 `main.go`：

```go
package main

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"time"
)

func fetch(ctx context.Context, client *http.Client, url string) ([]byte, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("创建请求: %w", err)
	}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("请求失败: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("上游状态码 %d", resp.StatusCode)
	}
	const limit = 1 << 20
	data, err := io.ReadAll(io.LimitReader(resp.Body, limit+1))
	if err != nil {
		return nil, fmt.Errorf("读取响应: %w", err)
	}
	if len(data) > limit {
		return nil, fmt.Errorf("响应超过 1 MiB")
	}
	return data, nil
}

func main() {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprint(w, "Go 学习服务")
	}))
	defer server.Close()
	client := &http.Client{Timeout: 3 * time.Second}
	data, err := fetch(context.Background(), client, server.URL)
	if err != nil {
		fmt.Println(err)
		return
	}
	fmt.Println(string(data))
}
```

`Do` 成功不代表状态码成功；404、429、500 通常不会直接成为 Go error。响应体必须关闭；为了复用 HTTP/1.x 连接，通常还需读到 EOF。遇到巨大或异常响应可以主动关闭并放弃该连接，不能为复用连接而无限读取恶意数据。以上非 200 路径选择直接关闭。

## 分别控制哪些时间

| 控制点 | 目的 |
| --- | --- |
| 请求 Context | 共享调用链剩余预算与取消。 |
| Client.Timeout | 一次调用含读取响应体的总时间上限。 |
| Transport 的连接、TLS 与响应头超时 | 限制某个阶段，便于细化策略。 |
| 业务整体截止时间 | 限制分页或多次重试的完整操作。 |

真实 API 还需要检查 Content-Type、验证 JSON 字段、限制分页页数与结果数。分页游标不可假设总是递增，防止循环游标造成无限请求。

## 重试不是“失败就再来一次”

只对明确可重试的错误和幂等操作进行有限重试，采用指数退避与抖动并遵守 Retry-After。总次数、总预算与并发都要有限。POST 的响应丢失可能发生在服务已提交之后，除非有幂等键等协议保证，不应盲目重发。

重试期间响应体要关闭、请求体要能够重建。避免业务层、SDK、网关同时各重试多次。让用户输入直接决定请求目标时还要约束协议、主机和重定向，避免访问内部管理地址。

## 练习与验收

1. 本地服务分别返回 404、延迟和超过 1 MiB 的响应，验证错误。
2. 在请求前取消 Context，确认调用及时结束。
3. 实现分页调用的最大页数与重复游标检测。

验收：所有调用有预算，错误状态可识别，输入与响应受控。参考：[net/http 文档](https://pkg.go.dev/net/http)。
