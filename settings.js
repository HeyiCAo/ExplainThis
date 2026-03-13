// settings.js
document.addEventListener('DOMContentLoaded', function() {
  const apiKeyInput = document.getElementById('apiKey');
  const saveBtn = document.getElementById('saveBtn');
  const testBtn = document.getElementById('testBtn');
  const statusDiv = document.getElementById('status');
  const closeBtn = document.getElementById('closeBtn');
  const langZh = document.getElementById('langZh');
  const langEn = document.getElementById('langEn');
  let currentUiLanguage = 'zh';

  const i18n = {
    zh: {
      settings_title: '设置',
      api_config: 'API 配置',
      api_info_title: '需要 DeepSeek API Key',
      api_info_body: '1. 访问 <a href="https://platform.deepseek.com/" target="_blank">DeepSeek</a> 注册<br>2. 进入 “API Keys” 页面创建新密钥<br>3. 粘贴到下方输入框<br>',
      api_key_label: 'API Key：',
      api_key_placeholder: 'sk-...',
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

  chrome.storage.local.get(['apiKey', 'usageCount', 'todayUsage', 'lastUsageDate', 'uiLanguage'], (result) => {
    if (result.apiKey) apiKeyInput.value = result.apiKey;
    if (result.uiLanguage) currentUiLanguage = result.uiLanguage;
    applyI18n(currentUiLanguage);
    document.getElementById('totalUsage').textContent = result.usageCount || 0;
    const today = new Date().toDateString();
    if (result.lastUsageDate === today) {
      document.getElementById('todayUsage').textContent = result.todayUsage || 0;
    } else {
      document.getElementById('todayUsage').textContent = 0;
    }
  });

  saveBtn.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) return showStatus(getText('status_enter_key'), 'error');
    if (!apiKey.startsWith('sk-')) return showStatus(getText('status_invalid_key'), 'error');

    showStatus(getText('status_testing'), 'info');
    const isValid = await testApiKey(apiKey);
    if (isValid) {
      chrome.storage.local.set({ apiKey }, () => showStatus(getText('status_success'), 'success'));
    } else {
      showStatus(getText('status_invalid_retry'), 'error');
    }
  });

  testBtn.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) return showStatus(getText('status_enter_key'), 'error');
    showStatus(getText('status_testing'), 'info');
    const isValid = await testApiKey(apiKey);
    if (isValid) showStatus(getText('status_success'), 'success');
    else showStatus(getText('status_conn_failed'), 'error');
  });

  closeBtn.addEventListener('click', () => window.close());

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

  async function testApiKey(apiKey) {
    try {
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
