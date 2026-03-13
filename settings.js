// settings.js
document.addEventListener('DOMContentLoaded', function() {
  const apiKeyInput = document.getElementById('apiKey');
  const geminiApiKeyInput = document.getElementById('geminiApiKey');
  const providerToggle = document.getElementById('providerToggle');
  const providerMenu = document.getElementById('providerMenu');
  const geminiInfoBox = document.getElementById('geminiInfoBox');
  const deepseekInfoBox = document.getElementById('deepseekInfoBox');
  const saveBtn = document.getElementById('saveBtn');
  const testBtn = document.getElementById('testBtn');
  const statusDiv = document.getElementById('status');
  const closeBtn = document.getElementById('closeBtn');
  const langZh = document.getElementById('langZh');
  const langEn = document.getElementById('langEn');
  let currentUiLanguage = 'zh';
  let currentProvider = 'deepseek';

  const i18n = {
    zh: {
      settings_title: '设置',
      api_config: 'API 配置',
      api_info_title: '需要 DeepSeek API Key',
      api_info_body: '1. 访问 <a href="https://platform.deepseek.com/" target="_blank">DeepSeek</a> 注册<br>2. 进入 “API Keys” 页面创建新密钥<br>3. 粘贴到下方输入框<br>',
      api_key_label: 'API Key：',
      api_key_placeholder: 'sk-...',
      provider_label: '服务商：',
      gemini_info_title: '需要 Gemini API Key',
      gemini_info_body: '1. 访问 <a href="https://aistudio.google.com/" target="_blank">Google AI Studio</a> 获取 API Key<br>2. 粘贴到下方输入框<br>',
      gemini_key_label: 'Gemini API Key：',
      gemini_key_placeholder: 'AIza...',
      save_key: '保存密钥',
      test_conn: '测试连接',
      usage_stats: '使用统计',
      time_used_today: '今日使用次数：',
      cumulative_usage: '累计使用次数：',
      credit_remaining: '剩余额度：',
      hotkeys: '快捷键',
      explain_selected: '解释选中文本：',
      quick_submission: '快速提交：',
      close: '关闭',
      status_enter_key: '请输入API密钥',
      status_invalid_key: '密钥格式无效，应以“sk-”开头',
      status_testing: '正在测试连接...',
      status_success: '连接成功！',
      status_invalid_retry: '密钥无效，请重试',
      status_conn_failed: '连接失败，请检查密钥'
    },
    en: {
      settings_title: 'Settings',
      api_config: 'API Configurations',
      api_info_title: 'DeepSeek API Key Required',
      api_info_body: '1. Visit <a href="https://platform.deepseek.com/" target="_blank">DeepSeek</a> to register<br>2. Navigate to the "API Keys" page to create new keys<br>3. Paste the key below<br>',
      api_key_label: 'API Key:',
      api_key_placeholder: 'sk-...',
      provider_label: 'Provider:',
      gemini_info_title: 'Gemini API Key Required',
      gemini_info_body: '1. Visit <a href="https://aistudio.google.com/" target="_blank">Google AI Studio</a> to get an API key<br>2. Paste the key below<br>',
      gemini_key_label: 'Gemini API Key:',
      gemini_key_placeholder: 'AIza...',
      save_key: 'Save Key',
      test_conn: 'Test Connection',
      usage_stats: 'Usage Statistics',
      time_used_today: 'Time used today:',
      cumulative_usage: 'Cumulative usage:',
      credit_remaining: 'Credit remaining:',
      hotkeys: 'Hotkeys',
      explain_selected: 'Explain selected:',
      quick_submission: 'Quick submission:',
      close: 'Close',
      status_enter_key: 'Please enter API key',
      status_invalid_key: 'Invalid API key format. Should start with "sk-"',
      status_testing: 'Testing connection...',
      status_success: 'Success!',
      status_invalid_retry: 'Invalid API key. Try again later.',
      status_conn_failed: 'Connection failed. Please check API key.'
    }
  };

  chrome.storage.local.get(['apiKey', 'geminiApiKey', 'provider', 'usageCount', 'todayUsage', 'lastUsageDate', 'uiLanguage'], (result) => {
    if (result.apiKey) apiKeyInput.value = result.apiKey;
    if (result.geminiApiKey && geminiApiKeyInput) geminiApiKeyInput.value = result.geminiApiKey;
    currentProvider = result.provider || 'deepseek';
    if (result.uiLanguage) currentUiLanguage = result.uiLanguage;
    applyI18n(currentUiLanguage);
    updateProviderUI();
    updateProviderMenu();
    document.getElementById('totalUsage').textContent = result.usageCount || 0;
    const today = new Date().toDateString();
    if (result.lastUsageDate === today) {
      document.getElementById('todayUsage').textContent = result.todayUsage || 0;
    } else {
      document.getElementById('todayUsage').textContent = 0;
    }
  });

  saveBtn.addEventListener('click', async () => {
    const provider = currentProvider || 'deepseek';
    const apiKey = apiKeyInput.value.trim();
    const geminiKey = geminiApiKeyInput ? geminiApiKeyInput.value.trim() : '';
    if (provider === 'deepseek') {
      if (!apiKey) return showStatus(getText('status_enter_key'), 'error');
      if (!apiKey.startsWith('sk-')) return showStatus(getText('status_invalid_key'), 'error');
    } else {
      if (!geminiKey) return showStatus(getText('status_enter_key'), 'error');
    }

    showStatus(getText('status_testing'), 'info');
    const isValid = await testApiKey(provider, provider === 'deepseek' ? apiKey : geminiKey);
    if (isValid) {
      chrome.storage.local.set({ apiKey, geminiApiKey: geminiKey, provider }, () => showStatus(getText('status_success'), 'success'));
    } else {
      showStatus(getText('status_invalid_retry'), 'error');
    }
  });

  testBtn.addEventListener('click', async () => {
    const provider = currentProvider || 'deepseek';
    const apiKey = apiKeyInput.value.trim();
    const geminiKey = geminiApiKeyInput ? geminiApiKeyInput.value.trim() : '';
    if (provider === 'deepseek') {
      if (!apiKey) return showStatus(getText('status_enter_key'), 'error');
    } else {
      if (!geminiKey) return showStatus(getText('status_enter_key'), 'error');
    }
    showStatus(getText('status_testing'), 'info');
    const isValid = await testApiKey(provider, provider === 'deepseek' ? apiKey : geminiKey);
    if (isValid) showStatus(getText('status_success'), 'success');
    else showStatus(getText('status_conn_failed'), 'error');
  });

  closeBtn.addEventListener('click', () => window.close());

  if (providerToggle && providerMenu) {
    providerToggle.addEventListener('click', (event) => {
      event.stopPropagation();
      const isOpen = providerMenu.classList.contains('open');
      providerMenu.classList.toggle('open', !isOpen);
      providerToggle.setAttribute('aria-expanded', String(!isOpen));
    });
    providerMenu.addEventListener('click', (event) => {
      const item = event.target.closest('.provider-item');
      if (!item) return;
      currentProvider = item.dataset.value || 'deepseek';
      updateProviderUI();
      updateProviderMenu();
      chrome.storage.local.set({ provider: currentProvider });
      providerMenu.classList.remove('open');
      providerToggle.setAttribute('aria-expanded', 'false');
    });
    document.addEventListener('click', () => {
      providerMenu.classList.remove('open');
      providerToggle.setAttribute('aria-expanded', 'false');
    });
  }

  if (langZh && langEn) {
    langZh.addEventListener('click', () => {
      currentUiLanguage = 'zh';
      applyI18n(currentUiLanguage);
      chrome.storage.local.set({ uiLanguage: currentUiLanguage, explainLang: currentUiLanguage });
    });
    langEn.addEventListener('click', () => {
      currentUiLanguage = 'en';
      applyI18n(currentUiLanguage);
      chrome.storage.local.set({ uiLanguage: currentUiLanguage, explainLang: currentUiLanguage });
    });
  }

  async function testApiKey(provider, apiKey) {
    try {
      if (provider === 'gemini') {
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
          headers: { 'x-goog-api-key': apiKey }
        });
        return response.ok;
      }
      const response = await fetch('https://api.deepseek.com/v1/models', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      return response.ok;
    } catch (error) {
      console.error('测试失败：', error);
      return false;
    }
  }

  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
  }

  function updateProviderUI() {
    const showGemini = currentProvider === 'gemini';
    const deepseekLabel = document.querySelector('label[for="apiKey"]');
    if (deepseekLabel) deepseekLabel.style.display = showGemini ? 'none' : 'block';
    if (apiKeyInput) apiKeyInput.style.display = showGemini ? 'none' : 'block';
    if (deepseekInfoBox) deepseekInfoBox.style.display = showGemini ? 'none' : 'block';
    if (geminiInfoBox) geminiInfoBox.style.display = showGemini ? 'block' : 'none';
    if (geminiApiKeyInput) geminiApiKeyInput.style.display = showGemini ? 'block' : 'none';
    const geminiLabel = document.querySelector('label[for="geminiApiKey"]');
    if (geminiLabel) geminiLabel.style.display = showGemini ? 'block' : 'none';
  }

  function updateProviderMenu() {
    if (!providerToggle || !providerMenu) return;
    const label = currentProvider === 'gemini' ? 'Gemini' : 'DeepSeek';
    const textNode = providerToggle.childNodes[0];
    if (textNode) textNode.nodeValue = label;
    providerMenu.querySelectorAll('.provider-item').forEach((item) => {
      item.classList.toggle('active', item.dataset.value === currentProvider);
    });
  }

  function applyI18n(lang) {
    const map = i18n[lang] || i18n.zh;
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (map[key]) el.textContent = map[key];
    });
    document.querySelectorAll('[data-i18n-html]').forEach((el) => {
      const key = el.getAttribute('data-i18n-html');
      if (map[key]) el.innerHTML = map[key];
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (map[key]) el.setAttribute('placeholder', map[key]);
    });
    if (langZh && langEn) {
      langZh.classList.toggle('active', lang === 'zh');
      langEn.classList.toggle('active', lang === 'en');
    }
  }

  function getText(key) {
    const map = i18n[currentUiLanguage] || i18n.zh;
    return map[key] || '';
  }
});
