import { describe, it, expect } from "bun:test";
import { auth } from "./auth.js";

async function login(
  body: Record<string, unknown>,
): Promise<{ status: number; body: unknown; sidCookie: string | null }> {
  const res = await auth.request("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  const setCookie = res.headers.getSetCookie?.() ?? [];
  const sidCookie =
    setCookie.find((c: string) => c.startsWith("sid=")) ?? null;
  return { status: res.status, body: json, sidCookie };
}

describe("POST /login", () => {
  it("returns 200 and sets session cookie for valid credentials", async () => {
    const { status, body, sidCookie } = await login({
      slug: "jane",
      password: "12345",
    });
    expect(status).toBe(200);
    expect(body).toEqual({ user: { slug: "jane", name: "Jane" } });
    expect(sidCookie).not.toBeNull();
    expect(sidCookie!).toContain("HttpOnly");
    expect(sidCookie!).toContain("Secure");
    expect(sidCookie!).toContain("SameSite=Lax");
  });

  it("returns 401 for wrong password", async () => {
    const { status, body, sidCookie } = await login({
      slug: "jane",
      password: "wrong",
    });
    expect(status).toBe(401);
    expect(body).toEqual({ error: "Invalid credentials" });
    expect(sidCookie).toBeNull();
  });

  it("returns 401 for unknown slug", async () => {
    const { status, body, sidCookie } = await login({
      slug: "nobody",
      password: "12345",
    });
    expect(status).toBe(401);
    expect(body).toEqual({ error: "Invalid credentials" });
    expect(sidCookie).toBeNull();
  });

  it("returns 400 for empty body", async () => {
    const res = await auth.request("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: "", password: "" }),
    });
    expect(res.status).toBe(400);
  });
});

describe("GET /me", () => {
  it("returns 401 with no cookie", async () => {
    const res = await auth.request("/me");
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: "Unauthorized" });
  });

  it("returns 200 with a valid session cookie", async () => {
    const { sidCookie } = await login({ slug: "jane", password: "12345" });
    const res = await auth.request("/me", {
      headers: { cookie: sidCookie! },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ user: { slug: "jane", name: "Jane" } });
  });

  it("returns 401 with a tampered cookie", async () => {
    const { sidCookie } = await login({ slug: "jane", password: "12345" });
    const tampered = sidCookie!.split(";")[0] + "X";
    const res = await auth.request("/me", {
      headers: { cookie: tampered },
    });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: "Unauthorized" });
  });
});

describe("POST /logout", () => {
  it("returns 200 and clears the cookie", async () => {
    const { sidCookie } = await login({ slug: "jane", password: "12345" });
    const res = await auth.request("/logout", {
      method: "POST",
      headers: { cookie: sidCookie! },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true });
    // logout should set an empty sid cookie
    const setCookie = res.headers.getSetCookie?.() ?? [];
    const cleared = setCookie.find((c: string) => c.startsWith("sid="));
    expect(cleared).toBeDefined();
  });

  it("returns 401 on /me after logout", async () => {
    const { sidCookie } = await login({ slug: "jane", password: "12345" });
    // logout
    const logoutRes = await auth.request("/logout", {
      method: "POST",
      headers: { cookie: sidCookie! },
    });
    // grab the cleared cookie from logout response
    const setCookie = logoutRes.headers.getSetCookie?.() ?? [];
    const clearedCookie =
      setCookie.find((c: string) => c.startsWith("sid=")) ?? sidCookie!;
    // try /me
    const res = await auth.request("/me", {
      headers: { cookie: clearedCookie },
    });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: "Unauthorized" });
  });

  it("succeeds with no cookie", async () => {
    const res = await auth.request("/logout", { method: "POST" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true });
  });
});
