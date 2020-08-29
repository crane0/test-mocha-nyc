import { parseHTML } from '../src/parse.js'
let assert = require('assert')

// it('should be', () => {
//   parseHTML('<div></div>')
// })

it('single element', () => {
  let doc = parseHTML('<div></div>')
  let div = doc.children[0]
  assert.equal(div.type, 'element')
  assert.equal(div.tagName, 'div')
  assert.equal(div.children.length, 0)
  assert.equal(div.attributes.length, 0)
})


it('single element with text content', () => {
  let doc = parseHTML('<div>hello</div>')
  let text = doc.children[0].children[0]
  assert.equal(text.type, 'text')
  assert.equal(text.content, 'hello')
})

// line 41
it('tag mismatch', () => {
  try {
    let doc = parseHTML('<div></vid>')
  } catch (error) {
    assert.equal(error.message, 'Tag start end doesn"t match!')
  }
})

// 测试 tagName
it('text with <', () => {
  let doc = parseHTML('<div>a < b</div>')
  let text = doc.children[0].children[0]
  assert.equal(text.content, 'a < b')
  assert.equal(text.type, 'text')
})

// line 106 带属性的元素
it('with property', () => {
  // 一并测试了单引号的属性值
  let doc = parseHTML('<div id=a class=\'cls\' data="abc" ></div>')
  let div = doc.children[0]

  let count = 0
  for (const attr of div.attributes) {
    if (attr.name === 'id') {
      count++
      assert.equal(attr.value, 'a')
    }
    if (attr.name === 'class') {
      count++
      assert.equal(attr.value, 'cls')
    }
    if (attr.name === 'data') {
      count++
      assert.equal(attr.value, 'abc')
    }
  }
  assert.ok(count === 3)
})

// 属性后跟 > 结束
it('with property 2', () => {
  let doc = parseHTML('<div id=a class=\'cls\' data="abc"></div>')
  let div = doc.children[0]

  let count = 0
  for (const attr of div.attributes) {
    if (attr.name === 'id') {
      count++
      assert.equal(attr.value, 'a')
    }
    if (attr.name === 'class') {
      count++
      assert.equal(attr.value, 'cls')
    }
    if (attr.name === 'data') {
      count++
      assert.equal(attr.value, 'abc')
    }
  }
  assert.ok(count === 3)
})

it('with property 3', () => {
  let doc = parseHTML('<div id =a class=\'cls\' data="abc"/>')
  let div = doc.children[0]

  let count = 0
  for (const attr of div.attributes) {
    if (attr.name === 'id') {
      count++
      assert.equal(attr.value, 'a')
    }
    if (attr.name === 'class') {
      count++
      assert.equal(attr.value, 'cls')
    }
    if (attr.name === 'data') {
      count++
      assert.equal(attr.value, 'abc')
    }
  }
  assert.ok(count === 3)
})

it('with property 4', () => {
  let doc = parseHTML('<div id=a/>')
  let div = doc.children[0]
})

it('with property 5', () => {
  let doc = parseHTML('<div id=a></div>')
  let div = doc.children[0]
})

it('with property 6', () => {
  let doc = parseHTML('<div/>')
  let div = doc.children[0]
})


it('script', () => {
  let content = `<div>adfa</div>
    <span>x</span>
  <
  </
  </s
  </sc
  </scr
  </scri
  </scrip
  </script `
  let doc = parseHTML(`<script>${content}</script>`)
  let text = doc.children[0].children[0]
  assert.equal(text.content, content)
  assert.equal(text.type, 'text')
})


it('attribute with no value', () => {
  let doc = parseHTML("<div class></div>")
})

it('attribute with no value', () => {
  let doc = parseHTML("<div class id></div>")
})