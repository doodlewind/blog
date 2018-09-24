categories: Note

tags:

- Web
- JS

date: 2016-10-08

toc: true

title: 基于 Vue / Webpack / WebSocket 的前端远程调试工具
---

[FlyLog](https://github.com/doodlewind/flylog) 这一工具可对传统调试工具难以调试的页面进行实时远程调试。在手机打开引入 FlyLog 的页面后，PC 端后台会实时推送该页面的日志信息，支持多设备并发访问，且提供了 AOP 风格的调试 API。下面分享一下它的实现。

<!--more-->

## Demo
如下所示，只需在待调试页面引入调试脚本，即可在 FlyLog 后台显示其日志、报错和加载性能信息。

![flylog-demo](/images/flylog-demo.png)

体验 Demo 效果，只需安装 FlyLog 到本地运行后，访问 `localhost:3000` 右上的 Doc 链接即可。

安装：

``` text
npm install -g flylog
```

运行：

``` text
flylog
```


## 架构
FlyLog 由三个独立的 JS 模块组成。

* `flyEcho.js` 为供待调试页面引入的 Hook 模块，在不影响原有代码的条件下注入远程上报代码。
* `flyHub.js` 为 Node 服务端模块，收集 POST 日志记录，并广播到所有 WebSocket 的后台客户端。
* `flyAdmin.js` 为通过 WebSocket 连接到服务端的后台模块，也是 Vue 组件的公用入口。

模块之间的联系十分简洁：待调试页面引入位于服务端的 `flyEcho.js` 后，`console.log` 等方法的信息会被截获并 POST （待调试页面的日志信息不走 WebSocket）到服务端，服务端广播相应消息到所有 Admin 客户端，从而实现远程调试。

## Hook 模块 - flyEcho
[flyEcho](https://github.com/doodlewind/flylog/blob/master/flyEcho.js) 通过 AOP 面向切面编程的方式，实现了将上报代码切入到 `console.log` 和 `window.onload` 调用的前后执行，且提供了用于调试的 API 以便实现定制。

### AOP 的实现
AOP 的实现，实际上就是在函数执行前或执行后，切入一段自有的代码，且不修改原函数代码。在 JS 中可以用下面这段经典的代码片段来实现：

``` js
Function.prototype.before = function(fn) {
    var _this = this;
    return function() {
        if (fn.apply(this, arguments) === false) {
            return false;
        }
        return _this.apply(this, arguments);
    }
};
```

思路就是替换原有的函数为一个【先 `apply` 执行切入函数 `fn`，后 `apply` 执行原函数】的新函数。使用方法：

``` js
// 原有代码
function foo(x) {
    console.log(x);
}

// 挂载 before 事件
foo = foo.before(function(x) {
    console.log(x + 1);
});

// 在点击等事件触发 foo 时先执行 before 再执行 foo
foo(1); // 2 1
```

若要阻止原函数执行，在切入的匿名函数内返回 `false` 即可：

``` js
// 对象方法同样可 Hook
var foo = {
    bar: function(x) {
        console.log(x);
    }
}

foo.bar = foo.bar.before(function(x) {
    console.log(x + 1);
    // 可在调试时按需阻止原函数执行
    if (x == 1) {
        return false;
    }
});

foo.bar(1); // 2
foo.bar(2); // 3 2
```

### 上报 console.log 内容
运用上例中的 `before` API，在 `console.log` 执行前切入一个我们自己的数据上报函数即可:

``` js
console.log = console.log.before(function() {
    sendAjax([].slice.call(arguments));
});
```

### 在 window.onload 结束后执行
和 `before` 类似的 `after` API 可以将代码挂载到 `windows.onload` 后执行。需要注意的是，下文中调用 Performance API 时，如果直接用同步的写法在 `after` 中收集性能数据，会由于这时的 `window.onload` 还没有完全结束而造成部分关键参数缺失。解决方法如下：

``` js
window.onload = (window.onload || function() {}).after(function() {
    // run after window.onload returns to get correct timing
    setTimeout(function() {
        var timing = getPerformanceTiming();
        sendAjax(timing);
    }, 0);
});
```

### Performance API
通过 Performance API 即可上报浏览器提供的性能数据，精确到毫秒级。

``` js
var performance = window.performance;
if (!performance) {
    console.log('performance API not supported');
    return;
}

var t = performance.timing;
var times = {};
times.lookupDomain = t.domainLookupEnd - t.domainLookupStart;  // DNS 查询时间
times.redirect = t.redirectEnd - t.redirectStart;              // URL 重定向时间
times.ttfb = t.responseStart - t.navigationStart;              // 获取首个字节时间
times.request = t.responseEnd - t.requestStart;                // 请求时间
times.domReady = t.domComplete - t.responseEnd;                // DOM 解析时间
times.loadEvent = t.loadEventEnd - t.loadEventStart;           // window.onload 执行时间
times.loadFullPage = t.loadEventEnd - t.navigationStart;       // 整页面加载时间
```

详细的分析参见[这里](http://www.alloyteam.com/2015/09/explore-performance/)，需要注意的是在绝大多数情况下，上例中除 `loadFullPage` 外的各时长之和，即为最后的 `loadFullPage` 整页面加载时间。因此可通过这个方式分析页面加载时间过长时的瓶颈位置。


## WebSocket 服务模块 - flyHub
[flyHub.js](https://github.com/doodlewind/flylog/blob/master/flyHub.js) 是对 Node 底层服务和 Socket.IO 的简单封装。

### 广播
调用 Socket.IO 的 `emit` API

``` js
io.emit('name', data);
```

即可向所有连接的 WebSocket 客户端广播名为 `name` 的 data 数据，数据可以是 JSON 或 string 等格式。

### 跨域
不通过 JSONP 的方式，直接在响应中使用 `Access-Control` 全家桶首部即可响应跨域请求。简要流程是：在发送 `appliacation/json` 一类的 XHR 请求前，浏览器会首先发送一个 Preflight OPTION 请求，检查响应首部是否声明支持跨域，若支持则发送原请求。

``` js
// 传入 http 模块的 handler 函数
function httpHandler(request, response) {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Request-Method', '*');
    response.setHeader('Access-Control-Allow-Methods', '*');
    response.setHeader('Access-Control-Allow-Headers', '*');
    // 支持 preflight OPTION 请求
    if (request.method === 'OPTIONS') {
        response.writeHead(200);
        response.end();
        return;
    }
    
    // 原有的 handler 代码
}
```

### 静态文件
基于 Node.js 基础的 fs 模块即可实现一个静态文件服务器，参考 [Stack Overflow 示例](http://stackoverflow.com/questions/16333790/node-js-quick-file-server-static-files-over-http)即可。注意示例中 `fs.readFile` 传入的路径是简单的 `filePath`，这会造成在将 package 安装到全局后运行时的路径问题。将该参数替换为 `path.join(__dirname, filePath)` 即可。


## Vue 展示后台 - flyAdmin
[flyAdmin.js](https://github.com/doodlewind/flylog/blob/master/flyAdmin.js) 采用了目前十分火热的 Vue + Webpack 方案实现了组件化开发。和 `vue-cli` 所提供的项目模板不同的是，FlyLog 采用了 Gulp + Webpack 的方案，来缓解 Webpack 配置文件难以阅读的问题，且支持 `.vue` 文件所需的各 loader 和构建出生产版本。这次的摸索中也解决了【如何不依赖脚手架，从头构建一个 Vue + Webpack 多入口打包方案】的问题，所需的相应的模板可以在后续的博客中介绍。

### Webpack
`webpack.config.js` 中关键的配置如下：

``` js
module.exports = {
  entry: { flyAdmin: "./flyAdmin" }, // 多入口文件在此声明即可
  output: {
    path: path.join(__dirname, "dist"), // 输出目录和文件名
    filename: "[name].bundle.js",
    chunkFilename: "[id].chunk.js"
  },
  plugins: [], // 可在此引入分离 Chunk 的相应 Plugin
  module: {
    loaders: [
      {
        test: /\.vue$/,
        loader: 'vue'
      },
      {
        test: /\.js$/,
        loader: 'babel',
        exclude: /node_modules/
      },
      {
        test: /\.scss$/,
        loader: 'style!css!sass'
      }
    ]
  },
  vue: {
    loaders: cssLoaders(), // 函数实现来自 vue-cli 脚手架，对预处理 sass 是必须的
    postcss: [
      require('autoprefixer')({
        browsers: ['last 2 versions']
      })
    ]
  }
}
```

### 数据传递
Vue 2.0 中废弃了 `$dispatch` 和 `$broadcast` 方法，而简单的数据单向传递（从 WebSocket 服务端推送至客户端）不需要引入 Vuex 这类较重的解决方案，直接在 `window.bus` 全局变量上设置事件的触发器和监听器即可：

``` js
  // App.vue
  window.bus = new Vue()
```

在主入口内注册了 `bus` 后，在 socket.io-client 的 Handler 中调用 `$emit` 方法即可在 Vue 的事件系统中触发事件：

``` js
  // Network.vue
  export default {
    created: function () {
      const socket = require('socket.io-client')(window.location.href)
      // 触发各类事件
      socket.on('log', function (data) {
        window.bus.$emit('log', data)
      })
      socket.on('error', function (data) {
        window.bus.$emit('error', data)
      })
      socket.on('performance', function (data) {
        window.bus.$emit('performance', data)
      })
    },
    render: () => {}
  }
```

在接受数据的组件的 `created` 钩子中，注册相应的事件监听器，传入添加数据的方法即可。Vue 重写的观察者数组方法实现了数据和 DOM 的绑定，无需手工操作 DOM 元素。

``` js
  // LogPanel.vue
  export default {
    data: function () {
      return {
        logs: []
      }
    },
    methods: {
      addLog: function (data) {
        this.logs.push(data)
      }
    },
    // 在 bus 上注册事件监听器
    created: function () {
      window.bus.$on('log', this.addLog)
    }
  }
```

### Filter
Vue 2.0 中废弃了 Angular 风格的 `filterBy` 方法，使用计算属性取代它的方式也很直观，以实现输入文字过滤日志结果为例，先在 HTML 中使用指令声明 `expr` 模型：

``` html
<input v-model="expr">
<div v-for="log in filteredLogs">
    <a>{{ log.src }}</a>
    <span> {{ log.content }} </span>
</div>
```

然后实现计算出 `filteredLogs` 数组的方法：

``` js
  export default {
    data: function () {
      return {
        expr: '',  // 用于过滤的输入文字
        logs: []   // 待过滤的日志项
      }
    },
    methods: {
      addLog: function (data) {
        data.content = data.content.toString()
        this.logs.push(data)
      }
    },
    computed: {
      filteredLogs() {
        var _this = this
        return this.logs.filter(function(logItem) {
          return logItem.content.indexOf(_this.expr) > -1
        })
      }
    },
    created: function () {
      window.bus.$on('log', this.addLog)
    }
  }
```

这样就实现了利用计算属性来替代 `filterBy` 过滤器的效果。


## 彩蛋
FlyLog 项目的配色来自这张 CG

![why-are-you-so-good-at-it](/images/color-scheme.jpg)
