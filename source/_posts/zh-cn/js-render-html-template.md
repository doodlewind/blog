categories: Note

tags:

- Web
- JS

date:  2016-08-31

toc: false

title: JS 绑定数据到 HTML 模板的简易模式
---

前端开发中，非常常见的重复性劳动之一就是把 Ajax 获取的 JSON 数据渲染成带样式的 HTML 文本<!--more-->。比如把这份数据：

``` js
var data = {"name": "foo", "value": "bar"};
```

渲染成这样夹杂着一堆无关 class 名的 HTML:

``` html
<div class="xxx">
    <div class="yyy aaa-name">foo</div>
    <div class="zzz bbb-value">bar</div>
</div>
```

在没有 Angular 等 MV* 框架的情况下，常见的做法是在 jQuery 里直接拼接 HTML 字符串后 `append` 到页面中，或者使用 `createElement` 等原生方法，创建 HTML 节点、赋值后操作 DOM 渲染。这种做法虽然普遍且可行，但有几个问题：

* JS 代码里掺杂 HTML 降低可读性，尤其是代码中经常需要将 class 的引号用另一种引号包裹。
* 和数据无关的 CSS 样式也需要在 JS 里添加，增加了维护负担。
* 性能问题，需要反复调用 jQuery 而较为低效（当然也可以在手工拼接 HTML 字符串后一次完成渲染，但代码非常丑陋）。

下面介绍的模式，可以在不引入任何第三方类库且没有兼容性问题的前提下，利用 HTML 模板非常优(tou)雅(lan)地解决这一问题。

同样是上面的需求，首先可以在 HTML 里搞个猥琐的 `<script>` 标签装模板，注意这个模板本身对 JS 并没有任何依赖，也可以把模板放在 `<body>` 外面。

``` js
<script id="my-template" type="text/x-custom-template">
    <div class="xxx">
        <div class="yyy">%name%</div>
        <div class="zzz">%value%</div>
    </div>
</script>
```

渲染数据时，直接取出模板中的 HTML 文本，用 JS 做正则替换即可：

``` js
var template = document.getElementById("my-template").innerHTML;
var html = template
            .replace(/%name%/, data['name'])
            .replace(/%value%/, data['value']);
// insert HTML...
```

这种方法除了简洁高效以外，还有很大的想象空间：

* 不管是 tag / id / class 都能直接替换。
    * 渲染 class 可以替换 <div class="xxx-%name%">
    * 渲染 tag 可以替换 <%name%></%name%>
* 只要保证模板中符号名和数据 key 名的一致，很容易扩展出根据 JSON 格式数据自动渲染 HTML 的组件 / 方法。
* 如果对数据的 getter / setter 事件应用 PubSub 模式来触发渲染，就实现了数据单向绑定的核心内容：数据变更时自动渲染 HTML.

由于 jsPerf 挂掉了，暂时没有对这个模式进行性能测试，但可以肯定这个基于正则替换的模式能够优于 jQuery 选择器的重复劳动。希望这个简单的模式对开发能有所帮助。
