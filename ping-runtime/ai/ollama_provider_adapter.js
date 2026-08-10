/**
 * Ollama Provider Adapter - Subordinate to Inference Authority (Node.js)
 * 
 * Constitutional Law: This is a PROVIDER ADAPTER, not an authority.
 * It is subordinate to InferenceAdapter.
 * 
 * This adapter provides Ollama-specific implementation.
 * Only InferenceAdapter may call this adapter.
 * No business logic may call this adapter directly.
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

class OllamaProviderAdapter {
  constructor(baseUrl, embeddingModel, chatModel) {
    this.baseUrl = baseUrl;
    this.embeddingModel = embeddingModel;
    this.chatModel = chatModel;
    
    // Create HTTP agent with connection pooling and keep-alive
    const parsedUrl = new URL(baseUrl);
    const isHttps = parsedUrl.protocol === 'https:';
    const AgentClass = isHttps ? https.Agent : http.Agent;
    
    this._httpAgent = new AgentClass({
      keepAlive: true,
      keepAliveMsecs: 1000,
      maxSockets: 10,
      maxFreeSockets: 5,
      timeout: 30000,
      scheduling: 'lifo'
    });
  }
  
  async embed(text) {
    try {
      const response = await fetch(`${this.baseUrl}/api/embeddings`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Connection': 'keep-alive'
        },
        body: JSON.stringify({
          model: this.embeddingModel,
          prompt: text
        }),
        // @ts-ignore - agent is not in standard fetch types but works in Node.js
        agent: this._httpAgent
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.embedding;
      } else {
        console.error(`Embedding failed: ${response.status}`);
        return null;
      }
    } catch (error) {
      console.error(`Embedding error: ${error.message}`);
      return null;
    }
  }
  
  async chat(messages, options = null) {
    try {
      const payload = {
        model: this.chatModel,
        messages: messages
      };
      
      if (options) {
        payload.options = options;
      }
      
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Connection': 'keep-alive'
        },
        body: JSON.stringify(payload),
        // @ts-ignore - agent is not in standard fetch types but works in Node.js
        agent: this._httpAgent
      });
      
      if (response.ok) {
        return await response.json();
      } else {
        console.error(`Chat failed: ${response.status}`);
        return null;
      }
    } catch (error) {
      console.error(`Chat error: ${error.message}`);
      return null;
    }
  }
  
  async health() {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        headers: { 'Connection': 'keep-alive' },
        // @ts-ignore - agent is not in standard fetch types but works in Node.js
        agent: this._httpAgent
      });
      return response.ok;
    } catch (error) {
      console.error(`Health check failed: ${error.message}`);
      return false;
    }
  }
  
  async modelCapability(model, capability) {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        headers: { 'Connection': 'keep-alive' },
        // @ts-ignore - agent is not in standard fetch types but works in Node.js
        agent: this._httpAgent
      });
      if (response.ok) {
        const data = await response.json();
        const models = data.models || [];
        return models.some(m => m.name === model);
      }
      return false;
    } catch (error) {
      console.error(`Capability check failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Cleanup HTTP agent
   */
  destroy() {
    if (this._httpAgent) {
      this._httpAgent.destroy();
    }
  }
}

module.exports = { OllamaProviderAdapter };
