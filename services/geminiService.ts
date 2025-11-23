import { GoogleGenAI } from "@google/genai";

const getAiClient = () => {
    // Note: In a real production app, use a proxy or serverless function to hide the key.
    // For this demo structure, we assume process.env.API_KEY is available or user provides it.
    // As per instructions, we rely exclusively on process.env.API_KEY.
    const apiKey = process.env.API_KEY; 
    return new GoogleGenAI({ apiKey });
};

export const enhanceItemDescription = async (itemName: string): Promise<string> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Melhore a descrição comercial deste produto para uma cotação formal, seja breve e profissional (máximo 250 caracteres): "${itemName}"`,
    });
    return response.text.trim().slice(0, 250);
  } catch (error) {
    console.error("Gemini API Error:", error);
    return itemName; // Fallback to original
  }
};