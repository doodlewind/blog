categories: Note

tags:

- Web

date: 2019-04-28

toc: true

title: 从 glTF 标准看动画数据格式设计
---

一般情况下，Web 应用所使用的数据模型都是静态的。那么该如何存储动态的动画效果呢？这方面 3D 工业界的 glTF 标准值得借鉴。

<!--more-->

## glTF 格式简介
glTF (GL Transmission Format) 是用于高效传输 3D 模型的通用标准。它获得了 Adobe、Google、Microsoft、nVidia 等业界巨头的背书，也有 Three、Cesium 等开源项目的支持。有了 glTF，你可以用 Blender 等编辑软件制作各种 3D 模型并导出为这一格式。这样只要是兼容了 glTF 的渲染引擎，就能无缝地使用这些模型了。

听起来似乎很高大上？其实不然，glTF 规范中的元数据，就是用 Web 开发者非常熟悉的 JSON 格式来表示的。这使得它对于 Web 相当友好，并对 Web 应用的数据结构设计也具备了相当的参考价值。一份 glTF 格式的模型数据大致形如这样：

``` js
// TODO
```

可以看到 glTF 格式是相当可读的，更加复杂的 3D 模型也可以用这种方式语义化地表达出来。但现在我们的重点并不在 3D 数据的结构上，让我们关注一下它是如何定义动画能力的吧。


## glTF 中的动画
TODO


## 总结
TODO
