---
title: gRPC-Web 中的拦截器
date: 2020-06-18
spelling: cSpell:ignore creds Jiang Zhenli
author: { name: Zhenli Jiang, position: Google }
source_url: https://grpc.io/blog/grpc-web-interceptor/
---

我们很高兴地宣布，自版本 [1.1.0][] 起，[gRPC-web][] 支持_interceptors_。虽然当前的设计基于其他 [gRPC 语言][] 提供的 gRPC 客户端拦截器，但它还包括 gRPC-web 特定功能，这些功能应该使拦截器易于与现代 Web 框架一起采用和使用。

## 介绍

与其他 gRPC 语言类似，gRPC-web 支持 _unary_ 和 server-_streaming_ 拦截器。对于每种拦截器，我们[定义了一个接口][interceptor.js]，其中包含一个 `intercept()` 方法：

- `UnaryInterceptor`
- `StreamInterceptor`

这是 `UnaryInterceptor` 接口的声明方式：

```js
/*
* @interface
*/
const UnaryInterceptor = function() {};

/**
 * @template REQUEST, RESPONSE
 * @param {!Request<REQUEST, RESPONSE>} request
 * @param {function(!Request<REQUEST,RESPONSE>):!Promise<!UnaryResponse<RESPONSE>>}
 *     invoker
 * @return {!Promise<!UnaryResponse<RESPONSE>>}
 */
UnaryInterceptor.prototype.intercept = function(request, invoker) {};
```

`intercept()` 方法采用两个参数：

- [grpc.web.Request][] 类型的 `request`
- `invoker`，在调用时执行实际的 RPC

`StreamInterceptor` 接口声明类似，只是 `invoker` 返回类型是 `ClientReadableStream` 而不是 `Promise`。有关实现细节，请参阅[interceptor.js][]。
`StreamInterceptor` 可以应用于具有 `ClientReadableStream` 返回类型的任何 RPC，无论它是一元 RPC 还是服务端流 RPC。
## 我可以用拦截器做什么？

拦截器允许您执行以下操作：

- 在传递原始 gRPC 请求之前更新它 — 用于
例如，您可以注入额外的信息，例如认证标头
- 操纵原始调用者函数的行为，例如绕过
调用，以便您可以使用缓存的结果
- 在返回给客户端之前更新响应

接下来您将看到一些示例。

## 一元拦截器示例

下面给出的代码说明了一个一元拦截器，它执行以下操作：

- 它在 RPC 之前将一个字符串添加到 gRPC 请求消息中。
- 它在收到 gRPC 响应消息后在其前面添加一个字符串。

这个简单的一元拦截器被定义为实现 `UnaryInterceptor` 接口的类：

```js
/**
 * @constructor
 * @implements {UnaryInterceptor}
 */
const SimpleUnaryInterceptor = function() {};

/** @override */
SimpleUnaryInterceptor.prototype.intercept = function(request, invoker) {
  // Update the request message before the RPC.
  const reqMsg = request.getRequestMessage();
  reqMsg.setMessage('[Intercept request]' + reqMsg.getMessage());

  // After the RPC returns successfully, update the response.
  return invoker(request).then((response) => {
    // You can also do something with response metadata here.
    console.log(response.getMetadata());

    // Update the response message.
    const responseMsg = response.getResponseMessage();
    responseMsg.setMessage('[Intercept response]' + responseMsg.getMessage());

    return response;
  });
};
```

## 流拦截器示例

使用 `StreamInterceptor` 拦截来自 `ClientReadableStream` 的服务端流式响应需要更加小心。以下是要遵循的主要步骤：

1、创建一个`ClientReadableStream`-包装类，并用它来拦截
流事件，例如接收服务端响应。
2. 创建一个实现 `StreamInterceptor` 并使用流的类
包装纸。

以下示例流包装类拦截响应并在响应消息前添加一个字符串：

```js
/**
 * A ClientReadableStream wrapper.
 *
 * @template RESPONSE
 * @implements {ClientReadableStream}
 * @constructor
 * @param {!ClientReadableStream<RESPONSE>} stream
 */
const InterceptedStream = function(stream) {
  this.stream = stream;
};

/** @override */
InterceptedStream.prototype.on = function(eventType, callback) {
  if (eventType == 'data') {
    const newCallback = (response) => {
      // Update the response message.
      const msg = response.getMessage();
      response.setMessage('[Intercept response]' + msg);
      // Pass along the updated response.
      callback(response);
    };
    // Register the new callback.
    this.stream.on(eventType, newCallback);
  } else {
    // You can also override 'status', 'end', and 'error' eventTypes.
    this.stream.on(eventType, callback);
  }
  return this;
};

/** @override */
InterceptedStream.prototype.cancel = function() {
  this.stream.cancel();
  return this;
};
```

示例拦截器的 `intercept()` 方法返回一个包装流：

```js
/**
 * @constructor
 * @implements {StreamInterceptor}
 */
const TestStreamInterceptor = function() {};

/** @override */
TestStreamInterceptor.prototype.intercept = function(request, invoker) {
  return new InterceptedStream(invoker(request));
};
```

## 绑定拦截器

通过使用适当的选项键传递拦截器实例数组，您可以在实例化客户端时将拦截器绑定到客户端：

```js
const promiseClient = new MyServicePromiseClient(
    host, creds, {'unaryInterceptors': [interceptor1, interceptor2, interceptor3]});

const client = new MyServiceClient(
    host, creds, {'streamInterceptors': [interceptor1, interceptor2, interceptor3]});
```
拦截器以相反的顺序执行请求处理，并按照响应处理的顺序执行，如下所示： ![拦截器处理顺序](https://grpc.io/img/grpc-web-interceptors.png)
## 反馈

发现 `grpc-web` 存在问题或需要某个功能？通过 [grpc-web][] 存储库提交 [问题][]。如果您有一般性问题或意见，请考虑发布到 [gRPC 邮件列表][] 或向我们发送电子邮件 [grpc-web-team@google.com][]。

[1.1.0]: https://github.com/grpc/grpc-web/releases/tag/1.1.0
[gRPC 语言]：https://grpc.io/docs/languages/
[gRPC mailing list]: https://groups.google.com/g/grpc-io
[grpc-web-team@google.com]：mailto：grpc-web-team@google.com
[grpc-web]: https://github.com/grpc/grpc-web
[grpc.web.Request]: https://github.com/grpc/grpc-web/blob/master/javascript/net/grpc/web/request.js
[interceptor.js]: https://github.com/grpc/grpc-web/blob/master/javascript/net/grpc/web/interceptor.js
[issue]: https://github.com/grpc/grpc-web/issues/new
