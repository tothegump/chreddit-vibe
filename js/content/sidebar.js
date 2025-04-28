/**
 * 侧边栏模块
 * 负责创建和管理侧边栏界面
 */

// 命名空间
window.RedditSidebarTool = window.RedditSidebarTool || {};

// 侧边栏
window.RedditSidebarTool.Sidebar = (function() {
  // 私有变量
  const Constants = window.RedditSidebarTool.Constants;
  const Utils = window.RedditSidebarTool.Utils;
  const DomExtractor = window.RedditSidebarTool.DomExtractor;
  const ApiService = window.RedditSidebarTool.ApiService;
  const Settings = window.RedditSidebarTool.Settings;
  
  // 侧边栏元素引用
  let sidebarElement = null;
  
  /**
   * 创建并注入侧边栏
   */
  function createSidebar() {
    // 创建侧边栏容器
    const sidebar = Utils.createElement('div', {
      id: 'reddit-sidebar-tool'
    });
    
    // 根据页面类型设置适当的类
    if (Utils.isPostDetailPage()) {
      sidebar.className = 'reddit-sidebar-tool post-detail-style';
    } else {
      sidebar.className = 'reddit-sidebar-tool listing-style';
    }
    
    // 创建头部
    const header = Utils.createElement('div', {
      className: 'sidebar-header',
      innerHTML: '<h2>Reddit Sidebar Tool</h2>'
    });
    
    // 创建内容区域
    const content = Utils.createElement('div', {
      className: 'sidebar-content'
    });
    
    // 根据页面类型添加不同的内容
    if (Utils.isPostDetailPage()) {
      content.innerHTML = `
        <div class="post-detail-view">
          <h3>Post Detail View</h3>
          <div class="tool-section">
            <h4>帖子标题</h4>
            <div class="post-title-container">
              <p id="post-title">加载中...</p>
            </div>
          </div>
          <div class="tool-section">
            <h4>帖子内容</h4>
            <div class="post-content-container">
              <p id="post-content">加载中...</p>
            </div>
            <div class="post-buttons-container">
              <button class="main-post-suggest-button" id="main-post-suggest-button">获取回复建议</button>
              <button class="translate-button" id="translate-post-button">翻译并解释</button>
            </div>
            <div class="additional-requirements-container" style="margin-top: 10px;">
              <textarea id="main-post-additional-requirements" rows="2" placeholder="输入回复建议的额外要求，例如：使用幽默的语气，包含一个相关的例子等"></textarea>
            </div>
          </div>
          <div class="tool-section translation-section" id="translation-section" style="display: none;">
            <h4>翻译内容</h4>
            <div class="translation-container">
              <p id="translation-content">点击上方的「翻译并解释」按钮</p>
            </div>
          </div>
          <div class="tool-section">
            <h4>评论内容</h4>
            <div class="comment-content-container">
              <p id="comment-content">点击评论上的「zjm」按钮查看内容</p>
            </div>
          </div>
          <div class="tool-section comment-translation-section" id="comment-translation-section" style="display: none;">
            <h4>评论翻译</h4>
            <div class="comment-translation-container">
              <p id="comment-translation-content">点击评论上的「zjm」按钮查看翻译</p>
            </div>
          </div>
          <div class="tool-section">
            <h4>Post Analytics</h4>
            <div class="analytics-item">
              <span class="label">Comments:</span>
              <span class="value" id="comment-count">Loading...</span>
            </div>
            <div class="analytics-item">
              <span class="label">Upvote Ratio:</span>
              <span class="value" id="upvote-ratio">Loading...</span>
            </div>
          </div>
          <div class="tool-section">
            <h4>Subreddit</h4>
            <div class="analytics-item">
              <span class="label">Channel:</span>
              <span class="value" id="subreddit-name">Loading...</span>
            </div>
          </div>
          <div class="tool-section">
            <h4>API Settings</h4>
            <div class="settings-item">
              <label for="openrouter-api-key">OpenRouter API Key:</label>
              <input type="password" id="openrouter-api-key" placeholder="Enter your API key">
            </div>
            <button class="action-button" id="save-api-key">Save API Key</button>
          </div>
          <div class="tool-section">
            <h4>Prompt Template</h4>
            <textarea id="prompt-template" rows="6" placeholder="Enter your prompt template"></textarea>
            <button class="action-button" id="save-prompt-template">Save Template</button>
            <div class="template-help">
              <p>Available variables: {{originalPost}}, {{replyContent}}, {{subreddit}}, {{additionalRequirements}}</p>
            </div>
          </div>
        </div>
      `;
    } else {
      content.innerHTML = `
        <div class="listing-view">
          <h3>Listing View</h3>
          <p>You're browsing a list of posts.</p>
          <div class="tool-section">
            <h4>Feed Filters</h4>
            <div class="filter-options">
              <label><input type="checkbox" id="filter-images"> Show Images Only</label>
              <label><input type="checkbox" id="filter-videos"> Show Videos Only</label>
              <label><input type="checkbox" id="filter-text"> Show Text Posts Only</label>
            </div>
          </div>
          <div class="tool-section">
            <h4>Sort Options</h4>
            <select id="sort-options">
              <option value="hot">Hot</option>
              <option value="new">New</option>
              <option value="top">Top</option>
              <option value="rising">Rising</option>
            </select>
          </div>
        </div>
      `;
    }
    
    // 创建页脚
    const footer = Utils.createElement('div', {
      className: 'sidebar-footer',
      innerHTML: '<p>© 2025 Reddit Sidebar Tool</p>'
    });
    
    // 添加关闭按钮
    const closeButton = Utils.createElement('button', {
      className: 'sidebar-close-button',
      textContent: '×'
    });
    
    closeButton.addEventListener('click', function() {
      sidebar.classList.toggle('collapsed');
    });
    
    // 组装侧边栏
    sidebar.appendChild(closeButton);
    sidebar.appendChild(header);
    sidebar.appendChild(content);
    sidebar.appendChild(footer);
    
    // 添加到页面
    document.body.appendChild(sidebar);
    
    // 保存侧边栏元素引用
    sidebarElement = sidebar;
    
    // 如果在帖子详情页，更新帖子详情数据
    if (Utils.isPostDetailPage()) {
      updatePostDetailData();
    }
    
    // 如果在列表页，设置列表页交互
    if (!Utils.isPostDetailPage()) {
      setupListingPageInteractions();
    }
    
    return sidebar;
  }
  
  /**
   * 更新帖子详情数据
   */
  function updatePostDetailData() {
    Utils.log('更新侧边栏中的帖子详情数据...');
    
    // 初始尝试提取帖子内容
    let { title, content } = DomExtractor.extractPostContent();
    
    // 更新侧边栏中的帖子标题和内容
    const postTitleElement = document.getElementById('post-title');
    const postContentElement = document.getElementById('post-content');
    const mainPostSuggestButton = document.getElementById('main-post-suggest-button');
    
    if (postTitleElement) {
      if (title) {
        postTitleElement.textContent = title;
      } else {
        postTitleElement.textContent = '无法获取标题';
      }
    }
    
    if (postContentElement) {
      if (content && content.trim() !== '') {
        postContentElement.textContent = content;
      } else {
        // 如果没有内容，显示为空或特定消息
        postContentElement.textContent = '帖子没有内容';
        // 隐藏内容容器或减小其高度
        const container = postContentElement.closest('.post-content-container');
        if (container) {
          container.style.maxHeight = '50px';
        }
      }
    }
    
    // 为主帖回复建议按钮添加点击事件监听器
    if (mainPostSuggestButton) {
      mainPostSuggestButton.addEventListener('click', function() {
        // 组合标题和内容，处理只有标题没有内容的情况
        let originalPost = '';
        if (title && content && content.trim() !== '' && content !== '帖子没有内容') {
          originalPost = `${title}\n\n${content}`;
        } else if (title) {
          originalPost = title; // 只有标题的情况
          Utils.log('只使用标题生成回复建议，没有内容');
        } else {
          originalPost = '';
        }
        const subreddit = DomExtractor.extractSubreddit() || '';
        
        // 获取额外要求输入框的内容
        const additionalRequirementsInput = document.getElementById('main-post-additional-requirements');
        let additionalReqs = '';
        if (additionalRequirementsInput && additionalRequirementsInput.value.trim()) {
          additionalReqs = additionalRequirementsInput.value.trim();
          // 保存额外要求到存储中，以便下次使用
          Settings.setAdditionalRequirements(additionalReqs);
        }
        
        // 检查是否已经存在回复建议容器
        let suggestionContainer = document.querySelector('.main-post-suggestion-container');
        
        // 如果不存在，创建一个新的
        if (!suggestionContainer) {
          suggestionContainer = Utils.createElement('div', {
            className: 'main-post-suggestion-container reply-suggestion-container'
          });
          
          // 将容器添加到帖子内容下方
          const postContentContainer = document.querySelector('.post-content-container');
          if (postContentContainer && postContentContainer.parentNode) {
            postContentContainer.parentNode.insertBefore(suggestionContainer, postContentContainer.nextSibling);
          }
        }
        
        // 显示加载状态
        suggestionContainer.innerHTML = '<div class="suggestion-loading">正在生成回复建议...</div>';
        
        // 生成主帖回复建议
        ApiService.generateReplySuggestion(originalPost, null, subreddit, suggestionContainer, additionalReqs);
      });
    }
    
    // 提取并显示 subreddit 名称
    const subredditElement = document.getElementById('subreddit-name');
    if (subredditElement) {
      const subreddit = DomExtractor.extractSubreddit();
      if (subreddit) {
        subredditElement.textContent = subreddit;
      } else {
        subredditElement.textContent = 'Unknown';
      }
    }
    
    // 加载保存的 API 密钥和提示模板到表单字段
    Settings.loadSettings(function(settings) {
      const apiKeyInput = document.getElementById('openrouter-api-key');
      const promptTemplateInput = document.getElementById('prompt-template');
      const mainPostRequirementsInput = document.getElementById('main-post-additional-requirements');
      
      if (apiKeyInput && settings.openRouterApiKey) {
        apiKeyInput.value = settings.openRouterApiKey;
      }
      
      if (promptTemplateInput && settings.promptTemplate) {
        promptTemplateInput.value = settings.promptTemplate;
      } else if (promptTemplateInput) {
        promptTemplateInput.value = Constants.DEFAULT_PROMPT_TEMPLATE;
      }
      
      // 加载额外要求到主帖输入框
      if (mainPostRequirementsInput && settings.additionalRequirements) {
        mainPostRequirementsInput.value = settings.additionalRequirements;
      }
    });
    
    // 为翻译按钮添加点击事件监听器
    const translateButton = document.getElementById('translate-post-button');
    if (translateButton) {
      translateButton.addEventListener('click', function() {
        // 获取帖子标题和内容
        const postTitle = postTitleElement ? postTitleElement.textContent : '';
        const postContent = postContentElement ? postContentElement.textContent : '';
        
        // 如果标题和内容都没有，则无法翻译
        if (!postTitle && !postContent) {
          alert('无法获取帖子内容进行翻译。');
          return;
        }
        
        // 组合标题和内容，处理只有标题没有内容的情况
        let fullContent = '';
        if (postTitle && postContent && postContent.trim() !== '' && postContent !== '帖子没有内容') {
          fullContent = `${postTitle}\n\n${postContent}`;
        } else if (postTitle) {
          fullContent = postTitle; // 只有标题的情况
          Utils.log('只翻译标题，没有内容');
        }
        
        // 显示翻译部分
        const translationSection = document.getElementById('translation-section');
        if (translationSection) {
          translationSection.style.display = 'block';
        }
        
        // 获取翻译内容元素
        const translationContentElement = document.getElementById('translation-content');
        if (translationContentElement) {
          translationContentElement.textContent = '正在翻译并解释...';
          
          // 调用翻译函数
          ApiService.translateAndExplainContent(fullContent, translationContentElement);
        }
      });
    }
    
    // 短暂延迟后向评论添加 zjm 按钮
    setTimeout(addZjmButtonsToComments, 1000);
    
    // 延迟后重试，处理动态加载的内容
    setTimeout(() => {
      Utils.log('延迟后重试内容提取...');
      const retryData = DomExtractor.extractPostContent();
      
      // 如果重试获取到更好的数据，则更新
      if (postTitleElement && retryData.title && (!title || retryData.title.length > title.length)) {
        postTitleElement.textContent = retryData.title;
        Utils.log('延迟后更新了标题');
      }
      
      if (postContentElement && retryData.content && (!content || retryData.content.length > content.length)) {
        postContentElement.textContent = retryData.content;
        Utils.log('延迟后更新了内容');
      }
      
      // 更新分析数据
      const commentCountElement = document.getElementById('comment-count');
      const upvoteRatioElement = document.getElementById('upvote-ratio');
      
      if (commentCountElement || upvoteRatioElement) {
        const analytics = DomExtractor.getPostAnalytics();
        
        if (commentCountElement) {
          commentCountElement.textContent = analytics.commentCount;
        }
        
        if (upvoteRatioElement) {
          upvoteRatioElement.textContent = analytics.upvoteRatio;
        }
      }
    }, 2000);
  }
  
  /**
   * 设置列表页交互
   */
  function setupListingPageInteractions() {
    // 为过滤复选框添加事件监听器
    const filterCheckboxes = document.querySelectorAll('.filter-options input[type="checkbox"]');
    filterCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', function() {
        Utils.log(`过滤器已更改: ${this.id} = ${this.checked}`);
        // 在实际扩展中，您会在这里过滤 Reddit 信息流
      });
    });
    
    // 为排序下拉菜单添加事件监听器
    const sortDropdown = document.getElementById('sort-options');
    if (sortDropdown) {
      sortDropdown.addEventListener('change', function() {
        Utils.log(`排序已更改为: ${this.value}`);
        // 在实际扩展中，您会在这里更改排序顺序
      });
    }
  }
  
  /**
   * 向评论添加 zjm 按钮
   */
  function addZjmButtonsToComments() {
    if (!Utils.isPostDetailPage()) return;
    
    Utils.log('向评论添加 zjm 按钮...');
    
    // 查找评论
    const comments = DomExtractor.findComments();
    
    // 向每个评论添加 zjm 按钮
    comments.forEach((comment, index) => {
      // 检查按钮是否已存在
      if (comment.querySelector('.zjm-button')) return;
      
      // 查找插入按钮的好位置
      let insertTarget = null;
      
      // 尝试不同的插入目标
      const possibleTargets = [
        comment.querySelector('div[data-testid="comment-top-meta"]'),
        comment.querySelector('.tagline'),
        comment.querySelector('.entry'),
        comment
      ];
      
      for (const target of possibleTargets) {
        if (target) {
          insertTarget = target;
          break;
        }
      }
      
      if (!insertTarget) return;
      
      // 创建 zjm 按钮
      const zjmButton = document.createElement('button');
      zjmButton.className = 'zjm-button';
      zjmButton.textContent = 'zjm';
      zjmButton.dataset.commentIndex = index;
      
      // 确保文本内容可见
      zjmButton.style.display = 'inline-block';
      zjmButton.style.minWidth = '30px';
      zjmButton.style.textAlign = 'center';
      zjmButton.style.fontWeight = 'bold';
      
      // 添加点击事件监听器
      zjmButton.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // 提取评论内容
        const commentContent = DomExtractor.extractCommentContent(comment);
        
        // 使用评论内容更新侧边栏
        const commentContentElement = document.getElementById('comment-content');
        if (commentContentElement && commentContent) {
          commentContentElement.textContent = commentContent;
          
          // 显示评论翻译部分
          const commentTranslationSection = document.getElementById('comment-translation-section');
          if (commentTranslationSection) {
            commentTranslationSection.style.display = 'block';
          }
          
          // 获取评论翻译内容元素
          const commentTranslationElement = document.getElementById('comment-translation-content');
          if (commentTranslationElement) {
            commentTranslationElement.textContent = '正在翻译评论...';
            
            // 调用翻译函数
            ApiService.translateAndExplainContent(commentContent, commentTranslationElement);
          }
        }
      });
      
      // 创建回复建议按钮
      const suggestButton = document.createElement('button');
      suggestButton.className = 'suggest-button';
      suggestButton.textContent = 'Reply Suggestions';
      suggestButton.dataset.commentIndex = index;
      
      // 确保文本内容可见
      suggestButton.style.display = 'inline-block';
      suggestButton.style.minWidth = '110px';
      suggestButton.style.textAlign = 'center';
      suggestButton.style.fontWeight = 'bold';
      
      // 为回复建议添加点击事件监听器
      suggestButton.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // 获取原始帖子内容
        const { title, content } = DomExtractor.extractPostContent();
        
        // 组合标题和内容，处理只有标题没有内容的情况
        let originalPost = '';
        if (title && content && content.trim() !== '' && content !== '帖子没有内容') {
          originalPost = `${title}\n\n${content}`;
        } else if (title) {
          originalPost = title; // 只有标题的情况
          Utils.log('只使用标题生成回复建议，没有内容');
        } else {
          originalPost = '无标题无内容的帖子';
        }
        
        // 获取评论内容（如果回复评论）
        const commentContent = DomExtractor.extractCommentContent(comment);
        
        // 获取 subreddit
        const subreddit = DomExtractor.extractSubreddit() || '';
        
        // 获取额外要求（从存储中获取，不为评论添加单独的输入框）
        Settings.loadSettings(function(settings) {
          const additionalReqs = settings.additionalRequirements || '';
          // 生成回复建议
          ApiService.generateReplySuggestion(originalPost, commentContent, subreddit, comment, additionalReqs);
        });
      });
      
      // 插入按钮
      if (insertTarget.firstChild) {
        insertTarget.insertBefore(suggestButton, insertTarget.firstChild);
        insertTarget.insertBefore(zjmButton, insertTarget.firstChild);
      } else {
        insertTarget.appendChild(zjmButton);
        insertTarget.appendChild(suggestButton);
      }
    });
  }
  
  /**
   * 处理 URL 变化
   */
  function handleUrlChange() {
    // 移除现有侧边栏（如果存在）
    if (sidebarElement) {
      sidebarElement.remove();
      sidebarElement = null;
    }
    
    // 创建新侧边栏，使用适当的样式
    createSidebar();
  }
  
  // 公开 API
  return {
    createSidebar: createSidebar,
    updatePostDetailData: updatePostDetailData,
    addZjmButtonsToComments: addZjmButtonsToComments,
    handleUrlChange: handleUrlChange
  };
})();
