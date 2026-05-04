import { Hono } from "hono";
import { users } from "./routes/users.js";

const app = new Hono();

app.get("/health", (c) => {
  return c.json({ status: "ok" });
});

app.route("/users", users);

export { app };
