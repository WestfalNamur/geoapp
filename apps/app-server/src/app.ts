import { Hono } from "hono";
import { api } from "./routes/api.js";

const app = new Hono()
  .get("/health", (c) => {
    return c.json({ status: "ok" });
  })
  .route("/api", api);

export { app };
export type AppType = typeof app;
