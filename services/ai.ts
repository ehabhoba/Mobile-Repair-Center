
import { GoogleGenAI } from "@google/genai";

export interface AIAnalysisResult {
  brand?: string;
  model?: string;
  color?: string;
}

// Retrieve keys from the build configuration
const API_KEYS: string[] = JSON.parse((process.env as any).AI_KEYS || '[]');

export async function identifyDeviceFromImage(base64Image: string): Promise<AIAnalysisResult> {
  // Strip header if exists (data:image/jpeg;base64,...)
  const cleanData = base64Image.split(',')[1] || base64Image;

  let lastError = null;

  // KEY ROTATION STRATEGY
  // Loop through available keys. If one fails, try the next.
  for (const apiKey of API_KEYS) {
    try {
      const ai = new GoogleGenAI({ apiKey });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
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
      return JSON.parse(jsonStr);

    } catch (error) {
      console.warn(`AI Key ending in ...${apiKey.slice(-4)} failed. Trying next key.`);
      lastError = error;
      // Continue to next iteration (next key)
    }
  }

  // If we reach here, all keys failed
  console.error("All AI keys failed:", lastError);
  throw new Error("فشل التعرف على الجهاز بعد عدة محاولات. يرجى التحقق من الإنترنت.");
}
