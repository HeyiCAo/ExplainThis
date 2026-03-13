// popup.js - 主逻辑
let aiService = null;

const RED = true;
const BLACK = false;

class RBNode {
  constructor(key, value, color) {
    this.key = key;
    this.value = value;
    this.color = color;
    this.left = null;
    this.right = null;
  }
}

class RBTree {
  constructor(compare) {
    this.root = null;
    this.compare = compare || ((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  }

  isRed(node) {
    return !!node && node.color === RED;
  }

  rotateLeft(h) {
    const x = h.right;
    h.right = x.left;
    x.left = h;
    x.color = h.color;
    h.color = RED;
    return x;
  }

  rotateRight(h) {
    const x = h.left;
    h.left = x.right;
    x.right = h;
    x.color = h.color;
    h.color = RED;
    return x;
  }

  flipColors(h) {
    h.color = !h.color;
    if (h.left) h.left.color = !h.left.color;
    if (h.right) h.right.color = !h.right.color;
  }

  get(key) {
    let x = this.root;
    while (x) {
      const cmp = this.compare(key, x.key);
      if (cmp === 0) return x.value;
      if (cmp < 0) x = x.left;
      else x = x.right;
    }
    return null;
  }

  put(key, value) {
    this.root = this._put(this.root, key, value);
    if (this.root) this.root.color = BLACK;
  }

  _put(h, key, value) {
    if (!h) return new RBNode(key, value, RED);
    const cmp = this.compare(key, h.key);
    if (cmp < 0) h.left = this._put(h.left, key, value);
    else if (cmp > 0) h.right = this._put(h.right, key, value);
    else h.value = value;

    if (this.isRed(h.right) && !this.isRed(h.left)) h = this.rotateLeft(h);
    if (this.isRed(h.left) && this.isRed(h.left.left)) h = this.rotateRight(h);
    if (this.isRed(h.left) && this.isRed(h.right)) this.flipColors(h);
    return h;
  }

  toArray() {
    const out = [];
    const walk = (node) => {
      if (!node) return;
      walk(node.left);
      out.push(node.value);
      walk(node.right);
    };
    walk(this.root);
    return out;
  }
}

let cacheTree = new RBTree();
let cacheList = [];
let historyList = [];

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
  const languageToggle = document.getElementById('languageToggle');
  const languageMenu = document.getElementById('languageMenu');
  const historySection = document.getElementById('historySection');
  const historyListEl = document.getElementById('historyList');
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');

  if (!inputText || !explainBtn) {
    console.error('❌ 找不到必要的DOM元素');
    return;
  }

  await loadCacheAndHistory();

  let currentLanguage = 'zh';
  if (languageToggle) {
    const storedLang = await getStorage(['explainLang']);
    if (storedLang.explainLang) {
      currentLanguage = storedLang.explainLang;
    }
    updateLanguageUI(currentLanguage);

    languageToggle.addEventListener('click', (event) => {
      event.stopPropagation();
      event.preventDefault();
      if (!languageMenu) return;
      const isOpen = languageMenu.classList.contains('open');
      languageMenu.classList.toggle('open', !isOpen);
      languageToggle.setAttribute('aria-expanded', String(!isOpen));
    });
  }

  if (languageMenu) {
    languageMenu.addEventListener('click', (event) => {
      event.stopPropagation();
      const item = event.target.closest('.lang-item');
      if (!item) return;
      const value = item.dataset.value || 'zh';
      currentLanguage = value;
      updateLanguageUI(currentLanguage);
      setStorage({ explainLang: currentLanguage });
      languageMenu.classList.remove('open');
      if (languageToggle) languageToggle.setAttribute('aria-expanded', 'false');
    });
  }

  document.addEventListener('click', () => {
    if (!languageMenu || !languageToggle) return;
    languageMenu.classList.remove('open');
    languageToggle.setAttribute('aria-expanded', 'false');
  });

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

    const language = currentLanguage || 'zh';
    const key = normalizeKey(text, language);
    let cached = cacheTree.get(key);
    if (!cached) {
      const legacyKey = normalizeKey(text);
      cached = cacheTree.get(legacyKey);
    }
    if (cached && cached.explanation) {
      showResult(cached.explanation);
      resultSection.classList.remove('hidden');
      if (cached.language) {
        currentLanguage = cached.language;
        updateLanguageUI(currentLanguage);
      }
      updateHistory(key, cached.text || text, currentLanguage);
      return;
    }

    loading.classList.remove('hidden');
    resultSection.classList.remove('hidden');
    resultContent.innerHTML = '<div style="text-align:center; padding:20px;">⏳ AI思考中...</div>';

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
      const explanation = await service.explainText(text, { detailLevel: 'detailed', language });
      showResult(explanation);
      upsertCache(key, text, explanation, language);
      updateHistory(key, text, language);
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
        updateHistory(key, text, language);
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

  if (historyListEl) {
    historyListEl.addEventListener('click', (event) => {
      const item = event.target.closest('.history-item');
      if (!item) return;
      const key = item.dataset.key;
      const termText = item.querySelector('.history-term')?.textContent || '';
      let cached = cacheTree.get(key);
      if (!cached) {
        cached = cacheTree.get(normalizeKey(termText));
      }
      const expandEl = item.querySelector('.history-expand');
      const langTag = item.dataset.lang || (cached && cached.language) || 'zh';

      Array.from(historyListEl.children).forEach((el) => {
        if (el !== item) el.classList.remove('expanded');
      });

      if (item.classList.contains('expanded')) {
        item.classList.remove('expanded');
        return;
      }

      inputText.value = cached?.text || termText;
      inputText.focus();
      currentLanguage = langTag;
      updateLanguageUI(currentLanguage);
      if (cached && cached.explanation) {
        expandEl.innerHTML = cached.explanation;
        showResult(cached.explanation);
        resultSection.classList.remove('hidden');
      } else {
        expandEl.innerHTML = '<em>暂无缓存，点击“✨ Ask AI”获取</em>';
      }
      item.classList.add('expanded');
    });
  }

  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', async () => {
      historyList = [];
      await setStorage({ history: historyList });
      renderHistory();
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

  function normalizeKey(text, language) {
    const base = text.trim();
    if (!language) return base;
    return `${base}::${language}`;
  }

  function escapeHtml(text) {
    const safeText = String(text ?? '');
    return safeText
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function buildTreeFromList(list) {
    const tree = new RBTree();
    list.forEach((entry) => {
      if (entry && entry.key) tree.put(entry.key, entry);
    });
    cacheTree = tree;
  }

  function updateHistory(key, text, language) {
    const timestamp = new Date().toLocaleString();
    historyList = historyList.filter((item) => item.key !== key);
    historyList.unshift({
      key,
      text: text.substring(0, 50),
      timestamp,
      language
    });
    if (historyList.length > 10) historyList = historyList.slice(0, 10);
    setStorage({ history: historyList });
    renderHistory();
  }

  function upsertCache(key, text, explanation, language) {
    const now = Date.now();
    const index = cacheList.findIndex((item) => item.key === key);
    if (index >= 0) {
      cacheList[index] = {
        ...cacheList[index],
        text: text.substring(0, 200),
        explanation,
        updatedAt: now,
        language
      };
    } else {
      cacheList.unshift({
        key,
        text: text.substring(0, 200),
        explanation,
        updatedAt: now,
        language
      });
    }
    if (cacheList.length > 100) cacheList = cacheList.slice(0, 100);
    buildTreeFromList(cacheList);
    setStorage({ explainCache: cacheList });
  }

  async function loadCacheAndHistory() {
    const result = await getStorage(['explainCache', 'history']);
    cacheList = result.explainCache || [];
    historyList = result.history || [];
    buildTreeFromList(cacheList);
    renderHistory();
  }

  function renderHistory() {
    if (!historySection || !historyListEl) return;
    if (!historyList.length) {
      historySection.classList.add('hidden');
      historyListEl.innerHTML = '';
      return;
    }
    historySection.classList.remove('hidden');
    const items = historyList.slice(0, 5);
    historyListEl.innerHTML = items.map((item) => {
      const lang = item.language || 'zh';
      const key = item.key || normalizeKey(item.text || '', lang);
      if (!key) return '';
      const safeText = escapeHtml(item.text || key);
      const safeTime = escapeHtml(item.timestamp || '');
      const safeLang = escapeHtml(lang.toUpperCase());
      return `
        <div class="history-item" data-key="${escapeHtml(key)}" data-lang="${escapeHtml(lang)}">
          <div class="history-item-row">
            <span class="history-term" title="${safeText}">${safeText}</span>
            <span class="history-lang">${safeLang}</span>
            <span class="history-time">${safeTime}</span>
          </div>
          <div class="history-expand">点击展开</div>
        </div>
      `;
    }).join('');
  }

  function getStorage(keys) {
    return new Promise((resolve) => chrome.storage.local.get(keys, resolve));
  }

  function setStorage(values) {
    return new Promise((resolve) => chrome.storage.local.set(values, resolve));
  }

  function updateLanguageUI(lang) {
    if (!languageToggle || !languageMenu) return;
    languageToggle.textContent = lang.toUpperCase();
    const items = languageMenu.querySelectorAll('.lang-item');
    items.forEach((item) => {
      item.classList.toggle('active', item.dataset.value === lang);
    });
  }

  function updateUsageStats() {
    chrome.storage.local.get(['usageCount'], (result) => {
      const count = (result.usageCount || 0) + 1;
      chrome.storage.local.set({ usageCount: count });
    });
  }
});
