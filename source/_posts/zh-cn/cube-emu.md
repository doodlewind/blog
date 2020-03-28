categories: Note

tags:

- Web
- Algorithms
- WebGL

date: 2018-08-26

toc: true

title: Web 魔方模拟器的设计与实现
---

魔方是个结构简单而变化无穷的神奇玩具。那么如何在万能的浏览器里模拟出魔方的无尽变换，又如何将其还原呢？下面让我们一步步地来一探究竟吧。

<!--more-->

## 魔方的抽象
拆解过魔方的同学可能知道，现实中魔方的内部结构包含了中轴、弹簧、螺丝等机械装置。但当我们只是想要「模拟」它的时候，我们只需抓住它最显著的性质即可——3x3x3 的一组立方体：

![cube-render-loop](/images/cube-render-loop.gif)


### 基本概念
上图演示了魔方最基本的思维模型。但光有这样的感性认识还不够：组成魔方的每个块并非随意安置，它们之间有着细微的区别：

* 位于魔方各角的块称为**角块**，每个角块均具有 3 个颜色。一个立方体有 8 个角，故而一个魔方也具有 8 个角块。
* 位于魔方各棱上的块称为**棱块**，每个棱块均具有 2 个颜色。一个立方体有 12 条棱，故而一个魔方也具有 12 个棱块。
* 位于魔方各面中心的块称为**中心块**，每个中心块仅有 1 个颜色。一个立方体有 6 个面，故而一个魔方也具有 6 个中心块。
* 位于整个魔方中心的块没有颜色，在渲染和还原的过程中也不起到什么实际的用处，我们可以忽略这个块。

将以上四种块的数量相加，正好是 `3^3 = 27` 块。对这些块，你所能使用的唯一操作（或者说变换）方式，就是在不同面上的**旋转**。那么，我们该如何标识出一次旋转操作呢？

设想你的手里「端正地」拿着一个魔方，我们将此时面对你的那一面定义为 `Front`，背对的一面定义为 `Back`。类似地，我们有了 `Left` / `Right` / `Upper` / `Down` 来标识其余各面。当你旋转某一面时，我们用这一面的简写（`F` / `B` / `L` / `R` / `U` / `D`）来标识在这一面上的一次**顺时针 90 度**旋转。对于一次逆时针的旋转，我们则用 `F'` / `U'` 这样带 `'` 的记号来表达。如果你旋转了 180 度，那么可以用形如 `R2` / `U2` 的方式表示。如下图的 5 次操作，如果我们约定蓝色一面为 Front，其旋转序列就是 `F' R' L' B' F'`：

![cube-solve](/images/cube-solve.gif)

关于魔方的基础结构和变换方式，知道这些就足够了。下面我们需要考虑这个问题：**如何设计一个数据结构来保存的魔方状态，并使用编程语言来实现某个旋转变换呢？**


### 数据结构
喜欢基于「面向对象」抽象的同学可能很快就能想到，我们可以为每个块设计一个 `Block` 基类，然后用形如 `CornerBlock` 和 `EdgeBlock` 的类来抽象棱块和角块，在每个角块实例中还可以保存这个角块到它相邻三个棱块的引用……这样一个魔方的 `Cube` 对象只需持有对中心块的引用，就可以基于各块实例的邻接属性保存整个魔方了。

上面这种实现很类似于链表，它可以 `O(1)` 地实现「给定某个块，查找其邻接块」的操作，但不难发现，它需要 `O(N)` 的复杂度来实现形如「某个位置的块在哪里」这样的查找操作，基于它的旋转操作也并不十分符合直觉。相对地，另一种显得「过于暴力」的方式反而相当实用：**直接开辟一个长度为 27 的数组，在其中存储每一块的颜色信息即可。**

为什么可以这样呢？我们知道，数组在基于下标访问时，具有 `O(1)` 的时间复杂度。而如果我们**在一个三维坐标系中定位魔方的每一个块，那么每个块的空间坐标都可以唯一地映射到数组的下标上**。更进一步地，我们可以令 `x, y, z` 分别取 `-1, 0, 1` 这三个值来表达一个块在其方向上可能的位置，这时，例如前面所定义的一次 `U` 旋转，刚好就是对所有 y 轴坐标值为 1 的块的旋转。这个良好的性质很有利于实现对魔方的变换操作。

### 旋转变换
在约定好数据结构之后，我们如何实现对魔方的一次旋转变换呢？可能有些同学会直接将这个操作与三维空间中的四阶变换矩阵联系起来。但只要注意到一次旋转的角度都是 90 度的整数倍，我们可以利用数学性质极大地简化这一操作：

在旋转 90 度时，旋转面上每个角块都旋转到了该面上的「下一个」角块的位置上，棱块也是这样。故而，我们只需要循环交替地在每个块的「下一个」位置赋值，就能轻松地将块「移动」到其新位置上。但这还不够：每个新位置上的块，还需要对其自身六个面的颜色做一次「自旋」，才能将它的朝向指向正确的位置。这也是一次交替的赋值操作。从而，**一次三维空间绕某个面中心的旋转操作，就被我们分解为了一次平移操作和一次绕各块中心的旋转操作**。只需要 30 余行代码，我们就能实现这一魔方最核心的变换机制：

``` js
rotate (center, clockwise = true) {
  const axis = center.indexOf(1) + center.indexOf(-1) + 1
  // Fix y direction in right-handed coordinate system.
  clockwise = center[1] !== 0 ? !clockwise : clockwise
  // Fix directions whose faces are opposite to axis.
  clockwise = center[axis] === 1 ? clockwise : !clockwise

  let cs = [[1, 1], [1, -1], [-1, -1], [-1, 1]] // corner coords
  let es = [[0, 1], [1, 0], [0, -1], [-1, 0]] // edge coords
  const prepareCoord = coord => coord.splice(axis, 0, center[axis])
  cs.forEach(prepareCoord); es.forEach(prepareCoord)
  if (!clockwise) { cs = cs.reverse(); es = es.reverse() }

  // 移动每个块到其新位置
  const rotateBlocks = ([a, b, c, d]) => {
    const set = (a, b) => { for (let i = 0; i < 6; i++) a[i] = b[i] }
    const tmp = []; set(tmp, a); set(a, d); set(d, c); set(c, b); set(b, tmp)
  }
  const colorsAt = coord => this.getBlock(coord).colors
  rotateBlocks(cs.map(colorsAt)); rotateBlocks(es.map(colorsAt))

  // 调整每个块的自旋朝向
  const swap = [
    [[F, U, B, D], [L, F, R, B], [L, U, R, D]],
    [[F, D, B, U], [F, L, B, R], [D, R, U, L]]
  ][clockwise ? 0 : 1][axis]
  const rotateFaces = coord => {
    const block = colorsAt(coord)
    ;[block[swap[1]], block[swap[2]], block[swap[3]], block[swap[0]]] =
    [block[swap[0]], block[swap[1]], block[swap[2]], block[swap[3]]]
  }
  cs.forEach(rotateFaces); es.forEach(rotateFaces)
  return this
}
```

这个实现的效率应该不差：在笔者的浏览器里，上面的代码可以支持每秒 30 万次的旋转变换。为什么在这里我们需要在意性能呢？在魔方的场景下，有一个非常不同的地方，即**状态的有效性与校验**。

熟悉魔方的同学应该知道，**并不是随便给每块涂上不同颜色的魔方都是可以还原的**。在普通的业务开发领域，数据的有效性和校验常常可以通过类型系统来保证。但对于一个打乱的魔方，保证它的可解性则是一个困难的数学问题。故而我们在保存魔方状态时，**只有保存从六面同色的初始状态到当前状态下的所有变换步骤，才能保证这个状态一定是可解的。**这样一来，反序列化一个魔方状态的开销就与操作步骤数量之间有了 `O(N)` 的关联。好在一个实际把玩中的魔方状态一般只会在 100 步之内，故而上面以牺牲时间复杂度换取数据有效性的代价应当是值得的。另外，这个方式可以非常简单地实现魔方任意状态之间的**时间旅行**：从初始状态走到任意一步的历史状态，都只需要叠加上它们之间一系列的旋转 diff 操作即可。这是一个很可靠的思维模型。

上面的实现中有一个特别之处：当坐标轴是 y 轴时，我们为旋转方向进行了一次取反操作。这初看起来并不符合直觉，但其背后却是坐标系定义的问题：如果你推导过每个块在顺时针变换时所处的下一个位置，那么在高中教科书和 WebGL 所用的右手坐标系中，绕 y 轴旋转时各个块的下一个位置，其交换顺序与 x 轴和 z 轴是相反的。反而在 DirectX 的左手坐标系中，旋转操作的正负能完全和坐标系的朝向一致。笔者作为区区码农，并不了解这背后的对称性是否蕴含了什么深刻的数学原理，希望数学大佬们解惑。

到此为止，我们已经基本完成了对魔方状态的抽象和变换算法的设计了。但相信很多同学可能更好奇的是这个问题：在浏览器环境下，我们该如何渲染出魔方呢？让我们来看看吧。


## 魔方的渲染
在浏览器这个以无数的二维矩形作为排版原语的世界里，要想渲染魔方这样的三维物体并不是件查个文档写几行胶水代码就可以搞定的事情。好在我们有 WebGL 这样的三维图形库可供差遣（当然了，相信熟悉样式的同学应该是可以使用 CSS 来渲染魔方的，可惜笔者的 CSS 水平不行）。

### WebGL 渲染基础
由于魔方思维模型的简单性，要渲染它并不需要使用图形学中纹理、光照和阴影等高级特性，只需要最基本的几何图形绘制特性就足够了。正因为如此，笔者在这里只使用了完全原生的 WebGL API 来绘制魔方。笼统地说，渲染魔方这样的一组立方体，所需要的步骤大致如下：

1. 初始化着色器（编译供 GPU 执行的程序）
2. 向缓冲区中传递顶点和颜色数据（操作显存）
3. 设置用于观察的透视矩阵和模-视变换矩阵（传递变量给 GPU）
3. 调用 `drawElements` 或 `drawArray` 渲染一帧

在前文中，我们设计的数据结构使用了长度为 27 的数组来存储 `[-1, -1, -1]` 到 `[1, 1, 1]` 的一系列块。在一个三重的 `for` 循环里，逐个将这些块绘制到屏幕上的逻辑大概就像前面看到的这张图：

![cube-render-loop](/images/cube-render-loop.gif)

需要注意的是，并不是越接近底层的代码就一定越快。例如在最早的实现中，笔者直接通过循环调用来自（或者说抄自）MDN 的 3D 立方体例程来完成 27 个小块的渲染。这时对于 27 个立方体区区不足千个顶点，60 帧绘制动画时的 CPU 占用率都可能跑满。经过定位，发现重复的 CPU 与 GPU 交互是一个大忌：从 CPU 向 GPU 传递数据，以及最终对 GPU 绘图 API 的调用，都具有较大的固定开销。一般我们需要将一帧中 Draw Call 的数量控制在 20 个以内，对于 27 个立方体就使用 27 次 Draw Call 的做法显然是个反模式。在将代码改造为一次批量传入全部顶点并调用一次 `drawElements` 后，即可实现流畅的 60 帧动画了 :)

### 旋转动画实现
在实现基本的渲染机制后，魔方整体的旋转效果可以通过对模-视矩阵做矩阵乘法来实现。模-视矩阵会在顶点着色器由 GPU 中对每一个顶点并行地计算，得到顶点变换后的 `gl_Position` 位置。但对于单个面的旋转，我们选择了先在 CPU 中计算好顶点位置，再将其传入顶点缓冲区。这和魔方旋转动画的实现原理直接相关：

* 在一次某个面的旋转过程中，魔方的数据模型不发生改变，仅改变受影响的顶点所在位置。
* 在旋转结束时，我们调用上文中实现的 `rotate` API 来「瞬间旋转好」魔方的数据模型，而后再多绘制一帧。

我们首先需要设计用于渲染一帧的 `render` API。考虑到魔方在绘制时可能存在对某个面一定程度的旋转，这个无状态的渲染 API 接口形如：

``` js
render (rX = 0, rY = 0, moveFace = null, moveAngle = 0) {
  if (!this.gl) throw new Error('Missing WebGL context!')
  this.buffer = getBuffer(this.gl, this.blocks, moveFace, moveAngle)
  renderFrame(this.gl, this.programInfo, this.buffer, rX, rY)
}
```

而对单个面的旋转过程中，我们可以使用浏览器的 `requestAnimationFrame` API 来实现基本的时序控制。一次调用 `animate` 的旋转返回一个在单次旋转结束时 resolve 的 Promise，其实现如下：

``` js
animate (move = null, duration = 500) {
  if (move && move.length === 0) return Promise.resolve()
  if (!move || this.__ANIMATING) throw new Error('Unable to animate!')

  this.__ANIMATING = true
  let k = move.includes("'") ? 1 : -1
  if (/B|D|L/.test(move)) k = k * -1
  const beginTime = +new Date()
  return new Promise((resolve, reject) => {
    const tick = () => {
      const diff = +new Date() - beginTime
      const percentage = diff / duration
      const face = move.replace("'", '')
      if (percentage < 1) {
        this.render(this.rX, this.rY, face, 90 * percentage * k)
        window.requestAnimationFrame(tick)
      } else {
        this.move(move)
        this.render(this.rX, this.rY, null, 0)
        this.__ANIMATING = false
        resolve()
      }
    }
    window.requestAnimationFrame(tick)
  })
}
```

### 连续旋转实现
在实现了单次旋转后，如何支持连续的多次旋转呢？本着能偷懒就偷懒的想法，笔者对上面的函数进行了不改动已有逻辑的递归化改造，只需要在原函数入口处加入如下几行，就可以使支持传入数组为参数来递归调用自身，并在传入的连续动画数组长度为 1 时作为递归的出口，从而轻松地实现连续的动画效果：

``` js
if (Array.isArray(move) && move.length > 1) {
  const lastMove = move.pop()
  // 返回递归得到的 Promise
  return this.animate(move).then(() => this.animate(lastMove))
} else if (move.length === 1) move = move[0] // 继续已有逻辑
```

到这里，一个可以供人体验的魔方基本就可以在浏览器里跑起来了。但这还不是我们最终的目标：**我们该怎么自动还原一个魔方呢？**


## 魔方的还原
魔方的还原算法在学术界已有很深入的研究，计算机在 20 步之内可以解出任意状态的魔方，也有成熟的轮子可以直接调用。但作为一个（高中时）曾经的魔方业余爱好者，笔者这里更关注的是「如何模拟出我自己还原魔方的操作」，故而在这里我们要介绍的是简单易懂的 CFOP 层先算法。

在开始前，有必要强调一个前文中一笔带过的概念：**在旋转时，魔方中心块之间的相对位置始终不会发生变化**。如下图：

![cube-centers](/images/cube-centers.gif)

因此，在魔方旋转时，我们只需关注角块和棱块是否归位即可。在 CFOP 层先法中，归位全部角块和棱块的步骤，被分为了逐次递进的四步：

1. 还原底部四个棱块，构建出「十字」。
2. 分组还原底层和第二层的所有角块和棱块。
3. 调整顶层块朝向，保证顶面同色。
4. 调整顶层块顺序，完成整个求解。

让我们依次来看看每一步都发生了什么吧。

### 底层十字
这一步可以说是最简单也最难的，在此我们的目标是还原四个底部棱块，像这样：

![cube-cross-end](/images/cube-cross-end.gif)

对一个完全打乱的魔方，每个目标棱块都可能以两种不同的朝向出现在任意一个棱块的位置上。为什么有两种朝向呢？请看下图：

![cube-cross-a](/images/cube-cross-a.gif)

这是最简单的一种情形，此时直接做一次 `R2` 旋转即可使红白棱块归位。但下面这种情况也是完全合法的：

![cube-cross-b](/images/cube-cross-b.gif)

这时由于棱块的朝向不同，所需的步骤就完全不同了。但总的来说，构成十字所需的棱块可能出现的位置总是有限的。拆解分类出所有可能的情形后，我们不难使用**贪心策略**来匹配：

1. 每次找到一个构成十字所需的棱块，求出它到目标位置的一串移动步骤。
2. 在不影响其他十字棱块的前提下将其归位，而后寻找下一个棱块。

这个最简单的策略很接近语法分析中向前看符号数量为 1 时的算法，不过这里不需要回溯。实现机制可以抽象如下：

``` js
solveCross () {
  const clonedCube = new Cube(null, this.cube.moves)
  const moveSteps = []
  while (true) {
    const lostEdgeCoords = findCrossCoords(clonedCube)
    if (!lostEdgeCoords.length) break
    moveSteps.push(solveCrossEdge(clonedCube, lostEdgeCoords[0]))
  }
  return moveSteps
}
```

这个实现原理并不复杂，其代价就是过小的局部最优造成了较多的冗余步骤。如果同时观察 2 个甚至更多的棱块状态并将其一并归位，其效率显然能得到提升（这时的实现难度也是水涨船高）。作为对比，一流的魔方玩家可以在 7 步内完成十字，但这个算法实现却需要 20 步左右——不过这里意思已经到了，各位看官就先不要太苛刻啦。

### 底部两层
这里的目标是在底部十字完成的基础上，完成底部两层所有块的归位。我们的目标是实现这样的状态：

![cube-f2l-solved](/images/cube-f2l-solved.gif)

这个步骤中，我们以 Slot 和 Pair 的概念作为还原的基本元素。相邻的十字之间所间隔的一个棱和一个角，构成了一个 Slot，而它们所对应的两个目标块则称为一个 Pair。故而这个步骤中，我们只需要重复四次将 Pair 放入 Slot 中的操作即可。一次最简单的操作大概是这样的：

![cube-f2l-pair](/images/cube-f2l-pair.gif)

上图将顶层的一对 Pair 放入了蓝红相间的 Slot 中。类似于之前解十字时的情形，这一步中的每个棱块和角块也有不同的位置和朝向。如果它们都在顶层，那么我们可以通过已有的匹配规则来实现匹配；如果它们在其它的 Slot 中，那么我们就递归地执行「将 Pair 从其它 Slot 中旋出」的算法，直到这组 Pair 都位于顶层为止。

这一步的还原算法与下面的步骤相当接近，稍后一并介绍。

### 顶层同色与顶层顺序
完成了前两层的还原后，我们最后所需要处理的就是顶层的 8 个棱块与角块了。首先是**顶面同色**的步骤，将各块调整到正确的朝向，实现顶面同色（一般采用白色作为底面，此时按照约定，黄色为顶面）：


![cube-oll](/images/cube-oll.gif)

而后是**顶层顺序**的调整。这一步在不改变棱与角朝向的前提下，改变它们的排列顺序，最终完成整个魔方的还原：

![cube-pll](/images/cube-pll.gif)

从前两层的还原到顶层的还原步骤中，都有大量的魔方公式规则可供匹配使用。如何将这些现成的规则应用到还原算法中呢？我们可以使用**规则驱动**的方式来使用它们。

### 规则驱动设计
了解编译过程的同学应该知道，语法分析的过程可以通过编写一系列的语法规则来实现。而在魔方还原时，我们也有大量的规则可供使用。一条规则的匹配部分大概是这样的：

![cube-oll-demo](/images/cube-oll-demo.gif)

在顶面同色过程中，满足上述 "pattern" 的顶面，可以通过 `U L U' R' U L' U' R` 的步骤来还原。类似地，在还原顶层顺序时，规则的匹配方式形如这样：

![cube-pll-demo](/images/cube-pll-demo.gif)

满足这条规则的顶层状态可以通过该规则所定义的步骤求解：`R2 U' R' U' R U R U R U' R`。这样一来，**只需要实现对规则的匹配和执行操作，规则的逻辑就可以完全与代码逻辑解耦**，变为可配置的 JSON 格式数据。用于还原前两层的一条规则格式形如：

``` js
{
  match: { [E]: topEdge(COLOR_F, E), [SE]: SE_D_AS_F },
  moves: "U (R U' R')"
}
```

顶层同色的规则格式形如：

``` js
{
  match: { [NW]: L, [NE]: R, [SE]: R, [SW]: L },
  moves: "R U R' U R U' R' U R U U R'"
}
```

顶面顺序的规则格式形如：

``` js
{
  match: { [N]: W, [W]: [E], [E]: N },
  moves: "R R U' R' U' R U R U R U' R"
}
```

这里的 `NW` / `E` / `SE` 是笔者的实现中基于九宫格东西南北方向定位的简写。在实现了对规则的自动匹配和应用之后，CFOP 中后面三步的实现方式可以说大同小异，主要的工作集中在一些与旋转相关的 mapping 处理。

### 规则的自测试
在整个还原过程中，一共有上百条规则需要匹配。对于这么多的规则，该如何保证它们的正确性呢？在 TDD 测试驱动开发的理念中，开发者需要通过编写各种繁冗的测试用例来实现对代码逻辑的覆盖。但在魔方领域，笔者发现了一种优雅得多的性质：**任何一条规则本身，就是自己的测试用例**！如这条规则：

``` js
{
  match: { [N]: W, [W]: [E], [E]: N },
  moves: "R R U' R' U' R U R U R U' R"
}
```

我们只需要将 `moves` 中的每一步**顺序颠倒地输入初始状态的魔方**，就可以用这个状态来验证规则是否能够匹配，以及魔方是否能基于该规则还原了。这个性质使得我很容易地编写了下面这样简单的代码，自动验证每条输入规则的正确性：

``` js
const flip = moves => moves.map(x => x.length > 1 ? x[0] : x + "'").reverse()

OLL.forEach(rule => {
  const rMoves = flip(rule.moves)
  const cube = new Cube(null, rMoves)
  if (
    matchOrientationRule(cube, rule) &&
    isOrientationSolved(cube.move(rule.moves))
  ) {
    console.log('OLL test pass', rule.id)
  } else console.error('Error OLL rule match', rule.id)
})
```

在这个支持自测试的规则匹配算法基础上，求解魔方的全部步骤就这样计算出来了 :)

## 成果与后记
经过半个多月业余时间的折腾，笔者实现了一个非常小巧的魔方求解模拟器 [Freecube](http://ewind.us/h5/freecube/)。它支持三阶魔方状态的渲染和逐步求解，还提供了旋转与求解的 API 可供复用。由于它没有使用任何第三方依赖并使用了各种力求精简的「技巧」，因而它的体积被控制在了压缩后 10KB 内。作为对比，魔方社区的已有实现依赖了 Three.js，体积达到了 1.5MB（当然了它的功能也比我们这个小玩具强大不少）。欢迎移步 [GitHub](https://github.com/doodlewind/freecube) 观光 XD

Freecube 是笔者在很多地方忙里偷闲地实现的：咖啡厅、动车、公交车甚至饭桌上……即便写不了代码的场合，也可以拿 iPad 写写画画来设计它。它的灵感来自于 @youngdro 神奇的[吉他和弦算法博文](https://juejin.im/post/5b2627d051882574ac7848a4)，另外感谢老婆对 README 文档的审校 XD

作为一个小广告，这个项目的 logo 是用我司的 [平面编辑器](https://www.gaoding.com/) 排版生成的（当然了，魔方图片仍然是笔者自己渲染的）后面也应该会以此为契机探索更多的 WebGL 等技术在前端的应用，欢迎各位大佬尝鲜~
