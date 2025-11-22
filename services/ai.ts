import { GoogleGenAI } from "@google/genai";

export interface AIAnalysisResult {
  brand?: string;
  model?: string;
  color?: string;
}

// Declare the global variable injected by Vite
declare const __AI_KEYS__: string[];

export async function identifyDeviceFromImage(base64Image: string): Promise<AIAnalysisResult> {
  // Strip header if exists (data:image/jpeg;base64,...)
  const cleanData = base64Image.split(',')[1] || base64Image;

  let lastError = null;
  
  // Ensure keys exist
  const keys = (typeof __AI_KEYS__ !== 'undefined') ? __AI_KEYS__ : [];

  if (keys.length === 0) {
      console.error("No API keys found in configuration.");
      throw new Error("خطأ في إعدادات النظام (API Keys missing).");
  }

  // KEY ROTATION STRATEGY
  // Loop through available keys. If one fails, try the next.
  for (const apiKey of keys) {
    try {
      const ai = new GoogleGenAI({ apiKey });

      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash', // Using 1.5-flash as it's often more stable/available for free tier rotation
        contents: {
            parts: [
                { inlineData: { mimeType: 'image/jpeg', data: cleanData } },
                { text: "Analyze this image of a mobile phone. Identify the Brand (e.g. Samsung, Apple), the specific Model (e.g. iPhone 13, Galaxy S22), and the Color. Return a strictly valid JSON object with keys: 'brand', 'model', 'color'. Do not include markdown code blocks." }
            ]
        },
        config: {
            responseMimeType: "application/json"
        }
      });

      const text = response.text || "{}";
      const jsonStr = text.replace(/```json|```/g, '').trim();
      const result = JSON.parse(jsonStr);
      
      // If we got a valid result, return it immediately
      if (result && (result.brand || result.model)) {
          return result;
      }
      
    } catch (error) {
      console.warn(`AI Key ending in ...${apiKey.slice(-4)} failed. Trying next key.`);
      lastError = error;
      // Continue to next iteration (next key)
    }
  }

  // If we reach here, all keys failed
  console.error("All AI keys failed:", lastError);
  throw new Error("فشل التعرف على الجهاز. يرجى المحاولة مرة أخرى (تأكد من الاتصال بالإنترنت).");
}