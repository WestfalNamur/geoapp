import { Hono } from "hono";
import { users } from "./users.js";

const api = new Hono();

api.route("/users", users);

export { api };
