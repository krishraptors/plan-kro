
import { GoogleGenAI, Chat, Type } from "@google/genai";
import { Suggestion, ChatMessage } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // In a real app, you'd show an error to the user or handle this more gracefully.
  console.error("API_KEY is not set. Please set the environment variable.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const suggestionSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      name: {
        type: Type.STRING,
        description: "Name of the place, movie, or activity.",
      },
      type: {
        type: Type.STRING,
        enum: ["Restaurant", "Movie", "Hangout Spot", "Other"],
        description: "The category of the suggestion."
      },
      rating: {
        type: Type.NUMBER,
        description: "A rating out of 5, e.g., 4.5"
      },
      reason: {
        type: Type.STRING,
        description: "A short, compelling reason why this is a good suggestion for the group."
      },
      address: {
        type: Type.STRING,
        description: "A plausible physical address for the suggested place. Only for 'Restaurant' or 'Hangout Spot'."
      },
      posterUrl: {
        type: Type.STRING,
        description: "A plausible placeholder image URL for the movie poster from a service like https://image.tmdb.org/t/p/w500/.... Only for 'Movie'."
      }
    },
    required: ["name", "type", "rating", "reason"]
  }
};


class PlanPalBot {
  private chat: Chat;

  constructor() {
    this.chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: `You are 'PlanPal', a cheerful and energetic AI assistant for planning events with friends, with a charming Indian cultural twist. Your tone is always encouraging and friendly, like a helpful friend.
- Use Hinglish phrases occasionally (e.g., 'Chalo, let's plan!', 'Kya idea hai!', 'Masti time!').
- Use emojis generously to keep the vibe fun and lighthearted 🎉🍛🎬.
- When asked for suggestions for places, movies, or activities, you MUST respond ONLY with a JSON object that strictly follows the provided schema. Do not add any text before or after the JSON.
- If the suggestion is a Movie, provide a plausible 'posterUrl'.
- If the suggestion is a Restaurant or Hangout Spot, provide a plausible 'address'.
- If the user provides their location coordinates, use them to make your suggestions more relevant and localized.
- For all other conversational queries, respond with a helpful, friendly text message.
- If the user asks for suggestions based on a mood (e.g., chill, adventurous, foodie), tailor your JSON suggestions to match that mood.
- Keep your text responses concise and to the point.`,
      },
    });
  }

  async sendMessage(message: string, location?: {latitude: number, longitude: number}): Promise<ChatMessage> {
    const isAskingForSuggestion = message.toLowerCase().includes('suggest') || message.toLowerCase().includes('recommend') || message.toLowerCase().includes('idea');
    
    let fullMessage = message;
    if (location) {
      fullMessage += ` (My current location is latitude: ${location.latitude}, longitude: ${location.longitude})`;
    }

    try {
      if (isAskingForSuggestion) {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Based on this request, provide some suggestions: "${fullMessage}"`,
            config: {
              responseMimeType: "application/json",
              responseSchema: suggestionSchema,
            },
        });

        const jsonString = response.text.trim();
        const suggestions: Suggestion[] = JSON.parse(jsonString);
        return {
            id: Date.now().toString(),
            sender: 'bot',
            suggestions: suggestions,
          };
      } else {
        const response = await this.chat.sendMessage({ message: fullMessage });
        const text = response.text;
        return {
            id: Date.now().toString(),
            sender: 'bot',
            text: text,
        };
      }
    } catch (error) {
        console.error("Error communicating with Gemini API:", error);
        return {
            id: Date.now().toString(),
            sender: 'bot',
            text: "Oh no! I'm having a little trouble thinking right now. Please try again in a moment. 🙏",
        };
    }
  }
}

export const bot = new PlanPalBot();
