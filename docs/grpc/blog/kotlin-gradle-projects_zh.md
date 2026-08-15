---
title: gRPC ❤ Kotlin
date: 2018-06-19
author:
  name: Spencer Fang
  link: https://github.com/zpencer
  company: Google
source_url: https://grpc.io/blog/kotlin-gradle-projects/
---

您是否知道 gRPC Java 现在对使用 Gradle 构建的 Kotlin 项目提供开箱即用的支持？ [Kotlin](https://kotlinlang.org/) 是由 JetBrains 开发的一种现代静态类型语言，面向 JVM 和 Android。 Kotlin 程序通常很容易与现有 Java 库进行互操作。为了进一步改善这种体验，我们添加了对 [protobuf-gradle-plugin](https://github.com/google/protobuf-gradle-plugin/releases) 的支持，以便 Kotlin 自动获取生成的 Java 库。现在，您可以将 protobuf-gradle-plugin 添加到您的 Kotlin 项目中，并像使用典型的 Java 项目一样使用 gRPC。
正在寻找 gRPC 的原生 Kotlin 支持？请参阅 [Kotlin，遇见 gRPC](/grpc/blog/kotlin-meet-grpc_zh)。
以下示例向您展示如何使用 Kotlin 为 JVM 应用程序和 Android 应用程序配置项目。

### Kotlin gRPC 客户端和服务端

完整的示例可以在[此处](https://github.com/grpc/grpc-java/tree/v1.29.0/examples/example-kotlin)找到。

为 Kotlin 项目配置 gRPC 与为 Java 项目配置 gRPC 相同。

以下是示例项目的 `build.gradle` 的片段，突出显示了一些与 Kotlin 相关的部分：

```groovy
apply plugin: 'kotlin'
apply plugin: 'com.google.protobuf'

// Generate IntelliJ IDEA's .idea & .iml project files.
// protobuf-gradle-plugin automatically registers *.proto and the gen output files
// to IntelliJ as sources.
// For best results, install the Protobuf and Kotlin plugins for IntelliJ.
apply plugin: 'idea'

buildscript {
  ext.kotlin_version = '1.2.21'

  repositories {
    mavenCentral()
  }
  dependencies {
    classpath 'com.google.protobuf:protobuf-gradle-plugin:0.8.5'
    classpath "org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlin_version"
  }
}

dependencies {
  compile "org.jetbrains.kotlin:kotlin-stdlib-jdk8:$kotlin_version"
  // The rest of the projects dep are added below, refer to example URL
}

// The standard protobuf block, same as normal gRPC Java projects
protobuf {
  protoc { artifact = 'com.google.protobuf:protoc:3.5.1-1' }
    plugins {
      grpc { artifact = "io.grpc:protoc-gen-grpc-java:${grpcVersion}" }
    }
    generateProtoTasks {
      all()*.plugins { grpc {} }
    }
}
```

现在，Kotlin 源文件可以使用 proto 生成的消息和 gRPC 存根。默认情况下，Kotlin 源代码应放置在 `src/main/kotlin` 和 `src/test/kotlin` 中。如果需要，运行 `./gradlew generateProto generateTestProto` 并刷新 IntelliJ 以使生成的源出现在 IDE 中。最后，运行 `./gradlew installDist` 构建项目，并使用 `./build/install/examples/bin/hello-world-client` 或 `./build/install/examples/bin/hello-world-server` 运行示例。

您可以在[此处](https://kotlinlang.org/docs/reference/using-gradle.html) 阅读有关配置 Kotlin 的更多信息。

### Kotlin Android gRPC 应用程序

完整的示例可以在[此处](https://github.com/grpc/grpc-java/tree/v1.29.0/examples/example-kotlin/android/helloworld)找到。

为 Kotlin Android 项目配置 gRPC 与为普通 Android 项目配置相同。

在顶层 `build.gradle` 文件中：

```groovy
buildscript {
  ext.kotlin_version = '1.2.21'

  repositories {
    google()
    jcenter()
  }
  dependencies {
    classpath 'com.android.tools.build:gradle:3.0.1'
    classpath "com.google.protobuf:protobuf-gradle-plugin:0.8.5"
    classpath "org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlin_version"
  }
}

allprojects {
  repositories {
    google()
    jcenter()
  }
}
```

在应用程序模块的 `build.gradle` 文件中：

```groovy
apply plugin: 'com.android.application'
apply plugin: 'kotlin-android'
apply plugin: 'kotlin-android-extensions'
apply plugin: 'com.google.protobuf'

repositories {
  mavenCentral()
}

dependencies {
  compile "org.jetbrains.kotlin:kotlin-stdlib-jdk7:$kotlin_version"
  // refer to full example for remaining deps
}

protobuf {
  // The normal gRPC configuration for Android goes here
}

android {
  // Android Studio 3.1 does not automatically pick up 'src/main/kotlin' as source files
  sourceSets {
    main.java.srcDirs += 'src/main/kotlin'
  }
}
```

就像非 Android 项目一样，运行 `./gradlew generateProto generateProto` 来运行原始代码生成器，运行 `./gradlew build` 来构建项目。

最后，通过在 Android Studio 中打开项目并选择 `Run > Run 'app'` 来测试 Android 应用程序。

![Kotlin Android 应用示例](https://grpc.io/img/kotlin-project-android-app.png)

我们很高兴能够改善 Kotlin 开发人员的 gRPC 体验。请将增强想法或错误添加到 [protobuf-gradle-plugin 问题跟踪器](https://github.com/google/protobuf-gradle-plugin/issues) 或 [grpc-java 问题跟踪器](https://github.com/grpc/grpc-java/issues)。
