let currentToken = null
let currentAttribute = null // 属性节点
let currentTextNode = null // 文本节点

// 处理标签构建DOM树，需要用到栈
// 标准实现的根元素也是一个 document 元素：document.getElementsByTagName('html')[0].parentNode
// let  stack = [{type: 'document', children: []}]
let stack

// 标签结束状态提交标签的 token
function emit(token) {
  let top = stack[stack.length - 1] // 取栈顶的元素
  if (token.type === 'startTag') {
    let element = {
      type: 'element',
      children: [],
      attributes: []
    }

    element.tagName = token.tagName

    for (const p in token) {
      if (p !== 'type' && p !== 'tagName') {
        element.attributes.push({
          name: p,
          value: token[p]
        })
      }
    }

    top.children.push(element)
    element.parent = top

    // 不是自封闭标签，入栈
    if (!token.isSelfClosing) {
      stack.push(element)
    }

    currentTextNode = null
  } else if (token.type === 'endTag') {
    if (top.tagName !== token.tagName) {
      throw new Error('Tag start end doesn"t match!')
    } else {
      stack.pop()
    }
    currentTextNode = null
    // 处理文本节点，不会入栈
  } else if (token.type === 'text') {
    if (currentTextNode == null) {
      currentTextNode = {
        type: "text",
        content: ''
      }
      top.children.push(currentTextNode)
    }
    currentTextNode.content += token.content
  }
  
}

const EOF = Symbol('EOF') // End Of File

function data(c) {
  if (c === '<') {
    return tagOpen;
  } else if (c == EOF) {
    emit({
      type: 'EOF'
    })
    return ;
  } else {
    emit({
      type: 'text',
      content: c
    })
    return data
  }
}


function tagOpen(c) {
  if (c === '/') {
    return endTagOpen
  } else if (c.match(/^[a-zA-Z]$/)) {
    currentToken = {
      type: 'startTag',
      tagName: ''
    }
    return tagName(c)
  } else {
    emit({
      type: "text",
      content: '<'
    });
    emit({
      type: "text",
      content: c
    });
    return data;
  }
}

function tagName(c) {
  // 各种空白
  if (c.match(/^[\t\n\f ]$/)) {
    return beforeAttributeName
  } else if (c === '/') {
    return selfClosingStartTag
  } else if (c.match(/^[a-zA-Z]$/)) {
    currentToken.tagName += c
    return tagName
  } else if (c === '>') {
    emit(currentToken)
    return data
  } else {
    return tagName
  }
}

// 准备进入属性key
function beforeAttributeName(c) {
  // 如果是空白，就一直等待属性
  if (c.match(/^[\t\n\f ]$/)) {
    return beforeAttributeName
  } else if (c === '/' || c === '>' || c == EOF) {
    return afterAttributeName(c)
  } else if (c === '=') {

  } else {
    currentAttribute = {
      name: '',
      value: ''
    }
    return attributeName(c)
  }
}

// 拼接属性key
function attributeName(c) {
  // 在 beforeAttributeName 已经判断了空格，拼接属性key时还是遇到，说明当前 key 结束了
  if (c.match(/^[\t\n\f ]$/) || c === '/' || c === '>' || c == EOF) {
    return afterAttributeName(c)
  } else if (c === '=') {
    // 准备进入属性value
    return beforeAttributeValue
  } else if (c === '\u0000') {
  
  } else if (c === "\"" || c == "'" || c == "<") {

  } else {
    // 如果不是上面的特殊字符，就 += 给 name
    currentAttribute.name += c
    return attributeName
  }
}


function afterAttributeName(c) {
  // metta  =这里的空格忽略掉
  if (c.match(/^[\t\n\f ]$/)) {
    return afterAttributeName
  } else if (c == '/') {
    return selfClosingStartTag
  } else if (c == '=') {
    // 准备进入属性value
    return beforeAttributeValue
  } else if (c == '>') {
    currentToken[currentAttribute.name] = currentAttribute.value
    emit(currentToken)
    return data
  } else if (c == EOF) {

  } else {
    currentToken[currentAttribute.name] = currentAttribute.value
    currentAttribute = {
      name: '',
      value: ''
    }
    return attributeName(c)
  }
}

// 准备进入属性value，value 可能由单双引号包裹。
function beforeAttributeValue(c) {
  if (c.match(/^[\t\n\f ]$/) || c === '/' || c === '>' || c == EOF) {
    return beforeAttributeValue
  } else if (c === "\"") {
    return doubleQuotedAttributeValue
  } else if (c === "\'") {
    return singleQuotedAttributeValue
  } else if (c === '>') {

  } else {
    // 拼接属性value
    return unquotedAttributeValue(c)
  }
}


// 拼接属性值，遇到空格或是 / > 就结束了。将当前完整属性的 key-value 给 token
function unquotedAttributeValue(c) {
  if (c.match(/^[\t\n\f ]$/)) {
    currentToken[currentAttribute.name] = currentAttribute.value
    // 进入空格后，可能会进入下个属性，也可能就是一个空格，空面就是 >
    // <html maaa=a >
    return beforeAttributeName
  } else if (c === '/') {
    currentToken[currentAttribute.name] = currentAttribute.value
    return selfClosingStartTag
  } else if (c === '>') {
    currentToken[currentAttribute.name] = currentAttribute.value
    emit(currentToken)
    return data
  } else if (c === '\u0000') {

  } else if (c === "\"" || c === "'" || c === '<' || c === '=' || c === '`') {

  } else if (c === EOF) {

  } else {
    // 不是上面的字符，就拼接属性值
    currentAttribute.value += c
    return unquotedAttributeValue
  }
}


function selfClosingStartTag(c) {
  if (c === '>') {
    currentToken.isSelfClosing = true
    /* 
      这行代码，老师并没加，加上后才可以将自闭合标签正确添加到 DOM 树中。
      这里 emit 后，在 emit 方法中，自闭合标签不会入栈，也不会出栈。相当于入栈后立即出栈。
    */
    emit(currentToken)
    return data
  } else if (c == 'EOF') {
    return ;
  } else {
    return;
  }
}


function endTagOpen(c) {
  if (c.match(/^[a-zA-Z]$/)) {
    currentToken = {
      type: 'endTag',
      tagName: ''
    }
    return tagName(c)
  } else if (c === '>') {
    return 
  } else {
    return 
  }
}

// 进入 script 标签解析
function scriptData(c) {
  if (c == '<') {
    return scriptDataLessThanSign
  } else {
    emit({
      type: 'text',
      content: c
    })
    return scriptData
  }
}

// 进入 script 标签解析的 <
function scriptDataLessThanSign(c) {
  if (c == '/') {
    return scriptDataEndTagOpen
  } else {
    // 此时发现不是 script 标签，需要将 / 也当做普通文本处理。所以要多 emit 一个
    emit({
      type: 'text',
      content: '<'
    })
    return scriptData(c)
  }
}

// 进入 script 标签解析的 </
function scriptDataEndTagOpen(c) {
  if (c == 's') {
    return scriptDataEndTagNameS
  } else {
    emit({
      type: 'text',
      content: '<'
    })
    emit({
      type: 'text',
      content: '/'
    })
    return scriptData(c)

  }
}

// 进入 script 标签解析的 </s
function scriptDataEndTagNameS(c) {
  if (c == 'c') {
    return scriptDataEndTagNameC
  } else {
    emit({
      type: 'text',
      content: '</s'
    })
    return scriptData(c)

  }
}

// 进入 script 标签解析的 </sc
function scriptDataEndTagNameC(c) {
  if (c == 'r') {
    return scriptDataEndTagNameR
  } else {
    emit({
      type: 'text',
      content: '</sc'
    })
    return scriptData(c)

  }
}

// 进入 script 标签解析的 </scr
function scriptDataEndTagNameR(c) {
  if (c == 'i') {
    return scriptDataEndTagNameI
  } else {
    emit({
      type: 'text',
      content: '</scr'
    })
    return scriptData(c)

  }
}

// 进入 script 标签解析的 </scri
function scriptDataEndTagNameI(c) {
  if (c == 'p') {
    return scriptDataEndTagNameP
  } else {
    emit({
      type: 'text',
      content: '</scri'
    })
    return scriptData(c)

  }
}

// 进入 script 标签解析的 </scrip
function scriptDataEndTagNameP(c) {
  if (c == 't') {
    return scriptDataEndTag
  } else {
    emit({
      type: 'text',
      content: '</scrip'
    })
    return scriptData(c)

  } 
}

// 进入 script 标签解析的 </script 就已经算结束了，后面的字符如果不是空格或>，都是非法的。
let spaces = 0
function scriptDataEndTag(c) {
  if (c == ' ') {
    spaces++
    return scriptDataEndTag
  } else if (c == '>') {
    emit({
      type: 'endTag',
      tagName: 'script'
    })
    return data
  } else {
    emit({
      type: 'text',
      content: '</script' + new Array(spaces).fill(' ').join('')
    })
    return scriptData(c)

  } 
}

// 属性值双引号解析
function doubleQuotedAttributeValue(c) {
  // 再次遇到引号，代表 value 拼接结束。
  if (c === "\"") {
    currentToken[currentAttribute.name] = currentAttribute.value
    return afterQuotedAttributeValue
  } else if (c == '\u0000') {
  
  } else if (c == EOF) {
  
  } else {
    currentAttribute.value += c
    return doubleQuotedAttributeValue
  }
  
}

// 属性值单引号
function singleQuotedAttributeValue(c) {
  // 再次遇到引号，代表 value 拼接结束。
  if (c === "\'") {
    currentToken[currentAttribute.name] = currentAttribute.value
    return afterQuotedAttributeValue
  } else if (c == '\u0000') {

  } else if (c == EOF) {

  } else {
    currentAttribute.value += c
    return singleQuotedAttributeValue
  }
}

function afterQuotedAttributeValue(c) {
  // value 拼接完成后，再次遇到空格，代表进入下个属性的解析
  if (c.match(/^[\t\n\f ]$/)) {
    return beforeAttributeName
  } else if (c === '/') {
    return selfClosingStartTag
  } else if (c === '>') {
    currentToken[currentAttribute.name] = currentAttribute.value
    emit(currentToken)
    return data
  } else if (c === EOF) {

  } else {
    currentAttribute.value += c
    return afterQuotedAttributeValue
  }
}



// 将 HTML 文本作为参数，返回一个DOM树
export function parseHTML(html) {
  let state = data
  // 重置放到这里，否则多次调用 parseHTML，每次传入的内容不同，stack也应该是不一样的。
  stack = [{type: 'document', children: []}]
  for (const c of html) {
    state = state(c)
    /* 
      强行切换到 scriptData，并且保证只执行一次。
      state 就是当前执行的函数，当 tagName()结束后，state 就切换到了 data() 进入下面的判断
    */
    if (stack[stack.length - 1].tagName === 'script' && state == data) {
      state = scriptData
    }
    // console.log(c)
  }
  state = state(EOF)
  // console.log(stack[0])
  return stack[0]
  // 给下面这行代码打断点，就可以看到 stack[0] 是什么了
  // console.log(1)
}