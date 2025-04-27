/**
 * 设置管理模块
 * 负责处理设置的加载和保存
 */

// 命名空间
window.RedditSidebarTool = window.RedditSidebarTool || {};

// 设置管理
window.RedditSidebarTool.Settings = (function() {
  // 私有变量
  const Constants = window.RedditSidebarTool.Constants;
  const Utils = window.RedditSidebarTool.Utils;
  
  // 设置数据
  let settings = {
    openRouterApiKey: '',
    promptTemplate: Constants.DEFAULT_PROMPT_TEMPLATE,
    translationPrompt: Constants.DEFAULT_TRANSLATION_PROMPT,
    additionalRequirements: ''
  };
  
  /**
   * 加载所有设置
   * @param {Function} callback - 加载完成后的回调函数
   */
  function loadSettings(callback) {
    const keys = Object.values(Constants.STORAGE_KEYS);
    
    chrome.storage.local.get(keys, function(result) {
      if (result[Constants.STORAGE_KEYS.API_KEY]) {
        settings.openRouterApiKey = result[Constants.STORAGE_KEYS.API_KEY];
      }
      
      if (result[Constants.STORAGE_KEYS.PROMPT_TEMPLATE]) {
        settings.promptTemplate = result[Constants.STORAGE_KEYS.PROMPT_TEMPLATE];
      }
      
      if (result[Constants.STORAGE_KEYS.TRANSLATION_PROMPT]) {
        settings.translationPrompt = result[Constants.STORAGE_KEYS.TRANSLATION_PROMPT];
      }
      
      if (result[Constants.STORAGE_KEYS.ADDITIONAL_REQUIREMENTS]) {
        settings.additionalRequirements = result[Constants.STORAGE_KEYS.ADDITIONAL_REQUIREMENTS];
      }
      
      Utils.log('Settings loaded', settings);
      
      if (typeof callback === 'function') {
        callback(settings);
      }
    });
  }
  
  /**
   * 保存设置
   * @param {string} key - 设置键名
   * @param {*} value - 设置值
   * @param {Function} [callback] - 保存完成后的回调函数
   */
  function saveSetting(key, value, callback) {
    const data = {};
    data[key] = value;
    
    chrome.storage.local.set(data, function() {
      // 更新本地设置
      settings[key] = value;
      
      Utils.log(`Setting saved: ${key}`, value);
      
      if (typeof callback === 'function') {
        callback();
      }
    });
  }
  
  /**
   * 获取设置值
   * @param {string} key - 设置键名
   * @returns {*} 设置值
   */
  function getSetting(key) {
    return settings[key];
  }
  
  /**
   * 设置API密钥
   * @param {string} apiKey - API密钥
   * @param {Function} [callback] - 保存完成后的回调函数
   */
  function setApiKey(apiKey, callback) {
    saveSetting(Constants.STORAGE_KEYS.API_KEY, apiKey, callback);
  }
  
  /**
   * 设置提示模板
   * @param {string} template - 提示模板
   * @param {Function} [callback] - 保存完成后的回调函数
   */
  function setPromptTemplate(template, callback) {
    saveSetting(Constants.STORAGE_KEYS.PROMPT_TEMPLATE, template, callback);
  }
  
  /**
   * 设置翻译提示模板
   * @param {string} template - 翻译提示模板
   * @param {Function} [callback] - 保存完成后的回调函数
   */
  function setTranslationPrompt(template, callback) {
    saveSetting(Constants.STORAGE_KEYS.TRANSLATION_PROMPT, template, callback);
  }
  
  /**
   * 设置额外要求
   * @param {string} requirements - 额外要求
   * @param {Function} [callback] - 保存完成后的回调函数
   */
  function setAdditionalRequirements(requirements, callback) {
    saveSetting(Constants.STORAGE_KEYS.ADDITIONAL_REQUIREMENTS, requirements, callback);
  }
  
  /**
   * 设置事件监听器
   */
  function setupEventListeners() {
    // 保存API密钥
    document.addEventListener('click', function(e) {
      if (e.target && e.target.id === 'save-api-key') {
        const apiKeyInput = document.getElementById('openrouter-api-key');
        if (apiKeyInput && apiKeyInput.value.trim()) {
          setApiKey(apiKeyInput.value.trim(), function() {
            alert('API密钥保存成功！');
          });
        } else {
          alert('请输入有效的API密钥。');
        }
      }
    });
    
    // 保存提示模板
    document.addEventListener('click', function(e) {
      if (e.target && e.target.id === 'save-prompt-template') {
        const templateInput = document.getElementById('prompt-template');
        if (templateInput && templateInput.value.trim()) {
          setPromptTemplate(templateInput.value.trim(), function() {
            alert('提示模板保存成功！');
          });
        } else {
          alert('请输入有效的提示模板。');
        }
      }
    });
    
    // 保存额外要求（从主帖输入框）
    document.addEventListener('click', function(e) {
      if (e.target && e.target.id === 'main-post-suggest-button') {
        const requirementsInput = document.getElementById('main-post-additional-requirements');
        if (requirementsInput && requirementsInput.value.trim()) {
          setAdditionalRequirements(requirementsInput.value.trim());
        }
      }
    });
  }
  
  // 公开API
  return {
    loadSettings: loadSettings,
    getSetting: getSetting,
    setApiKey: setApiKey,
    setPromptTemplate: setPromptTemplate,
    setTranslationPrompt: setTranslationPrompt,
    setAdditionalRequirements: setAdditionalRequirements,
    setupEventListeners: setupEventListeners
  };
})();
