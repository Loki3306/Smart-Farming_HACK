import { createServer } from "./index.js";

const { httpServer } = createServer();
const port = Number(process.env.PORT || 3000);

httpServer.listen(port, () => {
  console.log(`[dev] API server listening on http://localhost:${port}`);
});

function shutdown(signal: string) {
  console.log(`[dev] Received ${signal}, shutting down`);
  httpServer.close(() => process.exit(0));
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

