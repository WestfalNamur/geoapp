import { app } from "./app";

const port = Number(Bun.env["PORT"]) || 3000;

Bun.serve({ fetch: app.fetch, port, hostname: "0.0.0.0" });

console.log(`app-server listening on http://0.0.0.0:${port}`);
