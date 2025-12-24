import { GoogleGenAI } from "@google/genai";

// Initialize the client strictly according to instructions
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const askTunnelTutor = async (
  question: string, 
  context: string
): Promise<string> => {
  try {
    const model = 'gemini-3-flash-preview';
    const systemInstruction = `You are Professor TunnelViz, a world-class expert in civil engineering and tunneling. 
    Your goal is to explain complex concepts simply to undergraduate students. 
    Keep answers concise (under 150 words) unless asked for detail. 
    Use analogies. 
    Format your response using Markdown (bolding, lists) for better readability.
    Context provided by user: ${context}`;

    const response = await ai.models.generateContent({
      model,
      contents: question,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    return response.text || "I couldn't generate a response. Please try again.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "An error occurred while contacting the AI Tutor.";
  }
};