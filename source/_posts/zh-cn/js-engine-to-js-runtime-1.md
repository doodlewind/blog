categories: Note

tags:

- Web
- JS

date: 2020-01-29

toc: true

title: 从 JS 引擎到 JS 运行时（上）
---

<!-- ![](https://ewind.us/images/js-engine-to-js-runtime/intro.png) -->

V8 和 Node.js 的关系，是许多前端同学们所津津乐道的——浏览器里的语言，又兼容了浏览器外的环境，两份快乐重叠在一起。而这两份快乐，又带来了更多的快乐……但你有没有想过，这两份快乐到底是如何重叠在一起的呢？下面我们将以嵌入式 JS 引擎 QuickJS 为例，介绍一个 JS 引擎是如何被逐步定制为一个新的 JS 运行时的。

<!-- more -->

本文将分上下两篇，逐一覆盖（或者说，用尽可能简单的代码实现）这些内容：

* 集成嵌入式 JS 引擎
* 为 JS 引擎扩展原生能力
* 移植默认 Event Loop
* 支持 libuv Event Loop
* 支持宏任务与微任务

上篇主要涉及前三节，主要介绍 QuickJS 这一嵌入式 JS 引擎自身的基本使用，并移植其自带的 Event Loop 示例。而下篇所对应的后两节中，我们将引入 libuv，讲解如何基于 libuv 实现扩展性更好的 Event Loop，并支持宏任务与微任务。

闲话少说，进入白学现场吧 :)

## 集成嵌入式 JS 引擎
在我的理解里，JS 引擎的「嵌入式」可以从两种层面来理解，一种意味着它面向低端的嵌入式设备，另一种则说明它很易于**嵌入到原生项目中**。而 JS 运行时 (Runtime) 其实也是一种原生项目，它将 JS 引擎作为专用的解释器，为其提供操作系统的网络、进程、文件系统等平台能力。因此，要想自己实现一个 JS 运行时，首先应该考虑的自然是「如何将 JS 引擎嵌入到原生项目中」了。

> 本节内容是面向我这样前端背景（没有正经做过 C / C++ 项目）的同学的，熟悉的小伙伴可以跳过。

怎样才算将 JS 引擎嵌入了呢？我们知道，最简单的 C 程序就是个 main 函数。如果我们能在 main 函数里调用引擎执行一段 JS 代码，那不就成功「嵌入」了吗——就好像只要在地球两头各放一片面包，就能把地球做成三明治一样。

所以，又该怎样在自己写的 C 代码中调用引擎呢？从 C 开发者的视角看，JS 引擎也可以被当作一个第三方库来使用，它的集成方式和普通的第三方库并没有什么不同，简单说包括这几步：

1. 将引擎源码编译为库文件，这既可以是 `.a` 格式的静态库，也可以是 `.so` 或 `.dll` 格式的动态库。
2. 在自己的 C 源码中 include 引擎的头文件，调用它提供的 API。
3. 编译自己的 C 源码，并链接上引擎的库文件，生成最终的可执行文件。

对 QuickJS 来说，只要一行 `make && sudo make install` 就能完成编译和安装（再啰嗦一句，原生软件包的所谓安装，其实就是把头文件与编译出来的库文件、可执行文件，分别复制到符合 Unix 标准的目录下而已），然后就可以在我们的 C 源码里使用它了。

完成 QuickJS 的编译安装后，我们甚至不用亲自动手写 C，可以偷懒让 QuickJS 帮你生成，因为它支持把 JS 编译到 C 噢。像这样的一行 JS：

``` js
console.log("Hello World");
```

就可以用 `qjsc -e` 命令编译成这样的 C 源码：

``` c
#include <quickjs/quickjs-libc.h>

const uint32_t qjsc_hello_size = 87;

const uint8_t qjsc_hello[87] = {
 0x02, 0x04, 0x0e, 0x63, 0x6f, 0x6e, 0x73, 0x6f,
 0x6c, 0x65, 0x06, 0x6c, 0x6f, 0x67, 0x16, 0x48,
 0x65, 0x6c, 0x6c, 0x6f, 0x20, 0x57, 0x6f, 0x72,
 0x6c, 0x64, 0x22, 0x65, 0x78, 0x61, 0x6d, 0x70,
 0x6c, 0x65, 0x73, 0x2f, 0x68, 0x65, 0x6c, 0x6c,
 0x6f, 0x2e, 0x6a, 0x73, 0x0e, 0x00, 0x06, 0x00,
 0x9e, 0x01, 0x00, 0x01, 0x00, 0x03, 0x00, 0x00,
 0x14, 0x01, 0xa0, 0x01, 0x00, 0x00, 0x00, 0x39,
 0xf1, 0x00, 0x00, 0x00, 0x43, 0xf2, 0x00, 0x00,
 0x00, 0x04, 0xf3, 0x00, 0x00, 0x00, 0x24, 0x01,
 0x00, 0xd1, 0x28, 0xe8, 0x03, 0x01, 0x00,
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

这不就是我们要的 main 函数示例吗？这个 Hello World 已经变成了数组里的字节码，嵌入到最简单的 C 项目中了。

> 注意这其实只是把 JS 编译成字节码，再附上个 main 胶水代码入口而已，不是真的把 JS 编译成 C 啦。

当然，这份 C 源码还要再用 C 编译器编译一次才行。就像使用 Babel 和 Webpack 时的配置那样，原生工程也需要构建配置。对于构建工具，这里选择了现代工程中几乎标配的 [CMake](https://cmake.org/)。和这份 C 源码相配套的 `CMakeLists.txt` 构建配置，则是这样的：

```
cmake_minimum_required(VERSION 3.10)
# 约定 runtime 为最终生成的可执行文件
project(runtime)
add_executable(runtime
        # 若拆分了多个 C 文件，逐行在此添加即可
        src/main.c)

# 导入 QuickJS 的头文件和库文件
include_directories(/usr/local/include)
add_library(quickjs STATIC IMPORTED)
set_target_properties(quickjs
        PROPERTIES IMPORTED_LOCATION
        "/usr/local/lib/quickjs/libquickjs.a")

# 将 QuickJS 链接到 runtime
target_link_libraries(runtime
        quickjs)
```

CMake 的使用很简单，在此不再赘述。总之，上面的配置能编译出 `runtime` 二进制文件，直接运行它能输出 Hello World，知道这些就够啦。

## 为 JS 引擎扩展原生能力
上一步走通后，我们其实已经将 JS 引擎套在了一个 C 程序的壳里了。然而，这只是个「纯净版」的引擎，也就意味着它并不支持语言标准之外，任何由平台提供的能力。像浏览器里的 `document.getElementById` 和 Node.js 里的 `fs.readFile`，就都属于这样的能力。因此，在实现更复杂的 Event Loop 之前，我们至少应该能在 JS 引擎里调用到自己写的 C 原生函数，就像浏览器控制台里司空见惯的这样：

```
> document.getElementById
ƒ getElementById() { [native code] }
```

所以，该怎样将 C 代码封装为这样的函数呢？和其它 JS 引擎一样地，QuickJS 提供了标准化的 API，方便你用 C 来实现 JS 中的函数和类。下面我们以计算斐波那契数的递归 fib 函数为例，演示如何将 JS 的计算密集型函数改由 C 实现，从而大幅提升性能。

JS 版的原始 fib 函数是这样的：

``` js
function fib(n) {
  if (n <= 0) return 0;
  else if (n === 1) return 1;
  else return fib(n - 1) + fib(n - 2);
}
```

而 C 版本的 fib 函数则是这样的，怎么看起来这么像呢？

``` c
int fib(int n) {
  if (n <= 0) return 0;
  else if (n == 1) return 1;
  else return fib(n - 1) + fib(n - 2);
}
```

要想在 QuickJS 引擎中使用上面这个 C 函数，大致要做这么几件事：

1. 把 C 函数包一层，处理它与 JS 引擎之间的类型转换。
2. 将包好的函数挂载到 JS 模块下。
3. 将整个原生模块对外提供出来。

这一共只要约 30 行胶水代码就够了，相应的 `fib.c` 源码如下所示：

``` c
#include <quickjs/quickjs.h>
#define countof(x) (sizeof(x) / sizeof((x)[0]))

// 原始的 C 函数
static int fib(int n) {
    if (n <= 0) return 0;
    else if (n == 1) return 1;
    else return fib(n - 1) + fib(n - 2);
}

// 包一层，处理类型转换
static JSValue js_fib(JSContext *ctx, JSValueConst this_val,
                      int argc, JSValueConst *argv) {
    int n, res;
    if (JS_ToInt32(ctx, &n, argv[0])) return JS_EXCEPTION;
    res = fib(n);
    return JS_NewInt32(ctx, res);
}

// 将包好的函数定义为 JS 模块下的 fib 方法
static const JSCFunctionListEntry js_fib_funcs[] = {
    JS_CFUNC_DEF("fib", 1, js_fib ),
};

// 模块初始化时的回调
static int js_fib_init(JSContext *ctx, JSModuleDef *m) {
    return JS_SetModuleExportList(ctx, m, js_fib_funcs, countof(js_fib_funcs));
}

// 最终对外的 JS 模块定义
JSModuleDef *js_init_module_fib(JSContext *ctx, const char *module_name) {
    JSModuleDef *m;
    m = JS_NewCModule(ctx, module_name, js_fib_init);
    if (!m) return NULL;
    JS_AddModuleExportList(ctx, m, js_fib_funcs, countof(js_fib_funcs));
    return m;
}
```

上面这个 `fib.c` 文件只要加入 `CMakeLists.txt` 中的 `add_executable` 项中，就可以被编译进来使用了。这样在原本的 `main.c` 入口里，只要在 eval JS 代码前多加两行初始化代码，就能准备好带有原生模块的 JS 引擎环境了：

``` c
// ...
int main(int argc, char **argv)
{
  // ...
  // 在 eval 前注册上名为 fib.so 的原生模块
  extern JSModuleDef *js_init_module_fib(JSContext *ctx, const char *name);
  js_init_module_fib(ctx, "fib.so");

  // eval JS 字节码
  js_std_eval_binary(ctx, qjsc_hello, qjsc_hello_size, 0);
  // ...
}
```

这样，我们就能用这种方式在 JS 中使用 C 模块了：

``` js
import { fib } from "fib.so";

fib(42);
```

作为嵌入式 JS 引擎，QuickJS 的默认性能自然比不过带 JIT 的 V8。实测 QuickJS 里 `fib(42)`  需要约 30 秒，而 V8 只要约 3.5 秒。但一旦引入 C 原生模块，QuickJS 就能一举超越 V8，在不到 2 秒内完成计算，**轻松提速 15 倍**！

> 可以发现，现代 JS 引擎对计算密集任务的 JIT 已经很强，因此如果将浏览器里的 JS 替换为 WASM，加速效果未必足够理想。详见我的这篇文章：[一个白学家眼里的 WebAssembly](https://zhuanlan.zhihu.com/p/102692865)。


## 移植默认 Event Loop
到此为止，我们应该已经明白该如何嵌入 JS 引擎，并为其扩展 C 模块了。但是，上面的 `fib` 函数只是个同步函数，并不是异步的。各类支持回调的异步能力，是如何被运行时支持的呢？这就需要传说中的 Event Loop 了。

目前，前端社区中已有太多关于 Event Loop 的概念性介绍，可惜仍然鲜有人真正用简洁的代码给出可用的实现。好在 QuickJS 随引擎附带了个很好的例子，告诉大家如何化繁为简地从头实现自己的 Event Loop，这也就是本节所希望覆盖的内容了。

Event Loop 最简单的应用，可能就是 setTimeout 了。和语言规范一致地，QuickJS 默认并没有提供 setTimeout 这样需要运行时能力的异步 API 支持。但是，引擎编译时默认会内置 `std` 和 `os` 两个原生模块，可以这样使用 setTimeout 来支持异步：

``` js
import { setTimeout } from "os";

setTimeout(() => { /* ... */ }, 0);
```

稍微检查下源码就能发现，这个 `os` 模块并不在 `quickjs.c` 引擎本体里，而是和前面的 `fib.c` 如出一辙地，通过标准化的 QuickJS API 挂载上去的原生模块。这个原生的 setTimeout 函数是怎么实现的呢？它的源码其实很少，像这样：

``` c
static JSValue js_os_setTimeout(JSContext *ctx, JSValueConst this_val,
                                int argc, JSValueConst *argv)
{
    int64_t delay;
    JSValueConst func;
    JSOSTimer *th;
    JSValue obj;

    func = argv[0];
    if (!JS_IsFunction(ctx, func))
        return JS_ThrowTypeError(ctx, "not a function");
    if (JS_ToInt64(ctx, &delay, argv[1]))
        return JS_EXCEPTION;
    obj = JS_NewObjectClass(ctx, js_os_timer_class_id);
    if (JS_IsException(obj))
        return obj;
    th = js_mallocz(ctx, sizeof(*th));
    if (!th) {
        JS_FreeValue(ctx, obj);
        return JS_EXCEPTION;
    }
    th->has_object = TRUE;
    th->timeout = get_time_ms() + delay;
    th->func = JS_DupValue(ctx, func);
    list_add_tail(&th->link, &os_timers);
    JS_SetOpaque(obj, th);
    return obj;
}
```

可以看出，这个 setTimeout 的实现中，并没有任何多线程或 poll 的操作，只是把一个存储 timer 信息的结构体通过 `JS_SetOpaque` 的方式，挂到了最后返回的 JS 对象上而已，是个非常简单的同步操作。因此，就和调用原生 fib 函数一样地，**在 eval 执行 JS 代码时，遇到 setTimeout 后也是同步地执行一点 C 代码后就立刻返回，没有什么特别之处**。

但为什么 setTimeout 能实现异步呢？关键在于 eval 之后，我们就要启动 Event Loop 了。而这里的奥妙其实也在 QuickJS 编译器生成的代码里明确地写出来了，没想到吧：

``` c
// ...
int main(int argc, char **argv)
{
  // ...
  // eval JS 字节码
  js_std_eval_binary(ctx, qjsc_hello, qjsc_hello_size, 0);
  // 启动 Event Loop
  js_std_loop(ctx);
  // ...
}
```

因此，eval 后的这个 `js_std_loop` 就是真正的 Event Loop，而它的源码则更是简单得像是伪代码一样：

``` c
/* main loop which calls the user JS callbacks */
void js_std_loop(JSContext *ctx)
{
    JSContext *ctx1;
    int err;

    for(;;) {
        /* execute the pending jobs */
        for(;;) {
            err = JS_ExecutePendingJob(JS_GetRuntime(ctx), &ctx1);
            if (err <= 0) {
                if (err < 0) {
                    js_std_dump_error(ctx1);
                }
                break;
            }
        }

        if (!os_poll_func || os_poll_func(ctx))
            break;
    }
}
```

这不就是在双重的死循环里先执行掉所有的 Job，然后调 `os_poll_func` 吗？可是，for 循环不会吃满 CPU 吗？这是个前端同学们容易误解的地方：**在原生开发中，进程里即便写着个死循环，也未必始终在前台运行，可以通过系统调用将自己挂起**。

例如，一个在死循环里通过 sleep 系统调用不停休眠一秒的进程，就只会每秒被系统执行一个 tick，其它时间里都不占资源。而这里的 `os_poll_func` 封装的，就是原理类似的 poll 系统调用（准确地说，用的其实是 select），从而可以借助操作系统的能力，使得只在【定时器触发、文件描述符读写】等事件发生时，让进程回到前台执行一个 tick，把此时应该运行的 JS 回调跑一遍，而其余时间都在后台挂起。在这条路上继续走下去，就能以经典的异步非阻塞方式来实现整个运行时啦。

> poll 和 select 想实现的东西是一致的，只是原理不同，前者性能更好而后者更简单而已。

鉴于 `os_poll_func` 的代码较长，这里只概括下它与 timer 相关的工作：

* 如果上下文中存在 timer，将到期 timer 对应的回调都执行掉。
* 找到所有 timer 中最小的时延，用 select 系统调用将自己挂起这段时间。

这样，setTimeout 的流程就说得通了：**先在 eval 阶段简单设置一个 timer 结构，然后在 Event Loop 里用这个 timer 的参数去调用操作系统的 poll，从而在被唤醒的下一个 tick 里把到期 timer 对应的 JS 回调执行掉就行**。

所以，看明白这个 Event Loop 的机制后，就不难发现如果只关心 setTimeout 这个运行时 API，那么照抄，啊不移植的方法其实并不复杂：

* 将 `os` 原生模块里的 setTimeout 相关部分，仿照 fib 的形式抄进来。
* 将 `js_std_loop` 及其依赖抄进来。

这其实就是件按部就班就能完成的事，实际代码示例会和下篇一起给出。

到现在为止这些对 QuickJS 的分析，是否能让大家发现，许多经常听到的高大上概念，实现起来其实也没有那么复杂呢？别忘了，QuickJS 出自传奇程序员 Fabrice Bellard。读他代码的感受，就像读高中习题的参考答案一样，既不漏过每个关键的知识点又毫不拖泥带水，非常有启发性。他本人也像金庸小说里创造「天下武学正宗」的中神通王重阳那样，十分令人叹服。带着问题阅读更高段位的代码，也几乎总能带来丰富的收获。

好了，这就是上篇的全部内容了。在接下来的下篇中，我们将在熟悉了 QuickJS 和 Event Loop 的基础上，将 Event Loop 改由更可扩展的 libuv 来实现，届时全文涉及的代码示例也将一并给出。如果感兴趣，敬请关注我的「[前端随想录](https://zhuanlan.zhihu.com/fe-fantasy)」专栏噢～
