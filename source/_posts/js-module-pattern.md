categories: Note

tags:

- Web
- JS

date: 2014-12-09

toc: true

title: JavaScript 模块模式
---

> 本文翻译自 [JavaScript Module Pattern: In Depth](http://www.adequatelygood.com/JavaScript-Module-Pattern-In-Depth.html)


<!--more-->

Module Pattern 是 JavaScript 的一种泛用设计模式。这种模式大体上易于理解，但有些进阶用法知道的人并不多。下面从回顾基础开始，讨论包括一个原创模式在内的几个进阶模式。

## 基础模式
Module Pattern 始于 YUI 创始人 Eric Miraglia 四年前的一篇博文。如果你已经熟悉了这个模式，那么就跳过这里，直接阅读下面的「进阶模式」部分吧。

### 匿名闭包
闭包几乎是 **JavaScript 最有用的特性**了。只要直接创建并执行一个匿名函数，所有函数内部的代码都只在函数内的闭包内运行，从而在应用的生命周期内保持私有性与状态。

``` js
(function () {
   // ... 对所有在此声明的变量和函数，其作用域均在此闭包内
   // ... 仍然可访问全局变量
}());
```

注意匿名函数后跟着的 `()`。这是语法要求，否则由标识符 `function` 开头的语句都会被作为**函数声明**。紧跟着接上 `()` 则表明这是一个**函数表达式**。

### 导入全局变量
JavaScript 有所谓**隐式全局变量**的特性。不论何时使用一个变量名，解释器都会沿作用域链回溯，寻找是否有个以 `var` 打头的表达式使用了这个变量名。如果没有找到，那么这个变量将被认为是全局变量。如果在赋值表达式中使用了这个特性，那这就相当于创建了一个新的全局变量。这样一来，我们就能十分方便地使用与创建全局变量了。不过，滥用这种特性会使得在特定文件中变量的作用域变得模糊，产生难以管理的代码。

还好，我们还有匿名函数这个实用的工具。只要将全局变量作为参数传递给匿名函数，我们就能将它导入我们的代码中，这既简明又快捷。下面是个示例：

``` js
(function ($, YAHOO) {
   // 现在我们可以在代码中使用 jQuery (简写为 $) 和 YAHOO 这两个全局变量了
}(jQuery, YAHOO));
```

### 导入模块
有时候，你可能不想*使用*全局变量，而是想*声明*它们。我们可以通过匿名函数的返回值来导出这些变量。这么做，就完成了基础的 Module Pattern。下面又是个示例

``` js
var MODULE = (function () {
   var my = {},    
       privateVariable = 1;

   function privateMethod() {
       // ...
   }

   my.moduleProperty = 1;
   my.moduleMethod = function () {
       // ...
   };
   return my;
}());
```

这样我们就声明了 `MODULE` 这个全局模块，它带有两个公共属性：名为 `MODULE.moduleMethod` 的方法和 `MODULE.moduleProperty` 的变量。它通过闭包实现了**私有内部状态**。并且，通过上面的方式，我们还可以很方便地导入需要的全局变量。

## 进阶模式
虽然以上的内容已经可以满足一般的使用需求，但是我们还是能够为这个模式添加更强大、更可扩展的结构。下面我们就从这个 `MODULE` 模块开始循序渐进地讲解吧。

### 增进 - Augmentation
目前为止，Module Pattern 的模块只能在一个单独的文件中使用。而每个在大量代码库上有过实践经验的人，都知道分离文件的重要性。好在我们还有办法来方便地**增加模块**。首先导入模块，然后添加属性，最后再导出它。以下是个增进 `MODULE` 模块的示例：

``` js
var MODULE = (function (my) {
   my.anotherMethod = function () {
       // added method...
   };

   return my;
}(MODULE));
```

为了一致性，我们又使用了非必须的 `var` 关键字。在以上代码执行后，我们的模块就有了 `MODULE.anotherMethod` 这个新的公共方法。增进的文件也会保留自己的私有内部状态与导入的模块。

### 松散增进 - Loose Augmentation
虽然在上面我们是先创建初始模块再增进，但不这样也不是不行。毕竟 JavaScript 应用能做的最棒的事情之一就是异步加载代码。通过松散增进模式，我们能够灵活地分块创建模块。这要求每个文件具有以下的结构：

``` js
var MODULE = (function (my) {
   // 增加可扩展性...

   return my;
}(MODULE || {}));
```

在这个模式中， `var` 表达式是必需的。这样一旦在导入时遇上尚不存在的模块，就会创建这个模块。这样你就能用 LABjs 之类的工具并行地导入多个模块文件而不需担心阻塞。

### 紧凑增进 - Tight Augmentation
虽然松散增进是很棒没错，不过它也为代码带来了一些限制。譬如，你不能安全地重写模块属性。而且，你也不能在初始化时使用其它文件的模块属性了（在初始化后的运行时还是可以的）。**紧凑增进**意味着按一个安全顺序来加载模块，但允许**重写**。下面是个增进原生 `MODULE` 的示例：

``` js
var MODULE = (function (my) {
   var old_moduleMethod = my.moduleMethod;

   my.moduleMethod = function () {
       // 重写方法，并通过 old_moduleMethod 保留原有方法...
   };

   return my;
}(MODULE));
```

### 复制与继承 - Cloning and Inheritance

``` js
var MODULE_TWO = (function (old) {
   var my = {},
       key;

   for (key in old) {
       if (old.hasOwnProperty(key)) {
           my[key] = old[key];
       }
   }

   var super_moduleMethod = old.moduleMethod;
   my.moduleMethod = function () {
       // 在复制得到的模块中重写方法，并保留被继承模块的原有方法
       // override method on the clone, access to super through super_moduleMethod
   };

   return my;
}(MODULE));
```

基本上要属这个模式最不灵活了。它确实可以获得一些整洁的结构，但牺牲了灵活性。之前提到过，作为属性的对象和函数将不会被复制，而是在同一个对象中保存两份引用。改变一个，就会改变另一个。对对象，这个问题可以通过递归的复制过程来解决，但对函数，除非使用 `eval`，否则没有太好的方法。毕竟，提这个只是为了内容上的完整而已。

### 跨文件私有状态 - Cross-File Private State
在由多个文件组成的模块中，每个文件都有其独立的私有状态，并且不能获得其它文佳你的私有状态。这是个比较大的局限，但通过下面在增进中保持私有状态的方法，我们可以解决这个问题：

``` js
var MODULE = (function (my) {
   var _private = my._private = my._private || {},
       _seal = my._seal = my._seal || function () {
           delete my._private;
           delete my._seal;
           delete my._unseal;
       },
       _unseal = my._unseal = my._unseal || function () {
           my._private = _private;
           my._seal = _seal;
           my._unseal = _unseal;
       };

   // 能够持久地访问 to _private, _seal 和 _unseal

   return my;
}(MODULE || {}));
```

每个文件都可以为其私有变量 `_private` 设置属性，它将立即对其它文件生效。一旦模块加载完成，应用就能调用 `MODULE._seal()` 来阻止外部对内部 `_private` 的访问了。如果这个模块在应用的声明周期中还需要继续增进，那么在每个文件中，都可以在加载新文件前调用 `_unseal()` 再在执行后调用 `_seal()`。这个模式我还没在其它地方见过，而我觉得相当有用，值得一提。

### 子模块 - Sub-modules
最后一个进阶模式其实是最简单的。我们会有很多创建子模块的需求，而这就像创建通常的模块一样容易：

``` js
MODULE.sub = (function () {
   var my = {};
   // ...

   return my;
}());
```

很简洁，不过我觉得值得一提。子模块在通常模块中保留了其原有的特性，包括增进与私有状态。

## 总结
绝大多数进阶模式都可以相互结合，从而创建出更有用的模式来。如果非要我推荐个在复杂应用中使用模式的途径，我会选择**松散增进、私有状态和子模块**。

这里我并没有对性能做讨论。不过可以说一点：Module Pattern 对性能有帮助。它能有效地提升下载代码的速度，通过**松散增进**还能方便地并行非阻塞加载代码，提升下载速度。初始化速度可能会慢一点，但权衡起来是值得的。因为全局变量都得到了正确的导入，运行时的性能表现应该不会有差别，甚至还可能因为子模块中对私有变量引用的减少，获得性能提升。

最后给出一个动态加载到父模块上的子模块示例（若不存在父模块，则创建之）。为简单起见，这里没有处理私有状态，但要加上这个特性并不难。即便面对非常复杂的继承代码库，这个模式也能使其能并行地动态加载自身：

``` js
var UTIL = (function (parent, $) {
   var my = parent.ajax = parent.ajax || {};

   my.get = function (url, params, callback) {
       // 好吧这里不要太认真 :)
       return $.getJSON(url, params, callback);
   };

   // etc...

   return parent;
}(UTIL || {}, jQuery));
```

希望这篇文章对你有帮助，希望它能够让你写出更好、更模块化的 JavaScript~！
