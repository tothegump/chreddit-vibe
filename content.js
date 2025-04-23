// Main content script that runs when Reddit is loaded
(function() {
  'use strict';

  // Check if we're on Reddit
  if (!window.location.hostname.includes('reddit.com')) {
    return;
  }

  // Function to determine if we're on a post detail page
  function isPostDetailPage() {
    // Check if URL contains /comments/ which indicates a post detail page
    return window.location.pathname.includes('/comments/');
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
          </div>
          <div class="tool-section">
            <h4>评论内容</h4>
            <div class="comment-content-container">
              <p id="comment-content">点击评论上的「zjm」按钮查看内容</p>
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
            <h4>Quick Actions</h4>
            <button class="action-button">Save Post</button>
            <button class="action-button">Share Post</button>
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
        }
      });
      
      // Insert button at the beginning of the target element
      if (insertTarget.firstChild) {
        insertTarget.insertBefore(zjmButton, insertTarget.firstChild);
      } else {
        insertTarget.appendChild(zjmButton);
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
  
  // Initial sidebar creation
  createSidebar();
  
  // Set up a MutationObserver to detect URL changes (Reddit is a SPA)
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      handleUrlChange();
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
