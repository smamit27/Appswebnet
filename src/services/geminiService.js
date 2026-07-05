import { GoogleGenAI } from '@google/genai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
let ai;
if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

const responseCache = new Map();

export async function askGemini(query, context, history = []) {
  if (!ai) {
    throw new Error('Gemini API key is not configured.');
  }

  // Create a lightweight cache key from the query and a fingerprint of the context
  const cacheKey = `${query.trim().toLowerCase()}_${(context || '').slice(0, 500)}`;
  if (responseCache.has(cacheKey)) {
    console.log('[Gemini Cache] Returning cached response to save API quota');
    return responseCache.get(cacheKey);
  }

  const systemPrompt = `You are the Family Dashboard AI Assistant.
Your primary role is to answer questions about the family's activities, finance, and schedules based on the provided context.

Rules:
1. NEVER guess or invent information. If the requested information is not in the context, politely state that you do not know or do not have access to that data.
2. Format your response clearly using Markdown (bolding, lists, tables where appropriate, etc.).
3. Be concise and professional.
4. Use the provided context data to accurately and directly answer the question.

Context Data:
${context || 'No specific database records found for this query.'}`;

  const formattedHistory = history.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));

  try {
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.1,
      },
      history: formattedHistory
    });

    const response = await chat.sendMessage({
      message: query
    });

    const reply = response.text;
    responseCache.set(cacheKey, reply);
    
    // Limit cache size to 25 items to prevent memory build-up
    if (responseCache.size > 25) {
      const oldestKey = responseCache.keys().next().value;
      responseCache.delete(oldestKey);
    }

    return reply;
  } catch (error) {
    console.warn('Gemini 2.5-flash failed. Trying gemini-2.0-flash-lite fallback...', error);
    try {
      const chatFallback = ai.chats.create({
        model: 'gemini-2.0-flash-lite',
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.1,
        },
        history: formattedHistory
      });

      const responseFallback = await chatFallback.sendMessage({
        message: query
      });

      const reply = responseFallback.text;
      responseCache.set(cacheKey, reply);
      return reply;
    } catch (fallbackError) {
      console.error('Gemini fallback model also failed:', fallbackError);
      const errMsg = error.message || '';
      if (errMsg.includes('429') || errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('limit')) {
        throw new Error("I've hit the Gemini free-tier rate limit (429 Quota Exceeded). Please try again in a few minutes or configure a billing plan for your API key.");
      }
      throw error;
    }
  }
}
