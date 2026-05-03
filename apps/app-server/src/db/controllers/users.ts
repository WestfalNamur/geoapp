import { sql } from "../index.js";

export async function getUserByName(name: string) {
    const rows = await sql`
    SELECT id, name, password
    FROM users
    WHERE name = ${name}
  `;
    return rows[0] ?? null;
}
