/**
 * DOM 数据提取模块
 * 负责从 Reddit 页面提取各种数据
 */

// 命名空间
window.RedditSidebarTool = window.RedditSidebarTool || {};

// DOM 提取器
window.RedditSidebarTool.DomExtractor = (function() {
  // 私有变量
  const Constants = window.RedditSidebarTool.Constants;
  const Utils = window.RedditSidebarTool.Utils;
  
  /**
   * 提取帖子内容
   * @returns {Object} 包含标题和内容的对象
   */
  function extractPostContent() {
    Utils.log('提取帖子内容...');
    
    const titleSelectors = Constants.SELECTORS.TITLE_SELECTORS;
    const contentSelectors = Constants.SELECTORS.CONTENT_SELECTORS;
    
    let postTitle = null;
    let postContent = null;
    
    // 尝试每个标题选择器，直到找到一个有效的
    for (const selector of titleSelectors) {
      try {
        const titleElement = Utils.safeQuerySelector(selector);
        if (titleElement && titleElement.textContent.trim()) {
          postTitle = titleElement.textContent.trim();
          Utils.log('找到帖子标题，使用选择器:', selector);
          break;
        }
      } catch (e) {
        Utils.log('标题选择器错误:', selector, e, 'error');
      }
    }
    
    // 检查是否是只有标题的帖子
    const isTextPost = Utils.safeQuerySelector('shreddit-post[post-type="text"]') !== null;
    const hasTextBody = Utils.safeQuerySelector('shreddit-post div[slot="text-body"]') !== null;
    
    // 如果是文本帖子但没有文本内容，则很可能是只有标题的帖子
    if (isTextPost && !hasTextBody) {
      Utils.log('这似乎是一个只有标题的帖子');
      return { title: postTitle, content: '' };
    }
    
    // 尝试每个内容选择器，直到找到一个有效的
    for (const selector of contentSelectors) {
      try {
        const contentElement = Utils.safeQuerySelector(selector);
        if (contentElement && contentElement.textContent.trim()) {
          // 检查内容长度，过滤掉可能的误提取
          const text = contentElement.textContent.trim();
          // 如果内容过长或包含特定的HTML标记，可能是误提取
          if (text.length > 10000 || text.includes('<') || text.includes('>')) {
            Utils.log('跳过可能无效的内容，选择器:', selector);
            continue;
          }
          postContent = text;
          Utils.log('找到帖子内容，使用选择器:', selector);
          break;
        }
      } catch (e) {
        Utils.log('内容选择器错误:', selector, e, 'error');
      }
    }
    
    // 如果没有找到内容，可能是只有标题的帖子
    if (!postContent) {
      Utils.log('未找到内容，这可能是一个只有标题的帖子');
      return { title: postTitle, content: '' };
    }
    
    // 额外检查：如果提取的内容包含大量的HTML或看起来不像帖子内容，则忽略
    if (postContent && (postContent.includes('<html') || postContent.includes('<body'))) {
      Utils.log('内容似乎是HTML，忽略');
      postContent = '';
    }
    
    // 调试输出
    Utils.log('提取结果:', { 
      titleFound: !!postTitle, 
      contentFound: !!postContent,
      titleLength: postTitle ? postTitle.length : 0,
      contentLength: postContent ? postContent.length : 0
    });
    
    // 返回提取的标题和内容
    return { title: postTitle, content: postContent };
  }
  
  /**
   * 提取当前的 subreddit/频道
   * @returns {string|null} subreddit 名称或 null
   */
  function extractSubreddit() {
    let subreddit = null;
    
    // 尝试从 URL 中提取
    const urlMatch = window.location.pathname.match(/\/r\/([^/]+)/);
    if (urlMatch && urlMatch[1]) {
      subreddit = urlMatch[1];
      return subreddit;
    }
    
    // 如果 URL 中没有找到，尝试从 DOM 中查找
    const subredditSelectors = Constants.SELECTORS.SUBREDDIT_SELECTORS;
    
    for (const selector of subredditSelectors) {
      try {
        const element = Utils.safeQuerySelector(selector);
        if (element && element.textContent) {
          // 从文本内容或 href 中提取 subreddit 名称
          if (element.href) {
            const hrefMatch = element.href.match(/\/r\/([^/]+)/);
            if (hrefMatch && hrefMatch[1]) {
              subreddit = hrefMatch[1];
              break;
            }
          } else {
            // 尝试从文本内容中提取
            const textMatch = element.textContent.match(/r\/([^\s]+)/);
            if (textMatch && textMatch[1]) {
              subreddit = textMatch[1];
              break;
            } else if (element.textContent.trim()) {
              // 如果不符合 r/ 格式，直接使用文本
              subreddit = element.textContent.trim();
              break;
            }
          }
        }
      } catch (e) {
        Utils.log('提取 subreddit 时出错，选择器:', selector, e, 'error');
      }
    }
    
    return subreddit;
  }
  
  /**
   * 提取评论内容
   * @param {Element} commentElement - 评论元素
   * @returns {string|null} 评论内容或 null
   */
  function extractCommentContent(commentElement) {
    if (!commentElement) return null;
    
    const contentSelectors = Constants.SELECTORS.COMMENT_CONTENT_SELECTORS;
    let commentContent = null;
    
    // 尝试在特定评论中查找内容
    for (const selector of contentSelectors) {
      try {
        const contentElement = Utils.safeQuerySelector(selector, commentElement);
        if (contentElement && contentElement.textContent.trim()) {
          commentContent = contentElement.textContent.trim();
          break;
        }
      } catch (e) {
        Utils.log('提取评论内容时出错:', e, 'error');
      }
    }
    
    // 如果无法使用选择器找到内容，尝试获取评论中的所有文本
    if (!commentContent) {
      try {
        // 过滤掉用户名、积分、时间等
        const fullText = commentElement.textContent;
        // 简单启发式：在常见元数据模式后取文本
        const contentMatch = fullText.match(/(?:points|ago|score hidden)\s*(.+)/s);
        if (contentMatch && contentMatch[1]) {
          commentContent = contentMatch[1].trim();
        } else {
          commentContent = fullText;
        }
      } catch (e) {
        Utils.log('使用备用评论提取时出错:', e, 'error');
      }
    }
    
    return commentContent;
  }
  
  /**
   * 查找页面上的所有评论
   * @returns {Array} 评论元素数组
   */
  function findComments() {
    const commentSelectors = Constants.SELECTORS.COMMENT_SELECTORS;
    let comments = [];
    
    // 尝试每个评论选择器，直到找到有效的
    for (const selector of commentSelectors) {
      try {
        const foundComments = Utils.safeQuerySelectorAll(selector);
        if (foundComments && foundComments.length > 0) {
          comments = Array.from(foundComments);
          Utils.log(`使用选择器 ${selector} 找到 ${comments.length} 条评论`);
          break;
        }
      } catch (e) {
        Utils.log('评论选择器错误:', selector, e, 'error');
      }
    }
    
    return comments;
  }
  
  /**
   * 获取帖子分析数据（评论数、投票比例等）
   * @returns {Object} 分析数据对象
   */
  function getPostAnalytics() {
    const analytics = {
      commentCount: 'Unknown',
      upvoteRatio: 'Unknown'
    };
    
    // 尝试获取实际评论数
    try {
      const commentCountElement = Utils.safeQuerySelector('span[data-testid="comment-count"]');
      if (commentCountElement && commentCountElement.textContent) {
        analytics.commentCount = commentCountElement.textContent;
      }
    } catch (e) {
      Utils.log('获取评论数时出错:', e, 'error');
    }
    
    // 尝试获取投票比例
    try {
      const upvoteElement = Utils.safeQuerySelector('div[data-testid="post-upvote-ratio"]');
      if (upvoteElement && upvoteElement.textContent) {
        analytics.upvoteRatio = upvoteElement.textContent;
      }
    } catch (e) {
      Utils.log('获取投票比例时出错:', e, 'error');
    }
    
    return analytics;
  }
  
  // 公开 API
  return {
    extractPostContent: extractPostContent,
    extractSubreddit: extractSubreddit,
    extractCommentContent: extractCommentContent,
    findComments: findComments,
    getPostAnalytics: getPostAnalytics
  };
})();
