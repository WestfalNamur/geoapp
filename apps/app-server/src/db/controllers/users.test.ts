import { describe, it, expect } from "bun:test";
import { getUsers, getUserBySlug } from "./users.js";

describe("getUsers", () => {
  it("returns all users", async () => {
    const users = await getUsers();
    expect(users.length).toBeGreaterThanOrEqual(2);
    expect(users[0]).toHaveProperty("slug");
    expect(users[0]).toHaveProperty("name");
  });
});

describe("getUserBySlug", () => {
  it("finds Jane by slug", async () => {
    const user = await getUserBySlug("jane");
    expect(user).not.toBeNull();
    expect(user!.slug).toBe("jane");
  });

  it("returns null for unknown slug", async () => {
    const user = await getUserBySlug("nobody");
    expect(user).toBeNull();
  });
});
