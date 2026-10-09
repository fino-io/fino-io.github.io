---
title: 5.3. HTTP 客户端、超时与重试
description: 服务章节的延伸：连接复用、有限重试与本地验证。
pageClass: aip-article
---

# 5.3. HTTP 客户端、超时与重试

学习前应能完成：[HTTP 服务与 Web 框架](./web)。

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

## 可验证的调用矩阵

| 输入/响应 | 应观察到的行为 |
| --- | --- |
| 200 且合法小响应 | 返回完整数据，关闭 body。 |
| 404 / 500 | 不当作业务成功，返回可识别上游状态。 |
| 延迟超过预算 | 返回超时，调用链退出。 |
| 响应超过限额 | 明确超限，不返回被截断的成功结果。 |
| Context 调用前已取消 | 不继续无必要工作。 |
| 连接途中断开 | 报告读取错误，不把部分 JSON 当完整结果。 |

用 httptest.NewServer 在本机逐项构造响应，测试不依赖公共网站稳定性。重试测试还要断言尝试次数、总预算和请求幂等键；429 是否按 Retry-After 等待由协议定义。

## Transport 与请求体复用

连接/TLS/响应头等阶段预算放在复用 Transport；http.Client 的总超时也覆盖读 body。自定义 Transport 时从 DefaultTransport Clone 后调整，避免误丢代理或连接池配置。重定向是否允许、最大次数和目标主机按调用用途限制。

POST 重试必须能重建 body，并由幂等协议避免重复创建；一次请求超时只说明调用方没有获得结果，不证明上游没有提交。不能把所有 net.Error 都无条件无限重试。

## 练习与验收 {#lab}

1. 本地服务分别返回 404、延迟和超过 1 MiB 的响应，验证错误。
2. 在请求前取消 Context，确认调用及时结束。
3. 实现分页调用的最大页数与重复游标检测。

验收：所有调用有预算，错误状态可识别，输入与响应受控。参考：[net/http 文档](https://pkg.go.dev/net/http)。
