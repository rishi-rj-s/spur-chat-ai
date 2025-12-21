import { FastifyInstance } from "fastify";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const HistoryQuerySchema = z.object({
    sessionId: z.string().uuid(),
    cursor: z.string().uuid().optional(),
    limit: z.coerce.number().min(1).max(100).default(50),
});

export async function historyRoutes(fastify: FastifyInstance) {
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

            const messages = await prisma.message.findMany({
                where: { sessionId },
                take: limit + 1, // Fetch one extra to determine if there's a next page
                cursor: cursor ? { id: cursor } : undefined,
                orderBy: { createdAt: "desc" }, // Newest first
            });

            let nextCursor: string | undefined = undefined;
            if (messages.length > limit) {
                const nextItem = messages.pop(); // Remove the extra item
                nextCursor = nextItem?.id;
            }

            // Return messages in chronological order for the UI? 
            // Usually UI wants them reversed (newest at bottom). 
            // But for infinite scroll (scrolling UP), we want newest first from the API usually, 
            // or we just return them and let UI handle. 
            // Let's return them as fetched (descending aka newest first) so the UI can prepend them.
            return {
                messages,
                nextCursor
            };

        } catch (error) {
            console.error(error);
            return reply.status(500).send({ error: "Internal Server Error" });
        }
    });
}
