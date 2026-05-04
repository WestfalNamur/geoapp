import { sql } from "@db/index.js";

export async function create(userId: string): Promise<string> {
  const id = crypto.randomUUID();
  await sql`
    INSERT INTO sessions (id, user_id, expires_at)
    VALUES (${id}, ${userId}, now() + INTERVAL '7 days')
  `;
  return id;
}

export async function get(id: string): Promise<{ user_id: string; slug: string; name: string } | null> {
  const rows = await sql`
    SELECT sessions.user_id, users.slug, users.name
    FROM sessions
    JOIN users ON users.id = sessions.user_id
    WHERE sessions.id = ${id}
      AND sessions.expires_at > now()
  `;
  return rows.length > 0 ? rows[0] : null;
}

export async function revoke(id: string): Promise<void> {
  await sql`DELETE FROM sessions WHERE id = ${id}`;
}
