/**
 * 常量定义文件
 */

// 命名空间
window.RedditSidebarTool = window.RedditSidebarTool || {};

// 常量
window.RedditSidebarTool.Constants = {
  // 默认提示模板
  DEFAULT_PROMPT_TEMPLATE: `You are a helpful assistant providing suggestions for a Reddit reply. 

Original post: {{originalPost}}
{{#if replyContent}}Reply to: {{replyContent}}{{/if}}
Subreddit: {{subreddit}}
{{#if additionalRequirements}}Additional requirements: {{additionalRequirements}}{{/if}}

Please generate EXACTLY 3 different reply options that would be appropriate for this subreddit. Each option should have a different tone or approach:
1. A thoughtful, detailed response
2. A concise, to-the-point response
3. A friendly, conversational response
notice, the response should be clear and concise, use simple words, better with some personal experience.

You MUST format your response as a valid JSON object with the following structure:
{
  "options": [
    {
      "type": "thoughtful",
      "content": "First reply option text here..."
    },
    {
      "type": "concise",
      "content": "Second reply option text here..."
    },
    {
      "type": "friendly",
      "content": "Third reply option text here..."
    }
  ]
}

DO NOT include any explanations or additional text outside this JSON structure. ONLY return the JSON object.`,

  // 默认翻译提示模板
  DEFAULT_TRANSLATION_PROMPT: `请将以下英文内容翻译成中文，并在翻译后添加一个简短的解释，帮助理解内容的背景和要点：

{{content}}

请按照以下格式回复：

## 中文翻译
[翻译内容]

## 简要解释
[解释内容]`,

  // 存储键名
  STORAGE_KEYS: {
    API_KEY: 'openRouterApiKey',
    PROMPT_TEMPLATE: 'promptTemplate',
    TRANSLATION_PROMPT: 'translationPrompt',
    ADDITIONAL_REQUIREMENTS: 'additionalRequirements'
  },

  // 选择器
  SELECTORS: {
    // 帖子标题选择器
    TITLE_SELECTORS: [
      'h1[slot="title"]',
      'h1.Post__title',
      'h1[data-testid="post-title"]',
      'div[data-test-id="post-content"] h1',
      'div[data-adclicklocation="title"] h1',
      'div.title h1',
      'shreddit-title',
      'h1'
    ],
    
    // 帖子内容选择器
    CONTENT_SELECTORS: [
      'div[data-click-id="text"]',
      'div[data-testid="post-content"]',
      'shreddit-post div[slot="text-body"]',
      'div[data-adclicklocation="post_content"]',
      'div.usertext-body div.md',
      'div.expando div.usertext-body',
      'div.expando div.md',
      'div.post-content'
    ],
    
    // 评论选择器
    COMMENT_SELECTORS: [
      'shreddit-comment',
      'div[data-testid="comment"]',
      'div.comment',
      'div.thing.comment'
    ],
    
    // 评论内容选择器
    COMMENT_CONTENT_SELECTORS: [
      'div[data-testid="comment"] div[data-testid="comment-content"]',
      'div[slot="comment"]',
      'div[data-click-id="text"]',
      'div.usertext-body div.md',
      'p',
      'div.md'
    ],
    
    // Subreddit选择器
    SUBREDDIT_SELECTORS: [
      'a[href^="/r/"]',
      'a[data-testid="subreddit-link"]',
      'a.subreddit',
      'shreddit-subreddit-header'
    ]
  },
  
  // API配置
  API: {
    OPENROUTER_URL: 'https://openrouter.ai/api/v1/chat/completions',
    DEFAULT_MODEL: 'anthropic/claude-3-opus:beta'
  }
};
