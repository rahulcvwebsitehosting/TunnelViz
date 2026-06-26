import { GoogleGenAI } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

const getAiClient = (): GoogleGenAI => {
  if (aiClient) return aiClient;

  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "undefined" || apiKey.trim() === "") {
    throw new Error("API_KEY_MISSING");
  }

  aiClient = new GoogleGenAI({ apiKey });
  return aiClient;
};

export const askTunnelTutor = async (
  question: string, 
  context: string
): Promise<string> => {
  try {
    const ai = getAiClient();
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
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error && error.message === "API_KEY_MISSING") {
      return "⚠️ The Gemini API key is not set. To enable chat with Professor TunnelViz, please configure your API Key in the settings.";
    }
    return "An error occurred while contacting the AI Tutor. Please verify your API key.";
  }
};
