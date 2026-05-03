import type { SQL } from "bun";

export default async function up(sql: SQL) {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id   SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      password TEXT NOT NULL
    )
  `;

  await sql`INSERT INTO users (name, password) VALUES ('Jane', '12345')`;
  await sql`INSERT INTO users (name, password) VALUES ('John', '12345')`;
}
