
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

  // List of models to try in order of preference (Fastest/Free -> Strongest -> Experimental)
  const MODELS_TO_TRY = [
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-2.0-flash-exp'
  ];

  let lastError = null;
  
  // Ensure keys exist
  const keys = (typeof __AI_KEYS__ !== 'undefined') ? __AI_KEYS__ : [];

  if (keys.length === 0) {
      console.error("No API keys found in configuration.");
      throw new Error("خطأ في إعدادات النظام (API Keys missing).");
  }

  // STRATEGY: Iterate through Keys -> Then iterate through Models
  // This maximizes the chance of success if a specific key or model is rate-limited.
  for (const apiKey of keys) {
    try {
        const ai = new GoogleGenAI({ apiKey });

        for (const modelName of MODELS_TO_TRY) {
            try {
                // console.log(`Trying Key ending ...${apiKey.slice(-4)} with Model: ${modelName}`);
                
                const response = await ai.models.generateContent({
                    model: modelName,
                    contents: {
                        parts: [
                            { inlineData: { mimeType: 'image/jpeg', data: cleanData } },
                            { text: "Identify the mobile phone in this image. Return a JSON object with keys: 'brand' (e.g. Samsung, Apple), 'model' (e.g. iPhone 13, S24 Ultra), and 'color'. If unsure, make a best guess. Do NOT use Markdown. JSON only." }
                        ]
                    },
                    config: {
                        responseMimeType: "application/json"
                    }
                });

                const text = response.text;
                if (!text) throw new Error("Empty response");

                // Aggressive JSON cleaning
                const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
                const result = JSON.parse(jsonStr);
                
                // Validation: Must have at least brand or model
                if (result && (result.brand || result.model)) {
                    return result; // SUCCESS!
                }
            } catch (innerError) {
                // Continue to next model
                // console.warn(`Model ${modelName} failed for this key.`);
            }
        }
    } catch (error) {
      // Key failed entirely
      lastError = error;
    }
  }

  // If we reach here, everything failed
  console.error("All AI keys and models failed:", lastError);
  throw new Error("فشل التعرف على الجهاز. يرجى التأكد من جودة الصورة والاتصال بالإنترنت.");
}
