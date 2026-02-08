import { GoogleGenAI } from '@google/genai';
import { IMAGE_GEN_MODEL } from '../constants';

export async function generateOutfitChange(
  originalImageBase64: string,
  prompt: string
): Promise<string> {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error('API Key not found');

  const ai = new GoogleGenAI({ apiKey });
  
  // Construct a prompt that ensures consistency
  const fullPrompt = `Change the person's clothing to: ${prompt}. 
  CRITICAL: Keep the person's face, body pose, hair, and the background EXACTLY the same. 
  Only change the outfit. The result should be photorealistic.`;

  try {
    const response = await ai.models.generateContent({
      model: IMAGE_GEN_MODEL,
      contents: {
        parts: [
          {
            text: fullPrompt,
          },
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: originalImageBase64,
            },
          },
        ],
      },
    });

    // Extract the image from the response
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData && part.inlineData.data) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    
    throw new Error('No image data found in response');
  } catch (error) {
    console.error('Image generation failed:', error);
    throw error;
  }
}
