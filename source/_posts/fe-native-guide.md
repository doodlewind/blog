categories: Note

tags:

- Pattern

date: 2018-02-26

toc: true

title: 面向 Web 前端的原生语言总结手册
---

这一系列文章旨在让具有 Web 前端背景的开发者快速上手原生语言。

<!--more-->

## 背景与动机
从 WebView 到 Hybrid 再到 React Native，移动端主流技术方案中前端同学的施展空间越来越大。但传统 Web 前端背景的同学所熟悉的编程语言主要是 JavaScript，在与 Native 协作的边界上很容易遇到掌控范围之外的坑，这也是 RN 等方案经常被诟病的理由之一。

然而，某一门具体的编程语言并不应该成为生涯的瓶颈或阻碍。已经熟悉某门主流语言的同学，学习新语言的速度可以是非常快的。在这方面，C++ 领域的《Essential C++》就是一个很好的例子：它假定读者已经熟练掌握了一门编程语言，从而忽略了入门编程初期大量琐碎的新手向知识点，直接向读者展示 C++ 的核心特性，让读者能够非常迅速地上手 C++ 语言（注意这和精通是两回事）。对于这份教程而言，让已有 JavaScript 背景的同学能够迅速上手原生语言而迈过跨端开发的一个坎，就是我们的初心。

> 目前这个项目还处于连载中的早期阶段，欢迎任何形式的反馈与参与。


## 要求与目标
这份教程对读者的要求只有一点：**熟悉** JavaScript。而在学习目标层面，请首先明确这份教程**不能做到**什么：

* 让你达到**精通**水平：请慎用这个词。
* 让你成为移动端开发者：特定的编程语言只是平台开发的**子集**。
* 让你熟悉 IDE：这份教程会使用最简单的**命令行**编译配置，无需 IDE。

与之相对地，这份教程的定位，是在这些场景下能够让你更快地达成目标：

* 你在基于 RN 等方案开发，需要整合原生 SDK 或类库。
* 你在 RN 等方案下踩到了 Native 的坑，希望能够独立调试解决。
* 你需要大致理解现有的 Objective-C 等应用代码，或进行小修改。

如果这些场景命中了你，那么就别犹豫了，上车继续吧😉


## Getting Started
如何阅读呢？从下面的链接开始就行了：

* [**C**](https://github.com/doodlewind/fe-native-lang/tree/master/c)
  * [**重温 Hello World**](https://github.com/doodlewind/fe-native-lang/tree/master/c/hello-world) - 介绍编译环境外与编码风格等基础。
  * [**变量与类型**](https://github.com/doodlewind/fe-native-lang/tree/master/c/variable-types) - 介绍常常被 JS 程序员忽略的类型系统到底有多么重要。
  * [**控制流**](https://github.com/doodlewind/fe-native-lang/tree/master/c/control-flow) - 介绍日常司空见惯的 for 和 while 循环是怎样和底层机制联系起来的。
  * [**函数调用与栈**](https://github.com/doodlewind/fe-native-lang/tree/master/c/call-stack) - 介绍原生语言是如何复用代码段的。
  * [**指针与引用**](https://github.com/doodlewind/fe-native-lang/tree/master/c/pointer-references) - 介绍我们需要区分基本类型和引用类型的理由。
  * [**结构体与堆**](https://github.com/doodlewind/fe-native-lang/tree/master/c/structure-heap) - 介绍对象的雏形与内存管理的概念。
* [**Objective-C**](https://github.com/doodlewind/fe-native-lang/tree/master/objective-c)

为什么从 C 开始呢？一方面，WASM 和 WebGL 中少不了 C 的影子，而更主要的是，C 的内容**其实非常少**，并且有一个非常好的思维模型，能够帮助你理解编程语言的核心特性，从而更容易地通过类比来掌握其它语言。例如作为 C 的超集，Objective-C 中就有许多 C 的影子。从 C 开始能够让你更好地理解它的特性为何这么设计，从而更好地理解其它编译型的原生语言。当然，如果你已经熟悉了 C，你也可以直接跳过它，阅读其它部分。


## 贡献
非常欢迎各种形式的参与，包括但不仅限于问题讨论、勘误指正与新增内容🙏使用 GitHub 的 Issue 和 PR 来参与吧。


## 致谢
本系列文章的组织结构参考了《Objective-C Programming The Big Nerd Ranch Guide》一书。


## 许可
[CC 署名-禁止演绎](http://creativecommons.org/licenses/by-nd/4.0)
