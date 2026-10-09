---
title: 8.2. Benchmark 与分配实验
description: 可信计时、输入规模、分配统计与结果比较。
pageClass: aip-article go-course
---

# 8.2. Benchmark 与分配实验

先修建议：[表驱动、替身与 HTTP 测试](./testing)、[数组、切片、容量与共享存储](./collections)。

Benchmark 要回答一个具体性能问题：在固定输入规模下，某个操作耗时、分配和吞吐如何变化。先验证行为，再比较成本。

## 先确定比较问题，再读三个指标 {#concept-1}

两份实现必须完成同一个任务，才能比较运行成本。本例把若干文本片段拼成同一结果，先验证结果相等，再用不同输入规模看成本变化。

| 指标 | 含义 | 不代表什么 |
| --- | --- | --- |
| ns/op | 一次操作平均耗时 | 不自动等于线上请求尾延迟。 |
| B/op | 每操作平均分配字节 | 不等于进程全部常驻内存。 |
| allocs/op | 每操作平均分配次数 | 不说明每个对象大小与存活寿命。 |

准备数据、日志和外部网络可能淹没要比较的操作。把它们排除或明确纳入测量目标，多次运行并记录工具链和机器，再解释变化；教材不预填一个脱离环境的“更快百分比”。

## 同一任务、两种实现 {#concept-2}

独立模块保存为 `join_test.go`：

```go
package join

import (
	"fmt"
	"strings"
	"testing"
)

var sink string

func concat(parts []string) string {
	result := ""
	for _, part := range parts {
		result += part
	}
	return result
}

func TestJoinEquivalent(t *testing.T) {
	for _, parts := range [][]string{nil, {"Go"}, {"Go", "语言"}} {
		if got, want := concat(parts), strings.Join(parts, ""); got != want {
			t.Fatalf("got=%q want=%q", got, want)
		}
	}
}

func BenchmarkJoin(b *testing.B) {
	for _, size := range []int{10, 100, 1000} {
		parts := make([]string, size)
		for i := range parts {
			parts[i] = "Go学习"
		}
		b.Run(fmt.Sprintf("concat/%d", size), func(b *testing.B) {
			b.ReportAllocs()
			for i := 0; i < b.N; i++ {
				sink = concat(parts)
			}
		})
		b.Run(fmt.Sprintf("join/%d", size), func(b *testing.B) {
			b.ReportAllocs()
			for i := 0; i < b.N; i++ {
				sink = strings.Join(parts, "")
			}
		})
	}
}
```

```sh
go test .
go test -run '^$' -bench BenchmarkJoin -benchmem -count=5 .
```

准备数据位于各子基准计时之外，sink 防止结果成为无用计算。报告 ns/op、B/op 与 allocs/op，但不在教材中伪造某台机器的固定数值。预期随着 size 增大，反复拼接产生更多中间字符串，而 Join 通常更有效；用实际输出确认趋势。

## 如何解释复杂度 {#concept-3}

concat 每轮复制已有结果，等长片段下总复制量近似 1+2+…+n，是 O(n²) 字节工作；Join 可先计算长度再组织输出，整体更接近输入总字节数。输入规模从 10 到 1000 比只在三元素上测一次更能说明差别。

`b.ResetTimer()` 用于手动排除初始化，`b.StopTimer/StartTimer` 可排除必要准备，但大量暂停会增加复杂度。计时路径不调用日志、网络和随机不稳定服务，除非它们正是要测的系统部分。并行基准使用 RunParallel 时注意 sink 的共享竞争，改为每 worker 局部结果或明确同步。

## 看一组真实测量 {#measurements}

下图来自本节代码的实际运行：Go 1.25.9、darwin/amd64，同一组输入按 10、100、1000 片段分别运行五次，图中取中位数。横纵轴均采用对数刻度，等距离表示相同倍数变化，而非相同绝对差值。

![同一拼接任务的耗时与分配随输入规模变化](/go/figures/join-benchmark.svg)

| 输入片段 | 循环拼接 ns/op | Join ns/op | 循环分配 B/op | Join 分配 B/op |
| --- | --- | --- | --- | --- |
| 10 | 355.7 | 104.3 | 456 | 80 |
| 100 | 9,447.0 | 843.3 | 42,216 | 896 |
| 1000 | 694,126.0 | 8,127.0 | 4,273,924 | 8,192 |

循环拼接反复复制已积累的内容，规模越大，中间复制与分配增长越明显；Join 组织完整结果时减少了这些中间对象。本机观察支持本节的复杂度解释，但不是所有平台固定的耗时承诺。其他负载、工具链或机器应自行重测。

可下载[完整运行数据](/go/data/join-benchmark.json)、[原始输出](/go/data/join-benchmark.txt)和[图表 SVG](/go/figures/join-benchmark.svg)。数据保留命令、工具链、CPU、代码校验与每次结果，便于检查图表对应哪次实验。

## 可复现比较 {#concept-4}

```sh
go test -run '^$' -bench . -benchmem -count=10 . > before.txt
# 4.4. 修改实现后，在同一工具链、机器和负载条件下运行：
go test -run '^$' -bench . -benchmem -count=10 . > after.txt
```

用 [benchstat](https://pkg.go.dev/golang.org/x/perf/cmd/benchstat)分析多次结果，工具版本记录在项目清单。避免 CPU 频率、后台任务与温度造成误判；微基准收益还要通过服务真实请求验证，局部快并不代表尾延迟下降。

CPU/heap profile 可在基准上采样，具体读法见 [性能诊断](./performance)。本章使用 Go 1.22 兼容的 b.N 循环；较新版本的 B.Loop 要按版本使用，不能把新写法直接复制进旧基线。

## 学习实验与判定 {#lab}

1. 下载 [规模数据](/go/data/benchmark-sizes.json)，至少测试三种规模并重复运行。
2. 加一个 strings.Builder 实现，先通过等价测试再加入比较。
3. 为报告写明 Go 版本、CPU、输入字节量、重复次数与误差，解释 ns/op 和 allocs/op。

通过标准：输入与计时路径明确，结果有多次测量，任何“更快”结论有原始数据。参考：[testing Benchmark](https://pkg.go.dev/testing#hdr-Benchmarks)。
