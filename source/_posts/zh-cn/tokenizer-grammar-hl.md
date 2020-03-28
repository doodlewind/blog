categories: Note

tags:

- Web
- JS
- Algorithms

date: 2015-04-01

toc: false

title: Tokenizer 与语法高亮
---

![Demo](http://7u2gqx.com1.z0.glb.clouddn.com/Tokenizer与语法高亮1)

为了对付可能的约架，学学写 Tokenizer 还是有其必要性的。这个 [Demo](http://ewind.us/h5/sql-hl/index.html) 就是个小示例。

<!--more-->

顾名思义，Tokenizer 就是把输入的字符流转化为一个个 Token 的工具。这个过程就是所谓的 Lexial Analysis，也就是词法分析。完成词法分析后，文本被分离为一些独立的 Token，便于在接下来的语法分析过程中建立语法树。另外，Tokenizer 还可以丢掉源代码中的注释和空白，只是实现语法高亮时没必要这么做就是了。

分离 Token 的过程既可以通过自己定义的状态机来实现，也可以（偷懒地）利用正则表达式来匹配。由于正则表达式总可以表达成自动机，因此这两种方式其实是共通的。这里呢，就用 JS 的正则引擎来简单地实现这个过程。

说到用正则匹配，可能比较容易联想到通过 `text.replace(/\s/, '')` 这样的全局替换来去除空白的做法。这么做肯定是 Too Young 啦，譬如查询字段中的空格就不能随便吃掉。这里的做法是从前往后读入 `<textarea>` 中的字符流，依次匹配词素，把匹配到的词素装在指定了词素颜色的 `<span>` 里，这样就实现了基础的语法高亮。

下面的示例每次用 `nextToken()` 匹配下一个字符，用 `forward()` 向前移动（吃掉）输入字符中所匹配词素长度的位置。如此循环，就能完成对一个词法的匹配啦。当然了，SQL 的关键字才不止这么几个，不要太在意这种细节了……

``` js
function nextToken() {
    var space = text.match(/^\s/);
    if (space != null ) return forward(space, WHITE);
    var key = text.match(/^(SELECT|FROM|WHERE|VALUES|JOIN|HAVING|GROUP BY)/i);
    if (key != null ) return forward(key, COLOR_1);
    var field = text.match(/^'[^']*'/);
    if (field != null ) return forward(field, COLOR_2);
    var token = text.match(/^[\S]+/);
    if (token != null ) return forward(token, COLOR_5);
    var enter = text.match(/^\n/);
    if (enter != null ) return forward(enter, WHITE);
    function forward(symbol, color) {
        // 'eat up' text input
        text = text.substr(symbol[0].length, text.length);
        if (symbol[0] == '\n') {
            return "<br>";
        } else {
            return "<span style='color:" + color + "'>" + symbol[0] + "</span>";
        }
    }
}
```

这其实也是所有文本编辑器做语法高亮的基本思路（为什么这么武断呢。因为要是它走的不是这个思路，那么丫就是 IDE，不是文本编辑器啦……）。

下一步就是比较棘手一点的语法分析了。要记住，我们的征途是星辰大海！
