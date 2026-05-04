import type { SQL } from "bun";

export default async function up(sql: SQL) {
  await sql`
    CREATE TABLE IF NOT EXISTS sessions (
      id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
}

export async function down(sql: SQL) {
  await sql`DROP TABLE IF EXISTS sessions`;
}
