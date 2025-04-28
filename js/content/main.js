/**
 * 主入口文件
 * 负责初始化和协调各个模块
 */

// 立即执行函数表达式 (IIFE)
(function() {
  'use strict';
  
  // 获取各个模块的引用
  const Constants = window.RedditSidebarTool.Constants;
  const Utils = window.RedditSidebarTool.Utils;
  const Settings = window.RedditSidebarTool.Settings;
  const DomExtractor = window.RedditSidebarTool.DomExtractor;
  const ApiService = window.RedditSidebarTool.ApiService;
  const Sidebar = window.RedditSidebarTool.Sidebar;
  
  /**
   * 初始化扩展
   */
  function initialize() {
    // 检查是否在 Reddit
    if (!window.location.hostname.includes('reddit.com')) {
      Utils.log('不在 Reddit 网站上，退出初始化', null, 'info');
      return;
    }
    
    Utils.log('初始化 Reddit Sidebar Tool...', null, 'info');
    
    // 加载设置
    Settings.loadSettings(function() {
      // 创建侧边栏
      Sidebar.createSidebar();
      
      // 设置事件监听器
      setupEventListeners();
      
      Utils.log('Reddit Sidebar Tool 初始化完成', null, 'info');
    });
  }
  
  /**
   * 设置事件监听器
   */
  function setupEventListeners() {
    // 设置设置相关的事件监听器
    Settings.setupEventListeners();
    
    // 设置 MutationObserver 来检测 URL 变化（Reddit 是单页应用）
    let lastUrl = location.href;
    new MutationObserver(() => {
      const url = location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        Utils.log('URL 已更改，更新侧边栏', null, 'info');
        Sidebar.handleUrlChange();
      }
    }).observe(document, {subtree: true, childList: true});
    
    // 设置另一个 MutationObserver 来检测新评论的加载
    const commentObserver = new MutationObserver((mutations) => {
      if (Utils.isPostDetailPage()) {
        // 检查是否有任何突变可能添加了新评论
        const shouldAddButtons = mutations.some(mutation => {
          return mutation.addedNodes.length > 0 || 
                 (mutation.target && mutation.target.tagName && 
                  (mutation.target.tagName.toLowerCase() === 'shreddit-comment' || 
                   mutation.target.classList.contains('comment')));
        });
        
        if (shouldAddButtons) {
          Sidebar.addExtractButtonsToComments();
        }
      }
    });
    
    // 开始观察评论变化
    commentObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  
  // 启动扩展
  initialize();
})();
