categories: Note

tags:

- JS

date: 2016-10-12

toc: false

title: 从 sum(2)(3) == sum(2, 3) 到实现柯里化函数
---

一道前端笔试题如下：写出一个满足 `sum(2, 3) == 5` 且 `sum(2)(3) == 5` 的 `sum` 函数。

<!--more-->

只是完成题目本身，并没有什么难度，只是考察 JS 中如何判断输入的函数参数个数，并且将函数作为返回值返回而已。一个简单的实现如下：

``` js
function sum() {
    if (arguments.length > 1) {
        return arguments[0] + arguments[1];
    } else {
        var a = arguments[0];
        return function(x) {
            return a + x;
        }
    }
}
```

进阶一点的题目版本应该是这样的：实现一个 `sumOf3(a, b, c)` 函数，使得下面的几种调用都返回 6：

``` js
sumOf3(1)(2)(3)
sumOf3(1, 2)(3)
sumOf3(1)(2, 3)
sumOf3(1, 2, 3)
```

很好，参数个数增加的时候，上面的解法就离组合爆炸不远了。再将这个问题一般化，就得到了更有意义的问题：能否实现一个一共需要 n 个参数的函数，使得这 n 个参数可以分多次函数调用依次传入呢？

直接写出这样的函数无疑是麻烦的。不过我们可以写出用于生成这个函数的函数，这就是所谓的高阶函数了。

现在我们有一个原函数 `sumOf4` 的实现如下：

``` js
function sumOf4(a, b, c, d) {
	return a + b + c + d;
}
```

我们想要构造出一个 `sum4` 函数，使得如下的调用都能返回 10：

``` js
sum4(1, 2, 3, 4)
sum4(1, 2)(3, 4)
sum4(1)(2, 3, 4)
sum4(1)(2)(3, 4)
sum4(1)(2)(3)(4)
```

为了生成这个 `sum4` 函数，我们需要将原本接受 4 个固定参数的 `sumOf4` 函数改造成一个能分次传入参数的函数。对实现这个过程的函数而言，其输入是 `sumOf4` 函数，输出是 `sum4` 函数。所以，这个函数实现了将普通函数 `sumOf4` 转化为能分次接受参数的柯里函数 `sum4`，因此称这个函数为柯里化函数。

实现思路并不复杂，只需要递归的基本思路：递归检查参数是否达到指定的长度。如一开始指定 5 个参数，第一次调用时给了 2 个，那么就递归地返回一个新函数，这个新函数检查给自己的参数够不够剩下的 3 个，再传 1 个参数调用这个新函数时，它就返回一个检查参数够不够 2 个的函数。一直到检查到参数终于凑满 5 个时，就执行原函数返回。代码如下：

``` js
function curry(fn, argLen, currArgs) {
    return function() {
        var args = [].slice.call(arguments);
        // 首次调用时未提供最后一个参数
        if (currArgs !== undefined) {
            args = args.concat(currArgs);
        }
        // 递归出口
        if (args.length == argLen) {
            return fn.apply(this, args);
        } else {
            return curry(fn, argLen, args);
        }
    }
}

function sumOf4(a, b, c, d) {
	return a + b + c + d;
}

// 改造普通函数，返回柯里函数
var sum4 = curry(sumOf4, 4);

console.log(sum4(1, 2, 3, 4)); // 10
console.log(sum4(1, 2)(3, 4)); // 10
console.log(sum4(1)(2, 3, 4)); // 10
console.log(sum4(1)(2)(3, 4)); // 10
console.log(sum4(1)(2)(3)(4)); // 10
```

由此可见 JS 中函数式编程的强大。譬如如果存在一个函数，其参数需要通过多次 Ajax 请求来获取。那么在使用这个函数时，可通过 `curry` 这一柯里化函数，将原函数拆分，从而在多次请求的响应中逐次传入所有参数。当然，链式调用也能实现同样的需求，这个柯里化函数本身也只是一个比较优雅的 Proof of Concept 而已。
