"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const rate_limit_1 = __importDefault(require("@fastify/rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const chat_1 = require("./routes/chat");
const history_1 = require("./routes/history");
const redis_1 = require("./lib/redis");
dotenv_1.default.config();
const server = (0, fastify_1.default)({
    logger: true,
});
server.register(cors_1.default, {
    origin: ["http://localhost:5173", process.env.FRONTEND_URL || ""].filter(Boolean),
});
server.register(rate_limit_1.default, {
    max: 30,
    timeWindow: '1 minute',
    redis: redis_1.redis,
    errorResponseBuilder: (request, context) => {
        return {
            statusCode: 429,
            error: "Too Many Requests",
            message: `You are sending messages too fast. Please wait ${Math.ceil(context.ttl / 1000)} seconds.`
        };
    }
});
server.register(chat_1.chatRoutes, { prefix: "/chat" });
server.register(history_1.historyRoutes, { prefix: "/chat" });
server.get("/", async () => {
    return { status: "ok", service: "Spur Chat Agent API" };
});
const start = async () => {
    try {
        const PORT = parseInt(process.env.PORT || "3000");
        await server.listen({ port: PORT, host: "0.0.0.0" });
        console.log(`Server listening on http://localhost:${PORT}`);
    }
    catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};
start();
