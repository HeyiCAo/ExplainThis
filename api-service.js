// api-service.js
class AIService {
  constructor() {
    this.apiKey = null;
    this.baseURL = 'https://api.deepseek.com/v1';
    this.model = 'deepseek-chat';
  }

  async loadApiKey() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['apiKey'], (result) => {
        this.apiKey = result.apiKey || '';
        resolve(this.apiKey);
      });
    });
  }

  async saveApiKey(apiKey) {
    this.apiKey = apiKey;
    return new Promise((resolve) => {
      chrome.storage.local.set({ apiKey }, resolve);
    });
  }

  async explainText(text, options = {}) {
    await this.loadApiKey();
    if (!this.apiKey) throw new Error('Please set up an API key first');

    const prompt = this.buildPrompt(text, options);
    const language = options.language || 'zh';
    const languageHint = language === 'en' ? 'Use English for the entire response.' : '请全程使用中文回答。';
    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: `你是一个专业的解释助手。请用简单易懂的语言解释用户输入的内容。

              格式要求：
              1. 第一行用一句话总结
              2. 然后分点详细解释
              3. 最后给出相关例子
              4. ${languageHint}`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.45
        })
      });

      if (!response.ok) {
        let errorDetail = '';
        try {
          const errorData = await response.json();
          errorDetail = JSON.stringify(errorData);
        } catch {
          errorDetail = await response.text();
        }
        throw new Error(`API Call Failure (HTTP ${response.status}): ${errorDetail}`);
      }

      const data = await response.json();
      return this.formatExplanation(data.choices[0].message.content);
    } catch (error) {
      console.error('Error!：', error);
      throw error;
    }
  }

  buildPrompt(text, options) {
    const language = options.language || 'zh';
    const prefix = language === 'en' ? 'Explain:' : '请解释：';
    let prompt = `${prefix}${text}`;
    if (options.context) prompt += `\n上下文：${options.context}`;
    return prompt;
  }

  formatExplanation(explanation) {
    return explanation
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>')
      .replace(/📌/g, '<span style="color: #4da3ff;">📌</span>')
      .replace(/💡/g, '<span style="color: #ffaa00;">💡</span>');
  }

  async testApiKey(apiKey) {
    try {
      const response = await fetch(`${this.baseURL}/models`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
