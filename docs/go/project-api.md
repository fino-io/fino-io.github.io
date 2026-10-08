---
title: 20 · 实战二：任务管理 API
description: Go 中文学习指南：实战二：任务管理 API，包含概念、示例、练习与验收。
pageClass: aip-article
---

# 20 · 实战二：任务管理 API

本章目标：实现一个具有清楚契约、并发保护与测试的任务 API，完整走通服务生命周期。

## 契约与学习范围

| 方法与路径 | 行为 |
| --- | --- |
| `GET /tasks?offset=0&limit=20` | 按 ID 升序分页，limit 为 1–100，返回 items、total。 |
| `POST /tasks` | 接收 title，创建未完成任务，返回 201 与 Location。 |
| `GET /tasks/{id}` | 返回任务或 404。 |
| `PUT /tasks/{id}` | 完整替换 title、done，两个字段都必须提供。 |
| `DELETE /tasks/{id}` | 删除已存在任务，返回 204，不存在返回 404。 |

title 去除两端空白后长度为 1–100 个 Unicode 码点；ID 必须为正整数；body 上限 64 KiB。POST/PUT 接受 application/json，拒绝未知字段、无效 JSON 和额外值。查询仅接受 offset 与 limit，各自最多出现一次。业务处理与参数校验错误为 `{"error":"说明"}`；未匹配路由与不支持的方法使用 ServeMux 的默认 404/405 响应。

**存储使用内存，重启即清空；本项目用于本地学习，未实现认证和生产持久化。** 通过一个 Mutex 保护状态，创建、更新与查询快照各在完整临界区中进行；网络响应在锁外编码。扩展 PostgreSQL 见 [15 · SQL](./databases)，交付要求见 [21 · 项目架构](./projects)。

## 创建项目

```sh
mkdir tasks
cd tasks
go mod init example.com/tasks
```

创建 `main.go`、`main_test.go`，直接复用标准库，无额外安装步骤。

## main.go

```go
package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"mime"
	"net/http"
	"net/url"
	"os"
	"os/signal"
	"slices"
	"strconv"
	"strings"
	"sync"
	"syscall"
	"time"
	"unicode/utf8"
)

type Task struct {
	ID    int    `json:"id"`
	Title string `json:"title"`
	Done  bool   `json:"done"`
}

type API struct {
	mu     sync.Mutex
	nextID int
	tasks  map[int]Task
}

func newAPI() *API { return &API{nextID: 1, tasks: make(map[int]Task)} }

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(value); err != nil {
		log.Printf("响应写入失败: %v", err)
	}
}

func fail(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}

func decodeBody(w http.ResponseWriter, r *http.Request, value any) bool {
	mediaType, _, err := mime.ParseMediaType(r.Header.Get("Content-Type"))
	if err != nil || mediaType != "application/json" {
		fail(w, http.StatusUnsupportedMediaType, "Content-Type 必须为 application/json")
		return false
	}
	r.Body = http.MaxBytesReader(w, r.Body, 64<<10)
	defer r.Body.Close()
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()
	err = dec.Decode(value)
	if err == nil {
		var extra any
		err = dec.Decode(&extra)
		if err == io.EOF {
			return true
		}
	}
	var tooLarge *http.MaxBytesError
	if errors.As(err, &tooLarge) {
		fail(w, http.StatusRequestEntityTooLarge, "请求体超过 64 KiB")
	} else {
		fail(w, http.StatusBadRequest, "请求必须是一个字段合法的 JSON 对象")
	}
	return false
}

func cleanTitle(raw string) (string, bool) {
	title := strings.TrimSpace(raw)
	length := utf8.RuneCountInString(title)
	return title, length >= 1 && length <= 100
}

func taskID(w http.ResponseWriter, r *http.Request) (int, bool) {
	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil || id <= 0 {
		fail(w, http.StatusBadRequest, "id 必须为正整数")
		return 0, false
	}
	return id, true
}

func pagination(r *http.Request) (int, int, error) {
	query, err := url.ParseQuery(r.URL.RawQuery)
	if err != nil {
		return 0, 0, err
	}
	offset, limit := 0, 20
	for key, values := range query {
		if (key != "offset" && key != "limit") || len(values) != 1 {
			return 0, 0, fmt.Errorf("未知或重复的分页参数")
		}
		value, err := strconv.Atoi(values[0])
		if err != nil {
			return 0, 0, fmt.Errorf("分页参数必须为整数")
		}
		if key == "offset" {
			offset = value
		} else {
			limit = value
		}
	}
	if offset < 0 || limit < 1 || limit > 100 {
		return 0, 0, fmt.Errorf("offset 必须非负，limit 必须为 1–100")
	}
	return offset, limit, nil
}

func (a *API) list(w http.ResponseWriter, r *http.Request) {
	offset, limit, err := pagination(r)
	if err != nil {
		fail(w, 400, err.Error())
		return
	}
	a.mu.Lock()
	items := make([]Task, 0, len(a.tasks))
	for _, task := range a.tasks {
		items = append(items, task)
	}
	a.mu.Unlock()
	slices.SortFunc(items, func(x, y Task) int {
		if x.ID < y.ID {
			return -1
		}
		if x.ID > y.ID {
			return 1
		}
		return 0
	})
	total := len(items)
	start := min(offset, total)
	end := start + min(limit, total-start)
	writeJSON(w, 200, struct {
		Items []Task `json:"items"`
		Total int    `json:"total"`
	}{items[start:end], total})
}

func (a *API) create(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Title string `json:"title"`
	}
	if !decodeBody(w, r, &input) {
		return
	}
	title, valid := cleanTitle(input.Title)
	if !valid {
		fail(w, 400, "title 必须为 1–100 个码点")
		return
	}
	a.mu.Lock()
	task := Task{ID: a.nextID, Title: title}
	a.nextID++
	a.tasks[task.ID] = task
	a.mu.Unlock()
	w.Header().Set("Location", fmt.Sprintf("/tasks/%d", task.ID))
	writeJSON(w, 201, task)
}

func (a *API) get(w http.ResponseWriter, r *http.Request) {
	id, ok := taskID(w, r)
	if !ok {
		return
	}
	a.mu.Lock()
	task, exists := a.tasks[id]
	a.mu.Unlock()
	if !exists {
		fail(w, 404, "任务不存在")
		return
	}
	writeJSON(w, 200, task)
}

func (a *API) replace(w http.ResponseWriter, r *http.Request) {
	id, ok := taskID(w, r)
	if !ok {
		return
	}
	var input struct {
		Title *string `json:"title"`
		Done  *bool   `json:"done"`
	}
	if !decodeBody(w, r, &input) {
		return
	}
	if input.Title == nil || input.Done == nil {
		fail(w, 400, "PUT 必须提供非 null 的 title 与 done")
		return
	}
	title, valid := cleanTitle(*input.Title)
	if !valid {
		fail(w, 400, "title 必须为 1–100 个码点")
		return
	}
	a.mu.Lock()
	_, exists := a.tasks[id]
	task := Task{ID: id, Title: title, Done: *input.Done}
	if exists {
		a.tasks[id] = task
	}
	a.mu.Unlock()
	if !exists {
		fail(w, 404, "任务不存在")
		return
	}
	writeJSON(w, 200, task)
}

func (a *API) delete(w http.ResponseWriter, r *http.Request) {
	id, ok := taskID(w, r)
	if !ok {
		return
	}
	a.mu.Lock()
	_, exists := a.tasks[id]
	delete(a.tasks, id)
	a.mu.Unlock()
	if !exists {
		fail(w, 404, "任务不存在")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (a *API) routes() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /tasks", a.list)
	mux.HandleFunc("POST /tasks", a.create)
	mux.HandleFunc("GET /tasks/{id}", a.get)
	mux.HandleFunc("PUT /tasks/{id}", a.replace)
	mux.HandleFunc("DELETE /tasks/{id}", a.delete)
	return mux
}

func serve() error {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	server := &http.Server{
		Addr: "127.0.0.1:8080", Handler: newAPI().routes(),
		ReadHeaderTimeout: 5 * time.Second, ReadTimeout: 10 * time.Second,
		WriteTimeout: 10 * time.Second, IdleTimeout: 60 * time.Second,
	}
	failures := make(chan error, 1)
	go func() { failures <- server.ListenAndServe() }()
	log.Print("任务 API: http://127.0.0.1:8080")
	select {
	case err := <-failures:
		if errors.Is(err, http.ErrServerClosed) {
			return nil
		}
		return err
	case <-ctx.Done():
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		if err := server.Shutdown(shutdownCtx); err != nil {
			_ = server.Close()
			return err
		}
		return nil
	}
}

func main() {
	if err := serve(); err != nil {
		log.Print(err)
		os.Exit(1)
	}
}
```

## main_test.go

```go
package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
)

func request(h http.Handler, method, path, body string) *httptest.ResponseRecorder {
	r := httptest.NewRequest(method, path, strings.NewReader(body))
	if body != "" {
		r.Header.Set("Content-Type", "application/json")
	}
	w := httptest.NewRecorder()
	h.ServeHTTP(w, r)
	return w
}

func TestLifecycle(t *testing.T) {
	h := newAPI().routes()
	created := request(h, "POST", "/tasks", `{"title":"  学习 Go  "}`)
	if created.Code != 201 || created.Header().Get("Location") != "/tasks/1" {
		t.Fatalf("创建失败: %d %s", created.Code, created.Body.String())
	}
	var task Task
	if err := json.Unmarshal(created.Body.Bytes(), &task); err != nil {
		t.Fatal(err)
	}
	if task.Title != "学习 Go" || task.Done {
		t.Fatalf("任务错误: %+v", task)
	}
	updated := request(h, "PUT", "/tasks/1", `{"title":"完成练习","done":true}`)
	if updated.Code != 200 {
		t.Fatalf("更新失败: %s", updated.Body.String())
	}
	read := request(h, "GET", "/tasks/1", "")
	if err := json.Unmarshal(read.Body.Bytes(), &task); err != nil {
		t.Fatal(err)
	}
	if read.Code != 200 || !task.Done {
		t.Fatalf("更新未生效: %+v", task)
	}
	deleted := request(h, "DELETE", "/tasks/1", "")
	if deleted.Code != 204 || deleted.Body.Len() != 0 {
		t.Fatal("删除响应不符合约定")
	}
	if got := request(h, "GET", "/tasks/1", "").Code; got != 404 {
		t.Fatalf("删除后状态 %d", got)
	}
}

func TestInvalidRequests(t *testing.T) {
	h := newAPI().routes()
	cases := []struct {
		name, method, path, body string
		want                     int
	}{
		{"空标题", "POST", "/tasks", `{"title":" "}`, 400},
		{"未知字段", "POST", "/tasks", `{"title":"Go","id":9}`, 400},
		{"额外 JSON", "POST", "/tasks", `{"title":"Go"} {}`, 400},
		{"坏 JSON", "POST", "/tasks", `{`, 400},
		{"无内容类型", "POST", "/tasks", "", 415},
		{"缺少 done", "PUT", "/tasks/1", `{"title":"Go"}`, 400},
		{"非法 ID", "GET", "/tasks/0", "", 400},
		{"不存在", "GET", "/tasks/999", "", 404},
		{"分页范围", "GET", "/tasks?limit=101", "", 400},
		{"分页数字", "GET", "/tasks?offset=x", "", 400},
		{"重复参数", "GET", "/tasks?limit=1&limit=2", "", 400},
		{"未知参数", "GET", "/tasks?unknown=1", "", 400},
		{"超大 body", "POST", "/tasks", `{"title":"` + strings.Repeat("x", 70<<10) + `"}`, 413},
		{"方法不支持", "PATCH", "/tasks/1", `{}`, 405},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := request(h, tc.method, tc.path, tc.body)
			if got.Code != tc.want {
				t.Fatalf("状态=%d，期望=%d，body=%s", got.Code, tc.want, got.Body.String())
			}
		})
	}
}

func TestConcurrentCreateAndPagination(t *testing.T) {
	h := newAPI().routes()
	var wg sync.WaitGroup
	for i := 0; i < 40; i++ {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			body := fmt.Sprintf(`{"title":"任务 %d"}`, i)
			if got := request(h, "POST", "/tasks", body).Code; got != 201 {
				t.Errorf("创建状态 %d", got)
			}
		}(i)
	}
	wg.Wait()
	w := request(h, "GET", "/tasks?offset=10&limit=5", "")
	var page struct {
		Items []Task `json:"items"`
		Total int    `json:"total"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &page); err != nil {
		t.Fatal(err)
	}
	if w.Code != 200 || page.Total != 40 || len(page.Items) != 5 {
		t.Fatalf("分页错误: %+v", page)
	}
	for i, task := range page.Items {
		if task.ID != 11+i {
			t.Fatalf("排序/ID 错误: %+v", page.Items)
		}
	}
	empty := request(h, "GET", "/tasks?offset=999", "")
	if !strings.Contains(empty.Body.String(), `"items":[]`) {
		t.Fatalf("空页应为数组: %s", empty.Body.String())
	}
}
```

## 运行与接口体验

```sh
go fmt ./...
go test -race ./...
go vet ./...
go run .
```

在另一个终端运行：

```sh
curl -i -X POST http://127.0.0.1:8080/tasks -H 'Content-Type: application/json' -d '{"title":"学习 Go"}'
curl -i 'http://127.0.0.1:8080/tasks?offset=0&limit=20'
curl -i -X PUT http://127.0.0.1:8080/tasks/1 -H 'Content-Type: application/json' -d '{"title":"学习 Go","done":true}'
curl -i -X DELETE http://127.0.0.1:8080/tasks/1
```

预期创建返回 201，正文 `{"id":1,"title":"学习 Go","done":false}`；更新返回 done=true；删除返回 204 且无正文。Windows PowerShell 可以使用 `curl.exe`，注意按 shell 规则处理 JSON 引号。按 Ctrl+C 触发最多 5 秒的优雅关闭。

## 为什么这样组织

一个小项目保留 main 包便于通读，HTTP 解码、分页和状态操作都有明确函数，不预先建立多层 Service/Repository 框架。数据使用值复制后离开锁，不将可修改的 map 暴露给调用方。分页先排序再切片，offset 超出范围返回空数组，并避免 offset+limit 整数溢出。

PUT 使用指针字段区分“不提供”和“显式 false”。标题长度按码点而非字节计算；不代表按完整字形计数。标准 encoding/json 不禁止重复键，生产协议如有此要求需额外处理。ID 使用 int 适合这个内存练习，持久化模型再按协议选用固定宽度 ID。

## 进阶练习与验收

1. 加入 100 码点标题边界、错误 Content-Type、DELETE 不存在与坏查询转义的测试。
2. 接入 PostgreSQL，使用迁移与数据库集成测试，重启后数据仍在。
3. 设计版本字段解决并发更新覆盖，明确 409 冲突与重试策略。
4. 使用成熟认证方案加入用户身份，验证每个任务的归属权限。

验收：CRUD、排序分页、错误输入与并发创建均通过测试；能解释重启清空的限制，且生产扩展没有破坏接口契约。
