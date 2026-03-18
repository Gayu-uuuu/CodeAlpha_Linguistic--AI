import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const LANGUAGES = [
  { code: 'auto', name: 'Detect Language' },
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ta', name: 'Tamil' },
  { code: 'ar', name: 'Arabic' },
  { code: 'nl', name: 'Dutch' },
  { code: 'tr', name: 'Turkish' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'pl', name: 'Polish' },
];

export async function translateText(text: string, sourceLang: string, targetLang: string) {
  if (!text.trim()) return "";

  const model = "gemini-3-flash-preview";
  const source = sourceLang === 'auto' ? 'detect automatically' : LANGUAGES.find(l => l.code === sourceLang)?.name;
  const target = LANGUAGES.find(l => l.code === targetLang)?.name;

  const prompt = `Translate the following text from ${source} to ${target}. 
  Only provide the translated text, nothing else. No explanations, no quotes unless they are part of the original text.
  
  Text: ${text}`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: prompt }] }],
    });

    return response.text || "Translation failed.";
  } catch (error) {
    console.error("Translation error:", error);
    throw error;
  }
}
