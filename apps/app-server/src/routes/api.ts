import { Hono } from "hono";
import { users } from "./users.js";
import { auth } from "./auth.js";

const api = new Hono()
  .route("/users", users)
  .route("/auth", auth);

export { api };
