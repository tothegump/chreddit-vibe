/**
 * 工具函数
 */

// 命名空间
window.RedditSidebarTool = window.RedditSidebarTool || {};

// 工具函数
window.RedditSidebarTool.Utils = {
  /**
   * 判断当前是否在帖子详情页
   * @returns {boolean} 是否在帖子详情页
   */
  isPostDetailPage: function() {
    // 检查URL是否包含/comments/，这表示是帖子详情页
    return window.location.pathname.includes('/comments/');
  },

  /**
   * 安全地获取DOM元素
   * @param {string} selector - CSS选择器
   * @param {Element} [parent=document] - 父元素，默认为document
   * @returns {Element|null} 找到的元素或null
   */
  safeQuerySelector: function(selector, parent = document) {
    try {
      return parent.querySelector(selector);
    } catch (e) {
      console.error('Error selecting element:', selector, e);
      return null;
    }
  },

  /**
   * 安全地获取多个DOM元素
   * @param {string} selector - CSS选择器
   * @param {Element} [parent=document] - 父元素，默认为document
   * @returns {NodeList|[]} 找到的元素列表或空数组
   */
  safeQuerySelectorAll: function(selector, parent = document) {
    try {
      return parent.querySelectorAll(selector);
    } catch (e) {
      console.error('Error selecting elements:', selector, e);
      return [];
    }
  },

  /**
   * 创建DOM元素并设置属性
   * @param {string} tag - 标签名
   * @param {Object} [attributes={}] - 属性对象
   * @param {string} [textContent=''] - 文本内容
   * @param {string} [innerHTML=''] - HTML内容
   * @returns {Element} 创建的元素
   */
  createElement: function(tag, attributes = {}, textContent = '', innerHTML = '') {
    const element = document.createElement(tag);
    
    // 设置属性
    for (const [key, value] of Object.entries(attributes)) {
      if (key === 'className') {
        element.className = value;
      } else {
        element.setAttribute(key, value);
      }
    }
    
    // 设置文本内容
    if (textContent) {
      element.textContent = textContent;
    }
    
    // 设置HTML内容
    if (innerHTML) {
      element.innerHTML = innerHTML;
    }
    
    return element;
  },

  /**
   * 防抖函数
   * @param {Function} func - 要执行的函数
   * @param {number} wait - 等待时间（毫秒）
   * @returns {Function} 防抖后的函数
   */
  debounce: function(func, wait) {
    let timeout;
    return function(...args) {
      const context = this;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), wait);
    };
  },

  /**
   * 节流函数
   * @param {Function} func - 要执行的函数
   * @param {number} limit - 限制时间（毫秒）
   * @returns {Function} 节流后的函数
   */
  throttle: function(func, limit) {
    let inThrottle;
    return function(...args) {
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  /**
   * 日志函数
   * @param {string} message - 日志消息
   * @param {*} [data] - 附加数据
   * @param {string} [level='log'] - 日志级别
   */
  log: function(message, data, level = 'log') {
    const prefix = '[Reddit Sidebar Tool]';
    
    switch (level) {
      case 'error':
        console.error(prefix, message, data);
        break;
      case 'warn':
        console.warn(prefix, message, data);
        break;
      case 'info':
        console.info(prefix, message, data);
        break;
      default:
        console.log(prefix, message, data);
    }
  }
};
