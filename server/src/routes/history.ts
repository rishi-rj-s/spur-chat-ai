import { FastifyInstance } from "fastify";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import Redis from "ioredis";

const prisma = new PrismaClient();

const HistoryQuerySchema = z.object({
    sessionId: z.string().uuid(),
    cursor: z.string().uuid().optional(),
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

            // Redis Cache Strategy:
            // Only cache the "first page" (no cursor) to speed up initial loads/reloads.
            // Pagination (with cursor) is less frequent and can hit the DB.
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

            // The frontend expects oldest-first (usually) to render top-to-bottom, 
            // BUT for strict history fetching, we usually fetch newest-first (desc).
            // Let's send them back as is (descending), and frontend reverses them.

            const response = {
                messages,
                nextCursor
            };

            // Cache the result if it's the first page
            if (!cursor) {
                // Expire cache in 60 seconds (short lived) or keep it longer but invalidate explicitly?
                // Since we invalidate explicitly in chat.ts, we can keep it longer, e.g., 30 mins to match session
                await redis.set(cacheKey, JSON.stringify(response), "EX", 1800);
            }

            return response;

        } catch (error) {
            console.error(error);
            return reply.status(500).send({ error: "Internal Server Error" });
        }
    });
}
