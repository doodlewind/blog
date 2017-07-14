categories: Note

tags:

- JS

date: 2017-07-14

toc: true

title: 自制前端框架之 MVC
---

MVC 是 UI 编程领域中非常经典的设计模式，使得开发者能够借助该模式，构建出更易于扩展和维护的应用程序。在本文中，我们将基于经典的 MVC 理念，实现一个 50 行内的极简 MVC 框架，用于支持一个 Todo App 示例应用的开发。文末附有示例 Github 地址。

<!--more-->

## 简介与动机
MVC 模式在概念上，强调 Model / View / Controller 三个模块的分离：

* **Model**: 专注数据的存取，对基础数据对象的封装。
* **Controller**: 处理形如【用户登录】、【验证表单】等具体操作时的业务逻辑，从 Model 中存取数据，并渲染到 View 中。
* **View**: 负责界面视图，可理解为【输入数据，输出界面】的模块，在其中通常不涉及的业务逻辑。

需要注意的是，MVC 仅是一种模式理念，而非具体的规范。因此，根据 MVC 的理念所设计出的框架，在实现和使用上可能存在着较大的区别。下文中介绍的框架，仅是作者作为示例给出的一种实现，供读者参考。

那么，为什么需要 MVC 这一框架级的设计模式呢？相信许多前端开发者都经历过纯粹基于 jQuery / Zepto 等基础类库开发前端项目的阶段。在这种情境下，完全不需要考虑 MVC 的概念，对业务逻辑的实现是非常简单而直接的。以实现【点击某按钮时，从后台接口获取数据，然后渲染到页面】这样非常常见的需求为例，典型的业务代码实现形如：

``` js
// 点击某按钮时
$('.xx-btn').click(() => {
  // 从后台接口获取数据
  $.get('/xx-api', (data) => {
    // 拼接模板
    const template = `<div>${data}</div>`
    // 渲染到页面上
    $('#xx-table').html(template)
  })
})
```

基于这些便捷的 API，确实能在寥寥数行之内实现业务需求。这时，存在的问题包括：

* 处理【用户输入】与【数据渲染】的逻辑，以硬编码的形式结合在了一起，一般项目中数据渲染的代码多直接书写在匿名回调函数内，难以抽离复用（尤其是在回调函数内使用了 `this` 时，更难复用相应的渲染代码）。
* 在没有 ES6 的时代，字符串拼接的代码十分难以维护，各种形如 `'<div class="' + data.class + '">'` 这样引号交错的代码虽然容易符合初学者的直觉写出，但显然难以阅读和维护。
* 将数据直接映射到页面 DOM 上的操作同样很符合初学者的直觉，但也造成应用数据模型的缺乏。在页面【存在多种可能的输入，而每种输入所对应的输出均可直接修改 DOM 结构】时，会带来陡增的状态复杂性。

虽然 MVC 不是银弹，但其出现确实提供了一种解决上述问题的思路。下文中将从一个极简的 MVC 框架所需要具备的特性出发，一步步介绍我们解决上述问题的思路。

## 框架特性
与许多设计模式一样，MVC 在概念定义上较为抽象，通过代码实现掌握它，显然比模糊的文字描述要更为有效。下面作为示例，我们将一步步实现这个名为 NanoMVC 的框架。

在开始编写具体代码之前，需要在设计阶段明确的是，这个框架将提供何种功能，使用者该如何使用。基于使用情景的需求，给出一些简单的示例代码，最后再从满足这些示例的目标出发，进行实际的编码实现。在【先明确需求，再进行编码实现】的这一点上，框架开发与业务逻辑开发是很接近的，这样目标驱动的开发模式也有利于保持开发流程的可控，而非像实现简单业务需求那样随心所欲地【想到什么写什么】，以至于最后产出缺乏架构支持而不易维护的代码。

那么，NanoMVC 框架的使用情景是什么呢？常见的后端框架所封装的功能，不外乎对数据的增查改删与渲染。在前端，我们以一个非常简单的 Todo App 作为框架所需要支持的业务开发场景，这时基于框架的业务代码，所需要实现的功能包括：

* **TodoModel** 模块实现 Todo 这一数据模型的存取。
* **TodoView** 模块实现将 Todo 数据模型渲染到页面。
* **TodoController** 模块实现对 Todo 数据的新增、编辑、删除等操作。

在用于实现 Todo 业务逻辑的 Model 和 Controller 模块，除了具备框架提供的若干功能外，还需要在其中编写特定的业务代码。这时，面向对象的编程范式就能够发挥作用了：通过形如 TodoController 的业务代码【继承】框架所提供的 Controller 基类，在其中即可调用框架所封装的功能。这也就意味着，该框架的功能是需要支持通过继承来使用的。

## 使用示例
在【支持 MVC 三个模块】与【支持通过继承使用】的两个目标确定后，即可以框架使用者的身份，给出调用框架的基础示例代码：

``` js
// app/index.js
// Todo App 的业务代码入口
// 该示例为实际业务代码，并非框架代码

// 依次导入 MVC 的三个模块
import { TodoModel } from './model'
import { TodoController } from './controller'
import { TodoView as view } from './view'

// 实例化各模块
// 此处 View 的实现由于过于简单而不需实例化
const model = new TodoModel()
const controller = new TodoController(model, view)

// 通过手动调用 render 方法，初始化页面
// 在 controller 中 render 值得商榷
// 但其不失为一种很方便的实现
controller.render()
```

在这个应用的入口模块中，仅仅明确了 MVC 模块拆分的基本结构，而并没有给出各业务模块的基本实现示例。下面给出以框架使用者的角度，在利用框架实现 TodoModel 模块时的基本示例代码：

``` js
// model.js
// 该示例为实际业务代码，并非框架代码

// 从框架中导入 Model 基类
import { Model } from 'framework'

// 通过继承实现自己的业务 Model
export class TodoModel extends Model {
  // 在构造器中定义数据模型的基本结构
  // 在此即为 Todo 列表
  constructor () {
    super({ todos: [] })
  }
  // 利用 ES6 class 语法定义模型实例的 getter
  // 从而在调用 model.todos 时返回正确的 Todo 数据
  get todos () {
    return this.data.todos
  }
  // 利用 ES6 class 语法定义模型实例的 setter
  // 从而在执行形如 modle.todos = newTodos 的赋值时
  // 能够通知订阅了 Model 的模块进行相应更新
  set todos (todos) {
    this.data.todos = todos
    this.publish(todos)
  }
}
```

虽然 Model 模块的有效代码仅有十余行，但其实现中已体现了使用框架的基本方式：

1. 导入框架提供的基类。
2. 继承基类，根据实际业务需求定制出相应的模块实例。

与之类似地，实现 TodoController 模块的业务代码，也按照类似的思路进行组织：

``` js
// controller.js
// 该示例为实际业务代码，并非框架代码

import { Controller } from 'framework'

// 同样基于继承实现业务特定的 Controller
export class TodoController extends Controller {
  constructor (model, view) {
    // 在此提供实例化 Controller 时所需的参数
    // 包括其对应的 Model 与 View，及相应的业务逻辑功能
    super({
      model,
      view,
      el: '#app',
      // 提供点击页面特定按钮时的处理逻辑
      onClick: {
        // 点击【新增】按钮时，新增 Todo
        '.btn-add' () {
          // this.model.todos = ...
        },
        // 点击【删除】按钮时，删除相应的 Todo
        '.btn-delete' (e) {
          // this.model.todos = ...
        },
        // 点击【更新】按钮时，更新相应的 Todo
        '.btn-update' (e) {
          // 根据 id 更新元素
          // this.model.todos = ...
        }
      }
    })
    // 订阅 Model 更新事件
    // 在 Model 更新时执行 controller 的 render 方法
    this.model.subscribers.push(this.render)
  }
}
```

在实现了这个 Controller 后，基本的业务逻辑流程已经初见端倪了：

1. Controller 根据 onClick 参数中提供的字段，**声明式地**定义形如【当 class 名称包含 `btn-add` 的按钮点击时】所触发的业务逻辑，从而避免 `$(...)` 绑定点击事件的底层操作。
2. 在点击事件触发时，**不去直接修改 DOM**，而是更新 `this.model` 中的数据。这样，就实现了数据模型与页面视图的分离解耦。
3. 还记得 `model.js` 中实现的 `this.publish(todos)` 吗？在上一步中数据更新触发数据模型的 setter 时，Model 将通知【数据变更】的事件至模型的所有订阅者。
4. 在 Controller 的最后一行有效代码中，它订阅了数据模型的更新事件。故而在数据更新时，将触发 render 方法以重绘 DOM。

在这个流程中，不仅包含了对业务逻辑相关事件的配置式 / 声明式定义，还实现了发布 - 订阅这一设计模式，该模式也广泛应用在 MVC 框架设计中。而在 Controller 中业务逻辑成功更新后，最后需要的就是更新 View 了。相应的 TodoView 模块示例如下：

``` js
// view.js
// 该模块是一个【输入数据，输出 HTML 模板】的纯函数
// 故而在业务代码中即可实现其全部功能，不需要继承

export function TodoView ({ todos }) {
  // 根据 Todo 数组数据
  // 通过 map 得到带【编辑】与【删除】按钮的单条 Todo 页面模板
  const todosList = todos.map(todo => `
    <div>
      <span>${todo.text}</span>
      <button data-id="${todo.id}" class="btn-delete">
        Delete
      </button>

      <span>
        <input data-id="${todo.id}"/>
        <button data-id="${todo.id}" class="btn-update">
          Update
        </button>
      </span>
    </div>
  `).join('')
  
  // 通过 ES6 模板字符串实现类似 JSX 格式的 View 输出
  return (`
    <main>
      <input class="input-add"/>
      <button class="btn-add">Add</button>
      <div>${todosList}</div>
    </main>
  `)
}
```

到此为止，我们已经勾画出业务代码的全貌了。接下来需要的就是实现 NanoMVC 这一框架，从而让这些代码能够在框架的支持下正常运行。

## 编码实现
在给定了设计目标以及示例功能后，框架的开发并没有想象中复杂。根据上文中编写示例代码时的梳理，我们的 NanoMVC 框架中需实现的功能包括：

* Model 基类中实现对模型数据的发布 - 订阅设计模式。
* Controller 基类中实现：
    * 与 Model / View 实例的绑定。
    * 对点击事件、DOM 选择等底层 API 的封装。
    * 用于渲染数据的 Render 方法。


### Model 模块
由于 Model 中功能最为简单，且其为 Controller 实例的依赖，故而我们首先实现其中的发布 - 订阅模式：

``` js
// framework/index.js

// 对外暴露的 Model 基类
export class Model {
  // 在构造器中实例化数据与订阅者
  constructor (data) {
    this.data = data
    this.subscribers = []
  }
  // 由 TodoModel 实例调用的发布方法
  // 在 TodoModel 中的 setter 更新时，将新数据传入该方法
  // 由该方法将新数据推送到每个订阅者提供的回调中
  // 在 Todo 项目中，订阅者为 TodoController 的 render 方法
  publish (data) {
    this.subscribers.forEach(callback => callback(data))
  }
}
```

在示例中可以发现，所谓的发布 - 订阅模式，其思路和实现均非常简单：

1. 区分出【发布者】和【订阅者】的概念。本例中 Model 为发布者，Controller 为订阅者。
2. 在发布者中维护【我有哪些订阅者】信息的数组，每个元素为一个订阅者提供的回调。
3. 发布者数据更新时，依次触发所有订阅者的回调。

不过，Model 中的代码仅实现了【初始化发布者】与【触发所有订阅】的功能，并不是一个完整的发布 - 订阅模式。在完整的模式实现中，其余代码包括：

1. 【订阅者订阅发布者】机制的实现，其代码位置为 `controller.js` 中的最后一行 ` this.model.subscribers.push(this.render)`，在此将 render 方法作为订阅者回调，提供给了发布者。
2. 【数据更新时，触发订阅回调】机制的实现，其代码位置为 `model.js` 中 `set todos (todos)` 内的一行 `this.publish(todos)`。在此，通过 ES6 中 Class 语法的 setter 机制，在模型数据更新时，调用 Model 基类提供的 publish 方法，触发订阅。
3. 【订阅者提供的订阅方法】的实现，在此即为 TodoController 中提供的 `this.render` 方法。该方法并未在 TodoController 的业务代码中实现，而是在接下来的框架 Controller 基类中实现的。 

### Controller 模块
上文中已经明确，框架提供的 Controller 基类需要实现的功能为：

* 与 Model / View 实例的绑定。
* 对点击事件、DOM 选择等底层 API 的封装。
* 用于渲染数据的 Render 方法。

以下是相应的实现，去除注释后仅在 20 行的数量级：

``` js
// framework/index.js

// 对外暴露的 Controller 基类
export class Controller {
  constructor (conf) {
    // 根据子类提供的实例化参数，定义 Controller 基础配置
    // 包括 DOM 容器、Model / View 实例及 onClick 事件等
    this.el = document.querySelector(conf.el)
    this.model = conf.model
    this.view = conf.view

    // 常见于 React 开发中的 bind
    // 解决方法在 extend 出的实例中执行时的 this 指向问题
    this.render = this.render.bind(this)
    
    // 根据 TodoController 中提供的 onClick 配置规则执行业务逻辑
    // 例如 TodoController 若在 onClick 属性中提供了名为 .btn-add 的函数
    // 则在 Controller 对应 DOM 中点击事件触发时
    // 事件 path 的根元素若带有匹配 btn-add 的 className
    // 即执行 TodoController 提供的 .btn-add 函数
    this.el.addEventListener('click', (e) => {
      e.stopPropagation()
      const rules = Object.keys(conf.onClick || {})
      rules.forEach((rule) => {
        // 匹配事件根元素，并据此执行业务 Controller 实例提供的业务逻辑
        if (e.path[0].matches(rule)) conf.onClick[rule].call(this, e)
      })
    })
  }
  // 供业务 Controller 实例使用的 API 方法
  // 从而避免在业务代码中直接操作 DOM
  // 首先是事件对象，返回事件根元素的特定属性
  getTargetAttr (e, attr) {
    return e.path[0].getAttribute(attr)
  }
  // 同样供业务 Controller 实例使用的 API 方法
  // 提供在 Controller 对应 DOM 内查找元素的 API
  getChild (selector) {
    return this.el.querySelector(selector)
  }
  // 全量重置 DOM 的 naive render 实现
  render () {
    // 由于 view 是纯函数，故而直接对其传入 Model 数据
    // 将输出的 HTML 模板作为 Controller DOM 内的新状态
    this.el.innerHTML = this.view(this.model)
  }
}
```

基于这个 Controller 基类的实现，可以完善出前文中 TodoController 剩余的若干业务代码如下：

``` js
// controller.js

// ...
      onClick: {
        '.btn-add' () {
          // 新增 Todo 时操作
          // 由于简单的 setter 监测不到 push 方法的改动
          // 故而对 Todos 数据全量赋值
          this.model.todos = this.model.todos.concat([{
            id: new Date().getTime().toString(),
            // 使用 getter 获取【添加 Todo】输入框中的数据
            text: this.addInputText
          }])
        },
        // 根据 id 过滤掉待删除元素
        '.btn-delete' (e) {
          const id = this.getTargetAttr(e, 'data-id')
          this.model.todos = this.model.todos.filter(
            todo => todo.id !== id
          )
        },
        // 根据 id 查找出待更新 Todo 文本并更新
        '.btn-update' (e) {
          const id = this.getTargetAttr(e, 'data-id')
          const text = this.getUpdateText(id)
          // 通过 map 全量对新 Todos 列表赋值
          this.model.todos = this.model.todos.map(
            todo => ({
              id: todo.id,
              text: todo.id === id ? text : todo.text
            })
          )
        }
      }
// ...
```

新增的 TodoController 实例方法如下：

``` js
  // 调用框架 API，根据当前编辑 Todo 的 ID，获取其文本
  getUpdateText (id) {
    return super.getChild(`input[data-id="${id}"]`).value
  }
  // 获取【添加 Todo】输入框中的数据
  get addInputText () {
    return super.getChild('.input-add').value
  }
```

最后实现的业务代码中，只需在名为形如 `.btn-add` 的函数中调用框架封装好的方法，就能实现对 DOM 的查找及对数据的增查改删，不再需要显式地查找与修改 DOM 了。

### View 模块
如前文所述，框架的 View 实质上就是一个在 Model 中数据变更时，由 Controller 在 render 方法中执行的一个纯函数。由于 View 过于简单，故而在框架代码的实现中，没有涉及 View 这一模块。

## 总结
在实现 MVC 模式框架的过程中，框架的【模块拆分】与【功能封装】特性均得到了体现，而 ES6 所提供的 class 高级特性则大大简化这些特性的实现复杂度。例如，如果没有 setter 语法糖，那么实现发布 - 订阅模式中最关键的【在数据更新时执行代码】特性时，要么需要额外封装出框架的 get 和 set API，要么需要采用 `Object.defineProperty` 这样较为 Hack 的手段。

有趣的一点是，从实现框架过程中提供的示例代码来看，框架代码虽少，但其注释量显著多于业务代码。在许多成熟的开源项目中，注释所占比重也相当大。造成这种情况的原因，除了框架层开发者的编码习惯较好外，还有一个潜在的原因：框架开发中，提供的代码多是【供用户调用】的 API 代码，在没有用户提供代码的情况下，整个框架的执行流程可能是无法走通的（例如整个发布 - 订阅模式的实现代码，就分散在了各个模块中）。这时，对于许多**执行流程不连续且缺乏调用者信息的代码片段**，就需要提供传统的参数类型信息外，更丰富的【代码调用场景、作用场景、Hack 理由】等信息，来保证框架代码的可维护性。从这个角度上来说，框架级的开发也有助于培养开发者的编码习惯。

当然，这个框架毕竟只是一个简单 Demo，与真实世界中的框架相比，还存在许多问题：

* 不支持父子组件嵌套的机制。
* 基于 innerHTML 的渲染性能低下。
* Controller 与 View 是一对一的关系，且直接将 Model 传入 View 函数来获取模板，不够灵活。
* 不支持为特定元素单独设置事件监听器，只能拦截所有事件到 Controller DOM 顶层处理。
* 只支持通过对 Model 的全量赋值来触发发布 - 订阅机制，使得 TodoController 中的增查改删业务代码虽然剥离的 DOM，但仍然较为臃肿。

这些存在的问题，正是后续文章中所介绍的新类库 / 框架所要解决的。NanoMVC 正是引出对更高级的框架机制介绍的一个引子。

本文[示例地址](https://github.com/doodlewind/nano-mvc)