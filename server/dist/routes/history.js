"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.historyRoutes = historyRoutes;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const redis_1 = require("../lib/redis");
const prisma = new client_1.PrismaClient();
const HistoryQuerySchema = zod_1.z.object({
    sessionId: zod_1.z.uuid(),
    cursor: zod_1.z.uuid().optional(),
    limit: zod_1.z.coerce.number().min(1).max(100).default(50),
});
async function historyRoutes(fastify) {
    fastify.get("/history/:sessionId", async (request, reply) => {
        try {
            const { sessionId } = request.params;
            const query = HistoryQuerySchema.safeParse({
                sessionId,
                ...request.query
            });
            if (!query.success) {
                return reply.status(400).send({ error: "Invalid parameters", details: query.error.format() });
            }
            const { cursor, limit } = query.data;
            // Redis Cache (First page only)
            const cacheKey = `chat_history:${sessionId}`;
            if (!cursor) {
                const cached = await redis_1.redis.get(cacheKey);
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
            let nextCursor = undefined;
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
                await redis_1.redis.set(cacheKey, JSON.stringify(response), "EX", 1800);
            }
            return response;
        }
        catch (error) {
            console.error(error);
            return reply.status(500).send({ error: "Internal Server Error" });
        }
    });
}
