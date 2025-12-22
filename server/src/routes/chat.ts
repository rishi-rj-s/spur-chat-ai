import { FastifyInstance } from "fastify";
import { z } from "zod";
import { generateReply } from "../services/llm";
import { PrismaClient } from "@prisma/client";
import { redis } from "../lib/redis";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

const ChatMessageSchema = z.object({
    message: z.string().min(1).max(250),
    sessionId: z.uuid().optional(),
});

export async function chatRoutes(fastify: FastifyInstance) {
    fastify.post("/message", async (request, reply) => {
        try {
            let { message, sessionId } = ChatMessageSchema.parse(request.body);

            if (!sessionId) {
                sessionId = randomUUID();
            }

            // Check Limits (100 messages max)
            const count = await prisma.message.count({ where: { sessionId } });
            if (count >= 100) {
                return reply.status(403).send({
                    error: "Limit Reached",
                    details: "Conversation limit reached."
                });
            }

            // Session TTL Management
            const sessionKey = `session:${sessionId}`;
            await redis.set(sessionKey, "active", "EX", 1800);

            // Ensure Session exists in DB
            await prisma.session.upsert({
                where: { id: sessionId },
                create: { id: sessionId },
                update: {},
            });

            // Persist User Message
            await prisma.message.create({
                data: {
                    content: message,
                    role: "user",
                    sessionId: sessionId,
                },
            });

            // Retrieve History for Context
            const history = await prisma.message.findMany({
                where: { sessionId },
                orderBy: { createdAt: "desc" },
                take: 10,
                skip: 1,
            });

            const formattedHistory = history.reverse().map((m: { role: string; content: string }) => ({
                role: m.role === "ai" ? "model" as const : "user" as const,
                parts: m.content
            }));

            // Generate Reply
            const aiResponseText = await generateReply(formattedHistory, message);

            // Persist AI Message
            await prisma.message.create({
                data: {
                    content: aiResponseText || "Sorry, I couldn't generate a response.",
                    role: "ai",
                    sessionId: sessionId,
                },
            });

            // Invalidate history cache
            await redis.del(`chat_history:${sessionId}`);

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
