// popup.js - 主逻辑
let aiService = null;

async function initAIService() {
  if (aiService) return aiService;
  try {
    await new Promise((resolve, reject) => {
      if (window.AIService) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = 'api-service.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
    aiService = new AIService();
    console.log('✅ AI服务初始化成功');
    return aiService;
  } catch (error) {
    console.error('❌ AI服务初始化失败：', error);
    throw error;
  }
}

document.addEventListener('DOMContentLoaded', async function() {
  console.log('🚀 popup初始化...');

  const inputText = document.getElementById('inputText');
  const explainBtn = document.getElementById('explainBtn');
  const resultSection = document.getElementById('resultSection');
  const resultContent = document.getElementById('resultContent');
  const loading = document.getElementById('loading');
  const settingsBtn = document.getElementById('settingsBtn');

  if (!inputText || !explainBtn) {
    console.error('❌ 找不到必要的DOM元素');
    return;
  }

  // 检查API Key
  chrome.storage.local.get(['apiKey'], (result) => {
    if (!result.apiKey) {
      showResult(`
        <div style="background: #fff3cd; color: #856404; padding: 15px; border-radius: 8px;">
          <h4 style="margin:0 0 10px 0;">⚠️ 需要配置API密钥</h4>
          <p style="margin:0; font-size:13px;">
            1. 访问 deepseek.com 注册<br>
            2. 创建API Key<br>
            3. 点击右上角⚙️设置
          </p>
        </div>
      `);
    }
  });

  // 检查是否有选中的文字（带重试）
  function checkForSelectedText(retryCount = 0) {
    chrome.storage.local.get(['lastSelectedText', 'shouldAutoFill'], (result) => {
      console.log('📖 读取存储:', result);
      if (result.lastSelectedText && result.shouldAutoFill) {
        inputText.value = result.lastSelectedText;
        inputText.focus();
        inputText.select();
        chrome.storage.local.set({ shouldAutoFill: false }, () => {
          console.log('✅ 文字已填充并清除标记');
        });
        console.log('📝 自动填充文字:', result.lastSelectedText.substring(0, 30));
      } else if (retryCount < 3) {
        setTimeout(() => checkForSelectedText(retryCount + 1), 100);
      }
    });
  }
  checkForSelectedText();

  // 监听来自content.js的消息
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('📥 收到消息：', message);
    if (message.action === 'textSelected') {
      inputText.value = message.text;
      inputText.focus();
      inputText.select();
      sendResponse({ received: true });
    }
    return true;
  });

  // 解释按钮点击
  explainBtn.addEventListener('click', async function() {
    const text = inputText.value.trim();
    if (!text) {
      showResult('请输入要解释的内容');
      return;
    }

    loading.classList.remove('hidden');
    resultSection.classList.remove('hidden');
    resultContent.innerHTML = '<div style="text-align:center; padding:20px;">⏳ AI思考中...</div>';
    saveToHistory(text);

    try {
      const service = await initAIService();
      const apiKeyResult = await new Promise(resolve => {
        chrome.storage.local.get(['apiKey'], resolve);
      });
      if (!apiKeyResult.apiKey) {
        showResult(`
          <div style="background: #fff3cd; color: #856404; padding: 15px; border-radius: 8px;">
            <h4 style="margin:0 0 10px 0;">⚠️ 需要配置API密钥</h4>
            <p style="margin:0;">请先点击右上角⚙️设置API密钥</p>
          </div>
        `);
        loading.classList.add('hidden');
        return;
      }
      const explanation = await service.explainText(text, { detailLevel: 'detailed' });
      showResult(explanation);
      updateUsageStats();
    } catch (error) {
      console.error('AI解释失败：', error);

        let errorMessage = error.message;

        // 处理余额不足错误
        if (errorMessage.includes('402') || errorMessage.includes('Insufficient Balance')) {
          errorMessage = '⚠️ API 余额不足。请登录 <a href="https://platform.deepseek.com/" target="_blank">DeepSeek 控制台</a> 充值或检查免费额度。';
        } else if (errorMessage.includes('401') || errorMessage.includes('403')) {
          errorMessage = 'API密钥无效，请检查设置';
        } else if (errorMessage.includes('429')) {
          errorMessage = '请求过于频繁，请稍后再试';
        } else if (errorMessage.includes('Failed to fetch')) {
          errorMessage = '网络连接失败，请检查网络或代理设置';
        }

        showMockResult(text, errorMessage);
    } finally {
      loading.classList.add('hidden');
    }
  });

  // Ctrl+Enter快捷键
  inputText.addEventListener('keydown', function(event) {
    if (event.ctrlKey && event.key === 'Enter') {
      event.preventDefault();
      explainBtn.click();
    }
  });

  // Ctrl+E 获取选中文字
  document.addEventListener('keydown', async (e) => {
    if (e.ctrlKey && e.key === 'e') {
      e.preventDefault();
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      chrome.tabs.sendMessage(tab.id, { action: 'getSelectedText' }, (response) => {
        if (response && response.text) {
          inputText.value = response.text;
          inputText.focus();
          inputText.select();
        }
      });
    }
  });

  // 设置按钮
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      chrome.tabs.create({ url: 'settings.html' });
    });
  }

  function showResult(html) {
    resultContent.innerHTML = html;
  }

  function showMockResult(text, errorMsg = '') {
    const mockHtml = `
      <div style="color: #333; line-height: 1.6; padding: 15px;">
        <h4 style="margin-top: 0; color: #4da3ff;">📝 您查询的是：</h4>
        <p style="background: #f5f5f5; padding: 10px; border-radius: 5px;">${text}</p>
        <h4 style="color: #4da3ff; margin-top: 20px;">🤖 模拟解释：</h4>
        <p>这是"${text.substring(0, 30)}..."的模拟解释。</p>
        <p>连接真实AI后，会给出更详细、准确的答案。</p>
        ${errorMsg ? `<div style="margin-top: 20px; padding: 10px; background: #f8d7da; border-radius: 5px; color: #721c24;">⚠️ ${errorMsg}</div>` : ''}
        <div style="margin-top: 20px; padding: 10px; background: #e8f4ff; border-radius: 5px; font-size: 13px;">
          💡 提示：如果已配置API密钥但仍然看到此消息，请检查网络连接
        </div>
      </div>
    `;
    resultContent.innerHTML = mockHtml;
  }

  function saveToHistory(text) {
    chrome.storage.local.get(['history'], (result) => {
      const history = result.history || [];
      history.unshift({
        text: text.substring(0, 50),
        timestamp: new Date().toLocaleString()
      });
      if (history.length > 10) history.pop();
      chrome.storage.local.set({ history });
    });
  }

  function updateUsageStats() {
    chrome.storage.local.get(['usageCount'], (result) => {
      const count = (result.usageCount || 0) + 1;
      chrome.storage.local.set({ usageCount: count });
    });
  }
});