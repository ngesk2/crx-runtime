/**
 * OpenAI Provider Adapter - Subordinate to Inference Authority (Node.js)
 * 
 * Constitutional Law: This is a PROVIDER ADAPTER, not an authority.
 * It is subordinate to InferenceAdapter.
 * 
 * This adapter provides OpenAI-compatible implementation (vLLM).
 * Only InferenceAdapter may call this adapter.
 * No business logic may call this adapter directly.
 */

class OpenAIProviderAdapter {
  constructor(baseUrl, embeddingModel, chatModel) {
    this.baseUrl = baseUrl;
    this.embeddingModel = embeddingModel;
    this.chatModel = chatModel;
  }
  
  async embed(text) {
    try {
      const response = await fetch(`${this.baseUrl}/v1/embeddings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.embeddingModel,
          input: text
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const embeddings = data.data || [];
        if (embeddings.length > 0) {
          return embeddings[0].embedding;
        } else {
          console.error('No embedding in response');
          return null;
        }
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
        Object.assign(payload, options);
      }
      
      const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        const data = await response.json();
        // Convert OpenAI format to Ollama format for compatibility
        return {
          message: {
            role: 'assistant',
            content: data.choices[0].message.content
          },
          model: data.model,
          done: true
        };
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
      const response = await fetch(`${this.baseUrl}/v1/models`);
      return response.ok;
    } catch (error) {
      console.error(`Health check failed: ${error.message}`);
      return false;
    }
  }
  
  async modelCapability(model, capability) {
    try {
      const response = await fetch(`${this.baseUrl}/v1/models`);
      if (response.ok) {
        const data = await response.json();
        const models = data.data || [];
        return models.some(m => m.id === model);
      }
      return false;
    } catch (error) {
      console.error(`Capability check failed: ${error.message}`);
      return false;
    }
  }
}

module.exports = { OpenAIProviderAdapter };
