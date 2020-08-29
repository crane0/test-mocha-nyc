使用 mocha + nyc 单元测试 parseHTML.js 文件。


在写测试 case 时，测试出了很多 `parseHTML.js` 的问题。

# 1，关键配置文件

## 1.1，package.json 中， 

`--require @babel/register` 保证测试的 js 中使用 import 引入文件时不会有问题的条件之一。
```
"test": "mocha --require @babel/register",
```

## 1.2，.babelrc

presets 的配置，保证测试的 js 中使用 import 引入文件时不会有问题的条件之二。

plugins 的配置，保证 `npm run coverage` 时，可以正确查找文件。
```
{
  "presets": ["@babel/preset-env"],
  "plugins": ["babel-plugin-istanbul"]
}
```

# 1.3，.nycrc

`nyc` 的关键配置文件。

plugins 的配置，保证 `npm run coverage` 时，可以正确查找文件。

```
"extends": "@istanbuljs/nyc-config-babel"
```