# gemini-read-enhance-plugin

Gemini Read Enhance

Gemini 对话大纲与宽屏工具：为 Google Gemini 提供沉浸式宽屏阅读体验，并自动生成侧边栏对话大纲，支持一键导航与自定义宽度。

![demo](./demo.png)


## 如何使用？

<img width="823" height="651" alt="image" src="https://github.com/user-attachments/assets/32adc73b-34f5-43b5-8c18-ef392fb5b524" />

- [下载已发布的zip包](https://github.com/Juna3066/gemini-read-enhance-plugin/releases/tag/v3.1.0)
- 解压得到gemini-read-enhance文件夹
- 进入**扩展程序页面**（chrome地址输入`chrome://extensions/`）
- 开启右侧**开发者模式**
- 点击加载未打包的扩展程序,选择gemini-read-enhance文件夹



## 配合SingleFile插件使用（可选）

- 进入**扩展程序页面**（chrome地址输入`chrome://extensions/`）
- 点击Gemini Read Enhance插件**详情**
- 开启**允许访问文件网址**
- 点击SingleFile插件**详情**
- 点击**扩展程序选项**
- 点击**HTML内容**
- 【必须】在**移除特定元素**框添加
    ~~~
    #my-gemini-toc
    ~~~
- 【可选】在**文件名**模板框添加
    ~~~
    %if-empty<%page-element-text<span.conversation-title>|{page-title}|NoTitle>-{year-locale}-{month-locale}{day-locale}-{hours-locale}{minutes-locale}-{seconds-locale}.{filename-extension}
    ~~~
- 网页Gemini对话页面-右键-SingleFile-使用SingleFile保存页面
- 浏览器打开本地**已保存页面**查看
