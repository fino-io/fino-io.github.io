---
title: 认证
description: 'gRPC 认证概述，包括内置认证机制以及如何插入您自己的认证系统。'
source_url: https://grpc.io/docs/guides/auth/
---

### 概述

gRPC 旨在与各种认证机制配合使用，从而可以轻松安全地使用 gRPC 与其他系统进行通信。您可以使用我们支持的机制 - 带或不带基于 Google 令牌的认证的 SSL/TLS - 或者您可以通过扩展我们提供的代码来插入您自己的认证系统。

gRPC 还提供了一个简单的认证 API，可让您在创建通道或进行调用时以 `Credentials` 形式提供所有必要的认证信息。

### 支持的认证机制

gRPC 内置了以下认证机制：

- **SSL/TLS**：gRPC 具有 SSL/TLS 集成并推广 SSL/TLS 的使用
对服务端进行认证，并对客户端和服务端之间交换的所有数据进行加密。客户端可以使用可选机制来提供相互认证的证书。
- **ALTS**：gRPC 支持
如果应用程序在 [Compute Engine](https://cloud.google.com/compute) 或 [Google Kubernetes Engine (GKE)](https://cloud.google.com/kubernetes-engine) 上运行，则 [ALTS](https://cloud.google.com/security/encryption-in-transit/application-layer-transport-security) 作为传输安全机制。有关详细信息，请参阅对应语言的 [ALTS 官方文档](https://cloud.google.com/security/encryption-in-transit/application-layer-transport-security)。
- **与 Google 进行基于令牌的认证**：gRPC 提供了通用的
将基于元数据的凭据附加到请求和响应的机制（如下所述）。某些认证流程还提供了在通过 gRPC 访问 Google API 时获取访问令牌（通常是 OAuth2 令牌）的额外支持：您可以在下面的代码示例中了解其工作原理。一般来说，必须在通道上使用此机制*以及*SSL/TLS - Google 不会允许没有 SSL/TLS 的连接，并且大多数 gRPC 语言实现不会让您在未加密的通道上发送凭据。
Google 凭据只能用于连接到 Google 服务。将 Google 颁发的 OAuth2 令牌发送到非 Google 服务可能会导致该令牌被盗并用于冒充 Google 服务的客户端。
### 认证 API

gRPC 围绕 Credentials 对象的统一概念提供了一个简单的认证 API，可在创建整个 gRPC 通道或单个调用时使用。

#### 凭证类型

凭证可以有两种类型：

- **通道凭证**，附加到 `Channel`，例如 SSL
证书。
- **调用凭证**，附加到调用（或 `ClientContext`
C++）。

您还可以将这些组合在 `CompositeChannelCredentials` 中，从而允许您指定通道的 SSL 详细信息以及通道上每次调用的调用凭据等。 `CompositeChannelCredentials` 将 `ChannelCredentials` 和 `CallCredentials` 关联以创建新的 `ChannelCredentials`。结果将在通道上进行的每次调用中发送与组合的 `CallCredentials` 关联的认证数据。

例如，您可以从 `SslCredentials` 和 `AccessTokenCredentials` 创建 `ChannelCredentials`。当应用于 `Channel` 时，结果将为该通道上的每个调用发送适当的访问令牌。

单个 `CallCredentials` 也可以使用 `CompositeCallCredentials` 组成。生成的 `CallCredentials` 在调用中使用时将触发发送与两个 `CallCredentials` 关联的认证数据。


#### 使用客户端 SSL/TLS

现在让我们看看 `Credentials` 如何与我们支持的认证机制之一配合使用。这是最简单的认证场景，客户端只想对服务端进行认证并加密所有数据。该示例使用 C++ 编写，但所有语言的 API 都是相似的：您可以在下面的示例部分中了解如何在更多语言中启用 SSL/TLS。

```cpp
// Create a default SSL ChannelCredentials object.
auto channel_creds = grpc::SslCredentials(grpc::SslCredentialsOptions());
// Create a channel using the credentials created in the previous step.
auto channel = grpc::CreateChannel(server_name, channel_creds);
// Create a stub on the channel.
std::unique_ptr<Greeter::Stub> stub(Greeter::NewStub(channel));
// Make actual RPC calls on the stub.
grpc::Status s = stub->sayHello(&context, *request, response);
```

对于高级用例（例如修改根 CA 或使用客户端证书），可以在传递给工厂方法的 `SslCredentialsOptions` 参数中设置相应的选项。
非 POSIX 兼容系统（例如 Windows）需要在 `SslCredentialsOptions` 中指定根证书，因为默认值仅为 POSIX 文件系统配置。
#### 使用基于 OAuth 令牌的认证

OAuth 2.0 协议是用于授权的行业标准协议。它使网站或应用程序能够使用 OAuth 令牌获得对用户帐户的有限访问权限。

gRPC 提供了一组简单的 API，可将 OAuth 2.0 集成到应用程序中，从而简化认证。

概括地说，使用基于 OAuth 令牌的认证包括 3 个步骤：

1. 在客户端获取或生成 OAuth 令牌。
* 您可以按照以下说明生成 Google 特定的令牌。
2. 使用 OAuth 令牌创建凭据。
* OAuth 令牌始终是每次调用凭据的一部分，您也可以附加每次调用凭据
某些渠道凭证。
* 令牌将被发送到服务端，通常作为 HTTP 授权标头的一部分。
3. 服务端验证token。
* 在大多数实现中，验证是使用服务端拦截器完成的。

有关如何在不同语言中使用 OAuth 令牌的详细信息，请参阅下面的示例。

#### 使用基于 Google 令牌的认证

gRPC 应用程序可以使用简单的 API 创建一个凭证，用于在各种部署场景中通过 Google 进行认证。同样，我们的示例是用 C++ 编写的，但您可以在示例部分找到其他语言的示例。

```cpp
auto creds = grpc::GoogleDefaultCredentials();
// Create a channel, stub and make RPC calls (same as in the previous example)
auto channel = grpc::CreateChannel(server_name, creds);
std::unique_ptr<Greeter::Stub> stub(Greeter::NewStub(channel));
grpc::Status s = stub->sayHello(&context, *request, response);
```

此通道凭证对象适用于使用服务帐户的应用程序以及在 [Google 计算引擎 (GCE)](https://cloud.google.com/compute/) 中运行的应用程序。  在前一种情况下，服务帐户的私钥是从环境变量 `GOOGLE_APPLICATION_CREDENTIALS` 中命名的文件加载的。这些密钥用于生成承载令牌，这些令牌附加到相应通道上的每个传出 RPC。

对于在 GCE 中运行的应用程序，可以在 VM 设置期间配置默认服务帐户和相应的 OAuth2 范围。在运行时，此凭证处理与认证系统的通信，以获取 OAuth2 访问令牌，并将它们附加到相应通道上的每个传出 RPC。


#### 扩展 gRPC 以支持其他认证机制

凭证插件 API 允许开发人员插入自己类型的凭证。这包括：

- `MetadataCredentialsPlugin` 抽象类，其中包含纯虚拟
`GetMetadata` 需要由开发人员创建的子类实现的方法。
- `MetadataCredentialsFromPlugin` 函数，创建 `CallCredentials`
来自 `MetadataCredentialsPlugin`。

这是一个简单的凭据插件的示例，它在自定义标头中设置认证票证。

```cpp
class MyCustomAuthenticator : public grpc::MetadataCredentialsPlugin {
 public:
  MyCustomAuthenticator(const grpc::string& ticket) : ticket_(ticket) {}

  grpc::Status GetMetadata(
      grpc::string_ref service_url, grpc::string_ref method_name,
      const grpc::AuthContext& channel_auth_context,
      std::multimap<grpc::string, grpc::string>* metadata) override {
    metadata->insert(std::make_pair("x-custom-auth-ticket", ticket_));
    return grpc::Status::OK;
  }

 private:
  grpc::string ticket_;
};

auto call_creds = grpc::MetadataCredentialsFromPlugin(
    std::unique_ptr<grpc::MetadataCredentialsPlugin>(
        new MyCustomAuthenticator("super-secret-ticket")));
```

通过在核心级别插入 gRPC 凭证实现可以实现更深入的集成。 gRPC 内部结构还允许使用其他加密机制切换 SSL/TLS。

### 语言指南和示例

这些认证机制将在所有 gRPC 支持的语言中可用。下表链接到以各种语言演示认证和授权的示例。

|语言|例子|文档|
|----------|-------------------------------------------|------------------------|
|C++|不适用|不适用|
|Go|[Go 示例]|[Go 文档]|
|Java|[Java 示例 TLS] ([Java 示例 ATLS])|[Java 文档]|
|Python|[Python 示例]|[Python 文档]|


[Go Example]: https://github.com/grpc/grpc-go/tree/master/examples/features/encryption
[Go Documentation]: https://github.com/grpc/grpc-go/tree/master/examples/features/encryption#encryption
[Java Example TLS]: https://github.com/grpc/grpc-java/tree/master/examples/example-tls
[Java Example ATLS]: https://github.com/grpc/grpc-java/tree/master/examples/example-alts
[Java Documentation]: https://github.com/grpc/grpc-java/tree/master/examples/example-tls#hello-world-example-with-tls
[Python Example]: https://github.com/grpc/grpc/tree/master/examples/python/auth
[Python Documentation]: https://github.com/grpc/grpc/tree/master/examples/python/auth#authentication-extension-example-in-grpc-python

### 基于 OAuth 令牌的认证的语言指南和示例

下表链接到以各种语言演示基于 OAuth 令牌的认证和授权的示例。

|语言|例子|文档|
|----------|-------------------------------------------|-------------------------------|
|C++|不适用|不适用|
|Go|[转到 OAuth 示例]|[转到 OAuth 文档]|
|Java|[Java OAuth 示例]|[Java OAuth 文档]|
|Python|[Python OAuth 示例]|[Python OAuth 文档]|


[Go OAuth Example]: https://github.com/grpc/grpc-go/tree/master/examples/features/authentication#authentication
[Go OAuth Documentation]: https://github.com/grpc/grpc-go/tree/master/examples/features/authentication#oauth2
[Java OAuth Example]: https://github.com/grpc/grpc-java/tree/master/examples/example-oauth#authentication-example
[Java OAuth Documentation]: https://github.com/grpc/grpc-java/tree/master/examples/example-oauth
[Python OAuth Example]: https://github.com/grpc/grpc/blob/master/examples/python/auth/token_based_auth_client.py
[Python OAuth Documentation]: https://github.com/grpc/grpc/tree/master/examples/python/auth#token-based-authentication


### 其他示例

以下部分演示了上述认证和授权功能如何以上面未列出的其他语言显示。

#### 红宝石

##### 基本情况 - 没有加密或认证

```ruby

stub = Helloworld::Greeter::Stub.new('localhost:50051', :this_channel_is_insecure)
...
```

##### 使用服务端认证 SSL/TLS

```ruby
creds = GRPC::Core::ChannelCredentials.new(load_certs)  # load_certs typically loads a CA roots file
stub = Helloworld::Greeter::Stub.new('myservice.example.com', creds)
```

##### 使用 Google 进行认证

```ruby
require 'googleauth'  # from http://www.rubydoc.info/gems/googleauth/0.1.0
...
ssl_creds = GRPC::Core::ChannelCredentials.new(load_certs)  # load_certs typically loads a CA roots file
authentication = Google::Auth.get_application_default()
call_creds = GRPC::Core::CallCredentials.new(authentication.updater_proc)
combined_creds = ssl_creds.compose(call_creds)
stub = Helloworld::Greeter::Stub.new('greeter.googleapis.com', combined_creds)
```

#### Node.js

##### 基本情况 - 无加密/认证

```js
var stub = new helloworld.Greeter('localhost:50051', grpc.credentials.createInsecure());
```

##### 使用服务端认证 SSL/TLS

```js
const root_cert = fs.readFileSync('path/to/root-cert');
const ssl_creds = grpc.credentials.createSsl(root_cert);
const stub = new helloworld.Greeter('myservice.example.com', ssl_creds);
```

##### 使用 Google 进行认证

```js
// Authenticating with Google
var GoogleAuth = require('google-auth-library'); // from https://www.npmjs.com/package/google-auth-library
...
var ssl_creds = grpc.credentials.createSsl(root_certs);
(new GoogleAuth()).getApplicationDefault(function(err, auth) {
  var call_creds = grpc.credentials.createFromGoogleCredential(auth);
  var combined_creds = grpc.credentials.combineChannelCredentials(ssl_creds, call_creds);
  var stub = new helloworld.Greeter('greeter.googleapis.com', combined_credentials);
});
```

##### 使用 OAuth2 令牌向 Google 进行认证（传统方法）

```js
var GoogleAuth = require('google-auth-library'); // from https://www.npmjs.com/package/google-auth-library
...
var ssl_creds = grpc.Credentials.createSsl(root_certs); // load_certs typically loads a CA roots file
var scope = 'https://www.googleapis.com/auth/grpc-testing';
(new GoogleAuth()).getApplicationDefault(function(err, auth) {
  if (auth.createScopeRequired()) {
    auth = auth.createScoped(scope);
  }
  var call_creds = grpc.credentials.createFromGoogleCredential(auth);
  var combined_creds = grpc.credentials.combineChannelCredentials(ssl_creds, call_creds);
  var stub = new helloworld.Greeter('greeter.googleapis.com', combined_credentials);
});
```

##### 使用服务端认证 SSL/TLS 和带有令牌的自定义标头

```js
const rootCert = fs.readFileSync('path/to/root-cert');
const channelCreds = grpc.credentials.createSsl(rootCert);
const metaCallback = (_params, callback) => {
    const meta = new grpc.Metadata();
    meta.add('custom-auth-header', 'token');
    callback(null, meta);
}
const callCreds = grpc.credentials.createFromMetadataGenerator(metaCallback);
const combCreds = grpc.credentials.combineChannelCredentials(channelCreds, callCreds);
const stub = new helloworld.Greeter('myservice.example.com', combCreds);
```

#### PHP

##### 基本情况 - 无加密/授权

```php
$client = new helloworld\GreeterClient('localhost:50051', [
    'credentials' => Grpc\ChannelCredentials::createInsecure(),
]);
```

##### 使用服务端认证 SSL/TLS

```php
$client = new helloworld\GreeterClient('myservice.example.com', [
    'credentials' => Grpc\ChannelCredentials::createSsl(file_get_contents('roots.pem')),
]);
```

##### 使用 Google 进行认证

```php
function updateAuthMetadataCallback($context)
{
    $auth_credentials = ApplicationDefaultCredentials::getCredentials();
    return $auth_credentials->updateMetadata($metadata = [], $context->service_url);
}
$channel_credentials = Grpc\ChannelCredentials::createComposite(
    Grpc\ChannelCredentials::createSsl(file_get_contents('roots.pem')),
    Grpc\CallCredentials::createFromPlugin('updateAuthMetadataCallback')
);
$opts = [
  'credentials' => $channel_credentials
];
$client = new helloworld\GreeterClient('greeter.googleapis.com', $opts);
```

##### 使用 OAuth2 令牌向 Google 进行认证（传统方法）

```php
// the environment variable "GOOGLE_APPLICATION_CREDENTIALS" needs to be set
$scope = "https://www.googleapis.com/auth/grpc-testing";
$auth = Google\Auth\ApplicationDefaultCredentials::getCredentials($scope);
$opts = [
  'credentials' => Grpc\Credentials::createSsl(file_get_contents('roots.pem'));
  'update_metadata' => $auth->getUpdateMetadataFunc(),
];
$client = new helloworld\GreeterClient('greeter.googleapis.com', $opts);
```

#### 飞镖

##### 基本情况 - 没有加密或认证

```dart
final channel = new ClientChannel('localhost',
      port: 50051,
      options: const ChannelOptions(
          credentials: const ChannelCredentials.insecure()));
final stub = new GreeterClient(channel);
```

##### 使用服务端认证 SSL/TLS

```dart
// Load a custom roots file.
final trustedRoot = new File('roots.pem').readAsBytesSync();
final channelCredentials =
    new ChannelCredentials.secure(certificates: trustedRoot);
final channelOptions = new ChannelOptions(credentials: channelCredentials);
final channel = new ClientChannel('myservice.example.com',
    options: channelOptions);
final client = new GreeterClient(channel);
```

##### 使用 Google 进行认证

```dart
// Uses publicly trusted roots by default.
final channel = new ClientChannel('greeter.googleapis.com');
final serviceAccountJson =
     new File('service-account.json').readAsStringSync();
final credentials = new JwtServiceAccountAuthenticator(serviceAccountJson);
final client =
    new GreeterClient(channel, options: credentials.toCallOptions);
```

##### 验证单个 RPC 调用

```dart
// Uses publicly trusted roots by default.
final channel = new ClientChannel('greeter.googleapis.com');
final client = new GreeterClient(channel);
...
final serviceAccountJson =
     new File('service-account.json').readAsStringSync();
final credentials = new JwtServiceAccountAuthenticator(serviceAccountJson);
final response =
    await client.sayHello(request, options: credentials.toCallOptions);
```
