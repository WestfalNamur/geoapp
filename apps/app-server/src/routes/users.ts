import { Hono } from "hono";
import { getUsers, getUserBySlug } from "../db/controllers/users.js";

const users = new Hono();

users.get("/", async (c) => {
  const rows = await getUsers();
  return c.json(rows);
});

users.get("/:slug", async (c) => {
  const slug = c.req.param("slug");
  const user = await getUserBySlug(slug);
  if (!user) {
    return c.json({ error: "not found" }, 404);
  }
  return c.json(user);
});

export { users };
