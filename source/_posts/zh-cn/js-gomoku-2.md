categories: Note

tags:

- Web
- JS
- Algorithms

date: 2015-03-16

toc: true

title: 自制五子棋 (2) AI 入门
---

上一篇中基本完成了基础棋盘的布局，现在让我们从前端转向（伪）后端，关注一下对弈所需的算法实现，和一些相关的优化策略吧。

<!--more-->

![AI](/images/gomoku/2-1.gif)

## 朴素的基础：打分函数
最朴素的打分算法，是后面搜索算法的基石。它的策略是简单地遍历当前形势下所有下一步的落子选择，为每种选择打分，依据打分结果，选出最优的那个选择，作为下一步移动的依据。

那么，打分函数的设定依据是什么呢？我们知道，对于五子棋这种存在着「先手必胜法」的游戏，先移动的黑方总是存在着一定的优势。现在，假设我们的算法始终扮演着白方的角色，那么我们可以假设分数越高，黑方的优势就越大。所以，在打分函数正常工作后，白方就可以将分数最小化作为决策依据了。

有了思路，下面就需要解决「对场上形势打分」的问题了。最基本的几种情形可以归纳如下：

* 如果场上存在连续的五个黑子，这标志着游戏的结束，于是一旦找到这种情形，就把分数加得尽量高（譬如 1000 点）。
* 如果场上存在两头均为空的四个黑子（Open-Four），这也是死棋的标志，于是分数也可以加得尽量高（这里也是 1000 点）。
* 如果场上同时存在了两个两头均为空且两头互不重合的三个黑子（Open-Threes），这也是死棋的标志——和小伙伴玩的时候，也一般是通过构造这种堵不过来的情况来赢棋的吧。因此，找到这种情况时，也需要把分数加上 1000 点。
* 对于未被完全堵死的黑三子和黑四子，显然它们越多，黑方的优势就越明显。这时候，我们可以为它们的个数乘上一个固定的分值（譬如 50 分）。

只要依次判断黑子是否以上的几种情况，就可以容易地计算出一个分值，来作为对局势判定的依据。其实，一个好的打分函数可以在并不会增加多少时间复杂度的前提下，顶得下面提到的搜索过程中，一到两层的搜索深度。实际上，有了这个打分函数，原则上就已经造出了一个「能对局势做出响应」的 AI 了。

下面的示例是用 JS 的模块模式，为名为师傅（*Sifu*）的 AI 构造一个打分示例。嗯对了，为棋盘的二维数组起的变量名是 `goban`。

``` js
// use anonymous function for closure
var SIFU = (function() {
    var EMPTY = 0;
    var BLACK = 1;
    var WHITE = 2;
    var SIZE = 10;
    var sifu = {};
    
    // use this method to return next move
    sifu.think = function(goban, color) {
        var pos;
        var alpha = -9999;
        for (var i = 0; i < SIZE; i++) {
            for (var j = 0; j < SIZE; j++) {
                if (g[i][j] == EMPTY) {
                    g[i][j] = WHITE;
                    var score = sifu.evaluate(goban);
                    if (score > alpha) {
                        alpha = score;
                        pos = {x: i, y: j};
                    }
                    g[i][j] = EMPTY;
                }
            }
        }
        this.evaluate(goban);
        return pos;
    };
    sifu.evaluate = function(goban) {
        var count = 0;
        function hasFive(color) {
            var g = copy(goban);
            for (var i = 0; i < SIZE; i++) {
                for (var j = 0; j < SIZE; j++) {
                    if (
                        (j + 4) in g &&
                        g[i][j] == color &&
                        g[i][j + 1] == color &&
                        g[i][j + 2] == color &&
                        g[i][j + 3] == color &&
                        g[i][j + 4] == color
                    ) return true;
                    /* other judge conditions skipped */
                }
            }
            return false;
        }
        if (hasFive(BLACK)) {
            count += 1000;
        }
        /* other judge conditions skipped */
        return count;
    };
    
    return sifu;
})();
// usage example
var pos = SIFU.think(goban);
```


## 暴力的搜索：Minimax 算法
上面介绍了打分函数的构建，那么下面关注的就是如何「通过预料对手的行为，选择自己的行动」。这种类似于「诸葛亮料定司马懿料定自己不会用空城计，所以诸葛亮用了空城计」的算法思想，被称为 Minimax。要想对它有个直观的认识，可以先看看来自 ![WikiPedia](/images/gomoku/2-1.gif) 的题图（这可是会动的 GIF 哦）。

对于一次比赛，所有可能的行动策略都可以用一棵树来表示。用树的每一层都代表着一个回合内一方所有可能的行动。而每层的每个节点，又可以往下生长出在这个行动的基础上，对方下一回合的所有行动可能。

介绍打分函数时已经说了，黑方的策略是将自己的优势最大化，白方则是将自己的劣势最小化。这也就对应着在树中的每一层，交替地选择分数最高（黑方）或分数最低（白方）的枝干，并返回这一层做出最后选择后，得到的局势分值。这样在递归调用结束后，就可以判断出下一步的最优行动了。

下面这个函数就是 Minimax 的一个递归实现，注意我们是交替地指定 color 参数的，这也就相当于思考「我会料到他会料到我会料到他会料到我会料到他会出剪刀，所以我要出石头」……

``` js
function minimax(goban, depth, color) {
    var pos, score;
    var g = goban;
    
    // evaluate score for leaf node
    if (depth == 0) return sifu.evaluate(g, color);
    if (color == BLACK) {
        var value = -9999;
        for (var i = 0; i < SIZE; i++) {
            for (var j = 0; j < SIZE; j++) {
                if (g[i][j] == EMPTY) {
                    // try a move
                    g[i][j] = BLACK;
                    
                    // get best move recursively
                    score = minimax(g, depth - 1, WHITE);
                    if (score > value) {
                        value = score;
                        pos = {x: i, y: j};
                    }
                    
                    // reset the goban
                    g[i][j] = EMPTY;
                }
            }
        }
    }
    else if (color == WHITE) {
        var value = 9999;
        for (var i = 0; i < SIZE; i++) {
            for (var j = 0; j < SIZE; j++) {
                if (g[i][j] == EMPTY) {
                    g[i][j] = WHITE;
                    score = minimax(g, depth - 1, BLACK);
                    if (score < value) {
                        value = score;
                        pos = {x: i, y: j};
                    }
                    g[i][j] = EMPTY;
                }
            }
        }
    }
    return value;
}
```

顺便再提一个细节问题：刚才的 Minimax 实现（包括 WikiPedia 的伪代码）返回的都是打分值，而不是具体的移动位置。那么怎样通过 Minimax 得到下一步的位置呢？答案也很简单，只要把 Minimax 当做一个打分函数来使用就行啦。

## 取巧的优化：Alpha-Beta 剪枝
「我会料到他会料到」……的 Minimax 算法思路虽美，但计算量太大。在桌面级的 Web 浏览器中，对一个 15x15 的棋盘用朴素的 Minimax 搜索三层，时间就要以分钟计了（其实这和 JS 对数组的奇葩实现也有关系，搜索过程中最频繁的操作就是对数组下标的遍历，而 JS 的数组是通过哈希而不是偏移量实现的，访问起来会慢很多）。这样搞出来的 Sifu AI 显然是十分傻逼而需要优化的。

基本的优化思路有两种

* 缩小搜索范围。
* 跳过树中不可能选择到的情形（所谓的*剪枝*）

第一种优化的实现可以很朴素：把对棋盘进行的搜索，简化为对所有已存在棋子的邻接点进行的搜索。这么做可以大大提高性能。因为实现起来没什么特别之处，这里就略过不提了吧。

而第二种优化方式就比较特别了。它的实现其实是对 Minimax 的一个改进，根据为 Minimax 递归调用所增加的参数，它被称为[ Alpha-Beta 剪枝算法](http://en.wikipedia.org/wiki/Alpha-beta_pruning)。

这个算法的思路我是这样理解的：如果「他料到我料到他料到了更好的一步，那么这一步和这一层其它的步数就都没必要考虑了，因为他是不会让我走到这步的」。

要想可视化地了解它的执行方式，可以参考这个同样来自 WikiPedia 的动图：

![α-β Pruning](/images/gomoku/2-2.gif)

不过，这个听起来很绕的算法，实现起来并不复杂，用下面的实现和之前的 Minimax 对比一下，就能发现差别所在。

``` js
// minimax with alpha-beta pruning
function minimax(goban, depth, alpha, beta, color) {
    var pos, score;
    var g = goban;
    if (depth == 0) return sifu.evaluate(g, color);
    if (color == BLACK) {
        var value = -9999;
        for (var i = 0; i < SIZE; i++) {
            for (var j = 0; j < SIZE; j++) {
                if (vision[i][j] == true && g[i][j] == EMPTY) {
                    g[i][j] = BLACK;
                    score = minimax(g, depth - 1, alpha, beta, WHITE);
                    g[i][j] = EMPTY;
                    if (score > value) {
                        value = score;
                        pos = {x: i, y: j};
                    }
                    
                    alpha = Math.max(alpha, score);
                    if (alpha >= beta) {
                        // perform pruning
                        break;
                    }
                }
            }
        }
    }
    else if (color == WHITE) {
        var value = 9999;
        for (var i = 0; i < SIZE; i++) {
            for (var j = 0; j < SIZE; j++) {
                if (g[i][j] == EMPTY) {
                    g[i][j] = WHITE;
                    score = minimax(g, depth - 1, alpha, beta, BLACK);
                    g[i][j] = EMPTY;
                    
                    if (score < value) {
                        value = score;
                        pos = {x: i, y: j};
                    }
                    beta = Math.min(beta, score);
                    if (beta <= alpha) {
                        // perform pruning
                        break;
                    }
                }
            }
        }
    }
    return value;
}
```

实践表明，应用了剪枝后的搜索速度可以提升 3 倍左右。不过剪枝优化只在搜索层数大于 3 的时候才会生效，只搜索 2 层的话是没有多少性能提升的。

以上就是 Sifu 五子棋所应用的算法基础了。虽然打分函数还很傻逼，虽然搜索起来还很慢，但是它的雏形好歹已经出来啦~最后一篇文章会介绍一些对 Sifu 师傅页面设计和交互体验的改进方式，做完这步以后，基本就可以拿去让基友试试啦。
