categories: Note

tags:

- JS
- Assembly

date: 2017-01-19

toc: true

title: JS 实现 Chip8 汇编模拟器
---

[Merry8](https://github.com/doodlewind/merry8) 是一个使用 JS 实现的 Chip8 汇编语言模拟器，支持运行经典的【PONG】等游戏。这里总结一下它的实现过程。

<!--more-->

## Chip8 基础
Chip8 是上世纪 70 年代的一种中古汇编语言。但和 NES 使用的 6502 汇编不同，Chip8 并没有一种官方的硬件实现。只要按照它的规范实现了完整的指令集，就可以运行兼容的 ROM 了。由于其结构的简单，它非常适合作为模拟器开发的入门语言。

符合 Chip8 规范的虚拟机，可使用的资源包括：

* 4KB 大小的内存
* V0 到 V15 共 16 个 16 位寄存器
* 一个 PC 计数器
* 一个 I 索引寄存器
* 一个 SP 栈指针
* 一个延迟定时器
* 一个 16 键的键盘
* 一个音效寄存器
* 一个 64x32 的黑白屏幕

基础的 Chip8 规范共有 35 条指令，虽然每条指令长度都固定在 2 个字节，但不同指令中的参数格式是不同的。例如读取指令字节码为 `60 12` 时，首先匹配出该指令是 `6xkk` 指令，第一个操作数为 `0` 而第二个操作数为 `12`。根据文档，这条指令的功能就是将 `0x12` 这个操作数写入 `V0` 寄存器。这样，只要实现了上述的硬件和指令逻辑，实际上就实现了一个 Chip8 的虚拟机。将这个虚拟机封装为对用户可用的应用后，就完成整个模拟器的开发。


## 反汇编器
模拟器输入的内容是一条条的机器指令。因此，要实现模拟器，首先需要解析 Chip8 的 ROM 文件，提取出一个 ROM 中完整的指令。实现这个功能的模块称为反汇编器。

ES5 规范下的 `Uint8Array` 类型数组非常适合用于存储 Chip8 的 ROM 文件。每次读取 2 个字节（如 `00 EE`）后，只需根据每条指令的特征，即可判断出这条指令的内容，和其对应的操作数。将这些内容 log 出来后，反汇编器就完成了。其中的核心实现示例如下：

``` js
// input 16bits ins 0x0000
const getIns = (ins) => {
  // 00E0 - CLS
  if (ins === 0x00E0) {
    return ['00E0', 'CLS']
  }
  // 00EE - RET
  else if (ins === 0x00EE) {
    return ['00EE', 'RET']
  }
  // 1nnn - JP addr
  else if (ins >>> 12 === 0x1) {
    return ['1nnn', 'JP', ins & 0x0FFF]
  }
  // ...
}
```


## CPU
反汇编器实现后，就可以着手实现 CPU 了。Chip8 的 CPU 结构并不复杂，操作基本以简单的四则运算和直接的地址读写／跳转为主。在一个 `while` 循环中不停地执行这样的取指 - 执行操作，就是一个 CPU 了。

Merry8 的实现中，利用了 JS 灵活的 `Object` 类型，将 CPU 的 35 条指令实现为 35 个函数，它们以指令名为 key，放置在一个 `ops` 对象中。每次 Main Loop 先从反汇编器中获取到指令名 `ins`，然后以 `ops[ins](args)` 的方式调用模拟相应指令的函数，传入寄存器和内存等 Chip8 资源等状态变量，返回指令执行的结果。`ops` 对象的示例如下：

``` js
const ops = {
  // 00EE - RET
  // Return from a subroutine.
  '00EE': (ins, c8) => {
    c8.PC = c8.STACK[--c8.SP] + 2
    return c8
  },
  // 1nnn - JP addr
  // Jump to location nnn.
  '1nnn': (ins, c8) => {
    let [, , addr] = ins
    c8.PC = addr
    return c8
  },
  // ...
}
```

而 Main 循环的示例如下：

``` js
const getIns = require('./utils/disassembler').getIns
const read = (mem, pc) => mem[pc] << 8 | mem[pc + 1]
const c8 = {
  MEM: new Uint8Array(0xFFF), // TODO
  V: new Uint8Array(16),
  STACK: new Uint16Array(16),
  KEYS: Array.from({ length: 16 }, k => false),
  I: 0x0000,
  PC: 0x0200,
  SP: 0x00,
  DELAY: 0x00,
  SOUND: 0x00
}

while (true) {
  let ins = getIns(read(c8.MEM, c8.PC))
  ops[ins[0]](ins, c8)
}
```

上面示例的 `TODO` 部分中，直接将一个空的 `Uint8Array` 塞进了内存中。这样相当于载入了一个空 ROM，是不能正常运行的。实际使用时，将 `MEM` 部分从 `0x200` 开始替换为实际的 ROM 内容即可。

## 显示 / IO
Chip8 的显示功能是直接在一条 CPU 指令中实现的。这条 `Dxyn` 指令在 `ops` 中调用了 `display` 模块来实现对图形的绘制。这个模块将屏幕实现为一个 64x32 的布尔值数组，每次更新数组中的特定部分后，通过 Canvas 将数组渲染到页面上。

在 IO 方面，Chip8 同样是通过特定的 IO 指令来检测按键是否按下。实际 ROM 中的执行流程一般是：定时器以 60Hz 的频率触发对按键的检查指令，并根据指令的检查结果来判断是否需要跳转。


## 封装和打包
在实现了基础的模拟器后，最后要做的就是封装接口，并通过打包工具将源码构建发布了。对一个纯 JS 项目，使用 Webpack 只需要如下的一点配置即可：

``` js
var path = require('path')

module.exports = {
  entry: './src/entry.js',
  output: {
    path: path.join(__dirname, '/dist'),
    filename: 'bundle.js'
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: 'babel?presets[]=es2015',
        exclude: /node_modules/
      }
    ]
  }
}
```

将上例存为项目根目录下的 `webpack.config.js` 后，即可在项目根目录下运行 `webpack --watch` 打开发环境的包，运行 `webpack -p` 打生产环境包了。

在最后输出的构建文件中，JS 实际上是对环境敏感的。例如，模拟器所需的 ROM 在 Node 环境下是通过 `fs` 模块加载的，而在浏览器环境下是通过 `XHR` 请求加载的。在打包时如果 JS 代码依赖了 `fs` 模块，就会产生引用错误而导致打包失败。类似的情景还有 `display` 模块。在浏览器环境下这个模块需要绘制 Canvas，但在 Node 环境下它只需要输出 `console.log` 的日志信息即可。

这些需要对 JS 运行环境敏感的代码部分，可以显式地通过指定 Webpack 的不同入口来兼容浏览器和 Node 两套环境。具体做法是，通过 `module.export` 将核心的反汇编／CPU 等模块封装为对运行环境不敏感的模块，然后分别设置两个入口 JS 来引入这些模块，例如：

* Node 环境下的 `main.js` 在 `package.json` 中指定，在其中引入 `fs` 等 Node 模块。
* 浏览器环境下的 `entry.js` 在 `webpack.config.js` 中指定，在其中使用 `window` 等浏览器环境下的接口。

由于 Chip8 设置了一个 60Hz 的定时器来触发 `DRW` 等 IO 和绘图指令，因此在模拟器中需要对其有一个相应的实现。由于浏览器环境中的 `requestAnimationFrame` 恰好也是以 60fps 速度执行的，因此在实现中也采用了这个 API 来实现在页面上的流畅绘图。
