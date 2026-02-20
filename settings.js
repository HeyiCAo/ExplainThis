// settings.js
document.addEventListener('DOMContentLoaded', function() {
  const apiKeyInput = document.getElementById('apiKey');
  const saveBtn = document.getElementById('saveBtn');
  const testBtn = document.getElementById('testBtn');
  const statusDiv = document.getElementById('status');
  const closeBtn = document.getElementById('closeBtn');

  chrome.storage.local.get(['apiKey', 'usageCount', 'todayUsage', 'lastUsageDate'], (result) => {
    if (result.apiKey) apiKeyInput.value = result.apiKey;
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
    if (!apiKey) return showStatus('Please enter API key', 'error');
    if (!apiKey.startsWith('sk-')) return showStatus('Invalid API key format. Should start with "sk-" ', 'error');

    showStatus('Testing connection...', 'info');
    const isValid = await testApiKey(apiKey);
    if (isValid) {
      chrome.storage.local.set({ apiKey }, () => showStatus('Success!', 'success'));
    } else {
      showStatus('Invalid API key. Try again later.', 'error');
    }
  });

  testBtn.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) return showStatus('请输入API密钥', 'error');
    showStatus('Testing connection...', 'info');
    const isValid = await testApiKey(apiKey);
    if (isValid) showStatus('Success!', 'success');
    else showStatus('Connection failed. Please check API key.', 'error');
  });

  closeBtn.addEventListener('click', () => window.close());

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
});