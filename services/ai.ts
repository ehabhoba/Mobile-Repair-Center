
import { GoogleGenAI } from "@google/genai";

export interface AIAnalysisResult {
  brand?: string;
  model?: string;
  color?: string;
}

export async function identifyDeviceFromImage(base64Image: string): Promise<AIAnalysisResult> {
  try {
    // Fix: Initialize AI client using process.env.API_KEY directly as per guidelines
    // Assume process.env.API_KEY is available via Vite define
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Strip header if exists (data:image/jpeg;base64,...)
    const cleanData = base64Image.split(',')[1] || base64Image;

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
    // Ensure we handle potential markdown wrapping just in case, though mimeType json helps
    const jsonStr = text.replace(/```json|```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("AI Analysis Error:", error);
    throw new Error("فشل تحليل الصورة. تأكد من إعداد مفتاح API بشكل صحيح.");
  }
}