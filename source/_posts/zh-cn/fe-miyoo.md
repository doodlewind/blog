categories: Note

tags:

- Web
- JS

date: 2019-12-16

toc: true

title: 将前端技术栈移植到掌上游戏机
---

作为前端工程师，我们编写的代码只能活在浏览器、小程序或者 Node 进程里，这似乎已经成为了一种常识。但这就是我们的能力边界了吗？本文将带你为一台内存仅 32M，分辨率仅 320x240 的掌上游戏机适配前端工具链，见证 Web 技术栈的全新可能性。

<!-- more -->

本次我们的目标，是只配备了 400Mhz 单核 CPU 和 32M 内存的国产怀旧掌机 Miyoo。它固然完全无法与现在的 iOS 和安卓手机相提并论，但却能很好地在小巧精致的体积下，满足玩小霸王、GBA、街机等经典游戏平台模拟器的需求，价格也极为低廉。这是它和 iPad mini 的对比图：

![](https://ewind.us/images/miyoo/intro.jpg)

那么，怎样才算是为它移植了一套前端技术栈呢？我个人的理解里，这至少包括这么几部分：

* **构建环境** - 应用编译工具链
* **运行时** - 嵌入式 JS 引擎
* **调试环境** - IDE 或编辑器支持

下面将逐一介绍为完成这三大部分的移植，我所做的一些技术探索。这主要包括：

* 搭建 Docker 工具链
* 走通 Hello World
* 焊接排针与串口登录
* 定制 Linux 内核驱动
* 移植 JS 引擎
* 支持 VSCode 调试器

Let’s rock!

## 搭建 Docker 工具链
入门嵌入式开发时我们首先应该做到的，就是将源码编译为嵌入式操作系统上的应用。那么 Miyoo 掌机的操作系统是什么呢？这里首先有一段故事。

Miyoo 是个国内小公司基于全志 F1C500S 芯片方案定制的掌机，其默认的操作系统是闭源的 Melis OS，在国外以 Bittboy 和 Pocket Go 的名义销售，小有名气。闭源系统自然不能满足爱好者的需求，因此社区对其进行了逆向工程。来自台湾的前辈司徒 ([Steward Fu](https://steward-fu.github.io/website/handheld.htm)) 成功将 Linux 移植到了这台掌机上，但可惜他已因个人原因退出了开发。现在这台游戏机的开源系统 [MiyooCFW](https://github.com/TriForceX/MiyooCFW) 基于司徒最早移植的 Linux 4.14 内核，由社区维护。

因此，我们的目标系统既不是 iOS 也不是安卓，而是**原汁原味的 Linux**！如何为嵌入式 Linux 编译应用呢？我们需要一套由编译器、汇编器、链接器等基础工具组成的**工具链**，以构建出可用的 ARM 二进制程序。

在各个操作系统上搭建开发环境，往往相当繁琐。现在开源掌机社区中流行的方式是使用 VirtualBox 等 Linux 虚拟机。这基本解决了工具链的跨平台问题，但还没有达到现代前端工程的开发便利度。因此我选择首先引入 Docker，来实现跨平台开箱即用的开发环境。

我们知道，Docker 容器可以理解为更轻量的虚拟机。我们只要一句 `docker run` 命令就能运行容器，并为其挂载文件、网络等外部资源。显然，现在我们需要的是一个【能编译出嵌入式 Linux 应用】的 Docker 容器，这可以通过制作出一个用于启动容器的基准 Docker 镜像来实现。Docker 镜像很容易跨平台分发，因此只要制作并上传镜像，基础的开发环境就做好了。

那么，这个 Docker 镜像中应该包含什么内容呢？显然就是编译嵌入式应用的工具链了。司徒已为社区提供了一套在 Debian 9 上预编译好的工具链包，只需要将其解压到 `/opt/miyoo` 目录下，再安装一些常见依赖，就可以完成镜像的制作了。这一过程可以通过 Dockerfile 文件来自动化，其内容如下所示：

``` dockerfile
FROM debian:9
ADD toolchain.tar.gz /opt
ENV PATH="${PATH}:/opt/miyoo/bin"
ENV ARCH="arm"
ENV CROSS_COMPILE="arm-miyoo-linux-uclibcgnueabi-"
RUN apt-get update && apt-get install -y \
    build-essential \
    bc \
    libncurses5-dev \
    libncursesw5-dev \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /root
```

这样只要用 `docker build` 命令，我们就能用纯净的 Debian 镜像制作出纯净的嵌入式开发镜像了。那么接下来又该如何用镜像编译文件呢？假设我们做好了 `miyoo_sdk` 镜像，那么只要将本地的文件系统目录，挂载到基于镜像所启动的容器上即可。像这样：

``` bash
docker run -it --rm -v `pwd`:/root miyoo_sdk
```

简单说来，这条命令的意义是这样的：

* `docker run` 基于 `miyoo_sdk` 镜像启动一个**临时**容器
* `-v` 将当前目录挂载到容器的 `/root` 下
* `-it` 让我们用当前终端来登录操作容器的 Shell
* `--rm` 使容器用完即弃，除更改当前目录外，**不留任何痕迹**

因此，我们实际上基于 Docker，**直接在容器里编译了 Mac 文件系统上的源码**。这既没有副作用，也不需要其他数据传递操作。对于日益复杂的前端工具链依赖问题，我相信这也是一种解决方案，有机会可以单独撰文详述。

## 走通 Hello World
Docker 镜像制作好之后，我们就能用上容器里 `arm-linux-gcc` 这样的编译器了。那么该怎么编译出一个 Hello World 呢？现在还没到引入 JS 引擎的时候，先用 C 语言写出个简单的例子，验证一切都能正常工作吧。

嵌入式 Linux 设备常用 SDL 库来渲染基础的 GUI，其最简单的示例如下所示，是不是和前端同学们熟悉的 Canvas 有些神似呢：

``` c
#include <stdio.h>
#include <SDL.h>

int main(int argc, char* args[])
{
  printf("Init!\n");
  SDL_Surface* screen;
  screen = SDL_SetVideoMode(320, 240, 16, SDL_HWSURFACE | SDL_DOUBLEBUF);
  SDL_ShowCursor(0);
  // 填充红色
  SDL_FillRect(screen, &screen->clip_rect, SDL_MapRGB(screen->format, 0xff, 0x00, 0x00));
  // 交换一次缓冲区
  SDL_Flip(screen);
  SDL_Delay(10000);
  SDL_Quit();
  return 0;
}
```

这份 C 源码可以通过我们的 Docker 环境编译出来。但显然稍有规模的应用都不应该直接敲 `gcc` 那堆参数来直接构建，通过像这样的 Makefile 来自动化比较好（注意缩进必须用 tab 哦）：

``` makefile
all:
    arm-linux-gcc main.c -o demo.out -ggdb -lSDL -I/opt/miyoo/arm-miyoo-linux-uclibcgnueabi/sysroot/usr/include/SDL
clean:
    rm -rf demo.out
```

除了登陆 Docker 容器的 Shell 之外，我们还可以通过 `-d` 参数轻松地创建「无头」的容器，在后台帮你编译。像构建这个 Makefile 所需的 `make` 命令，就可以在 Mac 终端里这样一行搞定：

``` bash
docker run -d --rm -v `pwd`:/root miyoo_sdk make
```

这样就能生成 `demo.out` 二进制文件啦。将这个仅有 12KB 的文件复制到 Miyoo TF 卡里的 `/apps` 目录里后，再用 Miyoo 自带的程序安装器打开它，就能看到这样的结果了：

![](https://ewind.us/images/miyoo/sdl.jpg)

这说明 Docker 编译工具链已经正常工作了！但这还远远不够，现在的关键问题在于，我们的 `printf` 去哪了？

## 焊接排针与串口登录
基础的 Unix 知识告诉我们，进程的输出是默认写到 stdout 这个标准输出文件里的。一般来说，这些输出都会写入流式的缓冲区，进而绘制到终端上。但是，嵌入式设备的终端在哪里呢？一般来说，这些日志写入的是所谓的 Serial Console 串口控制台。而这种控制台的数据，则可以通过非常古老的 UART 传输器来和 PC 交互，只需要接上三条电路的连线就行。

因此，我们需要想办法接通 Miyoo 的 UART 接口，从而才能在电脑上登陆它的 Shell。在这方面，司徒的 [焊接 UART 接頭](https://steward-fu.github.io/website/handheld/miyoo/uart.htm) 这篇文章是非常好的参考资料。我对其中的一句话印象尤其深刻：

> 廠商真是貼心，特別把 GND、UART1 RX、UART1 TX（由上而下）拉出來，提供開發者一個友好的開發界面

拆机焊接才能用的东西，在大佬眼里居然算是友好的开发界面…好吧，不就是焊接吗？现学就是了。

首先我们把后盖拆开，再把主板卸下来。这步只需要标准的十字螺丝刀，注意别弄丢小零件就行。完成后像这样：

![](https://ewind.us/images/miyoo/teardown-1.jpg)

看到图中主板右上角的三根针了吗？这就是 UART 的三个接口了（这时我还没焊接，只是把排针摆上去了而已）。它们自上而下分别是 GND、RX 和 TX，只要为它们焊接好排针，将导线连到 UART 转 USB 转换器，就能在 Mac 上登陆它啦。连接顺序是这样的：

* Miyoo 的 GND 接转换器的 GND
* Miyoo 的 RX 接转换器的 TX
* Miyoo 的 TX 接转换器的 RX

所以，我们需要先焊上排针。焊接看起来很折腾，现学起来倒并不难，其实只要**先把烙铁头压在焊点上，然后把焊锡丝放上去**就行。像我这样的新手，还可以买一些白菜价的练习板，拿几个二极管练练手后再焊真的板子。完成后的效果如下所示，多了三根红色排针（焊点在背面，很丑就不放图了）：

![](https://ewind.us/images/miyoo/teardown-2.jpg)

焊好以后，用万用表即可测量焊点是否接通。还记得高中物理里万用表的红黑表笔怎么连接吗…反正我早就忘光了，也是现学的。实际测得 RX 和 TX 各自到 GND 的电阻值都在 600 欧姆左右，就代表连接畅通了。

加上转接头，连好之后的效果是这样的：

![](https://ewind.us/images/miyoo/connect.jpg)

最后我为了能把机器装回去，又在后盖上打了个洞，像这样：

![](https://ewind.us/images/miyoo/drilled.jpg)

做完这个硬件改造之后，该如何实现软件上的连接呢？这就需要能够登陆串口的软件了。Unix 里一切皆文件，因此我们只要找到 `/dev` 目录下的串口文件，然后用串口通信软件打开这个文件就行啦。screen 是 Mac 内置的命令行会话软件，但用起来较为麻烦，这里推荐 Mac 用户使用更方便的 minicom。连接好之后，能看到形如这样的登陆日志输出：

```
[    1.000000] devtmpfs: mounted
[    1.010000] Freeing unused kernel memory: 1024K
[    1.130000] EXT4-fs (mmcblk0p2): re-mounted. Opts: data=ordered
[    1.230000] FAT-fs (mmcblk0p4): Volume was not properly unmounted. Some data may be corrupt. Ple.
[    1.250000] Adding 262140k swap on /dev/mmcblk0p3.  Priority:-2 extents:1 across:262140k SS
Starting logging: OK
read-only file system detected...done
Starting system message bus: dbus-daemon[72]: Failed to start message bus: Failed to open socket: Fd
done
Starting network: ip: socket: Function not implemented
ip: socket: Function not implemented
FAIL

Welcome to Miyoo
miyoo login: 
```

看起来已经接近成功，可以 login 进去看日志了吧？结果一个 bug 拦住了我：**所有按键按下去都没反应，完全登陆不了终端，怎么办**？

我从来没做过这种层面的硬件改造，也没用过 UART 串口。因此这个问题对我相当棘手——既可能是硬件问题，也可能是软件问题。但总该是个可以解决的问题吧。

* 首先软件上，我反复确认了串口通信软件的配置，并梳理了 Linux 启动时的相关配置流程，将机器 EXT4 格式的 rootfs 分区挂载到 Mac 上，确认了 `/etc/inittab` 的配置和它启动的 `/etc/main` 脚本都是有效的，排除了设备侧的软件问题。
* 然后在硬件上，我确认了电路不存在虚焊，并实验改用树莓派与 Mac 做串口通信，确认了此时终端可以正常使用，排除了外围硬件的问题。
* 最后，我发现与树莓派通信时，Mac 侧按键可以让转接头的 RX 和 TX 灯都闪亮。但连接 Miyoo 时，按键时只会让 Mac 侧的 TX 发送端闪亮，没有收到本应经过 RX 返回的信号。因此推测问题在于这个接口的 RX 线路 。我整理了详尽的现象询问司徒后，得到的回复是：UART 与耳机共用，必须重新编译 Linux 内核才行。

好吧，我居然一路 debug 碰到了个物理电路设计的**硬件问题**。那就接着改 Linux 内核呗。

## 定制 Linux 内核驱动
根据司徒提供的线索，我开始尝试将音频驱动从 Miyoo 的 Linux 内核源码中屏蔽掉。我们都知道 Linux 是宏内核，大量硬件驱动的源码全都在里面。简单改改驱动，其实不是件多高大上的事情。

首先，我们至少要能把内核编译出来。注意内核不等于嵌入式 Linux 的系统。一个完整的嵌入式 Linux 系统，应该大致包括这几部分：

* **Kernel** - 包含操作系统的核心子系统，以及所需的硬件驱动
* **Rootfs** - 根文件系统，大致就是根目录下面放的那堆二进制应用
* **UBoot** - 引导加载程序，本身相当于一个非常简单的操作系统

我们只是想禁用掉音频驱动，因此只需要重新编译出 Kernel 就行。Kernel 会编译成名为 zImage 的镜像。这个过程的用户体验其实和编译普通的 C 项目没有什么区别，也就是先配好编译参数和环境变量，然后 `make` 就行了：

``` bash
make miyoo_defconfig
make zImage
```

在我 MacBook Pro 的 Docker 里，大致需要 12 分钟才能把内核编译出来。这里贴个图，纪念下职业生涯第一次编译出的 Linux 内核：

![](https://ewind.us/images/miyoo/compile-kernel.jpg)

编译通过后，我非常开心地直接开始尝试修改内核的驱动（注意我没有真机测试这个第一次编译出的内核，这是伏笔）。经过一番研究，我发现嵌入式 Linux 的硬件都是通过一种名叫设备树的 DSL 代码来描述的，修改这种 DSL 应该就能使 Kernel 不支持某种硬件了。于是我找到了 Miyoo 设备树里的音频部分，将其注释掉，尝试编译出不包括音频的设备树描述文件，把它装上去。

**然后机器启动后就黑屏了**。

……

看来设备树的配置不管用，我又想到了直接修改音频驱动的 C 源码。它就是内核项目的 `/sound/soc/suniv/miyoo.c`，里面的 C 代码看起来并不难，但我尝试了不下七八种修改手法，就是编译不出一份正常的镜像：有时候可以解决 UART 无法登陆的问题，有时则不行，并且黑屏问题也始终没有解决。为什么音频驱动会影响视频输出，这让我十分困扰，甚至一度怀疑起了我的工具链。

最终，我得到了一个令人震惊的结论：

**这份内核代码哪怕完全不改，编译出来都是会黑屏的**。

……

于是，我换了社区版本的内核代码，屏幕顺利点亮，问题解决。

但是，社区版本的内核是老外维护的，他们的用户习惯里，A 键和 B 键的定义是相反的（小时候玩过美版 PSP 的同学应该知道我是什么意思）。于是我又开始折腾，尝试如何交换 A 和 B 的位置。

结果，我遇到了一个更加诡异的问题，那就是只要我在键盘驱动里交换 A 和 B 的值，要么不生效，要么就总会有其它的按键失灵，不能完全交换成功。

于是，我去仔细研究了按键驱动所对应的 Linux 内核 GPIO 部分的文档，检查了 init 和 scan 阶段下这一驱动的行为，甚至怀疑按键的宏定义会影响位运算的结果……结果都没什么卵用。但我还是找到了个能显示按键信息的调试用宏，之前一直懒得浪费一次编译时间去打开它，干脆把它启用后再试一下。

结果，我又得到了一个令人震惊的结论：

**这份代码把变量的名字写错了。该对换的变量不是 A 和 B，是 A 和 X**。

……

看来我果然没有写 Linux 内核的天赋，还是老老实实回去移植 JS 引擎吧。

## 移植 JS 引擎
搞定内核层以后，我们就可以轻松登录进 Miyoo 的控制台了。用户名是 root，没有密码。绕了这么多弯子，第一次登陆成功的时候还是让人很激动的。截图纪念一下：

![](https://ewind.us/images/miyoo/login.jpg)

接下来应用层的 JS 引擎移植，对我来说就是轻车熟路了。这里祭出我们的老朋友 [QuickJS](https://bellard.org/quickjs/) 引擎，它作为一个超迷你的嵌入式 JS 引擎，甚至已经兼容了不少 ES2020 里的特性。由于它没有任何第三方依赖，把它迁移到 Miyoo 上，其实并没有多难，给 Makefile 加上个 `CROSS_PREFIX=arm-miyoo-linux-uclibcgnueabi-` 的编译配置，就可以用交叉编译器来编译它了。

交叉编译自然也很难一帆风顺。这里我遇到的编译错误，都来自嵌入式环境下的标准库能力缺失。不过其实也只有这两点：

* `malloc_usable_size`  不支持，这会影响内存度量数据的获取，但 JS 照样可以跑得很欢。顺便一提从源码来看，这个能力在 WASM 里也不支持。所以其实已经有人把 QuickJS 编译成 WASM，玩起 JS in JS 的套娃了。
* `fenv.h` 缺失，这应该会影响浮点数的 rounding 方式，但实测对 `Math.ceil` 和 `Math.floor` 无影响。先不管了，反正又不是不能用（喂）

这点小问题，简单 patch 一下相关代码以后就搞定了。编译成功后，把它复制到 rootfs 分区的 `/usr/bin` 目录下，即可在在 Miyoo 的 Shell 里用 `qjs` 命令运行 JS 了。这下终于爽了，看我回到主场，噼里啪啦写段 JS 测试一下：

``` js
import { setTimeout } from 'os'

const wait = timeout =>
  new Promise(resolve => setTimeout(resolve, timeout))

let i = 0
;(async () => {
  while (true) {
    await wait(2000)
    console.log(`Hello World ${i}!`)
    i++
  }
})()
```

截图为证，我真的是在 Miyoo 里面跑的：

![](https://ewind.us/images/miyoo/console.jpg)

但是这个 JS 代码的运行结果又该怎么输出到真机上呢？我们知道 Linux 上有默认的 `/dev/console` 系统控制台和 `/dev/tty1` 虚拟终端，因此只要在启动时的 `inittab` 里把 `console::respawn:/etc/main` 改成 `tty1::respawn:/etc/main`，就可以输出到图形化的虚拟终端了。像这样：

![](https://ewind.us/images/miyoo/ported.jpg)

## 支持 VSCode 调试器
JS 都能跑了，日志都能看了，还要啥自行车呢？当然是支持给它下断点啊！我本来一直以为断点调试必须要用 V8 那样的重型引擎配合 Chrome 才行，结果让我惊喜的是，社区已经为 QuickJS 实现了一个支持调试器的 fork，这样只需要 VSCode 作为调试器前端，就能调试 QuickJS 引擎运行时的代码了。配合 VSCode 的 Remote 功能，这玩意的想象空间实在很大。

这一步的支持是全文中最省事的。因为我只在 Mac 上做了个验证，编译一次通过，没什么好说的。效果像这样：

![](https://ewind.us/images/miyoo/debugger.jpg)

图中你看到的 VSCode Debugger 背后可不是 V8，而是正经的 QuickJS 引擎噢。我也用 VSCode 调试过 Dart 和 C++ 的代码，当时我没有想到过这样的一套调试器该如何由一门第三方语言接入。搜索之后我发现，微软甚至已经为编辑器与任意第三方语言之间设计了一个名为 Debug Adapter Protocol 的通用调试协议，它很具备启发性。原来我觉得十分高大上的编程语言调试系统，也是能用断点、异常等概念来抽象化和结构化，并设计出通用协议的。微软在工程设计和文档上的积累真不是盖的，赞一个。

现在，我已经将这个支持 VSCode 调试的 QuickJS 版本编译到了 Miyoo 上，只是还没有做过实际的调试——有了定制内核驱动时不停给自己挖坑的教训，我现在自然不敢立 Flag 说它能用了（捂脸）

到此为止，本次实验所关注的能力都已经得到基本的验证了。相应的 Docker 镜像我也已发布到 GitHub，参见 [MiyooSDK](https://github.com/doodlewind/MiyooSDK)。也欢迎大家的交流。

## 后记
这次写的又是一篇长文，这整套工作远没有文章写下来那么一气呵成，而是断断续续地逐步完成的。现在我手上的东西，还只是个初步的工程原型，有很多工作还可以继续深入。比如这些地方：

* 还不支持 USB 通信，不能 SSH 登录
* 还没有为 JS 实现 C 的 GUI 渲染器
* 还没有移植 JS 的上层框架

不过，只要有热情持续深入技术，那么收获一定不会让你失望。像大家眼里神秘的 Linux 内核，其实也是个有规可循的程序。即便是我这样本职写 JavaScript 的玩票选手，照样可以拿通用的科学方法论来实验分析它，而这个过程就像玩密室逃脱或者解谜游戏一样有趣——**你知道问题一定能解决，只要用逻辑推理，找到房间里隐藏的那个开关就行**。

我要特别感谢司徒，他为开源掌机的发展作出了巨大的贡献。这次最为疑难的硬件电路 bug，也是由他提供了关键信息后才最终得以解决的。很多时候我们缺的不是繁冗琐碎的入门指南，而是来自更高段位者，一两句话让你茅塞顿开的点拨。他就是这样一位令人尊敬的技术人。

这里跑个题，淘宝上有不少用司徒系统的名义销售掌机的店铺，这些商家其实已经与他本人完全无关了。虽然我仍然很推荐大家入手这个只要一百多块钱的 Miyoo 掌机用于娱乐或技术研究，但我还是有些感慨。所谓遍身罗绮者，不是养蚕人，大抵如此吧。

从搭建工具链到焊接电路板，再到定制 Linux 内核和 JS 引擎，这些技术本身固然都有点门槛。但富有乐趣的目标，总能让我们更有动力去克服中途的各种困难。我相信兴趣和热情总是最能刺激求知欲的，而永不知足的求知欲，才能驱动我们不停越过一个个山丘。毕竟乔帮主提过的那句名言是怎么说的来着？

**Stay Hungry. Stay Foolish.**


> 我主要是个前端开发者。如果你对 Web 编辑器、WebGL 渲染、Hybrid 架构设计，或者计算机爱好者的碎碎念感兴趣，欢迎关注我噢 :)
