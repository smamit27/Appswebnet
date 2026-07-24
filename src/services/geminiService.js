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

export async function parseTransactionWithAI(textOrAudio, isAudio = false, mimeType = 'audio/webm') {
  if (!ai) {
    throw new Error('Gemini API key is not configured.');
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const systemPrompt = `You are an expert personal finance transaction parser.
Your task is to analyze the provided input (which can be a text description or recorded audio) and extract transaction details.
You must return a structured JSON response containing the following fields:
1. transactionType: "income" or "expense"
2. amount: number (numeric value only, e.g. 150)
3. date: string in "YYYY-MM-DD" format. If no date is mentioned, use the current date (today is ${todayStr}).
4. category: string. Must match exactly one of these allowed categories:
   - For income: ["Salary", "Freelance", "Investments", "Dividend", "Interest", "Rent Received", "Business", "Other Income"]
   - For expense: ["Food & Dining", "Transport", "Shopping", "Bills & Utilities", "Home Loan EMI", "Investments", "Credit Card Payment", "House Help", "Monthly Maintenance", "Healthcare", "Entertainment", "Education", "Others"]
5. paymentMethod: string. Must match exactly one of these allowed methods (default is "Amit HDFC Bank"):
   ["Amit HDFC Bank", "SBI Bank", "Amit ICICI Bank", "Sweta ICICI Bank", "Pluxee", "Amazon Credit Card", "HSBC Credit Card", "Axis Credit Card", "Cash", "Other"]
6. entity: string. The source (e.g. employer, person) for income, or vendor (e.g. Starbucks, Amazon, landlord) for expense.
7. details: string. A short description or remark/purpose of the transaction.

Ensure your response is strictly a single valid JSON object. Do not include markdown formatting, code block markers, or any conversational text. Return only the JSON object.`;

  const contents = [];
  if (isAudio) {
    contents.push({
      role: 'user',
      parts: [
        { inlineData: { mimeType, data: textOrAudio } },
        { text: "Analyze the attached audio and extract the transaction details." }
      ]
    });
  } else {
    contents.push({
      role: 'user',
      parts: [
        { text: `Analyze the transaction: "${textOrAudio}"` }
      ]
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        responseMimeType: 'application/json',
        systemInstruction: systemPrompt,
        temperature: 0.1,
      }
    });

    return JSON.parse(response.text.trim());
  } catch (error) {
    console.warn('Gemini 2.5-flash parsing failed. Trying gemini-2.0-flash-lite fallback...', error);
    try {
      const responseFallback = await ai.models.generateContent({
        model: 'gemini-2.0-flash-lite',
        contents,
        config: {
          responseMimeType: 'application/json',
          systemInstruction: systemPrompt,
          temperature: 0.1,
        }
      });

      return JSON.parse(responseFallback.text.trim());
    } catch (fallbackError) {
      console.error('Gemini fallback model also failed for parsing:', fallbackError);
      throw fallbackError;
    }
  }
}

export async function transcribeAudioWithAI(base64, mimeType = 'audio/webm') {
  if (!ai) {
    throw new Error('Gemini API key is not configured.');
  }

  const contents = [{
    role: 'user',
    parts: [
      { inlineData: { mimeType, data: base64 } },
      { text: "Listen to this audio and write exactly what is said. Do not add any extra response, just return the transcription." }
    ]
  }];

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents
    });

    return response.text.trim();
  } catch (error) {
    console.warn('Gemini 2.5-flash transcription failed. Trying fallback...', error);
    try {
      const responseFallback = await ai.models.generateContent({
        model: 'gemini-2.0-flash-lite',
        contents
      });
      return responseFallback.text.trim();
    } catch (fallbackError) {
      console.error('Gemini fallback transcription failed:', fallbackError);
      throw fallbackError;
    }
  }
}
