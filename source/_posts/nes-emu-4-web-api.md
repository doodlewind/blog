categories: Note

tags:

- Web
- JS

date: 2015-07-26

toc: true

title: NES 模拟器笔记（4）Web 文件 API 与 RequireJS
---

理清了 NES 的基本架构之后，就可以着手开始写模拟器了。而实际开发的第一步，显然还是要从格式化地读取 NES ROM，将机器码反汇编回助记符指令来开始。其实在这一步只要通过 HTML5 的文件 API，就可以直接而简洁地读取 ROM 的数据了。<!--more-->另外，按照模块化的设计思路，这个反汇编器用到的文件读取等子模块，应该可以为后面的 CPU 模拟器复用，从而提升一些代码的质量。因此在这里，也一并介绍了时下大热的模块加载器 RequireJS，用它来管理代码结构。


## JS 回调模式
异步请求在 Web 应用中十分常见。一般来说要获得异步请求的响应，直接为 onload 等方法注册一个回调函数即可。不过这里有个小问题：怎么往这个回调函数里传参数呢？

比如现在我们包装出一个异步方法 `loadROM()` 来加载 ROM，并将 ROM 作为返回值返回。返回后我们需要用 `readROM(rom)` 来读取这个 ROM 的数据。这时候直接这么写是不行的：

``` js
var rom = loadROM();
readROM(rom); // rom is undefined
```

正确的实践，是按照 JS 的回调模式来处理参数。我们需要将 `readROM` 包在回调函数中，这样参数就可以正常地从 `loadROM` 传给 `readROM` 了：

``` js
function loadROM(callback) {
    // var rom = ...
    callback(rom);
}
loadROM(function(rom) {
    readROM(rom)
});
```


## Arraybuffer 读取 ROM
这是一个用 `XMLHttpRequest` 异步读取 ROM 文件，并将其以 `Uint8Array` 形式读入数组的例子。

``` js
var loadROM = function(filename, callback) {
    var req = new XMLHttpRequest();
    req.open("get", filename, true);
    req.responseType = "arraybuffer";
    req.onload = function() {
        var buffer = this.response;
        rom = new Uint8Array(buffer);
        // return rom in async callback
        callback(rom);
    };
    req.send();
};
```

这里用到了 `callback` 来异步返回 GET 到的 ROM 文件。这个封装起来的 ROM 加载器可以按下面这样调用。由于 `nes` 格式文件的开头总是 NES 三个大写字母的 ASCII 码值，因此可以根据这一点检查一下加载的 ROM 是否正确。

``` js
loadROM('filename.nes', function(rom) {
    console.log(rom[0]); // 78, ascii code for 'N'
    console.log(rom[1]); // 69, ascii code for 'E'
    console.log(rom[2]); // 83, ascii code for 'S'
});
```

再进一步地，这个文件加载器可以对返回的 ROM 做一次封装，简化读取值的过程，避免在上层出现各种直接对数组下标的操作。对一个反汇编器来说，应用情景是每次先根据基址取操作数，然后取后面紧挨着的 8 位或 16 位数据。而后面读取显存的时候，也有可能一次取多个 8 位或 16 位长度的数据，按照这个想法，可以先把上一步获得的 `Uint8Array` 封装为 ROM 的 `data` 属性，然后提供一个参数可变的 `read()` 方法来读取 ROM 数据。

``` js
var rom = {
    data: Array(), // data will be loaded by another method
    read: function () {
        var base = arguments[0];
        var result = Array();
        if (arguments.length == 1) {
            result.push(this.data[base]);
            return result;
        }
        for (var i = 1; i < arguments.length; i++) {
            switch (arguments[i]) {
                case 8:
                    result.push(this.data[base + i - 1]);
                    break;
                case 16:
                    var little = this.data[base + i - 1];
                    var high = this.data[base + i];
                    result.push(high * 256 + little);
            }
        }
        return result;
    }
};
```

这里利用了 JS 函数的 `arguments` 数组来获取参数，从而做到依据参数格式来获取并返回 8 位的字节或 16 位的字。处理 16 位数据的时候，也会按照高位在后的格式正确地读取小端数。这个 `read` 方法的调用方式如下：

``` js
rom.read(0x00); // [78]
rom.read(0x00)[0]; // 78
rom.read(0x00, 8, 8, 8); // [78, 69, 83]
```

上面基本完成了一个简单的文件读取模块，并为模块提供了一个方便的接口。接下来做的反汇编模块可以读取文件模块的接口，更简洁地实现反汇编的过程。有了这个思路，下面要解决的问题就是模块的加载方法和依赖关系了。这里第一次试用了 RequireJS 来管理这些模块。


## RequireJS
RequireJS 的模块规范十分的简洁，可以显式地指定模块的公有和私有方法，并且支持模块的异步加载，可以说是一个相当易学且相当实用的工具。

### 导入
引入 `require.js` 之后，就不需要在 HTML 中设置其它的 `<script src="xxx">` 标签了。取而代之的是一个用来导入 RequireJS 的标签。假如我们的根路径放着 `index.html` 和 `js` 目录，而 `js` 目录里放着 `require.js` 和配置 RequireJS 的 `main.js` 两个文件，那么在 HTML 中只要引入这样的一个标签，就可以完成对 RequireJS 的导入了：

``` js
<script data-main="js/main" src="js/require.js"></script>
```

### 配置
这样 `main.js` 中就可以用 `require()` 来自定义所需要的模块了，一个简单的例子是这样的：

``` js
// main.js
require.config({
    paths: {
        reader: 'lib/rom-reader',
        disassembler: 'lib/rom-disassembler'
    }
});
// main logic
require(['reader', 'disassembler'], function (reader, disassembler) {
    // reader.xxx()
    // disassembler.yyy()
});
```

### 模块定义
以上面用到的 `rom-reader` 模块为例，每个最基本的模块只要遵从 `define()` 写法，即可便捷地为 RequireJS 加载。

``` js
// rom-reader.js
define([], function(){
    var rom = {
        // some code
    };
    var load = function() {
        // some code
    };
    return {
        rom: rom,
        load: load
    }
});
```

如果这个模块有依赖，那么可以在 `define(['xxx'], function(xxx){})` 来定义依赖和依赖的命名空间。而每个模块也可以在其 `return` 的时候定义模块具体开放的接口，以及接口所对应的名称。后面的编写过程中，也是按照这个统一的格式来编写模拟器的各个模块的。

关于 RequireJS 的更多信息，可以在 [RequireJS](http://requirejs.org) 官网上找到。
