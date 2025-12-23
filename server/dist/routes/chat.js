"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatRoutes = chatRoutes;
const zod_1 = require("zod");
const llm_1 = require("../services/llm");
const client_1 = require("@prisma/client");
const redis_1 = require("../lib/redis");
const crypto_1 = require("crypto");
const prisma = new client_1.PrismaClient();
const ChatMessageSchema = zod_1.z.object({
    message: zod_1.z.string().min(1).max(250),
    sessionId: zod_1.z.uuid().optional(),
});
async function chatRoutes(fastify) {
    fastify.post("/message", async (request, reply) => {
        try {
            let { message, sessionId } = ChatMessageSchema.parse(request.body);
            if (!sessionId) {
                sessionId = (0, crypto_1.randomUUID)();
            }
            // Lock Mechanism: Prevent concurrent requests for same session
            const lockKey = `lock:chat:${sessionId}`;
            // NX: Only set if not exists, EX: Expire in 30s
            const acquired = await redis_1.redis.set(lockKey, "1", "EX", 30, "NX");
            if (!acquired) {
                return reply.status(429).send({
                    error: "Too Many Requests",
                    details: { message: "Previous message is still processing. Please wait." }
                });
            }
            try {
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
                await redis_1.redis.set(sessionKey, "active", "EX", 1800);
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
                const formattedHistory = history.reverse().map((m) => ({
                    role: m.role === "ai" ? "model" : "user",
                    parts: m.content
                }));
                // Generate Reply
                const aiResponseText = await (0, llm_1.generateReply)(formattedHistory, message);
                // Persist AI Message
                await prisma.message.create({
                    data: {
                        content: aiResponseText || "Sorry, I couldn't generate a response.",
                        role: "ai",
                        sessionId: sessionId,
                    },
                });
                // Invalidate history cache
                await redis_1.redis.del(`chat_history:${sessionId}`);
                return { reply: aiResponseText, sessionId };
            }
            finally {
                // Release Lock
                await redis_1.redis.del(lockKey);
            }
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return reply.status(400).send({ error: "Invalid input", details: error.issues });
            }
            console.error(error);
            return reply.status(500).send({ error: "Internal Server Error" });
        }
    });
}
