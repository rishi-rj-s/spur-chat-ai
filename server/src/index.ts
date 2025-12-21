import Fastify from "fastify";
import cors from "@fastify/cors";
import dotenv from "dotenv";
import { chatRoutes } from "./routes/chat";
import { historyRoutes } from "./routes/history";

dotenv.config();

const server = Fastify({
    logger: true,
});

server.register(cors, {
    origin: "http://localhost:5173",
});

server.register(chatRoutes, { prefix: "/chat" });
server.register(historyRoutes, { prefix: "/chat" });

server.get("/", async () => {
    return { status: "ok", service: "Spur Chat Agent API" };
});

const start = async () => {
    try {
        const PORT = parseInt(process.env.PORT || "3000");
        await server.listen({ port: PORT, host: "0.0.0.0" });
        console.log(`Server listening on http://localhost:${PORT}`);
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

start();
