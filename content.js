// Main content script that runs when Reddit is loaded
(function() {
  'use strict';

  // Check if we're on Reddit
  if (!window.location.hostname.includes('reddit.com')) {
    return;
  }
  
  // Default API key and prompt template
  let openRouterApiKey = '';
  let promptTemplate = `You are a helpful assistant providing suggestions for a Reddit reply. 
Original post: {{originalPost}}
{{#if replyContent}}Reply to: {{replyContent}}{{/if}}

Provide a thoughtful, engaging response that's appropriate for the subreddit. Be concise but comprehensive.`;
  
  // Translation prompt template
  let translationPrompt = `请将以下英文内容翻译成中文，并在翻译后添加一个简短的解释，帮助理解内容的背景和要点：

{{content}}

请按照以下格式回复：

## 中文翻译
[翻译内容]

## 简要解释
[解释内容]`;
  
  // Load saved API key and prompt template from storage
  chrome.storage.local.get(['openRouterApiKey', 'promptTemplate'], function(result) {
    if (result.openRouterApiKey) {
      openRouterApiKey = result.openRouterApiKey;
    }
    if (result.promptTemplate) {
      promptTemplate = result.promptTemplate;
    }
  });

  // Function to determine if we're on a post detail page
  function isPostDetailPage() {
    // Check if URL contains /comments/ which indicates a post detail page
    return window.location.pathname.includes('/comments/');
  }
  
  // Function to extract the current subreddit/channel
  function extractSubreddit() {
    let subreddit = null;
    
    // Try to extract from URL first
    const urlMatch = window.location.pathname.match(/\/r\/([^/]+)/);
    if (urlMatch && urlMatch[1]) {
      subreddit = urlMatch[1];
    }
    
    // If not found in URL, try to find it in the DOM
    if (!subreddit) {
      // Try different selectors for subreddit name
      const subredditSelectors = [
        'a[href^="/r/"]',
        'a[data-testid="subreddit-link"]',
        'a.subreddit',
        'shreddit-subreddit-header'
      ];
      
      for (const selector of subredditSelectors) {
        try {
          const element = document.querySelector(selector);
          if (element && element.textContent) {
            // Extract subreddit name from text content or href
            if (element.href) {
              const hrefMatch = element.href.match(/\/r\/([^/]+)/);
              if (hrefMatch && hrefMatch[1]) {
                subreddit = hrefMatch[1];
                break;
              }
            } else {
              // Try to extract from text content
              const textMatch = element.textContent.match(/r\/([^\s]+)/);
              if (textMatch && textMatch[1]) {
                subreddit = textMatch[1];
                break;
              } else if (element.textContent.trim()) {
                // Just use the text if it doesn't follow r/ format
                subreddit = element.textContent.trim();
                break;
              }
            }
          }
        } catch (e) {
          console.error('Error extracting subreddit with selector:', selector, e);
        }
      }
    }
    
    return subreddit;
  }

  // Function to create and inject the sidebar
  function createSidebar() {
    // Create sidebar container
    const sidebar = document.createElement('div');
    sidebar.id = 'reddit-sidebar-tool';
    
    // Set the appropriate class based on page type
    if (isPostDetailPage()) {
      sidebar.className = 'reddit-sidebar-tool post-detail-style';
    } else {
      sidebar.className = 'reddit-sidebar-tool listing-style';
    }

    // Create header
    const header = document.createElement('div');
    header.className = 'sidebar-header';
    header.innerHTML = '<h2>Reddit Sidebar Tool</h2>';
    
    // Create content area
    const content = document.createElement('div');
    content.className = 'sidebar-content';
    
    // Add different content based on page type
    if (isPostDetailPage()) {
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
              <p>Available variables: {{originalPost}}, {{replyContent}}, {{subreddit}}</p>
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
    
    // Create footer
    const footer = document.createElement('div');
    footer.className = 'sidebar-footer';
    footer.innerHTML = '<p>© 2025 Reddit Sidebar Tool</p>';
    
    // Add close button
    const closeButton = document.createElement('button');
    closeButton.className = 'sidebar-close-button';
    closeButton.textContent = '×';
    closeButton.addEventListener('click', function() {
      sidebar.classList.toggle('collapsed');
    });
    
    // Assemble sidebar
    sidebar.appendChild(closeButton);
    sidebar.appendChild(header);
    sidebar.appendChild(content);
    sidebar.appendChild(footer);
    
    // Add to page
    document.body.appendChild(sidebar);
    
    // Update data if on post detail page
    if (isPostDetailPage()) {
      updatePostDetailData();
    }
    
    // Add event listeners for filter and sort options if on listing page
    if (!isPostDetailPage()) {
      setupListingPageInteractions();
    }
  }
  
  // Function to extract post title and content
  function extractPostContent() {
    console.log('Extracting post content from Reddit page...');
    
    // Different selectors to try for post title (Reddit's DOM structure can vary)
    const titleSelectors = [
      'h1[slot="title"]',
      'h1.Post__title',
      'h1[data-testid="post-title"]',
      'div[data-test-id="post-content"] h1',
      'div[data-adclicklocation="title"] h1',
      'div.title h1',
      'shreddit-title',
      'h1'
    ];
    
    // Different selectors to try for post content (Reddit's DOM structure can vary)
    const contentSelectors = [
      // New Reddit selectors
      'div[data-click-id="text"]',
      'div[data-testid="post-content"]',
      'shreddit-post div[slot="text-body"]',
      'div[data-adclicklocation="post_content"]',
      // Old Reddit selectors
      'div.usertext-body div.md',
      'div.expando div.usertext-body',
      'div.expando div.md',
      // Generic fallbacks
      'div.post-content',
      'article'
    ];
    
    let postTitle = null;
    let postContent = null;
    
    // Try each title selector until we find one that works
    for (const selector of titleSelectors) {
      try {
        const titleElement = document.querySelector(selector);
        if (titleElement && titleElement.textContent.trim()) {
          postTitle = titleElement.textContent.trim();
          console.log('Found post title using selector:', selector);
          break;
        }
      } catch (e) {
        console.error('Error with title selector:', selector, e);
      }
    }
    
    // Try each content selector until we find one that works
    for (const selector of contentSelectors) {
      try {
        const contentElement = document.querySelector(selector);
        if (contentElement && contentElement.textContent.trim()) {
          postContent = contentElement.textContent.trim();
          console.log('Found post content using selector:', selector);
          break;
        }
      } catch (e) {
        console.error('Error with content selector:', selector, e);
      }
    }
    
    // Fallback method: Try to find any paragraphs within the post area
    if (!postContent) {
      try {
        // Look for main content area and extract paragraphs
        const mainContent = document.querySelector('main');
        if (mainContent) {
          const paragraphs = mainContent.querySelectorAll('p');
          if (paragraphs && paragraphs.length > 0) {
            // Combine paragraphs into content
            const contentArray = [];
            paragraphs.forEach(p => {
              if (p.textContent.trim().length > 20) { // Only include substantial paragraphs
                contentArray.push(p.textContent.trim());
              }
            });
            
            if (contentArray.length > 0) {
              postContent = contentArray.join('\n\n');
              console.log('Found post content using paragraph fallback method');
            }
          }
        }
      } catch (e) {
        console.error('Error with paragraph fallback method:', e);
      }
    }
    
    // Debug output
    console.log('Extraction results:', { 
      titleFound: !!postTitle, 
      contentFound: !!postContent,
      titleLength: postTitle ? postTitle.length : 0,
      contentLength: postContent ? postContent.length : 0
    });
    
    return { title: postTitle, content: postContent };
  }
  
  // Function to update post detail data
  function updatePostDetailData() {
    console.log('Updating post detail data in sidebar...');
    
    // Initial attempt to extract post content
    let { title, content } = extractPostContent();
    
    // Update the sidebar with post title and content
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
      if (content) {
        postContentElement.textContent = content;
      } else {
        postContentElement.textContent = '无法获取内容';
      }
    }
    
    // Add click event listener for main post suggestion button
    if (mainPostSuggestButton) {
      mainPostSuggestButton.addEventListener('click', function() {
        const originalPost = `${title || ''}
${content || ''}`;
        const subreddit = extractSubreddit() || '';
        
        // Create a container for the suggestion in the sidebar
        const commentContentElement = document.getElementById('comment-content');
        if (commentContentElement) {
          commentContentElement.textContent = '正在生成回复建议...';
          
          // Generate reply suggestion for main post
          generateMainPostReplySuggestion(originalPost, subreddit);
        }
      });
    }
    
    // Extract and display subreddit name
    const subredditElement = document.getElementById('subreddit-name');
    if (subredditElement) {
      const subreddit = extractSubreddit();
      if (subreddit) {
        subredditElement.textContent = subreddit;
      } else {
        subredditElement.textContent = 'Unknown';
      }
    }
    
    // Load saved API key and prompt template into form fields
    chrome.storage.local.get(['openRouterApiKey', 'promptTemplate', 'translationPrompt'], function(result) {
      const apiKeyInput = document.getElementById('openrouter-api-key');
      const promptTemplateInput = document.getElementById('prompt-template');
      
      if (apiKeyInput && result.openRouterApiKey) {
        apiKeyInput.value = result.openRouterApiKey;
      }
      
      if (promptTemplateInput && result.promptTemplate) {
        promptTemplateInput.value = result.promptTemplate;
      } else if (promptTemplateInput) {
        promptTemplateInput.value = promptTemplate;
      }
      
      // Update translation prompt if saved
      if (result.translationPrompt) {
        translationPrompt = result.translationPrompt;
      }
    });
    
    // Add click event listener for translate button
    const translateButton = document.getElementById('translate-post-button');
    if (translateButton) {
      translateButton.addEventListener('click', function() {
        // Get post title and content
        const postTitle = postTitleElement ? postTitleElement.textContent : '';
        const postContent = postContentElement ? postContentElement.textContent : '';
        
        if (!postTitle && !postContent) {
          alert('无法获取帖子内容进行翻译。');
          return;
        }
        
        // Combine title and content
        const fullContent = `${postTitle}\n\n${postContent}`;
        
        // Show translation section
        const translationSection = document.getElementById('translation-section');
        if (translationSection) {
          translationSection.style.display = 'block';
        }
        
        // Get translation content element
        const translationContentElement = document.getElementById('translation-content');
        if (translationContentElement) {
          translationContentElement.textContent = '正在翻译并解释...';
          
          // Call translation function
          translateAndExplainContent(fullContent, translationContentElement);
        }
      });
    }
    
    // Add zjm buttons to comments after a short delay
    setTimeout(addZjmButtonsToComments, 1000);
    
    // Try again after a delay to handle dynamic content loading
    setTimeout(() => {
      console.log('Retrying content extraction after delay...');
      const retryData = extractPostContent();
      
      // Update if we got better data on retry
      if (postTitleElement && retryData.title && (!title || retryData.title.length > title.length)) {
        postTitleElement.textContent = retryData.title;
        console.log('Updated title after retry');
      }
      
      if (postContentElement && retryData.content && (!content || retryData.content.length > content.length)) {
        postContentElement.textContent = retryData.content;
        console.log('Updated content after retry');
      }
      
      // Update analytics data
      const commentCountElement = document.getElementById('comment-count');
      const upvoteRatioElement = document.getElementById('upvote-ratio');
      
      if (commentCountElement) {
        // Try to get actual comment count from page
        const commentCountText = document.querySelector('span[data-testid="comment-count"]')?.textContent;
        commentCountElement.textContent = commentCountText || 'Unknown';
      }
      
      if (upvoteRatioElement) {
        // Try to get upvote ratio from page
        const upvoteText = document.querySelector('div[data-testid="post-upvote-ratio"]')?.textContent;
        upvoteRatioElement.textContent = upvoteText || 'Unknown';
      }
    }, 2000);
  }
  
  // Function to setup listing page interactions
  function setupListingPageInteractions() {
    // Add event listeners for filter checkboxes
    const filterCheckboxes = document.querySelectorAll('.filter-options input[type="checkbox"]');
    filterCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', function() {
        console.log(`Filter changed: ${this.id} = ${this.checked}`);
        // In a real extension, you would filter the Reddit feed here
      });
    });
    
    // Add event listener for sort dropdown
    const sortDropdown = document.getElementById('sort-options');
    if (sortDropdown) {
      sortDropdown.addEventListener('change', function() {
        console.log(`Sort changed to: ${this.value}`);
        // In a real extension, you would change the sort order here
      });
    }
  }
  
  // Function to handle URL changes (for single-page apps like Reddit)
  function handleUrlChange() {
    // Remove existing sidebar if present
    const existingSidebar = document.getElementById('reddit-sidebar-tool');
    if (existingSidebar) {
      existingSidebar.remove();
    }
    
    // Create new sidebar with appropriate style
    createSidebar();
  }
  
  // Function to add zjm buttons to comments
  function addZjmButtonsToComments() {
    if (!isPostDetailPage()) return;
    
    console.log('Adding zjm buttons to comments...');
    
    // Different selectors to try for comments (Reddit's DOM structure can vary)
    const commentSelectors = [
      // New Reddit selectors
      'shreddit-comment',
      'div[data-testid="comment"]',
      // Old Reddit selectors
      'div.comment',
      // Generic fallbacks
      'div.thing.comment'
    ];
    
    let comments = [];
    
    // Try each comment selector until we find one that works
    for (const selector of commentSelectors) {
      try {
        const foundComments = document.querySelectorAll(selector);
        if (foundComments && foundComments.length > 0) {
          comments = foundComments;
          console.log(`Found ${comments.length} comments using selector: ${selector}`);
          break;
        }
      } catch (e) {
        console.error('Error with comment selector:', selector, e);
      }
    }
    
    // Add zjm button to each comment
    comments.forEach((comment, index) => {
      // Check if button already exists
      if (comment.querySelector('.zjm-button')) return;
      
      // Find a good place to insert the button
      let insertTarget = null;
      
      // Try different targets for button insertion
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
      
      // Create zjm button
      const zjmButton = document.createElement('button');
      zjmButton.className = 'zjm-button';
      zjmButton.textContent = 'zjm';
      zjmButton.dataset.commentIndex = index;
      
      // Add click event listener
      zjmButton.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Extract comment content
        const commentContent = extractCommentContent(comment);
        
        // Update sidebar with comment content
        const commentContentElement = document.getElementById('comment-content');
        if (commentContentElement && commentContent) {
          commentContentElement.textContent = commentContent;
          
          // Show comment translation section
          const commentTranslationSection = document.getElementById('comment-translation-section');
          if (commentTranslationSection) {
            commentTranslationSection.style.display = 'block';
          }
          
          // Get comment translation content element
          const commentTranslationElement = document.getElementById('comment-translation-content');
          if (commentTranslationElement) {
            commentTranslationElement.textContent = '正在翻译评论...';
            
            // Call translation function
            translateAndExplainContent(commentContent, commentTranslationElement);
          }
        }
      });
      
      // Create reply suggestion button
      const suggestButton = document.createElement('button');
      suggestButton.className = 'suggest-button';
      suggestButton.textContent = 'Reply Suggestions';
      suggestButton.dataset.commentIndex = index;
      
      // Add click event listener for reply suggestion
      suggestButton.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Get original post content
        const { title, content } = extractPostContent();
        const originalPost = `${title}\n${content}`;
        
        // Get comment content if replying to a comment
        const commentContent = extractCommentContent(comment);
        
        // Get subreddit
        const subreddit = extractSubreddit() || '';
        
        // Generate reply suggestion
        generateReplySuggestion(originalPost, commentContent, subreddit, comment);
      });
      
      // Insert buttons
      if (insertTarget.firstChild) {
        insertTarget.insertBefore(suggestButton, insertTarget.firstChild);
        insertTarget.insertBefore(zjmButton, insertTarget.firstChild);
      } else {
        insertTarget.appendChild(zjmButton);
        insertTarget.appendChild(suggestButton);
      }
    });
  }
  
  // Function to extract comment content
  function extractCommentContent(commentElement) {
    if (!commentElement) return null;
    
    // Different selectors to try for comment content
    const contentSelectors = [
      // New Reddit selectors
      'div[data-testid="comment"] div[data-testid="comment-content"]',
      'div[slot="comment"]',
      'div[data-click-id="text"]',
      // Old Reddit selectors
      'div.usertext-body div.md',
      // Generic fallbacks
      'p',
      'div.md'
    ];
    
    let commentContent = null;
    
    // Try to find content within this specific comment
    for (const selector of contentSelectors) {
      try {
        const contentElement = commentElement.querySelector(selector);
        if (contentElement && contentElement.textContent.trim()) {
          commentContent = contentElement.textContent.trim();
          break;
        }
      } catch (e) {
        console.error('Error extracting comment content:', e);
      }
    }
    
    // If we couldn't find content with selectors, try to get all text from the comment
    if (!commentContent) {
      try {
        // Filter out the username, points, time, etc.
        const fullText = commentElement.textContent;
        // Simple heuristic: take text after common metadata patterns
        const contentMatch = fullText.match(/(?:points|ago|score hidden)\s*(.+)/s);
        if (contentMatch && contentMatch[1]) {
          commentContent = contentMatch[1].trim();
        } else {
          commentContent = fullText;
        }
      } catch (e) {
        console.error('Error with fallback comment extraction:', e);
      }
    }
    
    return commentContent;
  }
  
  // Function to translate and explain content
  function translateAndExplainContent(content, outputElement) {
    // Check if API key is available
    chrome.storage.local.get(['openRouterApiKey'], function(result) {
      const apiKey = result.openRouterApiKey;
      
      if (!apiKey) {
        alert('请在侧边栏设置中输入您的OpenRouter API密钥。');
        return;
      }
      
      // Replace template variables
      const processedPrompt = translationPrompt.replace(/{{content}}/g, content || '');
      
      // Call OpenRouter API
      const url = 'https://openrouter.ai/api/v1/chat/completions';
      const headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      };
      
      const payload = {
        'model': 'anthropic/claude-3-opus:beta',  // Default to Claude 3 Opus
        'messages': [
          {'role': 'user', 'content': processedPrompt}
        ],
        'stream': true
      };
      
      // Stream the response
      fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload)
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        let fullContent = '';
        
        function processStream({ done, value }) {
          if (done) {
            return;
          }
          
          buffer += decoder.decode(value, { stream: true });
          
          // Process complete lines
          let lines = buffer.split('\n');
          buffer = lines.pop(); // Keep the last incomplete line in the buffer
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.substring(6);
              if (data === '[DONE]') {
                // Stream completed
                return;
              }
              
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices[0].delta.content;
                if (content) {
                  fullContent += content;
                  if (outputElement) {
                    outputElement.textContent = fullContent;
                  }
                }
              } catch (e) {
                console.error('Error parsing streaming data:', e);
              }
            }
          }
          
          // Continue reading
          return reader.read().then(processStream);
        }
        
        return reader.read().then(processStream);
      })
      .catch(error => {
        console.error('Error calling OpenRouter API:', error);
        if (outputElement) {
          outputElement.textContent = `翻译错误: ${error.message}`;
        }
      });
    });
  }
  
  // Function to generate reply suggestions for main post
  function generateMainPostReplySuggestion(originalPost, subreddit) {
    // Check if API key is available
    chrome.storage.local.get(['openRouterApiKey', 'promptTemplate'], function(result) {
      const apiKey = result.openRouterApiKey;
      let template = result.promptTemplate || promptTemplate;
      
      if (!apiKey) {
        alert('请在侧边栏设置中输入您的OpenRouter API密钥。');
        return;
      }
      
      // Replace template variables
      const processedTemplate = template
        .replace(/{{originalPost}}/g, originalPost || '')
        .replace(/{{replyContent}}/g, '')
        .replace(/{{subreddit}}/g, subreddit || '');
      
      // Call OpenRouter API
      const url = 'https://openrouter.ai/api/v1/chat/completions';
      const headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      };
      
      const payload = {
        'model': 'anthropic/claude-3-opus:beta',  // Default to Claude 3 Opus
        'messages': [
          {'role': 'user', 'content': processedTemplate}
        ],
        'stream': true
      };
      
      // Get the comment content element
      const commentContentElement = document.getElementById('comment-content');
      
      // Stream the response
      fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload)
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        let fullContent = '';
        
        function processStream({ done, value }) {
          if (done) {
            return;
          }
          
          buffer += decoder.decode(value, { stream: true });
          
          // Process complete lines
          let lines = buffer.split('\n');
          buffer = lines.pop(); // Keep the last incomplete line in the buffer
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.substring(6);
              if (data === '[DONE]') {
                // Stream completed
                return;
              }
              
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices[0].delta.content;
                if (content) {
                  fullContent += content;
                  if (commentContentElement) {
                    commentContentElement.textContent = fullContent;
                  }
                }
              } catch (e) {
                console.error('Error parsing streaming data:', e);
              }
            }
          }
          
          // Continue reading
          return reader.read().then(processStream);
        }
        
        return reader.read().then(processStream);
      })
      .catch(error => {
        console.error('Error calling OpenRouter API:', error);
        if (commentContentElement) {
          commentContentElement.textContent = `错误: ${error.message}`;
        }
      });
    });
  }
  
  // Function to generate reply suggestions using OpenRouter API
  function generateReplySuggestion(originalPost, replyContent, subreddit, commentElement) {
    // Check if API key is available
    chrome.storage.local.get(['openRouterApiKey', 'promptTemplate'], function(result) {
      const apiKey = result.openRouterApiKey;
      let template = result.promptTemplate || promptTemplate;
      
      if (!apiKey) {
        alert('请在侧边栏设置中输入您的OpenRouter API密钥。');
        return;
      }
      
      // Create suggestion container if it doesn't exist
      let suggestionContainer = commentElement.querySelector('.reply-suggestion-container');
      if (!suggestionContainer) {
        suggestionContainer = document.createElement('div');
        suggestionContainer.className = 'reply-suggestion-container';
        
        // Find a good place to insert the suggestion container
        const possibleTargets = [
          commentElement.querySelector('.md'),
          commentElement.querySelector('div[data-testid="comment-content"]'),
          commentElement
        ];
        
        let insertTarget = null;
        for (const target of possibleTargets) {
          if (target) {
            insertTarget = target;
            break;
          }
        }
        
        if (!insertTarget) return;
        
        // Append after the target
        if (insertTarget.nextSibling) {
          insertTarget.parentNode.insertBefore(suggestionContainer, insertTarget.nextSibling);
        } else {
          insertTarget.parentNode.appendChild(suggestionContainer);
        }
      }
      
      // Show loading state
      suggestionContainer.innerHTML = '<div class="suggestion-loading">正在生成回复建议...</div>';
      
      // Replace template variables
      const processedTemplate = template
        .replace(/{{originalPost}}/g, originalPost || '')
        .replace(/{{replyContent}}/g, replyContent || '')
        .replace(/{{subreddit}}/g, subreddit || '');
      
      // Call OpenRouter API
      const url = 'https://openrouter.ai/api/v1/chat/completions';
      const headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      };
      
      const payload = {
        'model': 'anthropic/claude-3-opus:beta',  // Default to Claude 3 Opus
        'messages': [
          {'role': 'user', 'content': processedTemplate}
        ],
        'stream': true
      };
      
      // Create suggestion content element
      const suggestionContent = document.createElement('div');
      suggestionContent.className = 'suggestion-content';
      const suggestionHeader = document.createElement('div');
      suggestionHeader.className = 'suggestion-header';
      suggestionHeader.textContent = '回复建议（AI生成）：';
      suggestionContainer.innerHTML = '';
      suggestionContainer.appendChild(suggestionHeader);
      suggestionContainer.appendChild(suggestionContent);
      
      // Create copy button
      const copyButton = document.createElement('button');
      copyButton.className = 'copy-suggestion-button';
      copyButton.textContent = '复制';
      copyButton.addEventListener('click', function() {
        const text = suggestionContent.textContent;
        navigator.clipboard.writeText(text).then(() => {
          copyButton.textContent = '已复制！';
          setTimeout(() => {
            copyButton.textContent = '复制';
          }, 2000);
        });
      });
      suggestionContainer.appendChild(copyButton);
      
      // Create close button
      const closeButton = document.createElement('button');
      closeButton.className = 'close-suggestion-button';
      closeButton.textContent = '×';
      closeButton.addEventListener('click', function() {
        suggestionContainer.remove();
      });
      suggestionContainer.appendChild(closeButton);
      
      // Stream the response
      fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload)
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        
        function processStream({ done, value }) {
          if (done) {
            return;
          }
          
          buffer += decoder.decode(value, { stream: true });
          
          // Process complete lines
          let lines = buffer.split('\n');
          buffer = lines.pop(); // Keep the last incomplete line in the buffer
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.substring(6);
              if (data === '[DONE]') {
                // Stream completed
                return;
              }
              
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices[0].delta.content;
                if (content) {
                  suggestionContent.textContent += content;
                }
              } catch (e) {
                console.error('Error parsing streaming data:', e);
              }
            }
          }
          
          // Continue reading
          return reader.read().then(processStream);
        }
        
        return reader.read().then(processStream);
      })
      .catch(error => {
        console.error('Error calling OpenRouter API:', error);
        suggestionContainer.innerHTML = `<div class="suggestion-error">错误: ${error.message}</div>`;
      });
    });
  }
  
  // Function to set up event listeners for sidebar settings
  function setupSidebarEventListeners() {
    // Save API key
    const saveApiKeyButton = document.getElementById('save-api-key');
    if (saveApiKeyButton) {
      saveApiKeyButton.addEventListener('click', function() {
        const apiKeyInput = document.getElementById('openrouter-api-key');
        if (apiKeyInput && apiKeyInput.value.trim()) {
          chrome.storage.local.set({ 'openRouterApiKey': apiKeyInput.value.trim() }, function() {
            alert('API密钥保存成功！');
            openRouterApiKey = apiKeyInput.value.trim();
          });
        } else {
          alert('请输入有效的API密钥。');
        }
      });
    }
    
    // Save prompt template
    const saveTemplateButton = document.getElementById('save-prompt-template');
    if (saveTemplateButton) {
      saveTemplateButton.addEventListener('click', function() {
        const templateInput = document.getElementById('prompt-template');
        if (templateInput && templateInput.value.trim()) {
          chrome.storage.local.set({ 'promptTemplate': templateInput.value.trim() }, function() {
            alert('提示模板保存成功！');
            promptTemplate = templateInput.value.trim();
          });
        } else {
          alert('请输入有效的提示模板。');
        }
      });
    }
  }
  
  // Initial sidebar creation
  createSidebar();
  
  // Set up event listeners after sidebar is created
  setTimeout(setupSidebarEventListeners, 1000);
  
  // Set up a MutationObserver to detect URL changes (Reddit is a SPA)
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      handleUrlChange();
      setTimeout(setupSidebarEventListeners, 1000);
    }
  }).observe(document, {subtree: true, childList: true});
  
  // Set up another MutationObserver to detect new comments being loaded
  const commentObserver = new MutationObserver((mutations) => {
    if (isPostDetailPage()) {
      // Check if any mutations might have added new comments
      const shouldAddButtons = mutations.some(mutation => {
        return mutation.addedNodes.length > 0 || 
               (mutation.target && mutation.target.tagName && 
                (mutation.target.tagName.toLowerCase() === 'shreddit-comment' || 
                 mutation.target.classList.contains('comment')));
      });
      
      if (shouldAddButtons) {
        addZjmButtonsToComments();
      }
    }
  });
  
  // Start observing for comment changes
  commentObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
  
})();
