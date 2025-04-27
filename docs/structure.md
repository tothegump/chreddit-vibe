# Reddit Sidebar Tool - 项目结构文档

## 概述

Reddit Sidebar Tool 是一个 Chrome 扩展，为 Reddit 网站提供一个功能丰富的侧边栏。该扩展根据页面类型（帖子详情页或列表页）显示不同的侧边栏样式，并提供多种功能，包括内容提取、回复建议生成、内容翻译等。

## 目录结构

```
redder-tool/
├── manifest.json         # 扩展核心配置文件
├── .gitignore           # Git 忽略文件配置
├── README.md            # 项目说明文档
├── icons/               # 存放扩展图标
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── css/                 # 存放 CSS 样式文件
│   └── sidebar.css      # 侧边栏样式
├── js/                  # 存放 JavaScript 脚本
│   ├── common/          # 共享代码
│   │   └── constants.js # 常量定义
│   └── content/         # 内容脚本
│       ├── main.js      # 主入口文件
│       ├── sidebar.js   # 侧边栏 UI 管理
│       ├── domExtractor.js # 数据提取
│       ├── apiService.js # API 调用
│       ├── settings.js  # 设置管理
│       └── utils.js     # 工具函数
└── docs/                # 文档
    └── structure.md     # 项目结构文档
```

## 模块说明

### manifest.json

扩展的配置文件，定义了扩展的基本信息、权限、资源和脚本加载顺序。

### css/sidebar.css

包含所有侧边栏和相关组件的样式规则，如按钮、容器、输入框等。

### js/common/constants.js

定义了整个扩展中使用的常量，包括：
- 默认提示模板
- 默认翻译提示模板
- 存储键名
- DOM 选择器
- API 配置

### js/content/utils.js

提供通用工具函数，包括：
- `isPostDetailPage()`: 判断当前是否在帖子详情页
- `safeQuerySelector()`: 安全地获取 DOM 元素
- `safeQuerySelectorAll()`: 安全地获取多个 DOM 元素
- `createElement()`: 创建 DOM 元素并设置属性
- `debounce()`: 防抖函数
- `throttle()`: 节流函数
- `log()`: 日志函数

### js/content/settings.js

管理扩展设置的加载和保存，使用 `chrome.storage.local` 进行存储：
- `loadSettings()`: 加载所有设置
- `saveSetting()`: 保存单个设置
- `getSetting()`: 获取设置值
- `setApiKey()`: 设置 API 密钥
- `setPromptTemplate()`: 设置提示模板
- `setTranslationPrompt()`: 设置翻译提示模板
- `setAdditionalRequirements()`: 设置额外要求
- `setupEventListeners()`: 设置事件监听器

### js/content/domExtractor.js

负责从 Reddit 页面提取各种数据：
- `extractPostContent()`: 提取帖子标题和内容
- `extractSubreddit()`: 提取当前的 subreddit/频道
- `extractCommentContent()`: 提取评论内容
- `findComments()`: 查找页面上的所有评论
- `getPostAnalytics()`: 获取帖子分析数据（评论数、投票比例等）

### js/content/apiService.js

处理与 OpenRouter API 的交互：
- `generateReplySuggestion()`: 生成回复建议
- `translateAndExplainContent()`: 翻译并解释内容

### js/content/sidebar.js

创建和管理侧边栏界面：
- `createSidebar()`: 创建并注入侧边栏
- `updatePostDetailData()`: 更新帖子详情数据
- `setupListingPageInteractions()`: 设置列表页交互
- `addZjmButtonsToComments()`: 向评论添加 zjm 按钮
- `handleUrlChange()`: 处理 URL 变化

### js/content/main.js

作为入口点，初始化各个模块并协调它们之间的交互：
- `initialize()`: 初始化扩展
- `setupEventListeners()`: 设置事件监听器

## 功能流程

1. **初始化**：
   - `main.js` 检查是否在 Reddit 网站上
   - 加载设置
   - 创建侧边栏
   - 设置事件监听器

2. **侧边栏创建**：
   - 根据页面类型（帖子详情页或列表页）创建不同样式的侧边栏
   - 添加关闭按钮、头部、内容区域和页脚
   - 如果在帖子详情页，更新帖子详情数据
   - 如果在列表页，设置列表页交互

3. **帖子详情数据更新**：
   - 提取帖子标题和内容
   - 更新侧边栏中的帖子标题和内容
   - 添加回复建议按钮和翻译按钮的事件监听器
   - 提取并显示 subreddit 名称
   - 加载保存的设置到表单字段
   - 向评论添加 zjm 按钮
   - 延迟后重试内容提取，处理动态加载的内容
   - 更新分析数据（评论数、投票比例）

4. **评论互动**：
   - 向每个评论添加 zjm 按钮和回复建议按钮
   - zjm 按钮点击时，提取评论内容并更新侧边栏
   - 回复建议按钮点击时，生成回复建议

5. **API 调用**：
   - 生成回复建议：使用 OpenRouter API 生成回复建议
   - 翻译内容：使用 OpenRouter API 翻译并解释内容

6. **URL 变化处理**：
   - 检测 URL 变化
   - 移除现有侧边栏
   - 创建新侧边栏，使用适当的样式

## 设计模式

项目采用了以下设计模式：

1. **模块模式（Module Pattern）**：每个 JS 文件都使用立即执行函数表达式 (IIFE) 创建私有作用域，只暴露必要的公共 API。

2. **命名空间模式**：使用 `window.RedditSidebarTool` 作为全局命名空间，避免全局变量污染。

3. **观察者模式**：使用 MutationObserver 监听 DOM 变化和 URL 变化。

4. **依赖注入**：模块之间通过引用相互依赖，而不是直接创建实例。

## 扩展点

项目设计考虑了未来的扩展性，可以在以下方面进行扩展：

1. **添加新功能**：可以在现有模块中添加新方法，或创建新模块。

2. **支持更多 API**：可以在 `apiService.js` 中添加对其他 AI 服务的支持。

3. **自定义主题**：可以扩展 CSS 以支持多种主题。

4. **国际化**：可以添加多语言支持。

5. **数据分析**：可以添加用户行为分析功能。

## 开发指南

### 添加新功能

1. 确定新功能应该属于哪个模块，或者是否需要创建新模块。
2. 在相应模块中实现功能。
3. 如果需要，更新其他模块以使用新功能。
4. 更新 CSS 样式。
5. 测试新功能。

### 修改现有功能

1. 找到相关模块和方法。
2. 修改实现。
3. 测试修改。

### 调试技巧

1. 使用 `Utils.log()` 函数记录日志。
2. 在 Chrome 开发者工具中调试扩展。
3. 使用 Chrome 扩展管理页面重新加载扩展。