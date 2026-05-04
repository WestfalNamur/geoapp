import { Hono } from "hono";
import { api } from "./routes/api.js";

const app = new Hono();

app.get("/health", (c) => {
  return c.json({ status: "ok" });
});

app.route("/api", api);

export { app };
