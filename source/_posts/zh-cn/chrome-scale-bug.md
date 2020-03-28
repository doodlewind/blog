categories: Note

tags:

- Web

date: 2018-10-10

toc: true

title: 让 Chrome 崩溃的一行 CSS 代码
---

一般的 CSS 代码只会出现 UI 版式或者兼容性方面的小问题。但这里我们要分享一行有趣的 CSS，它可以直接让你的 Chrome 页面挂掉 :)

<!--more-->

## 复现

1. 在 Chrome 里打开一个稍复杂的页面，比如[知乎](zhihu.com)或者[掘金](http://juejin.im)
2. 打开开发者工具，为页面 `<body>` 增加样式 `style: "width:1px; height:1px; transform:scale(10000)"`
3. 欣赏任务管理器里 Chrome 崩溃前的内存占用

![memory](/images/chrome-scale-bug/memory.png)

其实这台机器只有 8GB 内存，不过这不重要了。和让 JS 崩溃的红线容量 4GB 比起来，果然还是 CSS 更强大呢 :)


## 故事
这行代码的发现，源自于我们的编辑器项目在实现画布尺寸调节时的一个诡异现象：用户调节画布尺寸时，**只要新旧尺寸之比超过一定幅度，Chrome 就会卡死**。

虽然这个问题很难由普通用户的操作路径触发，不过它所导致的后果确实比较严重。排查时我们首先考虑了 JS 阻塞和 DOM 重绘过频等方面的可能性，但它们都不是问题所在。一个突破点在于调试器 Rendering 工具中 FPS Meter 的输出：

![vram](/images/chrome-scale-bug/vram.png)

这里 GPU Memory 被占满了。虽然这个提示信息现在看来很明显是与硬件加速有关的，但在没有相关经历的情况下我们还是没有确定它与具体代码之间的关联。直到我们偶然查看 Chrome 设计文档中关于 Compositing 的介绍时，发现了一个行为：Blink 会将 DOM 节点映射到 LayoutObject 的渲染树，这棵树中的节点理论上每个都能具备到渲染后端的上下文，但为了节约资源 Chrome 会将它们做一些合并后再渲染。而这时存在 CSS 定位（如绝对定位与 transform）的元素是不能合并的，这会造成对显存的额外开销。

基于这个信息的提示，我们使用 Layout 工具来调试当时的页面，果然找到了一个特殊的地方：

![layout-debug](/images/chrome-scale-bug/layout-debug.png)

图中最大的矩形 Layer 通过一般的 DOM 调试是无法看见的，因此我们推测它的过大尺寸所导致的 RAM 开销是罪魁祸首。基于这个信息，我们最后找到了一个宽高都很合理但 transform 的 scale 值可能在逻辑中被修改得很大的 DOM 节点，限制它的 scale 上限即可解决问题：我们不难发现 scale 的值和最终对应像素数量之间有着 O(N^2) 的关系，1 个像素只放大 100 倍也有 10000 个像素了。因此 scale 很大时对内存 / 显存的过度使用也就是有可能的了（当然浏览器会做 Tiling 等工作，因此这不符合一般情况下的实际情形，Safari / Firefox 这时候也没有出现问题）。最后给 Chrome 提了个 bug 见 [#894115](https://bugs.chromium.org/p/chromium/issues/detail?id=894115)


## 总结
需要注意的是，因为缺乏对浏览器内核的深度了解，上面的调试思路很可能是不准确的。简单的总结：

* 硬件加速是有代价的，最好能知道代价在哪
* 浏览器的文档里藏着很多有意思的东西
* 调试工具的一些冷门功能其实很强大，平时可以多试试

希望大佬指正，谢谢 XD
