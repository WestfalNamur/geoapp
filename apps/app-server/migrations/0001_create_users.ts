import type { SQL } from "bun";
import { hash } from "@lib/password";

export default async function up(sql: SQL) {
    await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

    await sql`
    CREATE TABLE IF NOT EXISTS users (
      id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name     TEXT NOT NULL,
      slug     TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    )
  `;

    const pass = await hash("12345");
    await sql`INSERT INTO users (name, slug, password) VALUES ('Jane', 'jane', ${pass})`;
    await sql`INSERT INTO users (name, slug, password) VALUES ('John', 'john', ${pass})`;
}

export async function down(sql: SQL) {
    await sql`DROP TABLE IF EXISTS users`;
}
