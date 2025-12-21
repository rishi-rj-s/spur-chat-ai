import { FastifyInstance } from "fastify";
import { z } from "zod";
import { generateReply } from "../services/llm";
import { PrismaClient } from "@prisma/client";
import Redis from "ioredis";

const prisma = new PrismaClient();
// Ensure Redis uses the env var properly. In Docker usage it might be "redis:6379" but for localhost it's "localhost:6379"
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

const ChatMessageSchema = z.object({
    message: z.string().min(1).max(250),
    sessionId: z.string().uuid(),
});

export async function chatRoutes(fastify: FastifyInstance) {
    fastify.post("/message", async (request, reply) => {
        try {
            const { message, sessionId } = ChatMessageSchema.parse(request.body);

            // 0. Check Limits (100 messages max)
            const count = await prisma.message.count({ where: { sessionId } });
            if (count >= 100) {
                return reply.status(403).send({
                    error: "Limit Reached",
                    details: "Conversation limit reached (100 messages). Please refresh used a new session."
                });
            }

            // 1. Session TTL Management (Redis)
            const sessionKey = `session:${sessionId}`;
            const sessionExists = await redis.exists(sessionKey);

            // Reset TTL to 30 mins (1800s) on activity
            await redis.set(sessionKey, "active", "EX", 1800);

            // 2. Ensure Session exists in DB (Persistent Storage)
            // We upsert so if it's the first message ever for this UUID, we create it.
            // Note: In a real app, you might want strict creation endpoints, but for this "idiot-proof" chat, auto-creation is nice.
            await prisma.session.upsert({
                where: { id: sessionId },
                create: { id: sessionId },
                update: {},
            });

            // 3. Persist User Message
            await prisma.message.create({
                data: {
                    content: message,
                    role: "user",
                    sessionId: sessionId,
                },
            });

            // 4. Retrieve History for Context
            const history = await prisma.message.findMany({
                where: { sessionId },
                orderBy: { createdAt: "desc" },
                take: 10,
                skip: 1,
            });

            // Reverse to chronological order
            const formattedHistory = history.reverse().map((m: { role: string; content: string }) => ({
                role: m.role === "ai" ? "model" as const : "user" as const,
                parts: m.content
            }));

            // 5. Generate Reply
            const aiResponseText = await generateReply(formattedHistory, message);

            // 6. Persist AI Message
            await prisma.message.create({
                data: {
                    content: aiResponseText,
                    role: "ai",
                    sessionId: sessionId,
                },
            });

            return { reply: aiResponseText, sessionId };

        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.status(400).send({ error: "Invalid input", details: error.issues });
            }
            console.error(error);
            return reply.status(500).send({ error: "Internal Server Error" });
        }
    });
}
