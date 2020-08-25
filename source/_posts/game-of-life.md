categories: Note

tags:

- Web
- WebGL

date: 2020-08-25

toc: true

title: 用网页模拟生命：WebGL 版康威生命游戏
---

值此七夕佳节之际，正适合讨论创造生命的话题。虽然你未必有机会谈一笔几个亿的大生意，但有了 JavaScript，在网页里征服几百万个像素还是绰绰有余的——这就是我们这次的主题，[康威生命游戏](https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life)。

<!--more-->

康威生命游戏，是英国数学家 John Horton Conway 发明的一种元胞自动机（记得这个概念吗？它可以用来证明 CSS 的图灵完备性）。这个游戏的规则（亦即代码实现）极为简单，但却能得到相当令人惊叹的「演化」式效果。得益于其规则的简单性，本文其实更可以当作一篇 WebGL 的入门教程——当然，还是基于我们自己的 WebGL 基础库 [Beam](https://zhuanlan.zhihu.com/p/93500639) 做了大幅简化的。

## 背景
所谓生命游戏，其实只是一套在二维网格上进行的计算规则而已。假设每个网格内有一个细胞，它在下一个时刻的生死，取决于相邻 8 个网格中的活细胞数量：

* 如果周围活细胞过多，这个细胞会因为资源匮乏而死去（内卷）。
* 如果周围活细胞过少，它也会因为太孤单而死去（人口过少）。
* 如何周围活细胞数量合适，死细胞所在网格也可以变成存活状态（繁殖）。

这套规则的具体实现可以自由发挥，其中康威的版本最为经典，但其实也很简单：

* 如果当前细胞存活，且周围活细胞数为 2 或 3，保持原样。
* 如果当前细胞存活，且周围活细胞数小于 2，该细胞死亡。
* 如果当前细胞存活，且周围活细胞超过 3 个，该细胞死亡。
* 如果当前细胞死亡，且周围活细胞为 3 个，该细胞转为存活。

理解这几条规则后，就很容易解读下面这种周期状态了：


![hwss](/images/game-of-life/hwss.gif)

相对更复杂一些的，是可持续的繁殖模式。像这样：

![glider-gun](/images/game-of-life/glider-gun.gif)

不过这显然还不是最壮观的景象。本文题图中的效果要比这些简单图案复杂得多，在后面我们会看到如何编码实现它。

那么，我们要从哪里开始呢？在进入 WebGL 之前，不妨先用朴素的实现练练手吧。

## 朴素实现
如果仅仅给定上面这几条生命游戏规则，不限制实现方式和性能，相信很多做题家同行们应该随手就能写出来——只要用装着 `0` 或 `1` 的 `number[][]` 二维数组来存储状态，然后逐帧更新即可：

``` js
function update (oldCells) {
  const newCells = []
  for (let i = 0; i < oldCells.length; i++) {
    const row = []
    for (let j = 0; j < oldCells[i].length; j++) {
      const oldCell = get(oldCells, i, j)
      const total = (
        get(oldCells, i - 1, j - 1) +
        get(oldCells, i - 1, j) +
        get(oldCells, i - 1, j + 1) +
        get(oldCells, i, j - 1) +
        get(oldCells, i, j + 1) +
        get(oldCells, i + 1, j - 1) +
        get(oldCells, i + 1, j) +
        get(oldCells, i + 1, j + 1)
      )
      let newCell = 0
      if (oldCell === 0) {
        if (total === 3) newCell = 1
      }
      else if (total === 2 || total === 3) newCell = 1
      row.push(newCell)
    }
    newCells.push(row)
  }
  return newCells
}
```

上面这段代码不外乎是个双层的 for 循环，只要注意避免 `get` 函数中可能的下标越界即可。有了计算出的新数据，把它渲染到 DOM 或者 Canvas 中是件很容易的事，就不再赘述了。

然而，这种朴素的实现显然是不堪用的。只要到 1000x1000 这个数量级的 cell，就意味着要逐帧进行数百万次的数组存取和比较，不论怎么做 JS 层面的「极致优化」都很难突破瓶颈。所以我们需要什么呢？当然是加速啊，加速！

## 加速原理
虽然 WebGL 有很多复杂的概念，但它们多半是 3D 图形学这个具体应用场景所带来的。如果抛开这些概念，你也可以把 GPU 看作一个 **for 循环的加速器**。只要 for 循环里的任务没有先后依赖关系（可并行化），那么这类任务就很容易丢到 GPU 上完成计算。

从这个角度出发，我们可以获得对 WebGL 一种简单易懂的理解：

* 怎样提供 for 循环要遍历的数据？通过提供可按 XY 坐标访问的纹理（Textures）。
* 怎样确定 for 循环遍历的区间范围？通过顶点坐标数组（Buffers）。
* 怎样编写 for 循环里具体的计算逻辑？通过 GLSL 语言写的着色器（Shaders）。

所以，用 WebGL 来实现的生命游戏，其渲染过程的思维模型可以理解为如下：

* 提供一个能填满屏幕的矩形（两个三角形），作为渲染的范围。
* 提供一张装有初始状态的位图纹理，作为网格数据。
* 在由 GLSL 语言写的着色器中，对矩形上的每个点（即所谓片元）做周围 8 个点的纹理采样。
* 根据采样结果，在着色器中用简单的 if-else 逻辑做判断，输出颜色。

不过这个描述还是过于简化了。对于 WebGL 的渲染管线来说，还有最后一个关键的问题：如果像素被直接渲染到屏幕上，它就很不便于被重新读取来计算下一帧的状态（具体地说，`gl.readPixels` 很慢）。为此我们需要借鉴经典的双缓冲区概念，交错地进行渲染：

* 建立两个相同尺寸的纹理，作为渲染目标。
* 初始化时，将 `canvas` 或 `img` 中的初始状态上传到第一个纹理。
* 进入 main loop 后，交错地将前一个纹理作为输入，把着色器的计算结果输出到另一个纹理上。

但这样的离屏渲染，其结果是我们看不到的。因此最后还需要使用另一个简单的着色器，逐帧将更新后的纹理状态渲染到屏幕上。

听起来是不是有点意思？下面来看看怎么用 Beam **语义化地**编写出这个流程吧。

## 基于 Beam 的实现
在「[如何设计一个 WebGL 基础库](https://zhuanlan.zhihu.com/p/93500639)」这篇文章中，我们已经对 Beam 的 API 与相应的 WebGL 概念，做了详尽的入门介绍。简单说来，使用 Beam 做 WebGL 渲染时的概念模型，**其实就是拿着 Shader 和 Resources 去调用 draw 就行**。像这样：

``` js
const beam = new Beam(canvas)
const shader = beam.shader(MyShader)
const resources = [
  // buffers, textures, uniforms...
]
beam.draw(shader, ...resources)
```

这里为 `beam.draw` 所传入的 Resources，就包括了前面提到的顶点（Buffers）和纹理（Textures）。作为例子，不妨首先考虑最简单的这个需求：如果一个 `img` 标签里存储了生命游戏的初始状态，如何将它用 WebGL 渲染出来呢？在 Beam 的 [Basic Image](https://doodlewind.github.io/beam/examples.html#image-processing/basic-image) 示例里，就给出了一个相当简单的实现：

``` js
// 用于渲染基础图像的着色器
const shader = beam.shader(BasicImage)

// 构造宽高均为 [-1, 1] 的单位矩形 buffer
const rect = createRect()
const rectBuffers = [
  beam.resource(VertexBuffers, rect.vertex),
  beam.resource(IndexBuffer, rect.index)
]

loadImage(url).then(image => {
  // 构造并上传纹理
  const textures = beam.resource(Textures)
  // 'img' 对应于着色器中的变量名
  textures.set('img', { image, flip: true })
  // 在 clear 后执行 draw
  beam.clear().draw(shader, ...rectBuffers, textures)
})
```

上面这段代码中，主要的新概念应该就是 VertexBuffers 和 IndexBuffer 了。这也算是初学者的拦路虎之一，简单说来是这样的：矩形有 4 个顶点，要拆分成给 WebGL 用的 2 个三角形，则一共有 6 个顶点。为了避免数据的冗余，我们用 VertexBuffer 里装载 4 个顶点的坐标，而 IndexBuffer 里则装有描述「全部 6 个三角形顶点，分别对应 4 个点中的哪一个」的下标索引。

> 看起来有点绕？只要 log 看一下 `rect` 的结构，应该就清楚了。

有了顶点 Buffer 后，片元着色器会对它所覆盖的每个像素执行一次。而在这个默认的 `BasicImage` 着色器里，我们会对 `img` 的纹理的相应位置进行采样。这样一来，图片的相应位置就填上了像素。由于 WebGL 的屏幕坐标系区间也是 `[-1, 1]`，因此上面的这段代码的效果就是自动将图像拉伸展示，铺满整个 WebGL 的 canvas 区域。至于这个 `BasicImage`，其实就是这样简单的一份着色器配置而已：

``` js
const vertexShader = `
attribute vec4 position;
attribute vec2 texCoord;

varying highp vec2 vTexCoord;

void main() {
  gl_Position = position;
  vTexCoord = texCoord;
}
`

const fragmentShader = `
precision highp float;
uniform sampler2D img;

varying highp vec2 vTexCoord;

void main() {
  vec4 texColor = texture2D(img, vTexCoord);
  gl_FragColor = texColor;
}
`

export const BasicImage = {
  vs: vertexShader,
  fs: fragmentShader,
  buffers: {
    position: { type: vec4, n: 3 },
    texCoord: { type: vec2 }
  },
  textures: {
    img: { type: tex2D }
  }
}
```

顶点着色器和片元着色器的概念区别，在 Beam 的入门文章里已经介绍过了。这里我们只需要关心片元着色器，也就是下面这段 GLSL 代码：

``` glsl
void main() {
  vec4 texColor = texture2D(img, vTexCoord);
  gl_FragColor = texColor;
}
```

它其实可以大致理解成这样在 JS 中执行的 for 循环：

``` js
function main (img, x, y) {
  PIXEL_COLOR = getColor(img, x, y)
}

for (let texCoordX = 0; texCoordX < width; texCoordX++) {
  for (let texCoordY = 0; texCoordY < height: texCoordY++) {
    main(img, texCoordX, texCoordY)
  }
}
```

着色器在 GPU 上的执行过程是完全并行的。只要对 `gl_FragColor` 赋值，你就能将该片元（像素）的计算结果输出到屏幕上。

所以，只要理解了这种「从 for 循环到着色器」的映射关系，我们就很容易把刚才的朴素 CPU 版生命游戏实现，改写到 Shader 里了：

``` glsl
uniform sampler2D state;
varying vec2 vTexCoord;
const float size = 1.0 / 2048.0; // 像素尺寸换算

void main() {
  float total = 0.0;
  total += texture2D(state, vTexCoord + vec2(-1.0, -1.0) * size).x > 0.5 ? 1.0 : 0.0;
  total += texture2D(state, vTexCoord + vec2(0.0, -1.0) * size).x > 0.5 ? 1.0 : 0.0;
  total += texture2D(state, vTexCoord + vec2(1.0, -1.0) * size).x > 0.5 ? 1.0 : 0.0;
  total += texture2D(state, vTexCoord + vec2(-1.0, 0.0) * size).x > 0.5 ? 1.0 : 0.0;
  total += texture2D(state, vTexCoord + vec2(1.0, 0.0) * size).x > 0.5 ? 1.0 : 0.0;
  total += texture2D(state, vTexCoord + vec2(-1.0, 1.0) * size).x > 0.5 ? 1.0 : 0.0;
  total += texture2D(state, vTexCoord + vec2(0.0, 1.0) * size).x > 0.5 ? 1.0 : 0.0;
  total += texture2D(state, vTexCoord + vec2(1.0, 1.0) * size).x > 0.5 ? 1.0 : 0.0;

  vec3 old = texture2D(state, vTexCoord).xyz;
  gl_FragColor = vec4(0.0);

  if (old.x == 0.0) {
    if (total == 3.0) {
      gl_FragColor = vec4(1.0);
    }
  } else if (total == 2.0 || total == 3.0) {
    gl_FragColor = vec4(1.0);
  }
}
```

只要用这个着色器替换一下上面 Beam 图像渲染的示例，我们就踏出了关键的一步：完成第一次生命演化！

有了第一次之后，怎样实现可持续的双份快乐呢？当然是把两份喜悦（划掉，两份缓冲区）互相重叠在一起了呀。在原生的 WebGL 中，这涉及对 FramebufferObject / RenderbufferObject / ColorAttachment / DepthComponent / Viewport 的一系列操作。但 Beam 高度简化了这个流程的语义。在它示例性附带的 `offscreen2D` 方法中，**能以函数的作用域来抽象表达出「渲染的目标」**。比如像这样的逻辑：

``` js
// 渲染到屏幕
beam
  .clear()
  .draw(shaderA, ...resourcesA)
  .draw(shaderB, ...resourcesB)
  .draw(shaderC, ...resourcesC)
```

就可以这样无缝地改为离屏渲染：

``` js
// 初始化离屏渲染的 target
const target = beam.resource(OffscreenTarget)

// 将 target 和纹理连接起来
const textures = beam.resource(Textures)
textures.set('img', target)

// 渲染到纹理，已有的渲染逻辑完全不变
beam.clear()
beam.offscreen2D(target, () => {
  beam
    .draw(shaderA, ...resourcesA)
    .draw(shaderB, ...resourcesB)
    .draw(shaderB, ...resourcesC)
})

// 在其他着色器中，现在即可使用 textures 下名为 'img' 的纹理
```

注意，我们并不能「直接」渲染到纹理，而是需要先需要一个目标（实际上就是 Framebuffer Object），将这个目标和某个纹理连接在一起，然后再选择渲染到这个目标。

> `offscreen2D` 其实是一种可以自定义的 Command。你还可以自行设计出更多「需要清理」的渲染管线操作，将它们封装为 Command，从而借深层嵌套的函数来表达出更复杂的组合，这也是 Beam 的另一个强大之处。

理解了这个离屏渲染 API 之后，我们就能借助 `offscreen2D` 的能力，轻松地获得交错渲染的效果了：

``` js
const targetA = beam.resource(OffscreenTarget)
const targetB = beam.resource(OffscreenTarget)
let i = 0

const render = () => {
  // 交错切换两个 target
  const targetFrom = i % 2 === 0 ? targetA : targetB
  const targetTo = i % 2 === 0 ? targetB : targetA

  beam.clear()
  beam.offscreen2D(targetTo, () => {
    conwayTexture.set('state', targetFrom)
    beam.draw(conwayShader, ...rectBuffers, conwayTexture)
  })

  // 将交错渲染的结果，借另一个简单着色器输出到屏幕上
  screenTexture.set('img', targetTo)
  beam.draw(imageShader, ...rectBuffers, screenTexture)
  i++
}
```

只要准备好初始状态，然后用 `requestAnimationFrame` 来逐帧调用这个 `render` 函数就可以了。通过 Canvas 生成一系列随机点，即可得到这样的测试效果：

![random](/images/game-of-life/random.jpg)

这样一来，就表明关键的并行加速过程已经完成了。最后在片元着色器里稍作改动，即可加入价值五毛钱的「残影」特效：

``` glsl
float decay = 0.95; // 衰减参数

// gl_FragColor = vec4(0.0); // 不再直接置空
gl_FragColor = vec4(0.0, old.yz * decay, 1.0);

// 后续的 if-else...
```

这就是全部的重点了！现在我们就能体验渲染到 GPU 的康威生命游戏啦。它有一些预设的经典输入状态，比如这类「振荡器」形式的生命：

![oscillators](/images/game-of-life/oscillators.gif)

你还可以组合出巨大的结构，持续性地「孕育出生命」：

![constructor](/images/game-of-life/constructor.gif)

还有这样的小个子播种狂魔：

![breeder](/images/game-of-life/breeder.gif)

不过个人最喜欢的还是这个——「看似整齐划一的集体，在扩张到边界时却一触即溃」：

![loom](/images/game-of-life/loom.gif)

到这里，这个 WebGL 小应用就完成啦。有了 WebGL 的加持，对于 2048x2048 的网格尺寸，逐帧进行 400 多万个像素的计算也丝毫不在话下。你可以在这里访问到它的 [Demo](https://doodlewind.github.io/examples/conway/index.html)。最后是一些值得参考的相关文章：

* [A GPU Approach to Conway’s Game of Life](https://nullprogram.com/blog/2014/06/10/)
* [Conway in WebGL](https://tamats.com/apps/conway/)

## 总结
其实像康威生命游戏这样简单的 demo，显然是专业的图形开发者们「不屑于」讲解的雕虫小技而已。但是这里显然存在着一个很大的鸿沟：普通的前端开发者普遍欠缺对 WebGL 概念的了解和使用。在这方面，也许我们需要更多这样兼顾趣味性和简单性的例子，来让大家明白「原来这也不过如此」吧。

特别值得一提（一吹）的是，基于 Beam 实现的整个康威生命游戏应用，其压缩后体积仅 **5.6KB**，比社区实现所用的 [LightGL Demo](https://tamats.com/apps/conway/) 版本小 90% 以上。但 Beam 并不是个玩具，而是一个通用的 WebGL 基础库。你还可以用它学习 [WebGL 图像处理](https://zhuanlan.zhihu.com/p/100388037)，我们更是用它渲染了 Web 编辑器中支持 PBR 材质的 [3D 文字](https://zhuanlan.zhihu.com/p/81819123)。它极为轻量的体积，使其非常易于嵌入其他前端框架中。这方面有许多值得探索的 idea 尚未实现，希望大家多多 star 支持！

[Beam - Expressive WebGL](https://github.com/doodlewind/beam)

总之，「渲染」绝不仅仅是面试题解里翻来覆去讲的那些虚拟 DOM diff 层面的东西，它同样是一种计算，其中蕴涵着无限的可能性。而作为一种并未被前端业界充分开发的技术，WebGL 的使用其实也未必需要 3D 的专业知识，完全可以当作一种处理特定计算任务（可并行的 for 循环）时的强大加速器。想要学习如何成为一名 WebGL 加速师吗？欢迎尝鲜 Beam，感受 10KB 内的 *Expressive WebGL* 吧～
