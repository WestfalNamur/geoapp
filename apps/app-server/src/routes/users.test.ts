import { describe, it, expect } from "bun:test";
import { users } from "./users.js";

describe("GET /users", () => {
  it("returns all users", async () => {
    const res = await users.request("/");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThanOrEqual(2);
    expect(body[0]).toHaveProperty("slug");
    expect(body[0]).toHaveProperty("name");
  });
});

describe("GET /users/:slug", () => {
  it("returns a user by slug", async () => {
    const res = await users.request("/jane");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("slug", "jane");
  });

  it("returns 404 for unknown slug", async () => {
    const res = await users.request("/nobody");
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toEqual({ error: "not found" });
  });
});
