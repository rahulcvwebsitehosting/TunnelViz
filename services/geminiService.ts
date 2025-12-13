import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';

// Initialize the client strictly according to instructions
const ai = new GoogleGenAI({ apiKey });

export const askTunnelTutor = async (
  question: string, 
  context: string
): Promise<string> => {
  if (!apiKey) {
    return "API Key is missing. Please configure the environment variable.";
  }

  try {
    const model = 'gemini-2.5-flash';
    const systemInstruction = `You are Professor TunnelViz, a world-class expert in civil engineering and tunneling. 
    Your goal is to explain complex concepts simply to undergraduate students. 
    Keep answers concise (under 150 words) unless asked for detail. 
    Use analogies. 
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
