import { sql } from "../index.js";

export async function getUsers() {
  const rows = await sql`
    SELECT id, name, slug, password
    FROM users
    ORDER BY id
  `;
  return rows;
}

export async function getUserBySlug(slug: string) {
  const rows = await sql`
    SELECT id, name, slug, password
    FROM users
    WHERE slug = ${slug}
  `;
  return rows[0] ?? null;
}
