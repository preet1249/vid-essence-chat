import axios from 'axios';

export class AIService {
  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';
    this.baseURL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
    
    if (!this.apiKey) {
      console.error('❌ OpenRouter API key not found in environment variables');
    }
  }

  /**
   * Make a request to OpenRouter API
   */
  async makeRequest(messages, options = {}) {
    try {
      if (!this.apiKey) {
        throw new Error('OpenRouter API key not configured');
      }

      const requestData = {
        model: this.model,
        messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 2000,
        top_p: options.topP || 0.9,
        frequency_penalty: options.frequencyPenalty || 0,
        presence_penalty: options.presencePenalty || 0,
        ...options
      };

      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:5173',
            'X-Title': 'Vid Essence Chat'
          },
          timeout: 60000 // 60 second timeout
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('OpenRouter API Error:', error.response?.data || error.message);
      
      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      } else if (error.response?.status === 401) {
        throw new Error('Invalid API key. Please check your OpenRouter API configuration.');
      } else if (error.response?.status === 402) {
        throw new Error('Insufficient credits. Please check your OpenRouter account balance.');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Request timeout. The AI service took too long to respond.');
      }
      
      throw new Error(`AI service error: ${error.message}`);
    }
  }

  /**
   * Generate video summary from transcript
   */
  async generateSummary(transcript, videoTitle, channelName, duration) {
    try {
      const durationMinutes = Math.floor(duration / 60);
      
      const systemPrompt = `You are an expert video content analyzer. Your task is to create comprehensive, well-structured summaries of YouTube videos based on their transcripts.

Guidelines for the summary:
1. Create a concise yet comprehensive summary (200-500 words)
2. Focus on the main topics, key insights, and important information
3. Structure the summary with clear paragraphs for different topics
4. Highlight actionable insights or practical information
5. Maintain the original tone and context of the video
6. Include specific details, examples, or data points mentioned
7. Avoid redundancy and filler content`;

      const userPrompt = `Please create a detailed summary for this YouTube video:

Title: "${videoTitle}"
Channel: ${channelName}
Duration: ${durationMinutes} minutes

Transcript:
${transcript.substring(0, 8000)} ${transcript.length > 8000 ? '...' : ''}

Please provide a well-structured summary that captures the essence of the video content, key points, and main takeaways.`;

      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ];

      const summary = await this.makeRequest(messages, {
        temperature: 0.3,
        maxTokens: 1500
      });

      return summary;
    } catch (error) {
      console.error('Error generating summary:', error);
      throw new Error(`Failed to generate video summary: ${error.message}`);
    }
  }

  /**
   * Extract key points from transcript
   */
  async extractKeyPoints(transcript, videoTitle) {
    try {
      const systemPrompt = `You are an expert at extracting key points from video content. Your task is to identify the most important points, insights, and takeaways from a video transcript.

Guidelines:
1. Extract 5-8 key points maximum
2. Each point should be concise (1-2 sentences)
3. Focus on actionable insights, important facts, or main concepts
4. Prioritize unique or valuable information
5. Avoid generic or obvious statements
6. Format each point clearly and independently`;

      const userPrompt = `Extract the key points from this video transcript:

Title: "${videoTitle}"

Transcript:
${transcript.substring(0, 6000)} ${transcript.length > 6000 ? '...' : ''}

Please provide the key points as a bulleted list with each point being concise and valuable.`;

      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ];

      const keyPointsText = await this.makeRequest(messages, {
        temperature: 0.2,
        maxTokens: 800
      });

      // Parse key points from response
      const keyPoints = keyPointsText
        .split('\n')
        .filter(line => line.trim() && (line.includes('•') || line.includes('-') || line.includes('*')))
        .map(point => point.replace(/^[•\-*]\s*/, '').trim())
        .filter(point => point.length > 10); // Filter out very short points

      return keyPoints;
    } catch (error) {
      console.error('Error extracting key points:', error);
      throw new Error(`Failed to extract key points: ${error.message}`);
    }
  }

  /**
   * Generate contextual chat response
   */
  async generateChatResponse(question, videoContext, chatHistory = []) {
    try {
      const systemPrompt = `You are an intelligent assistant specialized in discussing YouTube video content. You have access to the full context of a specific video and can answer questions about it accurately.

Your capabilities:
1. Answer questions about the video content with specific details
2. Provide explanations and elaborations on topics mentioned in the video
3. Connect different concepts discussed in the video
4. Offer additional insights related to the video's subject matter
5. Reference specific parts or examples from the video when relevant

Guidelines:
1. Base your answers primarily on the video content provided
2. Be conversational and helpful
3. If asked about something not covered in the video, acknowledge this clearly
4. Keep responses focused and relevant to the question
5. Use examples from the video when possible
6. Maintain context from previous messages in the conversation`;

      // Prepare video context
      const contextMessage = `Video Context:
Title: ${videoContext.title}
Channel: ${videoContext.channelName}
Summary: ${videoContext.summary}

Key Points:
${videoContext.keyPoints?.map(point => `• ${point}`).join('\n') || 'No key points available'}

Transcript: ${videoContext.transcript.substring(0, 4000)}${videoContext.transcript.length > 4000 ? '...' : ''}`;

      // Build conversation history
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'assistant', content: `I have the context of the video "${videoContext.title}" and I'm ready to answer your questions about it.` },
        { role: 'user', content: `Context: ${contextMessage}` },
        { role: 'assistant', content: 'I understand the video content and context. What would you like to know about it?' }
      ];

      // Add chat history
      chatHistory.forEach(msg => {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        });
      });

      // Add current question
      messages.push({
        role: 'user',
        content: question
      });

      const response = await this.makeRequest(messages, {
        temperature: 0.4,
        maxTokens: 1000
      });

      return response;
    } catch (error) {
      console.error('Error generating chat response:', error);
      throw new Error(`Failed to generate response: ${error.message}`);
    }
  }

  /**
   * Generate tags for video content
   */
  async generateTags(transcript, title, channelName) {
    try {
      const systemPrompt = `You are an expert at creating relevant tags for video content. Generate 5-10 descriptive tags that accurately represent the video's content, topics, and themes.

Guidelines:
1. Create specific, relevant tags (not generic ones)
2. Include both broad topics and specific concepts
3. Consider the target audience and use case
4. Keep tags concise (1-3 words each)
5. Focus on searchable and discoverable terms
6. Avoid overly broad or common tags`;

      const userPrompt = `Generate relevant tags for this video:

Title: "${title}"
Channel: ${channelName}

Content summary: ${transcript.substring(0, 1500)}...

Please provide 5-10 relevant tags separated by commas.`;

      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ];

      const tagsResponse = await this.makeRequest(messages, {
        temperature: 0.3,
        maxTokens: 200
      });

      // Parse tags from response
      const tags = tagsResponse
        .split(/[,\n]/)
        .map(tag => tag.trim().toLowerCase().replace(/[^\w\s-]/g, ''))
        .filter(tag => tag.length > 0 && tag.length <= 50)
        .slice(0, 10); // Limit to 10 tags

      return tags;
    } catch (error) {
      console.error('Error generating tags:', error);
      return []; // Return empty array if tag generation fails
    }
  }

  /**
   * Check API key validity
   */
  async validateApiKey() {
    try {
      const messages = [
        { role: 'user', content: 'Hello, this is a test message to validate the API key.' }
      ];

      await this.makeRequest(messages, {
        maxTokens: 10,
        temperature: 0
      });

      return true;
    } catch (error) {
      console.error('API key validation failed:', error);
      return false;
    }
  }
}