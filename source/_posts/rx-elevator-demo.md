categories: Note

tags:

- Algorithms
- Reactive

date: 2017-08-27

toc: true

title: 响应式编程入门：50 行的电梯调度模拟器
---

据说每个程序员等电梯的时候都思考过电梯的调度算法…所以怎么动手实现一个呢？虽然这个场景貌似有些复杂，但却非常适合使用响应式编程的范式来处理。下面我们会在 RxJS 和 Vue 的基础上，一步步实现出一个最小可用的电梯调度模拟 Demo。

<!--more-->

## Demo
为了避免读者【脱了裤子就给我看这个？】的吐槽，在此我们先展示 50 行代码最终所能实现的效果：一台 10 层楼的电梯，你可以在每层楼按 `↓` 召唤电梯把你送到一楼。在多个楼层根据不同时序召唤出电梯的时候，这个模拟器的升降状态应当是和日常的体验一致的。先别急着吐槽它为什么这么简陋，把它实现成这样的理由会在下文中慢慢介绍😅

<iframe src="/h5/rx/final.html" width="100%" height="300"></iframe>

## Get Started
在介绍实际的编码细节前，我们不妨先考虑清楚最基础的思路，即**如何表达电梯的调度？**或者换一种表述方式，这其实是个更为有趣的话题：**如何使用代码抽象出一台电梯呢？**

也许高中物理学得好的同学首先会这么想：电梯可以抽象成由一条绳子挂着的盒子，我们可以传入它的重量 m、离地高度 h、当前速度 v、当前加速度 a，然后用一系列精妙的公式来描述它的运动轨迹……恭喜你，理科思维把你引入歧途了🙄请放心，最后的 50 行代码里**不涉及任何高中物理知识**。

倒是有个关于电梯的老段子更符合我们的抽象：【一个老屌丝看到一个老太婆进了电梯间，一会出来的居然是个白富美，于是就想着要是带了自己的老婆来该多好啊……】这里对电梯的抽象，**只不过是一扇数字会跳动的门而已**。我们不需要关心它的机械到底怎样运作，对于它的**状态**，只要知道电梯口液晶屏上的**方向**和**楼层号**就足够了。嗯，这就是 Duck Typing 的工科思维！

这两种思维有什么区别呢？让我们来考虑最简单的情形：在十楼按一个键，把电梯从一楼叫上来。这时，两种抽象方法所描述的内容会有很大的不同：

- **法一**：盒子开始以速度 v 向上运动，在十楼的高度 h 停下来。
- **法二**：楼层数字从 1 开始，按固定时间间隔加一，到 10 停止。

嗯，看起来后者实现起来很简单啊：只要每隔一秒 `setTimeout` 改一下楼层数，这个电梯就模拟出来啦😎恭喜你，你跳进了异步事件流的大坑里，考虑这些需求：

- 你在二楼想下楼，发现电梯正从三楼下来。这时候电梯会捎上你😆
- 你在十楼想下楼，发现电梯正在九楼往下走。这时候电梯并不会回头来接你😜
- 你在十楼想下楼，发现电梯正从二楼上来。你以为它会停在你这，结果其实是二十楼的混蛋叫的电梯😡
- ……

好的，这时候 `setTimeout` 恐怕不够用啦，至于什么 Redux Flux MobX……写这种需求也要掉层皮。嗯，到此我们的前戏终于差不多了，是时候介绍本文的主角 Reactive Programming 响应式编程了😀

在 Reactive 范式中，Stream 事件流的概念非常强大。我们都知道计算机处理的数据本质上都是离散的，即便是小姐姐的视频，也要拆成一秒 24 帧。对于我们的电梯模拟器，它的**输入其实就是用户在各个楼层上随时间变化的一系列离散操作，输出则是一个当前时间楼层和方向的状态**。这样，我们就能够使用 Stream 来表达模拟器的输入了。

Stream 和朴素的事件监听器有什么区别呢？Stream 是可以**在时间维度上进行组合、筛选等变换的**。如果觉得这个说法很抽象，不妨考虑这个例子：在十楼按一次电梯按钮，楼层数字会从 1 逐个走到 10。这时，我们就把**一个事件流中的一个事件，映射为了一个依次触发十次事件的新流**。再比如，我们只要把**从一楼到十楼**的事件流和**从十楼到一楼**的事件流简单地**连接**起来，就实现了**上楼接人再返回**的电梯基本功能！

话都说到这份上了，也差不多是时候 Show Me the Code 了🤓下面让我们来一步步使用 Reactive 实现 Demo 吧。

## Step 1
首先简要介绍一下这个 Demo 的技术背景：为简单起见，我们选择了 Vue 来充当简单的视图层，选择了 [RxJS](http://reactivex.io/rxjs/) 这个 Reactive 库来实现核心的功能。受限于篇幅，我们不会覆盖 Vue 的使用细节，只介绍 Reactive 相关的重要特性🙃另一方面，从 0 到 1 总是最难的，因此 Step 1 的内容也会是最多的😅

上文中，我们已经提到了 Rx 中流的强大。那么，我们首先考虑这个最最基本的需求吧：**在十楼按一下 `↓`，电梯数字从 1 开始逐次递增**。这时候，我们就从点击事件流中的一个事件，映射出了一个新流：

``` js
import { Observable } from 'rxjs'

const stream = Observable
  // 将 DOM 的楼层点击事件转化为 Observable 事件流
  .fromEvent(emitter, 'click')
  // 输入事件流，输出间隔 1s 触发新事件的新流
  .interval(1000)

// 流的一系列异步输出可以被订阅
stream.subscribe(x => console.log(x))
```

执行上面的代码，点击按钮时，就会每秒触发一个从 0 开始自增的事件流了，每秒也都能在控制台看到稳定的输出。但这并不符合要求：**怎样让楼层只增加十次呢？**我们引入 `take` 方法：

``` js
const up = Observable
  .fromEvent(emitter, 'click')
  .interval(1000)
  // 只会触发十次！
  .take(10)
```

嗯，接下来，我们发现还有一点不太优雅：楼层数字虽然按要求递增了，但却是从 0 到 9，而非从 1 到 10（你家有 0 层吗？）要按照特定规则映射出新流，我们直接使用熟悉的 `map` 方法就行：

``` js
const up = Observable
  .fromEvent(emitter, 'click')
  .interval(1000)
  .take(10)
  // +1 🐸
  .map(x => x + 1)
```

现在我们能够从一楼到十楼了，但是怎么下楼呢？我们先造一个从十楼到一楼的 Stream 吧😏

``` js
const down = Observable
  .interval(1000)
  .map(x => 10 - x)
  .take(10)
```

电梯需要先 UP 上楼，再 DOWN 下楼。为此，我们直接 `concat` 两个 Stream 就行：

``` js
function getStream () {
  // 声明 Up 和 Down...
  return up.concat(down) 
}
```

目前我们已经使用了 `interval` / `take` / `map` / `concat` 这几个 API 了，不过离真正完成 Step 1 这一步，还有一个非常关键的地方：**在不同楼层多次按下电梯按钮时，如何控制事件流？**

从这几个 API 的使用上，有些逼格比较高的同学也许会发现，我们的编码算法，其实有些接近拉普拉斯的**决定论**：电梯的按钮被按下后，它在**未来一段时间内的一系列状态变化在那一个时刻就已经被决定了**。换句话说，给我一个足够精确的当前状态，我能计算出整个未来（被拖走）……这时候我们首先遇到的麻烦是：**如果在输出的一系列事件执行时间中，又出现了新的输入事件，该如何定义后续的状态呢？**

这里，我们引入了 `switchMap` 方法来表达逻辑：假设在十楼按下按钮，在未来的十秒会触发十个事件。那么经过 `switchMap` 的封装，**一旦在十秒中的某个时刻又有新按钮被按下，原先剩余的事件就被舍弃，从这时起改为触发新按钮事件衍生出的新事件。**换一种说法，就是从一楼到十楼的电梯，如果走到一半有人按了五楼，就立刻从一楼重新出发，走到五楼返回。既然我们只关心状态，不关心这么量子化的电梯到底怎么实现的，这个 Step 1 的模拟器执行结果倒也是稳定的。稍微封装出一些参数，第一个 Demo 就完成啦：

<iframe src="/h5/rx/step1.html" width="100%" height="300"></iframe>

在上面的 Demo 中点击任何一个按钮，电梯就会从一楼开始去接你，然后返回。中途如果再次点击新楼层，电梯就会立刻重新从一楼出发（量子化？）去新楼层接人。嗯离实用还有段距离，不过已经有个样子啦。而目前我们的 Rx 逻辑大概长这样，非常简短：

``` js
import { Observable } from 'rxjs'

export function getStream (emitter, type) {
  return Observable
    .fromEvent(emitter, type)
    // target 为 Vue 中触发按钮事件的楼层号
    .switchMap(({ target }) => {
      const up = Observable
        .interval(1000)
        .map(x => x + 1)
        .take(target)
      const down = Observable
        .interval(1000)
        .map(x => target - x)
        .take(target)
      return up.concat(down)
    })
}
```

## Step 2
这一步中，我们需要解决电梯在新按钮按下时，神奇地量子化出现在一楼的问题（误）。我们不需要引入新的 API，只需要稍微修正一下逻辑：

第一步中，我们输入流中的状态只有 `target` 这个唯一的目标楼层，这就意味着**电梯甚至不知道按钮触发时，自己当前正在几楼**。为此，我们在 Vue 中添加一个 `curr` 参数来标记这个状态，这样，电梯每当新事件触发时，就会从当前楼层去往新目标楼层，而不是直接出现在一楼：

``` js
// 增加一个 curr 参数
.switchMap(({ target, curr }) => {
  const up = Observable
    .interval(1000)
    // 从当前楼层出发去往新楼层
    .map(x => x + curr)
    .take(target + 1 - curr)
  const down = Observable
    .interval(1000)
    .map(x => target - x)
    .take(target)
  return up.concat(down)
```

增加这个状态后，Step 2 的效果如下所示：

<iframe src="/h5/rx/step2.html" width="100%" height="300"></iframe>

这个 Demo 里，你可以先点击五楼，等到电梯走到三楼时再点击七楼。这时电梯不会直接出现在一楼，而是会从三楼老老实实地爬上七楼再下来。

不过这就带来了新的状态问题：先点击五楼，等电梯走到三楼时点击二楼。Boom！电梯出 bug 走不动了……

## Step 3
上一步的 bug 出现原因，是你 `take` 了一个负数（本来从五楼到六楼需要 `take` 一次，但从五楼到四楼则是 `take` -1 次）。普通的数组下标越界倒还好，面向时间序列的 Observable 下标越界的话，那可就是真正的 `-1s` 了……我们来补一点逻辑修复它吧！

``` js
.switchMap(({ target, curr }) => {
  // 目标楼层高于当前楼层，我们先上楼再下楼
  if (target >= curr) {
    const up = Observable
      .interval(1000)
      .map(x => x + curr)
      .take(target + 1 - curr)
    const down = Observable
      .interval(1000)
      .map(x => target - x)
      .take(target)
    return up.concat(down)
  } else {
    // 目标楼层低于当前楼层，我们直接下楼
    return Observable
      .interval(1000)
      .map(x => curr - x)
      .take(curr)
  }
```

好了，bug 修复了：

<iframe src="/h5/rx/step3.html" width="100%" height="300"></iframe>

上面的例子中，不管怎么按按钮，电梯终于都不会量子化，也都不会被玩坏啦！但是新的风暴又出现了：来回点十楼和五楼，会发现为什么这个电梯来来去去却总是到不了一楼呢……

## Step 4
在上面的例子中，我们传入 Stream 的状态其实始终不足以支撑电梯调度算法的正常工作。比如，我们并没有标志出一个楼层有没有被按钮点亮。在这一步中，我们在 Vue 的视图层增加一个这样的状态：

``` js
  // ...
  data () {
    return {
      floors: [
        { up: false, down: false },
        { up: false, down: false },
        { up: false, down: false },
        { up: false, down: false },
        { up: false, down: false },
        { up: false, down: false },
        { up: false, down: false },
        { up: false, down: false },
        { up: false, down: false },
        { up: false, down: false }
      ],
      currFloor: 1
    }
  },
```

嗯不要在意我们没有 `↑` 按钮为什么有 `up` 状态这些细节了。而 Rx 中我们添加一些简单的处理，让事件流传出的状态不仅仅包括当前楼层，也包括当前方向：

``` js
if (targetFloor >= baseFloor) {
  const up = Observable
    .interval(1000)
    .map(count => {
      const newFloor = count + baseFloor
      return {
        floor: newFloor,
        // 传出当前方向
        direction: newFloor === targetFloor ? 'stop' : 'up'
      }
    })
    .take(targetFloor + 1 - baseFloor)
    // ...
}
```

总之现在模拟器看起来长这样：

<iframe src="/h5/rx/step4.html" width="100%" height="300"></iframe>

点击时会在 Rx 中弹出一个醒目的 `alert` 来告诉你：我这个事件流是知道这些状态的！不过目前仍然没解决到不了一楼的问题……

## Final Step
在最后一步里，我们需要使用 Rx 处理之前到不了一楼的问题。我们知道，根据【决定论】的思想，Rx 其实在每个按钮事件触发时，就已经规划好了未来的电梯运动了。那么，我们能不能做做减法，把影响状态的事件过滤掉呢？这里我们可以使用 `filter` 来操作事件流：

简化的模型中，我们不妨认为电梯只会执行【先 up 再 down】的操作。这时，对于电梯运动过程中触发的新事件，可以这样分类：

- 如果电梯正在下降，那么不管在哪个楼层触发的新事件都不能再次让电梯再次 up and down，保证电梯总能下降到一楼
- 如果电梯正在上升，但是新的下降事件所在楼层低于当前楼层，那么电梯在这一轮下降过程中就可以经过这个新楼层，从而不需要再次 up and down
- 如果电梯正在上升，而且新的下降时间所在楼层高于当前楼层，那么我们重新进行一次目标为新楼层的 up and down 即可。

三种情形中，我们会判断出是否需要 up and down。既然每次 up and down 都是输入 `switchMap` 的一个事件，那么我们就可以直接在 `switchMap` 前放置一个 `filter` 来过滤掉无关的按钮事件：

``` js
  return Observable
    .fromEvent(emitter, type)
    .filter(({ floors, targetFloor, currFloor, currDirection }) => {
      // 参考上文逻辑判断
      if (currDirection === 'down') return false
      else if (currDirection === 'up' && targetFloor <= currFloor) {
        return false
      } else return true
    })
```

在放置这个逻辑后，我们把 up and down 的目标楼层由事件所在楼层，改为从 floors 中找出的最高楼层（maxTargetFloor），就能够保证电梯正常抵达目标楼层并正常返回了。不过这时还有最后的一点小问题：如果电梯下降中你按下了十楼，那么电梯到达一楼后不会再次来接你…解决方法很简单，在电梯下降到达一层时，尝试让电梯再 up and down 一次即可。

在我们实现完了最后的这一点异步逻辑后，就是本文开始时的 Demo 了：

<iframe src="/h5/rx/final.html" width="100%" height="300"></iframe>

到这时，Rx 中的代码仍然仅有 40 余行。而 Vue 中的代码也没有涉及任何的异步逻辑，仅仅需要对 Observable 做简单的订阅并渲染数据即可。

## Wrap Up
目前为止，我们的模拟器功能其实还只是真正电梯的一个子集，它还缺少这样的功能：

- 一个让用户在电梯里选择状态的面板
- 每层的 `↑` 按钮

不过在 Rx 的基本思路基础上，模拟出这些特性并不会显著地增加复杂度：在电梯里选择状态所触发的事件，其实在优先级上完全等效于在电梯门外的楼层选择（在向上运行的电梯内按一楼，电梯不会理你，就能够证明这一点）；而引入 `↑` 按钮同样只是引入了新的【决定论】状态而已……虽然这么说有些不负责任，不过从我们已有的实现来看 Rx 事件流确实是具备优雅解决这些问题的能力的。

如果你还在纠结需不需要在已有项目中引入 Rx，也许本文的实践能够为你提供一些小参考：Rx 在处理异步事件流时非常强大，类似Redux / MobX 等状态管理器所关注的与 Rx 其实并非同个层面的问题，一旦将它们与 Rx 结合，是能够处理很高的业务复杂度的。
不过如果你的需求仅仅是【数据加载时显示 Loading 状态】，那么引入 Rx 多少就有些杀鸡用牛刀了。

最后，这其实作者第一次尝试 Rx 的项目。真正编写的代码并不多，不过要适应它并使用它真正解决问题，所需要的思考时间其实比敲键盘写几行代码的时间要多得多……这也算是一种乐趣吧🙃本文中每一个 Step 都是从开发过程中的真实 commit 抽取出来的，希望本文对大家有所帮助🙃

[Github 传送门](https://github.com/doodlewind/rx-elevator-demo)
[Observable 文档](http://reactivex.io/rxjs/class/es6/Observable.js~Observable.html)