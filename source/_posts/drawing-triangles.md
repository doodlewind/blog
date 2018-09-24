categories: Note

tags:

- Web
- JS
- CSS

date: 2018-05-01

toc: true

title: 三角形的 N 种画法与浏览器的开放世界
---

![zelda-title](/images/zelda-title.jpeg)

最近，我完全沉迷在了任天堂 Switch 上的《塞尔达传说：荒野之息》里，以至于专栏都快要停更了（罪过罪过）。大概每个塞尔达玩家都会有这个疑问，那就是**这个游戏为什么这么好玩？！**非常有意思的是，这个问题的答案似乎和「**前端为什么这么日新月异**」有着微妙的关系，这让我有了一些全新的认识…

<!--more-->

塞尔达的游戏体验有一点广受好评，那就是**符合直觉的开放世界**。换句话说，在这个游戏里**想要做到一件事，只要你能想到什么方式，那么你几乎就能基于这种方式去实现**。比如，你看到树上挂着一颗苹果，那么想要摘下这颗苹果，至少有以下这些办法：

* 把树砍倒，捡到苹果
* 爬树、骑在马上或者搬来箱子垫脚够到苹果
* 用弓箭把苹果射下来
* 扇风或者炸弹制造冲击波，把苹果吹下来
* 从周围的高地滑翔到苹果树上
* 放火把树点着，留下烤苹果
* ……

这种自由度使得游戏的冒险体验充满了惊喜。对各种棘手的机关谜题，解法常常是开放而不唯一的。巧的是，我近期的工作也和折腾前端的各种渲染机制有些关系。**当用自由程度来评价浏览器的时候，能看到的几乎也是一个塞尔达级别的开放世界了。**

我们不妨用三角形作为例子吧。三角形作为最简单的几何图形，绘制它对于任何一位前端同学都不会是一件难事。但在今天的前端领域里，到底有多少种技术方案能够画出一个三角形呢？答案可以说非常的百花齐放了。让我们循序渐进地开始吧。下面的各种套路可以按照折腾程度分为三种：

* 2B Play
* 普通 Play
* 羞耻 Play


## 2B Play
首先让我们从最不费劲的耍无赖方法开始吧：

### 字符
还有什么比复制粘贴一个 `△` 字符更简单的绘制方式呢？这其实就是个形如 `'\u25b3'` 的 Unicode 特殊字符而已。

### 图片
看起来 `<img src="三角形.jpg"/>` 的套路很 low，但完全没毛病啊🙄

### HTML
只要垂直居中一系列宽度均匀增长的矩形，我们是不是就得到了一个三角形呢😅

``` html
<div class="triangle">
  <div style="width: 1px; height: 1px;"></div>
  <div style="width: 2px; height: 1px;"></div>
  <div style="width: 3px; height: 1px;"></div>
  <div style="width: 4px; height: 1px;"></div>
  <!-- ...... -->
</div>
```

[Demo](https://jsfiddle.net/mbvgdjv7/4/)


## 普通 Play
如果感觉上面的实现太过于玩世不恭，接来下我们可以用一些略微「正常」一点的操作来画出同样的三角形：

### CSS
CSS 里充斥着大量的奇技淫巧，而下面这个操作可能是很多面试题的标准答案了。我们只需要简单的 HTML：

``` html
<div class="triangle"></div>
```

配合魔改容器边框的样式：

``` css
.triangle {
  width: 0;
  height: 0;
  border-left: 50px solid transparent;
  border-right: 50px solid transparent;
  border-bottom: 100px solid red;
}
```

就能够模拟出一个三角形了。[Demo](https://jsfiddle.net/dzvbv1La/)

### Icon Font
把字体当做图标使用的做法也是老调重弹了。只需要大致这样的字体样式配置：

``` css
@font-face {
  font-family: Triangle;
  src: url(./triangle.woff) format("woff");
}

.triangle:before { content:"\t666" }
```

这样一个 `<i class="triangle"></i>` 的标签，就能通过 `:before` 插入特殊字符，进而渲染对应的图标字体了😑[Demo](https://jsfiddle.net/a5L8fuz9/1/)

### SVG
很多时候我们习惯把 SVG 当做图片一样的静态资源直接引入使用，但其实只要稍微了解一下它的语法后，就会发现直接手写 SVG 来绘制简单图形也并不复杂：

``` html
<svg width="100" height="100">
  <polygon points="50,0 100,100 0,100" style="fill: red;"/>
</svg>
```

[Demo](https://jsfiddle.net/pnetx4vw/)

### Clip Path
SVG 和 CSS 有很多相似之处，但 CSS 虽然长于样式，长久以来却一直缺乏「绘制出一个形状」的能力。好在 CSS 规范中刚加入不久的 clip path 能够名正言顺地让我们用类似 SVG 的形式绘制出更多样的形状。这只需要形如下面的样式：

``` css
.triangle {
  width: 10px; height: 10px;
  background: red;
  clip-path: polygon(50% 0, 0 100%, 100% 100%);
}
```

这和熟悉的 border 套路有什么区别呢？除了代码更直观简洁以外，它还能够为绘制出的形状支持背景图片属性，可惜的地方主要是 IE 兼容了。[Demo](https://jsfiddle.net/7xzwbp2t/)

### Canvas
到目前为止的方法没有一个需要编写 JS 代码，这多少有些对不起工钱。还好我们有 Canvas 来名正言顺地折腾。只需要一个 `<canvas>` 标签配上这样的胶水代码就行：

``` js
const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')
ctx.beginPath()
ctx.fillStyle = 'red'
ctx.moveTo(50, 0)
ctx.lineTo(0, 100)
ctx.lineTo(100, 100)
ctx.fill()
```

[Demo](https://jsfiddle.net/mbvgdjv7/1/)


## 羞耻 Play
如果你还是嫌弃上面的操作过于中规中矩，让我们用最后的几种方法来探索浏览器的自由尺度吧：

### CSS Houdini
近期的 CSS 大会上 CSS Houdini 可以说赚足了眼球。这套大大增强 CSS 控制力的规范中，目前已经实装的主要也就是 CSS Paint 了。简而言之，通过这个 API，只要 CSS 属性需要图片的地方，你就可以编程式地通过 canvas 控制图片的渲染过程。

通过 `CSS.paintWorklet.addModule` API，我们可以定义绘制 canvas 所用的 paint worklet：

``` html
<script>
  CSS.paintWorklet.addModule('/worklet.js')
</script>
```

Paint worklet 中能够拿到正常的 canvas 上下文：

``` js
class TrianglePainter {
  paint(ctx, geom, properties) {
	 const offset = geom.width
    ctx.beginPath()
    ctx.fillStyle = 'red'
    ctx.moveTo(offset / 2, 0)
    ctx.lineTo(offset, offset)
    ctx.lineTo(0, offset)
    ctx.fill()
  }
}

registerPaint('triangle', TrianglePainter)
```

只要这样，就能在 CSS 里使用 `paint` 规则了：

``` css
.demo {
  width: 100px;
  height: 100px;
  background-image: paint(triangle);
}
```

我们还可以使用 CSS Variable 在 CSS 中定义形如 `--triangle-size` 或 `--triangle-fill` 的参数，来控制 canvas 的渲染，这样在参数更新时 canvas 会自动重绘。结合上 animation，它在特效领域的想象空间也很大。虽然最后使用的还是前面提及的 canvas，但 Houdini 确实给基于 CSS 的渲染带来了更大的掌控。


### WebGL 多边形
主流浏览器对 WebGL 的支持已经相当不错了，但目前看来它仍然不是前端领域人人必备的主流技术。这或许和它较为陡峭的学习曲线有关。可能有不少同学对 WebGL 有一种误解，即它和 canvas 一样，是一套 JS API。实际上，编写 WebGL 应用时，除了需要编写运行在 CPU 范畴内的 JS 胶水代码外，真正在 GPU 上执行的是 GLSL 语言编写的**着色器**。但是由于绘图库本身的复杂性，在入门示例中，JS 的胶水代码占了绝对的大头。按照计算机图形学按部就班的教程，即便只是完成一个三角形的渲染过程，也需要百行左右的代码。限于篇幅，我们只简要地将这个流程里所需要做的关键事项概括为以下三步：

1. 用 GLSL 语言编写顶点着色器和片元着色器。
2. 定义出一个顶点缓冲区，向其中传入三角形逐个顶点的数据。
3. 在我们自己实现的 render 函数里做一些准备。在加载完着色器程序后，调用 `drawArray` API 绘制缓冲区中数据。

这个过程（[Demo](https://jsfiddle.net/skpuk5b1/)）初看之下控制的不过是一个更啰嗦而折腾的 canvas 而已，除了可以支持 3D 以外，有什么不同呢？在最后一种方法里我们就能看到区别了。


### WebGL 造型函数
上面的流程基本是每一个 WebGL 教程都会按部就班地去做的。考虑这个问题：绘制三角形一定需要提供三个顶点吗？这可不一定。

熟悉 canvas 的同学都知道，在处理图像时，像下面这样的逐像素操作很容易带来性能问题：

``` js
for (let i = 0; i < width; i++) {
  for (let j = 0; j < height; j++) {
    // ...
  }
}
```

但是在 WebGL 中，是不存在这样**串行**的循环的。你用 GLSL 语言所编写的着色器，会被编译到 GPU 上去**并行**执行。听起来是不是比较酷？上面已经提到，我们有两种着色器，即**顶点着色器**和**片元着色器**：

* 顶点着色器的代码逐顶点执行，比如对于三角形，它就执行三次。
* 片元着色器的代码逐片元（粗略的理解就是像素）执行，对于一个 100x100 的区域，GPU 会并行地对这 1w 个像素调用片元着色器，这个并行的过程对你是透明的。

所以对于一个「逐像素执行」的片元着色器来说，只要它知道自己每次被调用时所在的坐标，那么就能够根据这个位置计算出最终的颜色。这样一来，我们甚至不需要顶点缓冲区，就能够基于特定的公式去计算逐像素的颜色了。这样为着色器设计的函数我们称为 shaping function，即造型函数。一个正多边形的着色器形如：

``` glsl
#define TWO_PI 6.28318530718

// 由 JS 传入的屏幕分辨率
uniform vec2 u_resolution;

void main() {
  vec2 st = gl_FragCoord.xy/u_resolution.xy;
  st.x *= u_resolution.x/u_resolution.y;
  vec3 color = vec3(0.0);
  float d = 0.0;

  // 重新映射空间坐标到 -1. 与 1. 间
  st = st * 2.-1.;

  // 多边形边数量
  int N = 3;

  // 当前像素的角度与半径
  float a = atan(st.x,st.y)+PI;
  float r = TWO_PI/float(N);

  // 调节距离的造型函数
  d = cos(floor(.5+a/r)*r-a)*length(st);

  color = vec3(1.0-smoothstep(.4,.41,d));
  // color = vec3(d);

  gl_FragColor = vec4(color,1.0);
}
```

这就是一个船新的领域了，由于 shader 编程要求对众多的像素编写出同一份简洁而并行执行的代码，彼此之间还完全透明且无法随意 log 调试，这使得面向着色器编程的门槛实际上很高。这里的示例在非常好的入门书 [The Book of Shaders](https://thebookofshaders.com/07/) 中有相应的章节，有兴趣的同学或许会打开新世界的大门哦🤔

P.S. 在这里我们为什么要舍近求远呢？这个途径其实和字体渲染的原理有些接近，近期我也在学习一些相关的知识，希望届时能有更多的内容可以分享~


## 总结
不可否认，常规的业务开发很容易进入枯燥的重复劳动阶段，但再看开一点，我们可以发现实际上我们已经有了非常多可用的技术手段来优化前端这个领域里的交互了。一个简单的三角形都能用 HTML / CSS / JS / GLSL 四种语言的十几种方案来画了，更复杂的场景下就更是百花齐放了。浏览器的渲染能力之强应该也算得上是个开放世界了吧：别管你想画什么，总有适合你的方法去实现。

不过和塞尔达里越高级的操作看起来越风骚简洁不同，越是掌控力强的技术方案，在实现上就会更加复杂。但总之不管是游戏还是代码还是生活，相信快乐的方式都不止一种~希望大家都能够享受过程，找到属于自己的那份乐趣~
