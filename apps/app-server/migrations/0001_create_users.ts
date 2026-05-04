import type { SQL } from "bun";

export default async function up(sql: SQL) {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id       SERIAL PRIMARY KEY,
      name     TEXT NOT NULL,
      slug     TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    )
  `;

  await sql`INSERT INTO users (name, slug, password) VALUES ('Jane', 'jane', '12345')`;
  await sql`INSERT INTO users (name, slug, password) VALUES ('John', 'john', '12345')`;
}
