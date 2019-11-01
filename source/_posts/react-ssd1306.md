categories: Note

tags:

- Web

date: 2019-10-31

toc: true

title: 将 React 渲染到嵌入式液晶屏
---

我们都知道，React 最大的卖点之一，就是 Learn once, write anywhere 的通用性。但如何才能在浏览器之外，甚至在 Node.js 之外，用 React 渲染 UI 呢？本文将带你用 React 直通嵌入式驱动层，让现代前端技术与古老的硬件无缝结合。

<!--more-->

## 背景概述
本次我们的渲染目标，是一块仅 0.96 寸大的点阵液晶屏，型号为 SSD1306。它的分辨率仅 128x64，你可能在早期黑白 MP3 时代用它滚动播放过歌词。这块芯片到底有多小呢？我拍了张实物对比图：

![](https://ewind.us/images/react-ssd1306/chip-view.jpg)

一般的 PC 显然不会直接支持这种硬件，因此我们需要嵌入式的开发环境——我选择了最方便的树莓派。

虽然树莓派已经具备了完善的 Python 和 Node.js 等现成的语言环境，但我希望挑战极限，按照「能够将 React 运行在最低配置的硬件环境上」的方式来做技术选型。为此我寻找的是面向嵌入式硬件的超轻量 JS 解释器，来替代浏览器和 Node.js 上较为沉重的 V8。最后我选择了 [QuickJS](https://bellard.org/quickjs/)，一个年轻但系出名门的 JS 引擎。

所以简单说，我们的目标是**打通 React → QuickJS → 树莓派 → SSD1306 芯片这四个体系**。这个初看起来困难的目标，可以拆分为如下的几个步骤：

* 将 React 移植到嵌入式 JS 引擎上
* 基于 C 语言驱动硬件
* 为 JS 引擎封装 C 语言扩展
* 实现 React 渲染后端

上面的每一步虽然都不算难，但也都足够写篇独立的技术博客了。为保持可读性，本文只能尽量覆盖核心概念与关键步骤。不过我可以先向你保证，最后的整个项目不仅代码足够简单，还是自由而开源的。

让我们开始吧！

## 将 React 移植到嵌入式 JS 引擎上
其实，QuickJS 并不是唯一的嵌入式 JS 引擎，之前社区已有 DukTape 和 XS 等不少面向 IoT 硬件的 JS 引擎，但一直不温不火。相比之下 QuickJS 最吸引我的地方，有这么几点：

* **几乎完整的 ES2019 支持**。从 ES Module 到 async 和 Proxy，这些我们早已习惯的 Modern JS 语法，都是 QuickJS 已经支持，并通过了 Test262 测试的。相比之下，其他嵌入式 JS 引擎连 ES6 的支持都未必足够。
* **轻便灵活、可嵌入性强**。很多前端同学喜欢深入研究的 V8 引擎，其实连自己编译一份都相当困难。相比之下 QuickJS 无任何依赖，一句 make 就能编译好，二进制体积不到 700KB，也非常容易嵌入各类原生项目。
* **作者的个人实力**。作者 Fabrice Bellard 对我来说是神级的存在。像安卓模拟器底层的 QEMU 和音视频开发者必备的 FFmpeg，都是他创造的杰作。每当我技术有些进步，访问他的 [Home Page](https://bellard.org/)  时总能让我清晰地认识到自己的渺小。

但是，QuickJS 毕竟还只是个刚发布几个月的新项目而已，敢于尝鲜的人并不多。即便通过了各种单元测试，它真的能稳定运行起 React 这样的工业级 JS 项目吗？这是决定这条技术路线可行性的关键问题。

为此，我们当然需要先实际用上 QuickJS。它的源码是跨平台的，并非只能在 Linux 或树莓派上运行。在我的 macOS 上，拉下代码一套素质三连即可：

``` bash
cd quickjs
make
sudo make install
```

这样，我们就可以在终端输入 `qjs` 命令来进入 QuickJS 解释器了。只要形如 `qjs foo.js` 的形式，即可用它执行你的脚本。再加上 `-m` 参数，它就能支持载入 ES Module (ESM) 形式的模块，直接运行起整个模块化的 JS 项目了。

> 注意，在 QuickJS 中使用 ESM 时，必须给路径加上完整的  `.js` 后缀。这和浏览器中对直接加载 ESM 的要求是一致的。

不过，QuickJS 并不能直接运行「我们日常写的那种 React」，毕竟标签式的 JSX 只是方言，不是业界标准。怎么办呢？作为变通，我引入了辅助的 Node.js 环境，先用 Rollup 打包并转译 JSX 代码为 ESM 格式，再交给 QuickJS 执行。这个辅助环境的 node_modules 体积只有 10M 不到，具体配置不再赘述。

很快关键的一步就来了，你觉得 `qjs react.js` 真的能用吗？这时就体现出 React 的设计优越性了——早在两年前 React 16.0 发布时，React 就在架构上分离了上层的 `react` 和下层的默认 DOM 渲染器 `react-dom`，它们通过 `react-reconciler` 封装的 Fiber 中间层来连接。`react` 包没有对 DOM 的依赖，是可以独立在纯 JS 环境下运行的。这种工程设计虽然增大了整体的项目体积，但对于我们这种要定制渲染后端的场合则非常有用，也是个 React 比 Vue 已经领先了两年有余的地方。如何验证 React 可用呢？编写个最简单的无状态组件试试就行了：

``` jsx
import './polyfill.js'
import React from 'react'

const App = props => {
  console.log(props.hello)
  return null
}

console.log(<App hello={'QuickJS'} />)
```

注意到 `polyfill.js` 了吗？这是将 React 移植到 QuickJS 环境所需的兼容代码。看起来这种兼容工作可能很困难，但其实非常简单，就像这样：

``` js
// QuickJS 约定的全局变量为 globalThis
globalThis.process = { env: { NODE_ENV: 'development' } }
globalThis.console.warn = console.log
```

这么点代码由 Rollup 打包后，执行 `qjs dist.js` 即可获得这样的结果：

``` bash
$ qjs ./dist.js
QuickJS
null
```

这说明 `React.createElement` 能正确执行，Props 的传递也没有问题。这个结果让我很兴奋，因为即使停在这一步，也已经说明了：

* QuickJS 完全可以直接运行工业界中 Battle-Tested 的框架。
* `npm install react` 的源码，能够**一行不改地**运行在符合标准的 JS 引擎上。

好了，QuickJS 牛逼！React 牛逼！接下来该干嘛呢？

## 基于 C 语言驱动硬件
我们已经让 React 顺利地在 QuickJS 引擎上执行了。但别忘了我们的目标——将 React 直接渲染到**液晶屏**！该如何在液晶屏上渲染内容呢？最贴近硬件的 C 语言肯定是最方便的。但在开始编码之前，我们需要搞明白这些概念：

* 要想控制 SSD1306 这块芯片，最简单的方式是通过 I2C 通信协议。这就和 U 盘支持 USB 协议是一个道理。
* 一般的 PC 主板上没有 I2C 接口，但树莓派上有，只要连接几个针脚就行。
* 连接了支持 I2C 的设备后，就可以在操作系统中控制它了。我们知道 Linux 里一切皆文件，因此这个屏幕也会被当成文件，挂载到 `/dev` 目录下。
* 对于文件，只需通过 C 语言编写 Unix 的 [open](http://man7.org/linux/man-pages/man2/open.2.html) / [write](http://man7.org/linux/man-pages/man2/write.2.html) 等系统调用，就能读写控制了。不过 I2C 显示屏毕竟不是普通文件，是通过 Linux 内核里的驱动控制的。为此我们需要安装 [libi2c-dev](https://www.kernel.org/doc/Documentation/i2c/dev-interface) 这个包，以便在用户态通过 [ioctl](http://man7.org/linux/man-pages/man2/ioctl.2.html) 系统调用来控制它。

我们首先需要将屏幕芯片连接到树莓派上。方法如下（树莓派引脚号可以用 `pinout` 命令查看）：

* 芯片 Vcc 端接树莓派 1 号引脚，这是 3.3V 的电源输入
* 芯片 Gnd 端接树莓派 14 号引脚，这是地线
* 芯片 SCL 端接树莓派 5 号引脚，这是 I2C 规范的 SCL 口
* 芯片 SDA 端接树莓派 3 号引脚，这是 I2C 规范的 SDA 口

连接好之后，大概是这样的：

![](https://ewind.us/images/react-ssd1306/pi-with-oled.jpg)

然后，在树莓派「开始菜单」的 System Configuration 中，启用 Interface 中的 I2C 项（这步也能敲命令处理）并重启，即可启用 I2C 支持。

硬件和系统都配置好之后，我们来安装 I2C 的一些工具包：

``` bash
sudo apt-get install i2c-tools libi2c-dev
```

如何验证上面这套流程 OK 了呢？使用 `i2cdetect` 命令即可。如果看到下面这样在 `3c` 位置有值的结果，说明屏幕已经正确挂载了：

``` bash
$ i2cdetect -y 1
     0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f
00:          -- -- -- -- -- -- -- -- -- -- -- -- --
10: -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --
20: -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --
30: -- -- -- -- -- -- -- -- -- -- -- -- 3c -- -- --
40: -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --
50: -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --
60: -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --
70: -- -- -- -- -- -- -- --   
```

环境配置完成后，我们就可以编写用 open / write / ioctl 等系统调用来控制屏幕的 C 代码了。这需要对 I2C 通信协议有些了解，好在有不少现成的轮子可以用。这里用的是 [oled96](https://github.com/bitbank2/oled_96) 库，基于它的示例代码大概这样：

``` c
// demo.c
#include <stdint.h>
#include <string.h>
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include "oled96.h"

int main(int argc, char *argv[])
{
    // 初始化
    int iChannel = 1, bFlip = 0, bInvert = 0;
    int iOLEDAddr = 0x3c;
    int iOLEDType = OLED_128x64;
    oledInit(iChannel, iOLEDAddr, iOLEDType, bFlip, bInvert);

    // 清屏后渲染文字和像素
    oledFill(0);
    oledWriteString(0, 0, "Hello OLED!", FONT_SMALL);
    oledSetPixel(42, 42, 1);

    // 在用户输入后关闭屏幕
    printf("Press ENTER for to quit!\n");
    getchar();
    oledShutdown();
}
```

这个示例只需要 `gcc demo.c` 命令就能运行。不出意外的话，运行编译产生的 `./a.out` 即可点亮屏幕。这一步编写的代码也很浅显易懂，真正较复杂的地方在于 oled96 驱动层的通信实现。有兴趣的同学可以读读它的源码噢。

## 为 JS 引擎封装 C 语言扩展
现在，React 世界和硬件世界分别都能正常运转了。但如何连接它们呢？我们需要为 QuickJS 引擎开发 C 语言模块。

QuickJS 中默认内置了 `os` 和 `std` 两个原生模块，比如我们司空见惯的这种代码：

``` js
const hello = 'Hello'
console.log(`${hello} World!`)
```

其实在 QuickJS 中也能换成这样写：

``` js
import * as std from 'std'

const hello = 'Hello'
std.out.printf('%s World!', hello)
```

有没有种 C 语言换壳的感觉？这里的 `std` 模块其实就是作者为 C 语言 `stdlib.h` 和 `stdio.h` 实现的 JS Binding。那我如果想自己实现其他的 C 模块，该怎么办呢？官方文档大手一挥，告诉你「直接照我的源码来写就行」——敢把核心源码当作面向小白的示例，可能这就是大神吧。

一番折腾后，我发现 QuickJS 在接入原生模块时的设计，非常的「艺高人胆大」。首先我们要知道的是，在 `qjs` 之外，QuickJS 还提供了个 `qjsc` 命令，能将一份写了 Hello World 的 `hello.js` 直接编译到二进制可执行文件，或者这样的 C 代码：

``` c
/* File generated automatically by the QuickJS compiler. */
#include "quickjs-libc.h"
const uint32_t qjsc_hello_size = 87;
const uint8_t qjsc_hello[87] = {
 0x01, 0x04, 0x0e, 0x63, 0x6f, 0x6e, 0x73, 0x6f,
 0x6c, 0x65, 0x06, 0x6c, 0x6f, 0x67, 0x16, 0x48,
 0x65, 0x6c, 0x6c, 0x6f, 0x20, 0x57, 0x6f, 0x72,
 0x6c, 0x64, 0x22, 0x65, 0x78, 0x61, 0x6d, 0x70,
 0x6c, 0x65, 0x73, 0x2f, 0x68, 0x65, 0x6c, 0x6c,
 0x6f, 0x2e, 0x6a, 0x73, 0x0d, 0x00, 0x06, 0x00,
 0x9e, 0x01, 0x00, 0x01, 0x00, 0x03, 0x00, 0x00,
 0x14, 0x01, 0xa0, 0x01, 0x00, 0x00, 0x00, 0x39,
 0xd0, 0x00, 0x00, 0x00, 0x43, 0xd1, 0x00, 0x00,
 0x00, 0x04, 0xd2, 0x00, 0x00, 0x00, 0x24, 0x01,
 0x00, 0xcc, 0x28, 0xa6, 0x03, 0x01, 0x00,
};

int main(int argc, char **argv)
{
  JSRuntime *rt;
  JSContext *ctx;
  rt = JS_NewRuntime();
  ctx = JS_NewContextRaw(rt);
  JS_AddIntrinsicBaseObjects(ctx);
  js_std_add_helpers(ctx, argc, argv);
  js_std_eval_binary(ctx, qjsc_hello, qjsc_hello_size, 0);
  js_std_loop(ctx);
  JS_FreeContext(ctx);
  JS_FreeRuntime(rt);
  return 0;
}
```

你的 Hello World 去哪了？就在这个大数组的**字节码**里呢。这里一些形如 `JS_NewRuntime` 的 C 方法，其实就是 QuickJS 对外 API 的一部分。你可以参考这种方式，在原生项目里接入 QuickJS——真正的大神，即便把自己的代码编译一遍，还是示例级的教程代码。

搞懂这个过程后不难发现，QuickJS 中最简单的原生模块使用方式，其实是这样的：

1. 用 `qjsc` 将全部 JS 代码，编译成 C 语言的 `main.c` 入口
2. 依次将你的各个 C 源码，用 `gcc -c` 命令编译为 `.o` 格式的目标文件
3. 编译 `main.c` 并链接上这些 `.o` 文件，获得最终的 `main` 可执行文件

看懂了吗？这个操作的核心在于**先把 JS 编译成普通的 C，再在 C 的世界里链接各种原生模块**。虽然有些奇幻，但好处是这样不需要魔改 QuickJS 源码就能实现。按这种方式，我基于 oled96 实现了个名为 `renderer.c` 的 C 模块，它会提供名为 `renderer` 的 JS 原生模块。其整体实现大致是这样的：

``` c
// 用于初始化 OLED 的 C 函数
JSValue nativeInit(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv)
{
    const int bInvert = JS_ToBool(ctx, argv[0]);
    const int bFlip = JS_ToBool(ctx, argv[1]);
    int iChannel = 1;
    int iOLEDAddr = 0x3c;
    int iOLEDType = OLED_128x64;
    oledInit(iChannel, iOLEDAddr, iOLEDType, bFlip, bInvert);
    oledFill(0);
    return JS_NULL;
}

// 用于绘制像素的 C 函数
JSValue nativeDrawPixel(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv)
{
    int x, y;
    JS_ToInt32(ctx, &x, argv[0]);
    JS_ToInt32(ctx, &y, argv[1]);
    oledSetPixel(x, y, 1);
    return JS_NULL;
}

// 定义 JS 侧所需的函数名与参数长度信息
const JSCFunctionListEntry nativeFuncs[] = {
    JS_CFUNC_DEF("init", 2, nativeInit),
    JS_CFUNC_DEF("drawPixel", 2, nativeDrawPixel)};

// 其他的一些胶水代码
// ...
```

整个包含了 C 模块的项目编译步骤，如果手动执行则较为复杂。因此我们选择引入 GNU Make 来表达整个构建流程。由于是第一次写 Makefile，这个过程对我有些困扰。不过搞懂原理后，它其实也没那么可怕。感兴趣的同学可以自己查看后面开源仓库地址中的实现噢。

只要上面的 C 模块编译成功，我们就能用这种前端同学们信手拈来的 JS 代码，直接驱动这块屏幕了：

``` js
// main.js
import { setTimeout } from 'os'
import { init, clear, drawText } from 'renderer'

const wait = timeout =>
  new Promise(resolve => setTimeout(resolve, timeout))

;(async () => {
  const invert = false
  const flip = false
  init(invert, flip)
  clear()
  drawText('Hello world!')
  await wait(2000)

  clear()
  drawText('Again!')
  await wait(2000)

  clear()
})()
```

其实，很多树莓派上著名的 Python 模块，也都为你做好了这一步。那为什么要用 JS 重新实现一遍呢？因为只有 JS 上才有 Learn once, write anywhere 的 React 呀！让我们走出最后一步，将 React 与这块液晶屏连接起来吧。

## 实现 React 渲染后端
为 React 实现渲染后端，听起来是件非常高大上的事情。其实这玩意很可能并没有你想象的那么复杂，社区也有 [Making a custom React renderer](https://github.com/nitin42/Making-a-custom-React-renderer) 这样不错的教程，来告诉你如何从零到一地实现自己的渲染器。不过对我来说，光有这份教程还有些不太够。关键在于两个地方：

1. 这份教程只将 React 渲染到静态的 docx 格式，不支持能持续更新的 UI 界面。
2. 这份教程没有涉及接入 React Native 式的原生模块。

这两个问题里，问题 2 已经在上面基本解决了：我们手里已经有了个用 JS 调一次就能画些东西的原生模块。那么剩下的问题就是，该如何实现一个支持按需更新的 React 渲染后端呢？

我选择的基本设计，是将整个应用分为三个宏观角色：

* 事件驱动的 React 体系
* 维护原生屏幕状态的容器
* 固定帧率运行的渲染 Main Loop

这些体系是如何协调工作的呢？简单来说，当用户事件触发了 React 中的 setState 后，React 不仅会更新自身的状态树，还会在原生状态容器中做出修改和标记。这样在 Main Loop 的下一帧到来时，我们就能根据标记，按需地刷新屏幕状态了。**从事件流向的视角来看**，整体架构就像这样：

![](https://ewind.us/images/react-ssd1306/react-arch-1.jpg)

图中的 Native State Container 可以理解为浏览器真实 DOM 这样「不难直接写 JS 操控，但不如交给 React 帮你管理」的状态容器。只要配置正确，React 就会单向地去更新这个容器的状态。而一旦容器状态被更新，这个新状态就会在下一帧被同步到屏幕上。这其实和经典的生产者 - 消费者模型颇为类似。其中 React 是更新容器状态的生产者，而屏幕则是定时检查并消费容器状态的消费者。听起来应该不难吧？

实现原生状态容器和 Main Loop，其实都是很容易的。最大的问题在于，我们该如何配置好 React，让它自动更新这个状态容器呢？这就需要使用大名鼎鼎的 React Reconciler 了。要想实现一个 React 的 Renderer，其实只要在 Reconciler 的各个生命周期勾子里，正确地更新原生状态容器就行了。**从层次结构的视角来看**，整体架构则是这样的：

![](https://ewind.us/images/react-ssd1306/react-arch-2.jpg)

可以认为，我们想在 React 中拿来使用的 JS Renderer，更像是一层较薄的壳。它下面依次还有两层重要的结构需要我们实现：

* 一个实现了原生状态容器和原生渲染 Loop 的 Adapter 适配层
* 真正的 C 语言 Renderer

React 所用的 Renderer 这层壳的实现，大致像这样：

``` js
import Reconciler from 'react-reconciler'
import { NativeContainer } from './native-adapter.js'

const root = new NativeContainer()
const hostConfig = { /* ... */ }
const reconciler = Reconciler(hostConfig)
const container = reconciler.createContainer(root, false)

export const SSD1306Renderer = {
  render (reactElement) {
    return reconciler.updateContainer(reactElement, container)
  }
}
```

其中我们需要实现个 NativeContainer 容器。这个容器大概是这样的：

``` js
// 导入 QuickJS 原生模块
import { init, clear, drawText, drawPixel } from 'renderer'
// ...

export class NativeContainer {
  constructor () {
    this.elements = []
    this.synced = true
    // 清屏，并开始事件循环
    init()
    clear()
    mainLoop(() => this.onFrameTick())
  }
  // 交给 React 调用的方法
  appendElement (element) {
    this.synced = false
    this.elements.push(element)
  }
  // 交给 React 调用的方法
  removeElement (element) {
    this.synced = false
    const i = this.elements.indexOf(element)
    if (i !== -1) this.elements.splice(i, 1)
  }
  // 每帧执行，但仅当状态更改时重新 render
  onFrameTick () {
    if (!this.synced) this.render()
    this.synced = true
  }
  // 清屏后绘制各类元素
  render () {
    clear()
    for (let i = 0; i < this.elements.length; i++) {
      const element = this.elements[i]
      if (element instanceof NativeTextElement) {
        const { children, row, col } = element.props
        drawText(children[0], row, col)
      } else if (element instanceof NativePixelElement) {
        drawPixel(element.props.x, element.props.y)
      }
    }
  }
}
```

不难看出这个 NativeContainer 只要内部元素被更改，就会在下一帧调用 C 渲染模块。那么该如何让 React 调用它的方法呢？这就需要上面的 `hostConfig` 配置了。这份配置中需要实现大量的  Reconciler API。对于我们最简单的初次渲染场景而言，包括这些：

``` js
appendInitialChild () {}
appendChildToContainer  () {} // 关键
appendChild () {}
createInstance () {} // 关键
createTextInstance () {}
finalizeInitialChildren () {}
getPublicInstance () {}
now () {}
prepareForCommit () {}
prepareUpdate () {}
resetAfterCommit () {}
resetTextContent () {}
getRootHostContext () {} // 关键
getChildHostContext () {}
shouldSetTextContent () {}
useSyncScheduling: true
supportsMutation: true
```

这里真正有意义的实现基本都在标记为「关键」的项里。例如，假设我的 NativeContainer 中具备 NativeText 和 NativePixel 两种元素，那么 `createInstance` 勾子里就应该根据 React 组件的 type 来创建相应的元素实例，并在 `appendChildToContainer` 勾子里将这些实例添加到 NativeContainer 中。具体实现相当简单，可以参考实际代码。

创建之后，我们还有更新和删除元素的可能。这至少对应于这些 Reconciler API：

``` js
commitTextUpdate () {}
commitUpdate () {} // 关键
removeChildFromContainer () {} // 关键
```

它们的实现也是同理的。最后，我们需要跟 Renderer 打包提供一些「内置组件」，就像这样：

``` js
export const Text = 'TEXT'
export const Pixel = 'PIXEL'
// ...
export const SSD1306Renderer = {
  render () { /* ... */ }
}
```

这样我们从 Reconciler 那里拿到的组件 type 就可以是这些常量，进而告知 NativeContainer 更新啦。

**到此为止，经过这全部的历程后，我们终于能用 React 直接控制屏幕了**！这个 Renderer 实现后，基于它的代码就相当简单了：

``` jsx
import './polyfill.js'
import React from 'react'
import { SSD1306Renderer, Text, Pixel } from './renderer.js'

class App extends React.Component {
  constructor () {
    super()
    this.state = { hello: 'Hello React!', p: 0 }
  }

  render () {
    const { hello, p } = this.state
    return (
      <React.Fragment>
        <Text row={0} col={0}>{hello}</Text>
        <Text row={1} col={0}>Hello QuickJS!</Text>
        <Pixel x={p} y={p} />
      </React.Fragment>
    )
  }

  componentDidMount () {
    // XXX: 模拟事件驱动更新
    setTimeout(() => this.setState({ hello: 'Hello Pi!', p: 42 }), 2000)
    setTimeout(() => this.setState({ hello: '', p: -1 }), 4000)
  }
}

SSD1306Renderer.render(<App />)
```

渲染结果是这样的：

![](https://ewind.us/images/react-ssd1306/pi-success.jpg)

别看显示效果似乎貌不惊人，这几行文字的出现，标准着 JSX、组件生命周期勾子和潜在的 Hooks / Redux 等现代的前端技术，终于都能直通嵌入式硬件啦——将 React、QuickJS、树莓派和液晶屏连接起来的尝试，到此也算是能告一段落了。拜 QuickJS 所赐，**最终包括 JS 引擎和 React 全家桶在内的整个二进制可执行文件体积，只有 780K 左右**。

## 资源
上面涉及的整个项目代码示例，都在公开的 [react-ssd1306](https://github.com/doodlewind/react-ssd1306) 仓库中（如果你觉得有意思，来个 star 吧）。再附上些过程中较有帮助的参考链接：

* [QuickJS 主页](https://bellard.org/quickjs)
* [QuickJS 异步原生模块开发](https://medium.com/@calbertts/how-to-create-asynchronous-apis-for-quickjs-8aca5488bb2e)
* [在树莓派上使用 I2C OLED](https://www.raspberrypi-spy.co.uk/2018/04/i2c-oled-display-module-with-raspberry-pi/)
* [构建自定义 React Renderer](https://github.com/nitin42/Making-a-custom-React-renderer)

## 后记
如果你坚持到了这里，那真是辛苦你啦~这篇文章的篇幅相当长，涉及的关键点也可能比较分散——重点到底是如何使用 QuickJS、如何编写 C 扩展，还是如何定制 React Reconciler 呢？似乎都很重要啊（笑）。不过这个过程折腾下来，确实给了我很多收获。许多以前只是听说过，或者觉得非常高大上的概念，自己动手做过之后才发现并没有那么遥不可及。其他的一些感想大概还有：

* 有了这么方便的嵌入式 JS 引擎，Web 技术栈可以更好地走出浏览器啦
* 树莓派真的很有趣，配合 VSCode Remote 更是高效。非常推荐入手玩玩
* I2C 的性能瓶颈真的很明显，整个系统的优化光在 React 侧做肯定还不够
* 运行 React 的「最低配置」是多少呢？一定比 Node.js 的最低配置低得多吧

其实从我日常切图的时候起，我就喜欢弄些「对业务没什么直接价值」的东西，比如：

* [支持中文关键字的类 Lisp 语言解释器](http://ewind.us/h5/ove-lang/demo/)
* [用 WebGL 渲染魔方，并写算法还原它](https://juejin.im/post/5b837c0b51882542d950efb4)
* [能玩 PONG 游戏的 Chip8 虚拟机](https://juejin.im/post/5a11729251882554b83723e5)

这次的 react-ssd1306 项目里，驱使我的动力和造这些轮子时也是相似的。为什么不好好写业务逻辑，非要搞这些「没有意义」的事呢？

**Because we can.**
