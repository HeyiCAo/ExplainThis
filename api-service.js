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
    const speed = options.speed || 'fast';
    const isFast = speed === 'fast';
    const languageHint = language === 'en' ? 'Use English for the entire response.' : '请全程使用中文回答。';
    const systemHeader = isFast
      ? (language === 'en'
        ? 'You are a concise explainer. Reply with 1 line summary and up to 2 bullets. No examples.'
        : '你是精简解释助手。只要一句话总结 + 不超过2个要点。不要给例子。')
      : '你是一个专业的解释助手。请用简单易懂的语言解释用户输入的内容。';
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
              content: `${systemHeader}
              ${!isFast ? `格式要求：
              1. 第一行用一句话总结
              2. 然后分点详细解释
              3. 最后给出相关例子` : ''}
              ${languageHint}`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: isFast ? 180 : 900,
          temperature: isFast ? 0.1 : 0.4
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
    const html = explanation
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>')
      .replace(/📌/g, '<span style="color: #4da3ff;">📌</span>')
      .replace(/💡/g, '<span style="color: #ffaa00;">💡</span>');
    return this.renderMath(html);
  }

  renderMath(html) {
    let out = html;
    out = out.replace(/\\\[((?:.|\n)*?)\\\]/g, (match, content) => {
      return `<div class="math-display">${this.latexToHtml(content)}</div>`;
    });
    out = out.replace(/\\\((.*?)\\\)/g, (match, content) => {
      return `<span class="math-inline">${this.latexToHtml(content)}</span>`;
    });
    return out;
  }

  latexToHtml(latex) {
    if (!latex) return '';
    let s = latex;
    s = s.replace(/\\Delta/g, 'Δ')
      .replace(/\\to/g, '→')
      .replace(/\\infty/g, '∞')
      .replace(/\\cdot/g, '·')
      .replace(/\\times/g, '×')
      .replace(/\\leq/g, '≤')
      .replace(/\\geq/g, '≥');

    // frac
    for (let i = 0; i < 3; i += 1) {
      s = s.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, (m, a, b) => {
        return `<span class="frac"><span class="num">${a}</span><span class="den">${b}</span></span>`;
      });
    }

    // subscripts and superscripts
    s = s.replace(/_({[^}]+}|[^\s^_])/g, (m) => {
      const val = m.slice(1).replace(/^\{|\}$/g, '');
      return `<sub>${val}</sub>`;
    });
    s = s.replace(/\^({[^}]+}|[^\s^_])/g, (m) => {
      const val = m.slice(1).replace(/^\{|\}$/g, '');
      return `<sup>${val}</sup>`;
    });

    // lim with subscript: \lim_{...}
    s = s.replace(/\\lim<sub>(.*?)<\/sub>/g, (m, sub) => {
      return `<span class="op">lim</span><sub>${sub}</sub>`;
    });
    s = s.replace(/\\lim/g, '<span class="op">lim</span>');

    return s;
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
