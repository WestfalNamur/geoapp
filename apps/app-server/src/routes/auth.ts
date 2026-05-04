/**
 * Session-based auth using signed cookies.
 *
 * Login validates credentials against bcrypt hashes, creates a DB-backed
 * session (7-day TTL), and sets a signed `sid` cookie.  /me resolves the
 * current user from the cookie via a sessions↔users join.  Logout revokes
 * the session and clears the cookie.  Tampered or missing signatures are
 * rejected before any DB round-trip.
 */
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { setSignedCookie, getSignedCookie, deleteCookie } from "hono/cookie";
import { z } from "zod";
import { getUserBySlug } from "@db/controllers/users.js";
import * as sessions from "@lib/sessions.js";
import * as password from "@lib/password.js";

const COOKIE_SECRET = Bun.env["COOKIE_SECRET"];
if (!COOKIE_SECRET || COOKIE_SECRET.length < 32) {
  throw new Error("COOKIE_SECRET must be set and at least 32 characters long");
}

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "Lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
};

const loginSchema = z.object({
  slug: z.string().min(1),
  password: z.string().min(1),
});

const auth = new Hono()
  .post("/login", zValidator("json", loginSchema), async (c) => {
    const { slug, password: plain } = c.req.valid("json");

    const user = await getUserBySlug(slug);
    if (!user) {
      return c.json({ error: "Invalid credentials" }, 401);
    }

    const ok = await password.verify(plain, user.password);
    if (!ok) {
      return c.json({ error: "Invalid credentials" }, 401);
    }

    const sid = await sessions.create(user.id);
    await setSignedCookie(c, "sid", sid, COOKIE_SECRET, COOKIE_OPTIONS);

    return c.json({ user: { slug: user.slug, name: user.name } });
  })
  .post("/logout", async (c) => {
    const sid = await getSignedCookie(c, COOKIE_SECRET, "sid");
    if (sid && typeof sid === "string") {
      await sessions.revoke(sid);
    }
    deleteCookie(c, "sid", { path: "/" });
    return c.json({ ok: true });
  })
  .get("/me", async (c) => {
    const sid = await getSignedCookie(c, COOKIE_SECRET, "sid");
    if (!sid || typeof sid !== "string") {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const session = await sessions.get(sid);
    if (!session) {
      deleteCookie(c, "sid", { path: "/" });
      return c.json({ error: "Unauthorized" }, 401);
    }

    return c.json({ user: { slug: session.slug, name: session.name } });
  });

export { auth };
