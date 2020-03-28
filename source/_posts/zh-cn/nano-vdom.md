categories: Note

tags:

- JS
- Algorithms

date: 2017-07-18

toc: true

title: 自制前端框架之 50 行的虚拟 DOM
---

实现一个听起来高大上的虚拟 DOM 要多少行代码呢？50 行就够啦😅

<!--more-->

## 动机
在上一篇文章中实现基础的 MVC 模式框架时，留下的一大问题即是在 render 方法中全量更新 innerHTML 对性能的影响。

以 React 为代表的虚拟 DOM 类库可以很好地解决这个问题。作为一个纯粹的 View 层类库，其它的 MVC 框架可直接将原有【输入 Model 数据，输出页面模板】的 View 模块与之对接，借助其虚拟 DOM 的 Diff 算法，在不更改业务逻辑的前提下提高性能。引入这一机制后，每次 Model 更新时，将全新数据输入 View 层，由虚拟 DOM 自动 diff 出数据更新位置，并仅更新相应位置的 DOM 节点。这样，在保持整个应用逻辑简单性的前提下，就实现了性能上的优化。

## 背景
实现虚拟 DOM 所需的技术背景可以分为两个方面：一方面，需要了解的是与 DOM 紧密相关的树形数据结构，及对树进行增查改删等操作的算法；另一方面，需要了解的是用于转译 JSX 代码的工具链。在本节中为简洁起见，将通过现成的 JSX 转译工具来转译代码为树。

### 树与递归
由于本书并不假定读者已有计算机科学的基础，因此在此首先对树和递归的基础知识作一个简要的介绍。对递归有所了解的读者可略过本段，并不影响阅读。

很多开发者认为，在日常的前端开发工作中接触不到【数据结构与算法】的内容，这种观点其实并不准确。树就是一个很好的例子。在此，我们不妨暂时抛开计算机科学中严谨的定义，从实例出发理解这种数据结构：

以一个用于录入【省 / 市 / 区信息】的输入组件为例，如果需要提供省市等数据的搜索提示，或将其实现为单选框而非输入框来提升用户体验，那么显然需要在前端保存省市等信息的数据。这时，相应的 JSON 数据结构是什么样的呢？

一种简单的方案是，既然省市的个数均是有限且唯一的，那么可以将每个省市的名称作为对象的 Key，然后通过 Key 来查找值，形如：

``` js
const data = {
  '福建': {
    '厦门': {
      '思明区': 123
    }
  }
}
```

这时，编写形如 `data['福建']['厦门']['思明区']` 的代码能够获取到数据值了。这种数据结构固然简洁，但并不能很好地支持业务需求，有这样的一些缺陷：

* 在用户选择了新的市级数据时，需要重置相应的区级输入框。然而，一般的输入框选中时触发的事件通常仅仅包含该输入框的文本，而非一条完整的选择路径。这时，如何在不知道省级信息的情况下，通过一个市的名称，查找到其下的区级数据呢？直接编写形如 `data[?]['厦门']` 的选择代码不是完全行不通，但会带来相当多的冗余代码（业务实践中甚至需要上百行代码来实现这一需求）。
* 没有位置用于存储 `福建` 和 `厦门` 等中间层次字段的数据。例如若需要在 `福建` 字段下添加 value 等属性，那么这个属性名和数据是同级的，存在着被名为 value 的市级数据覆盖的风险（当然在实际业务情景中不太可能）。这时，`data['福建']['value']` 的类型可能是 `number`，而 `data['福建']['漳州']` 的数据类型却是对象。这样的数据结构并不稳定，在遍历时需要许多额外的判断和异常处理。
* 如果级联超过三级，那么在更深的嵌套层次中获取数据，会更加的困难。
* 在获取到某一层级的值时，并不能直接知道该值来源于哪一个层级。例如，若输入组件触发了一个 `吉林` 的值，那么这个值来源于省级的吉林，还是市级的吉林呢？这时需要带上该值对应的所有属性，才能通过较为复杂的代码判断出层级。

这时候，不妨从数据结构出发，重新考虑这个问题。

上述的问题中，很大一部分的产生原因在于，**对于嵌套数据结构的每一层，开发者都将其当做了一种不同的数据结构来进行处理**。例如，第一层省级结构对应于 `data` 下的属性，第二层市级结构对应于 `data['省份名']` 下的属性。这时，有多少层结构，就需要硬编码出对应多少层结构的不同查询逻辑。如果查询的结构是【公司的组织架构】这样嵌套层级完全不定，而非简单的【省市区】这样固定的信息，那么这时若将每一层数据都当做不同的数据结构，那么在实现上会更加的复杂，甚至几乎走不通。

下面，我们通过引入树的概念来解决这个问题。对应于同样的嵌套数据，使用树的数据结构来表达时，基本的示例形如：

``` js
const data = {
  name: '中国',
  id: 0,
  value: null
  children: [
    {
      name: '福建',
      id: 1,
      value: null
      children: [
        {
          name: '厦门',
          id: 2,
          value: null
          children: [
            {
              name: '思明区',
              id: 3,
              value: 123
              children: []
            },
            // ...
          ]
        },
        // ...
      ]
    },
    // ...
  ]
}
```

这个数据结构和之前的实现，有几点较大的区别：

1. 添加了【中国】这一根节点。
2. 为每一层的数据，添加了统一的 id / name / value 等属性。在统一了每层的结构后，每层中每条数据都可看做一个格式一致的【节点】，每个节点均具备 id / name / value / **children** 等类型完全一致的属性。这样一来，对数据的处理就方便多了。
3. 将原有通过对象属性保存的深层嵌套内容，保存在名为 children 的数组中。在这个结构中，当然可以通过一个 children 对象来保存节点的数据，但此时遍历节点时，会较之遍历数组更加繁琐。

这样的数据结构，就可以称为一棵树了。树形结构是一种带有层次关系的嵌套结构，且它的内层和外层的结构是相似的。在一开始的示例中，虽然表达了这样具备嵌套关系的结构，但并没有满足【内层和外层结构相似】这一条件。而一般情况下的树，其任意的子节点，都和根节点【中国】具备同样的结构（均具备 id / name / value / children 属性，且每种属性的数据类型都完全一致）。这样，我们就可以将查询省、查询市、查询区……查询各级结构的代码实现统一和复用，以便利对于嵌套数据的查询。换句话说，树通过每层一致的结构来表达嵌套的数据，从而可以用简单的代码，来查询出任意层次的数据。

那么，如何设计出一个简单的 `getValueById` 的函数，来实现【获取树中任意节点值】的需求呢？这时就需要递归的思想了。

<del>要想理解递归，首先你要理解递归。</del>对递归在代码形式上的理解，就是函数中会出现调用函数自身的函数。具体到查找树中数据的例子，就体现在这个函数的执行流程上。首先，这个函数的输入是一个树的节点与一个待查找的 ID，输出是树中 ID 与之匹配的节点的值。在明确了输入和输出的基础上，这个查找函数的执行流程可以描述如下：

1. 输入一个节点和待查 ID，如匹配则返回当前节点。
2. 如不匹配，那么返回【对当前节点的所有子节点，查找该 ID】的值。

在 2 中实现【查找当前节点的所有子节点】时，就需要在 `getValueById` 中，遍历当前节点的所有子节点，依次调用 `getValueById` 自身并传入每个子节点和待查 ID，最后判断每次递归调用的查询结果，若查找到了 value，则返回该 value 的值。

和一般对数组的遍历不同的是，在这样所谓【深度优先】遍历树的方式中，对节点的遍历顺序并不是逐层的，而是会一次深入树的叶子节点（最深一层的嵌套节点）。在这个例子中，假设查找的 ID 为一个区级的 ID，那么整体的执行流程是：

1. 查找【中国】根节点，ID 不匹配。
2. 开始对【中国】下的每一个节点，调用 `getValueById`。
3. 查找第一个子节点【福建】，这时 ID 不匹配，继续对【福建】下的每一个子节点（这时查找的是子节点，而不是同一层的节点！），调用 `getValueById`。
4. 查找福建省下的第一个子节点【厦门】，这时 ID 仍然不匹配，继续对【厦门】下的每一个子节点，调用 `getValueById`。
5. 依次查找所有区级节点信息（区级信息 children 属性均为空，不会继续往下查找），查找到匹配的 ID 时，返回 value 给调用者（当前函数是查询思明区的函数，其调用者是查询中国的函数调用的查询福建的函数调用的查询厦门的函数，嗯其实它们是同一个函数）。
6. 调用者向上返回 value 给调用者（查询中国的函数调用的查询福建的函数）。
7. 调用者向上返回 value 给调用者（查询中国的函数）。
8. 返回 value 结果给用户。

看起来流程十分啰嗦，但满足这个流程的代码却十分简单：

``` js
function getValueById (node, id) {
  // 当前节点值匹配时直接返回节点 value
  if (node.id === id) return node.value
  // 对所有子节点递归调用自身，若匹配则返回查到的子节点 value
  // 注意这时的返回值类型就是 getValueById 的返回值（value 或 null）
  for (let i = 0; i < node.children.length; i++) {
    const tmpValue = getValueById(node.children[i], id)
    if (tmpValue) return tmpValue
  }
  // 当前节点不匹配，所有当前节点下的子节点也不匹配时，返回 null
  return null
}
```

这样就实现了一个最基本的递归了。到这里即可回归虚拟 DOM 的正题：实现虚拟 DOM，需要树形的数据结构，并且需要理解基础的递归。如果读者已经理解了上文的介绍，那么在理解下文中的示例代码时，应当不会遇到与计算机基础知识有关的瓶颈。

### JSX 转译配置
在后续的代码编写中，我们希望能够借用 React 提供的 JSX 来简化表达，这时在不依赖 React 的情况下，可以通过 Babel 的 `transform-react-jsx` 插件来实现。其配置方式也并不麻烦，只需在配置了 Babel 的项目中，安装 `babel-plugin-transform-react-jsx` 依赖，而后在 `.babelrc` 中添加如下配置即可：

``` js
"plugins": [
  [
    "transform-react-jsx", { "pragma": "dom" }
  ]
]
```

这里的 `pragma` 字段意味着，我们会将 JSX 转译的结果用 `dom` 函数来表示。关于转译的介绍，及虚拟 DOM 的具体表达，请参见下文。

## 表达虚拟 DOM
在背景介绍部分已经提及，我们希望借助 React 的 JSX 语法，来表达虚拟 DOM。这样的虚拟 DOM 代码形如：

``` js
const vdom = (
  <div>
    <span>123</span>
    <span>456</span>
  </div>
)
```

熟悉 React 的开发者应该知道，一对 JSX 格式的 HTML 标签，会被转译为一个对 `React.createElement` 函数的调用。而在背景介绍部分中，通过配置 babel，已将该转译得到的函数名改写为 `dom`。也就是说，经过转换后，上例中的 JSX 代码将被转换为这样的形式：

``` js
// 使用 dom 函数替代默认的 React.createElement
const vdom = dom(
  'div',
  null,
  dom('span', null, '123'),
  dom('span', null, '456')
)
```

根据 JSX 转译得到的 `dom` 调用方式，可以发现该函数的签名格式中，第一个参数为标签类型，第二个参数为标签 props 属性，后续的多个参数则为标签的 children 子节点。而这个函数的输出，则应当是一个表示虚拟 DOM 的纯 JSON 结构。这样，在已知函数输入和输出的条件下，我们就能够实现这个函数了：

``` js
// 此处的对象展开运算符，表示将剩余传入参数展开至 children 数组中
function dom (type, props, ...children) {
  // 等价于 { type: type, props: props, children: children }
  return { type, props, children }
}
```

这时，不妨将 `dom` 的声明复制入 Node 的 REPL 环境，然后复制入上例中使用 `dom` 函数表达的 `vdom` 常量声明，这样就能在 Node 中观察到我们声明的虚拟 DOM 了：

``` text
> vdom
{ type: 'div',
  props: null,
  children: 
   [ { type: 'span', props: null, children: [Object] },
     { type: 'span', props: null, children: [Object] } ] }
```

## 绑定真实 DOM
上一步骤中实现的虚拟 DOM 只是一个简单的 JSON 结构，需要调用 DOM 的 API，来从虚拟 DOM 节点生成真实 DOM 节点。这一步骤也只需通过一个函数即可实现，该函数的输入是一个虚拟 DOM 节点，而输出则是一个真实 DOM 节点：

``` js
// 输入一个虚拟 DOM 节点，返回对应的真实 DOM 节点
function createElement (node) {
  // 节点内容为纯文本时，表示节点该节点为叶子节点
  // 创建 DOM 元素后返回即可
  if (typeof node === 'string') {
    return document.createTextNode(node)
  } else {
    // 节点内容为非叶子节点时，递归对所有子节点调用本函数
    const $el = document.createElement(node.type)
    node.children
      .map(createElement)
      .forEach($el.appendChild.bind($el))
    return $el
  }
}
```

在上例和后续的示例中，带有 `$` 的变量代表与真实 DOM 相关的变量。上例中同样利用了递归的思想：`createElement` 既可能被用于用来渲染 body 这样的根节点，也可能被用来渲染纯文本的叶子节点。这时，递归的入口是【渲染非叶子节点时，对所有叶子节点调用自身】，而递归的出口则是【渲染叶子节点时，返回节点值】。这样，递归在叶子节点一定会终止。在这样的遍历中，也就能够根据虚拟 DOM 返回真实 DOM 了。

## 更新虚拟 DOM
对虚拟 DOM 实现 Diff 算法而后差量更新，一直是 React 引以为傲的特性之一。这样的 Diff 算法，同样可实现为一个函数。这个函数的签名格式如下所示：

``` js
function updateElement ($parent, newNode, oldNode, index = 0) {
  // TODO
}
```

根据命名约定，我们知道 `$parent` 为真实 DOM 中待更新节点的父节点，而 `newNode` 和 `oldNode` 分别代表新虚拟 DOM 节点和旧虚拟 DOM 节点。最后的 `index` 字段则用于在遍历子节点数组时，标记每个子节点的序号。

`updateElement` 的核心，是两个节点之间的 Diff。理想情况下，只需将新旧两棵树的根节点传入该函数中，该函数就会递归地向下比较每个新老节点状态，进而仅更新发生变动的节点（这并不是一个高效的算法，但很容易实现）。

在对比节点状态时，需要区分以下的几种情况：

### 不存在旧节点
`oldNode` 为空时，新节点可以整体作为子树，插入 `$parent` 中：

``` js
function updateElement ($parent, newNode, oldNode, index = 0) {
  // 不存在旧节点
  if (!oldNode) {
    $parent.appendChild(
      createElement(newNode)
    )
  }
}
```

### 不存在新节点
`newNode` 为空时，从 `$parent` 中根据下标，移除该位置的节点：

``` js
function updateElement ($parent, newNode, oldNode, index = 0) {
  if (!oldNode) {
    $parent.appendChild(
      createElement(newNode)
    )
  // 不存在新节点
  } else if (!newNode) {
    $parent.removeChild(
      $parent.childNodes[index]
    )
  }
}
```

### 新旧节点均存在，但节点类型发生改变
节点类型的改变，不仅仅包括形如 `<div>` 变为 `<span>` 这样两种不同的标签节点间的变换，也包括从标签节点变为文本节点（不含标签的纯文本），或是从文本节点变为为标签节点，这些情况可以用一个辅助函数表达：

``` js
function isChanged (node1, node2) {
  return (
    (typeof node1 !== typeof node2) ||
    (typeof node1 === 'string' && node1 !== node2) ||
    (node1.type !== node2.type)
  )
}
```

而后即可根据 `isChanged` 的判断来处理这一类情形了。对这类情形的处理方式亦并不复杂：既然当前节点类型已经改变，那么直接将当前节点及其下的子节点全量替换掉即可：

``` js
function updateElement ($parent, newNode, oldNode, index = 0) {
  if (!oldNode) {
    $parent.appendChild(
      createElement(newNode)
    )
  } else if (!newNode) {
    $parent.removeChild(
      $parent.childNodes[index]
    )
  // 新旧节点均存在，但节点类型发生改变
  } else if (isChanged(newNode, oldNode)) {
    $parent.replaceChild(
      createElement(newNode),
      $parent.childNodes[index]
    )
  }
}
```

### 新旧节点类型相同
新旧节点类型相同时，无需替换当前节点，但当前节点类型相同，并不代表节点下的所有子节点类型相同。此时，需要对当前节点下的所有子节点，递归调用 `updateElement` 自身，来实现对新旧节点下子树的遍历：

``` js
function updateElement ($parent, newNode, oldNode, index = 0) {
  if (!oldNode) {
    $parent.appendChild(
      createElement(newNode)
    )
  } else if (!newNode) {
    $parent.removeChild(
      $parent.childNodes[index]
    )
  } else if (isChanged(newNode, oldNode)) {
    $parent.replaceChild(
      createElement(newNode),
      $parent.childNodes[index]
    )
  // 新旧节点类型相同
  } else if (newNode.type) {
    const newLen = Math.max(
      newNode.children.length,
      oldNode.children.length
    )
    for (let i = 0; i < newLen; i++) {
      updateElement(
        $parent.childNodes[index],
        newNode.children[i],
        oldNode.children[i],
        i
      )
    }
  }
}
```

区分出以上四种情形后，就得到了 `updateElement` 函数完整的实现了。

## 实现 Demo
如果不希望按照上文中提及的方式配置构建环境，这里给出了一个保存为 HTML 后可直接运行的示例（需要最新版本的 Chrome 以支持 ES6）。

``` html
<html>
<head><style>span { display: block; }</style></head>
<body>

<button id="btn">Change</button>
<div id="root"></div>
<script>
function dom (type, props, ...children) {
  return { type, props, children }
}

function createElement (node) {
  if (typeof node === 'string') {
    return document.createTextNode(node)
  } else {
    const $el = document.createElement(node.type)
    node.children
      .map(createElement)
      .forEach($el.appendChild.bind($el))
    return $el
  }
}

function isChanged (node1, node2) {
  return (
    (typeof node1 !== typeof node2) ||
    (typeof node1 === 'string' && node1 !== node2) ||
    (node1.type !== node2.type)
  )
}

function updateElement ($parent, newNode, oldNode, index = 0) {
  if (!oldNode) {
    $parent.appendChild(
      createElement(newNode)
    )
  } else if (!newNode) {
    $parent.removeChild(
      $parent.childNodes[index]
    )
  } else if (isChanged(newNode, oldNode)) {
    $parent.replaceChild(
      createElement(newNode),
      $parent.childNodes[index]
    )
  } else if (newNode.type) {
    const newLen = Math.max(
      newNode.children.length,
      oldNode.children.length
    )
    for (let i = 0; i < newLen; i++) {
      updateElement(
        $parent.childNodes[index],
        newNode.children[i],
        oldNode.children[i],
        i
      )
    }
  }
}

const a = dom(
  'div',
  null,
  dom('span', null, '123'),
  dom('span', null, '456'),
  dom('span', null, '789'),
)
// 对虚拟 DOM 的直接声明，等效于以下注释代码
/*
const a = (
  <div>
    <span>123</span>
    <span>456</span>
    <span>789</span>
  </div>
)
*/

const b = dom(
  'div',
  null,
  dom('span', null, '123'),
  dom('span', null, '456'),
  dom('span', null, '666')
)

const $root = document.getElementById('root')
const $btn = document.getElementById('btn')
updateElement($root, a)
$btn.addEventListener('click', () => {
  updateElement($root, b, a)
})
</script>

</body>
</html>
```

页面加载后，打开 Chrome 调试器的 Elements 面板可以看到原始的 DOM 结构。点击按钮时，可以发现虽然完全加载了一个新的虚拟 DOM 结构，但只有发生改变的最后一个 `span` 元素在调试器中有可视的刷新，这说明 Diff 算法确实实现了仅对变化的 DOM 结构进行更新。

## 总结
在这一节中，我们实现了一个包含了核心概念与原理的虚拟 DOM，并能够正常运行。但这个实现显然过于简单，缺少的机制包括：

1. Diff 算法是深度优先遍历，而不是更适合实际场景的层序优先遍历。
2. 虚拟 DOM 映射到的真实 DOM 中，并没有维护 DOM 元素的事件和样式。
3. 没有实现 JSX 格式语法到虚拟 DOM 语法的转译，而是采用了现成的插件。

后续的系列文章中会继续更新前端框架的核心模块原理和实现，欢迎感兴趣的同学[关注 Github](https://github.com/doodlewind) 哦😉

最后是若干参考资料：

[Medium 参考](https://medium.com/@deathmood/how-to-write-your-own-virtual-dom-ee74acc13060)
[React 虚拟 DOM 解析](www.infoq.com/cn/articles/react-dom-diff)
