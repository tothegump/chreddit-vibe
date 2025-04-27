/**
 * API 服务模块
 * 负责处理与 OpenRouter API 的交互
 */

// 命名空间
window.RedditSidebarTool = window.RedditSidebarTool || {};

// API 服务
window.RedditSidebarTool.ApiService = (function() {
  // 私有变量
  const Constants = window.RedditSidebarTool.Constants;
  const Utils = window.RedditSidebarTool.Utils;
  const Settings = window.RedditSidebarTool.Settings;
  
  /**
   * 生成回复建议
   * @param {string} originalPost - 原始帖子内容
   * @param {string|null} replyContent - 回复内容（如果有）
   * @param {string} subreddit - 子版块名称
   * @param {Element} container - 显示建议的容器元素
   * @param {string} [customRequirements=''] - 自定义要求
   */
  function generateReplySuggestion(originalPost, replyContent, subreddit, container, customRequirements = '') {
    // 获取 API 密钥
    const apiKey = Settings.getSetting('openRouterApiKey');
    if (!apiKey) {
      alert('请在侧边栏设置中输入您的OpenRouter API密钥。');
      return;
    }
    
    // 获取提示模板
    const template = Settings.getSetting('promptTemplate');
    
    // 获取额外要求（优先使用自定义要求）
    const requirements = customRequirements || Settings.getSetting('additionalRequirements') || '';
    
    // 创建建议容器
    let suggestionContainer;
    if (container.classList.contains('reply-suggestion-container')) {
      suggestionContainer = container;
    } else {
      // 检查是否已经存在回复建议容器
      suggestionContainer = container.querySelector('.reply-suggestion-container');
      
      // 如果不存在，创建一个新的
      if (!suggestionContainer) {
        suggestionContainer = Utils.createElement('div', {
          className: 'reply-suggestion-container'
        });
        
        // 将容器添加到评论或帖子内容下方
        container.appendChild(suggestionContainer);
      }
    }
    
    // 显示加载状态
    suggestionContainer.innerHTML = '<div class="suggestion-header">回复建议（AI生成）：</div><div class="suggestion-loading">正在生成回复建议...</div>';
    
    // 获取加载指示器元素
    const loadingIndicator = suggestionContainer.querySelector('.suggestion-loading');
    
    // 创建选项容器（将在加载完成后显示）
    const optionsContainer = Utils.createElement('div', {
      className: 'options-container',
      style: 'display: none;' // 初始隐藏
    });
    
    // 替换模板变量
    const processedTemplate = template
      .replace(/{{originalPost}}/g, originalPost || '')
      .replace(/{{replyContent}}/g, replyContent || '')
      .replace(/{{subreddit}}/g, subreddit || '')
      .replace(/{{additionalRequirements}}/g, requirements || '');
    
    // 调用 OpenRouter API
    const url = Constants.API.OPENROUTER_URL;
    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };
    
    const payload = {
      'model': Constants.API.DEFAULT_MODEL,
      'messages': [
        {'role': 'user', 'content': processedTemplate}
      ],
      'stream': true
    };
    
    // 添加标题（已经包含在加载提示中，不需要额外添加）
    
    // 创建三个选项元素（将由流填充）
    const optionElements = [];
    for (let i = 1; i <= 3; i++) {
      const optionWrapper = Utils.createElement('div', {
        className: 'option-wrapper'
      });
      
      const optionNumber = Utils.createElement('div', {
        className: 'option-number',
        textContent: `选项 ${i}`
      });
      optionWrapper.appendChild(optionNumber);
      
      const optionContent = Utils.createElement('div', {
        className: 'option-content',
        'data-option-number': i
      });
      optionWrapper.appendChild(optionContent);
      
      const copyOptionButton = Utils.createElement('button', {
        className: 'copy-option-button',
        textContent: '复制',
        'data-option-number': i
      });
      
      copyOptionButton.addEventListener('click', function() {
        const text = optionContent.textContent;
        navigator.clipboard.writeText(text).then(() => {
          copyOptionButton.textContent = '已复制！';
          setTimeout(() => {
            copyOptionButton.textContent = '复制';
          }, 2000);
        });
      });
      
      optionWrapper.appendChild(copyOptionButton);
      
      optionsContainer.appendChild(optionWrapper);
      optionElements.push(optionContent);
    }
    
    // 将选项容器添加到主容器（但保持隐藏状态）
    suggestionContainer.appendChild(optionsContainer);
    
    // 添加调试信息显示区域，在正式发布时可以移除
    const debugInfo = Utils.createElement('div', {
      className: 'debug-info',
      style: 'font-size: 10px; color: #999; margin-top: 5px; display: none;' // 默认隐藏
    });
    suggestionContainer.appendChild(debugInfo);
    
    // 创建关闭按钮
    const closeButton = Utils.createElement('button', {
      className: 'close-suggestion-button',
      textContent: '×'
    });
    
    closeButton.addEventListener('click', function() {
      suggestionContainer.remove();
    });
    
    suggestionContainer.appendChild(closeButton);
    
    // 流式获取响应
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
        
        // 处理完整行
        let lines = buffer.split('\n');
        buffer = lines.pop(); // 保留最后一个不完整的行
        
        // 变量来跟踪完整响应和选项解析
        let fullContent = '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.substring(6);
            if (data === '[DONE]') {
              // 流完成
              // 流式内容完成后，解析选项并显示
              parseAndDisplayOptions(fullContent, optionElements);
              return;
            }
            
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0].delta.content;
              if (content) {
                fullContent += content;
                
                // 直接在加载指示器中显示流式内容
                if (loadingIndicator) {
                  // 替换"正在生成回复建议..."的文本
                  if (loadingIndicator.textContent === '正在生成回复建议...') {
                    loadingIndicator.textContent = content;
                  } else {
                    loadingIndicator.textContent += content;
                  }
                }
              }
            } catch (e) {
              Utils.log('解析流数据时出错:', e, 'error');
            }
          }
        }
        
        // 继续读取
        return reader.read().then(processStream);
      }
      
      return reader.read().then(processStream);
    })
    .catch(error => {
      Utils.log('调用 OpenRouter API 时出错:', error, 'error');
      suggestionContainer.innerHTML = `<div class="suggestion-error">错误: ${error.message}</div>`;
    });
    
    /**
     * 解析选项并显示
     * @param {string} content - API 返回的内容
     * @param {Array} optionElements - 选项元素数组
     */
    function parseAndDisplayOptions(content, optionElements) {
      try {
        // 获取加载指示器与选项容器
        const loadingIndicator = suggestionContainer.querySelector('.suggestion-loading');
        const optionsContainerElement = suggestionContainer.querySelector('.options-container');
        
        // 更新调试信息
        const debugInfo = suggestionContainer.querySelector('.debug-info');
        
        // 先检查是否有纯文本内容（非JSON格式）
        if (content.trim() && !content.includes('{') && !content.includes('}')) {
          // 可能是纯文本回复，直接显示在第一个选项中
          if (optionElements.length > 0) {
            // 移除加载指示器
            if (loadingIndicator) {
              // 在加载指示器的位置上显示选项容器
              if (optionsContainerElement) {
                optionsContainerElement.style.display = 'block';
                loadingIndicator.parentNode.insertBefore(optionsContainerElement, loadingIndicator);
              }
              loadingIndicator.remove();
            }
            
            // 更新第一个选项
            const optionNumber = optionElements[0].parentNode.querySelector('.option-number');
            if (optionNumber) {
              optionNumber.textContent = '回复建议';
            }
            optionElements[0].textContent = content.trim();
            
            // 隐藏其他选项
            for (let i = 1; i < optionElements.length; i++) {
              const wrapper = optionElements[i].parentNode;
              if (wrapper) {
                wrapper.style.display = 'none';
              }
            }
            
            return; // 已经处理完成，不需要继续JSON解析
          }
        }
        
        // 尝试在内容中查找有效的JSON对象
        // 这在流式响应中有点棘手，所以我们需要小心
        let jsonStartIndex = content.indexOf('{');
        let jsonEndIndex = content.lastIndexOf('}');
        
        // 确保我们同时有开括号和闭括号
        if (jsonStartIndex !== -1 && jsonEndIndex !== -1 && jsonEndIndex > jsonStartIndex) {
          // 提取JSON子字符串
          let jsonStr = content.substring(jsonStartIndex, jsonEndIndex + 1);
          
          try {
            // 尝试解析JSON
            const data = JSON.parse(jsonStr);
            
            // 检查是否有选项数组
            if (data.options && Array.isArray(data.options)) {
              // 将加载指示器替换为选项容器
              if (loadingIndicator) {
                // 在加载指示器的位置上插入选项容器
                if (optionsContainerElement) {
                  optionsContainerElement.style.display = 'block';
                  loadingIndicator.parentNode.insertBefore(optionsContainerElement, loadingIndicator);
                }
                loadingIndicator.remove();
              }
              
              // 使用内容更新选项元素
              data.options.forEach((option, index) => {
                if (index < optionElements.length && option.content) {
                  // 显示该选项的容器
                  const wrapper = optionElements[index].parentNode;
                  if (wrapper) {
                    wrapper.style.display = 'block';
                  }
                  
                  // 使用类型更新选项编号
                  const optionNumber = wrapper.querySelector('.option-number');
                  if (optionNumber) {
                    let typeLabel = '';
                    switch(option.type) {
                      case 'thoughtful':
                        typeLabel = '详细回复';
                        break;
                      case 'concise':
                        typeLabel = '简洁回复';
                        break;
                      case 'friendly':
                        typeLabel = '友好回复';
                        break;
                      default:
                        typeLabel = `选项 ${index + 1}`;
                    }
                    optionNumber.textContent = typeLabel;
                  }
                  
                  // 更新内容
                  optionElements[index].textContent = option.content;
                }
              });
            } else if (data.content) {
              // 如果返回的是单个内容而不是选项数组
              // 将加载指示器替换为选项容器
              if (loadingIndicator) {
                // 在加载指示器的位置上插入选项容器
                if (optionsContainerElement) {
                  optionsContainerElement.style.display = 'block';
                  loadingIndicator.parentNode.insertBefore(optionsContainerElement, loadingIndicator);
                }
                loadingIndicator.remove();
              }
              
              // 只显示第一个选项
              if (optionElements.length > 0) {
                const optionNumber = optionElements[0].parentNode.querySelector('.option-number');
                if (optionNumber) {
                  optionNumber.textContent = '回复建议';
                }
                optionElements[0].textContent = data.content;
                
                // 隐藏其他选项
                for (let i = 1; i < optionElements.length; i++) {
                  const wrapper = optionElements[i].parentNode;
                  if (wrapper) {
                    wrapper.style.display = 'none';
                  }
                }
              }
            }
          } catch (e) {
            // 如果JSON解析失败，它可能不完整 - 对于流式传输来说这是可以的
            Utils.log('收到部分JSON，等待更多数据...', e);
            
            // 如果已经收到大量数据但仍然无法解析，尝试将其作为纯文本处理
            if (content.length > 500 && optionElements.length > 0) {
              if (loadingIndicator) {
                // 移除加载指示器
                loadingIndicator.remove();
              }
              
              // 清理内容中的JSON标记
              let cleanContent = content.replace(/[{}"]"|"options":|"type":|"content":|"thoughtful":|"concise":|"friendly":/g, '');
              cleanContent = cleanContent.replace(/\[|\]|,/g, '');
              
              // 更新第一个选项
              if (optionElements.length > 0) {
                const optionNumber = optionElements[0].parentNode.querySelector('.option-number');
                if (optionNumber) {
                  optionNumber.textContent = '回复建议';
                }
                optionElements[0].textContent = cleanContent.trim();
                
                // 隐藏其他选项
                for (let i = 1; i < optionElements.length; i++) {
                  const wrapper = optionElements[i].parentNode;
                  if (wrapper) {
                    wrapper.style.display = 'none';
                  }
                }
              }
            }
          }
        }
      } catch (e) {
        Utils.log('解析选项时出错:', e, 'error');
        
        // 如果解析失败，尝试显示原始内容
        if (content && content.trim()) {
          // 将加载指示器替换为选项容器
          const loadingIndicator = suggestionContainer.querySelector('.suggestion-loading');
          if (loadingIndicator) {
            // 在加载指示器的位置上插入选项容器
            const optionsContainerElement = suggestionContainer.querySelector('.options-container');
            if (optionsContainerElement) {
              optionsContainerElement.style.display = 'block';
              loadingIndicator.parentNode.insertBefore(optionsContainerElement, loadingIndicator);
            }
            loadingIndicator.remove();
          }
          
          if (optionElements.length > 0) {
            const optionNumber = optionElements[0].parentNode.querySelector('.option-number');
            if (optionNumber) {
              optionNumber.textContent = '回复建议';
            }
            optionElements[0].textContent = content.trim();
            
            // 隐藏其他选项
            for (let i = 1; i < optionElements.length; i++) {
              const wrapper = optionElements[i].parentNode;
              if (wrapper) {
                wrapper.style.display = 'none';
              }
            }
          }
        }
      }
    }
  }
  
  /**
   * 翻译并解释内容
   * @param {string} content - 要翻译的内容
   * @param {Element} outputElement - 输出元素
   */
  function translateAndExplainContent(content, outputElement) {
    // 检查是否有API密钥
    const apiKey = Settings.getSetting('openRouterApiKey');
    if (!apiKey) {
      alert('请在侧边栏设置中输入您的OpenRouter API密钥。');
      return;
    }
    
    // 获取翻译提示模板
    const translationPrompt = Settings.getSetting('translationPrompt');
    
    // 替换模板变量
    const processedPrompt = translationPrompt.replace(/{{content}}/g, content || '');
    
    // 调用OpenRouter API
    const url = Constants.API.OPENROUTER_URL;
    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };
    
    const payload = {
      'model': Constants.API.DEFAULT_MODEL,
      'messages': [
        {'role': 'user', 'content': processedPrompt}
      ],
      'stream': true
    };
    
    // 流式获取响应
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
        
        // 处理完整行
        let lines = buffer.split('\n');
        buffer = lines.pop(); // 保留最后一个不完整的行
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.substring(6);
            if (data === '[DONE]') {
              // 流完成
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
              Utils.log('解析流数据时出错:', e, 'error');
            }
          }
        }
        
        // 继续读取
        return reader.read().then(processStream);
      }
      
      return reader.read().then(processStream);
    })
    .catch(error => {
      Utils.log('调用OpenRouter API时出错:', error, 'error');
      if (outputElement) {
        outputElement.textContent = `翻译错误: ${error.message}`;
      }
    });
  }
  
  // 公开API
  return {
    generateReplySuggestion: generateReplySuggestion,
    translateAndExplainContent: translateAndExplainContent
  };
})();
