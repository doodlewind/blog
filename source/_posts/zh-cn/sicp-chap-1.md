categories: Note

tags:

- Summary

date: 2015-04-30

toc: true

title: SICP Chapter 1 笔记
---

> 心智活动除了产生认识外，表现在
> 
> 将若干简单认识组合为一个复合认识。
> 将两个认识放在一起对照，得到有关它们相互关系的认识。
> 将有关认识与世纪中和它们同在的其它认识隔离开，这就是抽象。

<!--more-->

## 程序设计的基本元素

* 基本表达形式
* 组合的方法
* 抽象的方法

我们需要处理两类要素：过程和数据。

将值与符号关联，而后又能提取，这意味着解释器应该能维护某种存储能力，以保持有关的名字-值对偶的轨迹。这种存储被称为*环境*。


### 组合式的求值
解释器的工作过程

1. 求值该组合式的各个子表达式。
2. 将最左子表达式（运算符）的值的过程用于相应的实际参数。

采用递归思想，简洁地描述深度嵌套的情况。通过构造对组合式的树形表示，可以发现计算过程是「值向上穿行」的。

处理组合式计算的基础情况的定义

* 数的值就是它们的数值
* 内部运算符的值就是能完成运算的机器指令序列
* 其他名字的值就是环境中关联于这一名字的对象

`(define x 3)` 不适用于上述定义。它的作用是将 `x` 关联到 `3` 上，因此他也不是一个组合式。称其为*特殊形式*。

### 复合过程

``` lisp
(define (square x) (* x x))
```

是一个*复合过程*。

``` lisp
(define (<name> <formal parameters>) <body>)
```

复合过程可以有多个实际参数

``` lisp
(define (sum-of-squares x y)
  (+ (square x) (square y))
```

过程应用的代换模型

* 将形式参数用实际参数一步步取代，最后得到过程体的值。

### 应用序和正则序

* 完全展开后归约：**正则序**
* 先求子表达式值后应用：**应用序**

Scheme 采用应用序

### 条件表达式和谓词
需要分情况分析时，可以利用 `cond` 条件，它是一种特殊形式

``` lisp
(define (abs x) 
  (cond ((> x 0) x)
        ((= x 0) 0)
        ((< x 0) (- x))))
```

可以用特殊符号 `else` 简化 `cond` 结构。

``` lisp
(define (abs x) 
  (cond ((> x 0) x)
        (else (- x))))
```

或者用 `if`，它适用于分情况分析中只有两种情况的情形。

``` lisp
(define (abs x)
  (if (< x 0)
      (- x)
      x))
```

除 `>` `<` `=` 等基本谓词外，逻辑运算符的使用

* `(and <e1> <e2> ...)`
* `(or <e1> <e2> ...)`
* `(not <e>)`

注意，`and` 与 `or` 都是特殊形式，因为子表达式不一定都求值。`not` 则是普通过程。

检测一个数是否大于等于另一个数：

``` text
(define (>= x y)
  (or (> x y) (= x y)))
```

### 牛顿法求平方根
对问题说明性的定义

``` lisp
(define (sqrt x)
  (the y (and (>= y 0)
              (= (sqrt x) y))))
```

它没有描述可以用于计算出平方根的计算过程

过程的思想：如果对 x 的平方根有了一个猜测 y，那么 y 和 x/y 的平均值更接近 x 的平方根。

``` lisp
(define (sqrt-iter guess x)
  (if (good-enough? guess x)
      guess
      (sqrt-iter (improve guess x)
                          x)))
```

### 过程作为黑箱抽象
`square` 是一个过程的抽象，在这一抽象层次上，任何能计算平方的过程都可以利用。

形参的具体名称完全不影响对过程的抽象。这样的名字称为约束变量。在过程定义中，被声明为过程形式参数的约束变量，就以过程的体作为它们的作用域。

通过内部定义，可以将子过程局部化，以免构造大系统时造成变量名冲突。

除了将辅助过程的定义放到内部，还可以让上述过程中的 `x` 作为内部定义中的自由变量。由于 `x` 在 `sqrt` 的定义中是受约束的，从而 `good-enough?` `improve` 等子过程也都在 `x` 的定义域中。这就称为*词法作用域*。


## 过程与它们所产生的计算
一个过程就是一种模式，描述了一个计算过程的局部演化方式。这些演化方式的「形状」各不相同，对时间与空间资源的消耗速率也不相同。

### 线性的递归和迭代
直接递归地计算阶乘

``` lisp
(define (factorial n)
  (if (= n 1)
      1
      (* n (factorial (- n 1)))))
```

迭代地计算阶乘

``` lisp
(define (factorial n)
    (fact-iter 1 1 n))
(define (fact-iter product counter max-count)
    (if (> counter max-count)
        product
        (fact-iter (* counter product)
                   (+ counter 1)
                   max-count)))
```

第一个过程展示出「先展开后收缩」的形状，这是先构造出了计算的轨迹，再执行实际计算的一种过程，称它为线性递归过程。

第二个过程计算中没有任何增长或手作，需要保存的轨迹都存储在约束变量的当前值中。这种过程称为迭代计算过程。

注意区分递归计算过程和递归过程。前者是计算过程展开的方式，后者是语法形式上的自我引用。

在常见语言中，即便计算过程从原理上是迭代的，它的空间消耗也是与过程调用的数目成正比的。因此它们需要 `do` `while` 等「语法糖」来实现迭代。

### 斐波那契数
树形递归过程为

``` lisp
(define (fib n)
        (cond ((= n 1) 1)
              ((= n 0) 0)
              (else (+ (fib (- n 1))
                       (fib (- n 2))))))
```

由于这里每层分裂为两个分支，故而会产生指数级数量的递归计算过程。

优化为迭代形式


``` lisp
(define (fib n)
    (fib-iter 1 0 n))
(define (fib-iter a b count)
    (if (= 0 count)
        b
        (fib-iter (+ a b) a (- count 1))))
```

### 换零钱方式的统计
将总数为 `a` 的现金换成 `n` 种硬币的不同方式的数目等于：

* 将现金 `a` 换成第一种以外硬币的方式数目，加上
* 将现金 `a-d` 换成第一种以外硬币方式的数目，`d` 是第一种硬币的币值（`a-d` 可能小于 0，此时只有 0 种选择）

``` text
(define (count-exchange amount)
    (cc amount 5))
(define (cc amount kinds-of-coins)
    (cond ((= amount 0) 1)
          ((or (< amount 0) (= kinds-of-coins 0)) 0)
          (else (+ (cc amount
                       (- kinds-of-coins 1))
                   (cc (- amount
                          (first-denomination kinds-of-coins))
                       kinds-of-coins)))))
(define (first-denomination kinds-of-coins)
    (cond ((= kinds-of-coins 1) 1)
          ((= kinds-of-coins 2) 5)
          ((= kinds-of-coins 3) 10)
          ((= kinds-of-coins 4) 25)
          ((= kinds-of-coins 5) 50)))
(count-exchange 100)
292
```

### 增长的阶
定义 `R(n)` 拥有 `Ɵ(f(n))` 的增长阶，当且仅当存在与 `n` 无关的正数 `p` 和 `p`，使得 `pf(n) <= R(n) <= qf(n)` 对任何足够大的 `n` 都成立。
