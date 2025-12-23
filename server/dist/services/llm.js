"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateReply = generateReply;
const genai_1 = require("@google/genai");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const genAI = new genai_1.GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
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
async function generateReply(history, newMessage) {
    try {
        const chat = genAI.chats.create({
            model: "gemini-2.5-flash-lite",
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
        // Result object usually has .text (or candidates). 
        // We assume .text works based on usage.
        return result.text;
    }
    catch (error) {
        console.error("LLM Error:", error);
        return "I'm having trouble connecting to my brain right now. Please try again later.";
    }
}
