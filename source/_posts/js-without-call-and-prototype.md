categories: Note

tags:

- JS
- Summary

date:  2016-10-01

toc: true

title: 远离 call / prototype 的面向对象 JS 
---

JS 虽然是一门面向对象的语言，但其面向对象的实现机制是**基于原型**而不是**基于类的**。然而由于基于类的编程语言已经深入人心，因此在 JS 中产生了各种模式，企图在用原型来模拟类的行为。

<!--more-->

## 实例化
以最基础的类实例化和继承为例，常见的 JS 模式是通过 `new` 关键字来模仿类：

``` js
function Foo(name) {
    this.name = name;
}

Foo.prototype.bar = "bar";
Foo.prototype.myName = function() {
    return this.name;
}

var a = new Foo('a');
var b = new Foo('b');

console.log(a.myName()); // 'a'
console.log(b.myName()); // 'b'

console.log(a.bar);      // 'bar'
console.log(b.bar);      // 'bar'
```

上例中 `myName` 相当于公有的类方法，`a` 和 `b` 各自持有私有的 `name` 属性。挂在原型链上的 `bar` 则是公有属性。由于 JS 没有 `final` 的概念，因此修改 `a.myName` 或者 `a.bar` 就会把 `b` 上相应的方法或属性给覆盖掉。

我们已经实现了公有属性、私有属性和公有方法了。剩下的私有方法，当然也可以按这个套路来实现：

``` js
function Foo(name) {
  this.name = name;
  this.myName = function() {
    return this.name;
  };
}

var a = new Foo('a');
var b = new Foo('b');

console.log(a.myName()); // "a"
console.log(b.myName()); // "b"
```

现在 `myName` 是 `a` 和 `b` 的私有方法了，但是这时候 `this.myName` 中嵌套着一个 `this`，这个 `this` 的指向很容易让人困惑。因为 JS 中的 `this` 并非指向包裹着它的 `function` 的块级作用域，而是指向 Call Stack 上调用它的上下文。从而在调用 `a.myName` 时，`this` 指向了 `a`，获取到了 `a.name` 这个属性。


## 继承
在使用私有方法时 `this` 指向的迷惑性，是这种 JS OO 模式的第一个问题。下面来看继承时的情况：

``` js
var state = 1;

// 父类
function Foo(name) {
  state *= 2; // 构造一次新对象时，state 乘 2
  this.name = name;
}

// 子类
function Bar(name) {
  Foo.call(this, name);
}

Bar.prototype = new Foo();
// 可能还要修复 Bar.prototype.constructor

var b = new Bar('b'); // 只新建了一个子类对象
console.log(b.name);  // "b"
console.log(state);   // state 是多少？
```

这样 `Bar` 就能继承 `Foo` 的 `myName` 方法了。不过这里的问题有两个：

1. 调父类方法时，显式 `call` 了父类名称，在需要 `Foo` 到 `Bar` 到 `Baz` 的多层继承时吃屎（这个比较无所谓）。
2. `state` 不是 2 而是 4！理论上构造一次 `Bar` 对象只会执行一次父类的构造函数，但实际上在 `Bar` 中执行 `call` 时，已经执行了一次 `Foo` 的构造函数。而在 `Bar.prototype = new Foo();` 改写原型时，又执行了 一次 `Foo` 这个构造函数。如果 `Foo` 这个构造函数带有写日志、Ajax 取数据、操作 DOM 等副作用的话，可能就会发现新建一个 `Bar` 的时候写了两次日志、发了两次请求、把一个 DOM 元素移动了两倍距离…非常糟糕


## 对象关联
对象委托是 Kyle Simplson 提出的一种模式，通过 `Object.create` 来解决在 JS 中模拟类的继承问题。它**并不实例化类，而是直接组装对象实例**，从而实现对象的复用。以表单验证的业务情景为例，对象关联的代码形式如下：

``` js
// 验证父对象
var Validator = {
    getInput: function() { /* 从 DOM 获取 form 信息 */ },
    isValid: function(input) { /* 验证表单，返回 boolean */ },
    postData: function(input, callback) { /* 发送请求 */ },
    renderCallback: function(response) { /* 执行请求发送成功后的 DOM 操作 */ }
}

// 将自定义子对象关联到父对象
var MyValidator = Object.create(Validator);

// 定义子对象对外开放的 API
MyValidator.validate = function() {
    var input = this.getInput();
    if (this.isValid(input)) {
        this.postData(input, this.renderCallback);
    }
}

// 启用验证
$('.submit-btn').click(MyValidator.validate);
```

这里的 `MyValidator` 继承了 `Validator` 的方法，并将这些方法组合对外开放为 `validate` 这一个新的方法。在这种模式下，对上文中 OO 各个特性的实现方式都非常简单：

* 私有方法和私有属性在子对象中声明
* 公有方法和公有属性在父对象中声明
* 实现多重继承时，将一个新的对象关联到子对象上即可

除此之外，这一模式还有不少额外的优点：

* `this` 的指向十分清晰
* 避开了 `prototype` 和 `constructor` 这两个坑（由 `Object.create` 处理）
* 无需 `call` 父类，容易实现多重继承

相应的，注意事项包括：

* 尽量用父对象方法组合出更有语义性的子对象新方法，避免覆盖父对象方法名。
* 状态尽量直接存储在子对象上。
* 调用时，尽量不要越过子对象直接调用父对象的方法，而是使用子对象封装出的新方法。

最后，关于兼容性，`Object.create` 为 ES5 标准支持，这也就包括了 IE9 在内的所有主流浏览器，且其 polyfill 也十分简单：

``` js
if (!Object.create) {
    Object.create = function(o) {
        function F(){}
        F.prototype = o;
        return new F();
    }
}
```
