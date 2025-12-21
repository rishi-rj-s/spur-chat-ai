
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const SYSTEM_PROMPT = `
You are a helpful customer support agent for "Spur generic Store", a fictional e-commerce shop.
Your tone is professional, friendly, and concise.

Domain Knowledge:
- Shipping: We ship worldwide. India shipping is free over $50. International is flat $20.
- Returns: 30-day no-questions-asked return policy. Customer pays return shipping unless item is defective.
- Support Hours: Mon-Fri 9am-5pm IST.
- Products: generic widgets, gadgets, and other likely products.

If you don't know the answer, politely say you don't know and ask them to email support@spur.store.
Do not invent policies.
`;

export async function generateReply(history: { role: "user" | "model"; parts: string }[], newMessage: string) {
    try {
        const chat = genAI.chats.create({
            model: "gemini-2.5-flash",
            history: [
                {
                    role: "user",
                    parts: [{ text: SYSTEM_PROMPT }],
                },
                {
                    role: "model",
                    parts: [{ text: "Understood. I am ready to assist customers with their inquiries about Spur Generic Store." }],
                },
                ...history.map(msg => ({
                    role: msg.role,
                    parts: [{ text: msg.parts }]
                }))
            ],
        });

        const result = await chat.sendMessage({
            message: newMessage
        });

        // The result object from sendMessage is a GenerateContentResponse
        // Based on new SDK, it should have a 'text' property or we need to access candidates.
        // User example showed `response.text`. 
        // Note: The new SDK return type might be slightly different but usually is { text: string ... }.
        // Let's assume .text works as per user snippet.
        return result.text;
    } catch (error) {
        console.error("LLM Error:", error);
        return "I'm having trouble connecting to my brain right now. Please try again later.";
    }
}
