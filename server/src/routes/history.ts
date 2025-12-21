import { FastifyInstance } from "fastify";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import Redis from "ioredis";

const prisma = new PrismaClient();

const HistoryQuerySchema = z.object({
    sessionId: z.uuid(),
    cursor: z.uuid().optional(),
    limit: z.coerce.number().min(1).max(100).default(50),
});

export async function historyRoutes(fastify: FastifyInstance) {
    const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

    fastify.get("/history/:sessionId", async (request, reply) => {
        try {
            const { sessionId } = request.params as { sessionId: string };
            const query = HistoryQuerySchema.safeParse({
                sessionId,
                ...request.query as any
            });

            if (!query.success) {
                return reply.status(400).send({ error: "Invalid parameters", details: query.error.format() });
            }

            const { cursor, limit } = query.data;

            // Redis Cache (First page only)
            const cacheKey = `chat_history:${sessionId}`;

            if (!cursor) {
                const cached = await redis.get(cacheKey);
                if (cached) {
                    console.log("Hits Redis for history");
                    return JSON.parse(cached);
                }
            }

            const messages = await prisma.message.findMany({
                where: { sessionId },
                take: limit + 1,
                cursor: cursor ? { id: cursor } : undefined,
                orderBy: { createdAt: "desc" },
            });

            let nextCursor: string | undefined = undefined;
            if (messages.length > limit) {
                const nextItem = messages.pop();
                nextCursor = nextItem?.id;
            }

            const response = {
                messages,
                nextCursor
            };

            // First page? Cache it (30 min TTL)
            if (!cursor) {
                await redis.set(cacheKey, JSON.stringify(response), "EX", 1800);
            }

            return response;

        } catch (error) {
            console.error(error);
            return reply.status(500).send({ error: "Internal Server Error" });
        }
    });
}
