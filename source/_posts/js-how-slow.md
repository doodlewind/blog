categories: Note

tags:

- JS

date: 2018-03-24

toc: true

title: JavaScript 到底有多慢？
---

拜浏览器大战所赐，主流浏览器的 JS 引擎已经引入了各种优化技术，不时出现的某某浏览器性能大幅提升的新闻也让前端同学们信心倍增。那么 JS 这门语言本身是否已经达到了接近原生的水平呢？

<!--more-->

## 思路
我们知道，即便引入了 JIT 等更高阶的编译技术，当今的 JavaScript 本质上也是一门脚本语言。不要说对比 C / C++ 这样能编译到原生机器码的语言，即便和使用了字节码的 Java 比起来，JavaScript 的运行时在原理上也没有优势。那么问题来了，怎么样**量化**地得出 JS 速度和原生语言的差距呢？

前端框架领域里有很多 Todo MVC 的 benchmark，它们的对比方式可以简单地理解为**对比基于不同框架实现同样功能的性能**。这固然是可行且易于量化的，但不同的编码实现和构建技巧可能显著地改变跑分数据（如是否打开 React 的优化插件等），并且 Todo MVC 的场景也基本局限于数据的增查改删，还不是真实场景下的复杂应用。

注意到在今天，许多编程语言已经能够编译到 JavaScript，我们选择了另一条方式：**对比真实世界应用原生版和 JavaScript 版的性能**。并且，在 Web Assembly 已经成为标准的背景下，我们还有机会对比原生代码、WASM 和 JS 的性能，这看起来就更有趣了。

怎么样选择所测试的应用呢？我们需要计算密集型的场景来压榨出运行时的性能，这方面的场景中最常见的就是游戏和多媒体处理了。我们选择了视频编码领域非常老牌的 FFmpeg，通过将它构建到 WASM 和 JavaScript 的方式，测试其不同版本编码视频的速度，以此得到原生、WASM 和 JS 的一个性能对比参考。


## 过程与结果
我们希望对比三种 FFmpeg 构建版使用默认配置编码视频时的速度：

* 原生
* JavaScript 版
* WASM 版

测试的输入文件是 JS 版 FFmpeg（即 videoconverter.js 库）附带的 [Demo 视频](https://github.com/bgrins/videoconverter.js/blob/master/demo/bigbuckbunny.webm)，测试平台是 2015 款乞丐版 MacBook Pro。

### 原生
使用 Homebrew 安装的版本：

```
time ffmpeg -i bigbuckbunny.webm output.mp4
```

转码所需时长在 **6s** 左右。

### JavaScript 版
[videoconverter.js](https://github.com/bgrins/videoconverter.js) 附带了一个开箱即用的静态 Demo 页，可以在其中转码视频。选择 `Video to .MP4` 输出即可。转码所需时长在 **140s** 左右。

### WASM 版
WASM 版 FFmpeg 没有社区的稳定 release，这里参考了[这篇专栏](https://zhuanlan.zhihu.com/p/27910351)的构建方式，在安装 Emscripten 后从源码编译 FFmpeg 到 WASM，将获得的 [ffmpeg.wasm](https://github.com/doodlewind/learn-cs/blob/master/video/wasm/ffmpeg.wasm) 用于转码。

将一个 C 应用编译到 WASM 后，我们可以选择在 Web Worker 中使用它。只需将原本的命令行参数换一种格式传递即可：

``` js
ffmpeg({
  arguments: [
    '-i', '/input/demo.mp4',
    'out.mp4'
  ],
  files
}, function (results) {
  self.postMessage(results[0].data)
})
```

测得所需的时长在 **24s** 左右。


## 结论
我们观察到了比较显著的性能差异：

![benchmark](http://7u2gqx.com1.z0.glb.clouddn.com/ffmpeg-benchmark.png)

在这个计算密集型的场景下，JavaScript 的性能在原生的 **1/20** 左右，而 WASM 的性能可以达到原生的 **1/4** 左右。

但这个数据只能供参考之用，理由是整个链路中还有很多隐式的坑。列举几个：

* 视频编码测试的指标受算法、参数影响很大。基于 FFmpeg 的默认配置并不能保证所运行的代码路径一致。
* 将 FFmpeg 编译到 WASM 时进行了很多剪裁，如禁用内联的平台相关汇编码、禁用多线程等。这对最终构建出版本的性能是有影响的。
* WASM 很多时候并不能相比原生 JS 实现几倍的性能提升。在一些没有将整个应用编译成 WASM，而是采用 JS 调用 WASM 模块的示例（如图像处理）中，频繁地在 WASM 与 JS 之间复制数据的开销很大，甚至会出现 WASM 性能不如 JS 的情况。

尽管有上面这些干扰因素存在，我们基本能确定的是，JavaScript 与原生之间的性能差距仍然可以是数量级的。只不过在目前常见的中后台、活动页、Hybrid 等场景下，我们很少需要用 JavaScript 处理计算密集型的任务，这时它不容易成为整个应用的瓶颈。

希望这个简单的测试对于了解【JS 到底有多慢】能有一些帮助。不过我们的好消息是，从另一个角度来看，移动端的 JS 已经不比 PC 端的 JS 跑得慢了，感兴趣的同学不妨参考笔者的[这篇文章](http://ewind.us/2017/mobile-js-benchmark/)。

最后列出文中涉及的相关资源：

* [FFmpeg 文档](https://www.ffmpeg.org/documentation.html)
* [videoconverter.js](https://github.com/bgrins/videoconverter.js)
* [WASM 版仓库](https://github.com/doodlewind/videoconverter.js)
* [WASM 版示例](https://github.com/doodlewind/learn-cs/tree/master/video/wasm)
