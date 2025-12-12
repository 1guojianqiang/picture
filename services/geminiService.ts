import { GoogleGenAI } from "@google/genai";

const getAiClient = () => {
  // Graceful check for environment to allow local offline execution
  const apiKey = typeof process !== 'undefined' && process.env ? process.env.API_KEY : null;
  
  if (!apiKey) {
    throw new Error("API Key missing. AI features require an API Key.");
  }
  return new GoogleGenAI({ apiKey });
};

// Helper to strip data:image/...;base64, prefix
const extractBase64 = (dataUrl: string): string => {
  return dataUrl.split(',')[1] || dataUrl;
};

export const editImageWithGemini = async (
  base64Image: string,
  instruction: string,
  modelName: string = 'gemini-2.5-flash-image'
): Promise<string> => {
  const ai = getAiClient();
  
  try {
    const prompt = `${instruction}. Ensure the result is a high-quality ID photo portrait. Maintain the person's facial identity strictly. Output only the image.`;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/png',
              data: extractBase64(base64Image),
            },
          },
          {
            text: prompt,
          },
        ],
      },
    });

    const parts = response.candidates?.[0]?.content?.parts;
    if (!parts) throw new Error("No content generated");

    for (const part of parts) {
      if (part.inlineData && part.inlineData.data) {
        return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
      }
    }
    
    const textPart = parts.find(p => p.text);
    if (textPart) {
      throw new Error(`AI Generation failed: ${textPart.text}`);
    }

    throw new Error("No image data found in response");
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const removeBackground = async (base64Image: string, color: string): Promise<string> => {
  const colorPrompt = color === 'gradient' ? 'a professional blue gradient background' : `a solid ${color} background`;
  return editImageWithGemini(
    base64Image,
    `Extract the person and place them on ${colorPrompt}. Ensure clean edges and hair details.`
  );
};

export const changeOutfit = async (base64Image: string, outfitDescription: string): Promise<string> => {
  return editImageWithGemini(
    base64Image,
    `Change the person's clothing to a ${outfitDescription}. Keep the head, face, and hair exactly the same. Only change the neck down. Ensure the clothing fits naturally.`
  );
};

export const applyBeauty = async (base64Image: string, levelPrompt: string): Promise<string> => {
  return editImageWithGemini(
    base64Image,
    `Enhance this ID photo with ${levelPrompt}. Keep the person's identity recognizable but improve image quality, lighting and skin tone.`
  );
};