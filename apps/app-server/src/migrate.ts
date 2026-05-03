import { sql } from "./db";

async function ensureMigrationsTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS _migrations (
      name TEXT PRIMARY KEY,
      run_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
}

async function appliedMigrations(): Promise<Set<string>> {
  const rows = await sql`SELECT name FROM _migrations ORDER BY name`;
  return new Set(rows.map((r: { name: string }) => r.name));
}

async function run() {
  await ensureMigrationsTable();

  const applied = await appliedMigrations();
  const migrationsDir = new URL("../migrations", import.meta.url).pathname;

  const files = Array.from(new Bun.Glob("*.ts").scanSync({ cwd: migrationsDir, absolute: false }))
    .filter((f) => f.endsWith(".ts"))
    .sort();

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`  skip ${file} (already applied)`);
      continue;
    }

    const mod = await import(`${migrationsDir}/${file}`);
    const up = mod.default;
    if (typeof up !== "function") {
      throw new Error(`Migration ${file} does not export a default function`);
    }

    console.log(`  apply ${file} …`);
    await up(sql);
    await sql`INSERT INTO _migrations (name) VALUES (${file})`;
    console.log(`  done  ${file}`);
  }

  console.log("Migrations complete.");
}

run()
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  })
  .finally(() => {
    sql.close();
  });
