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

async function runUp() {
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

async function runDown() {
  const applied = await appliedMigrations();
  const migrationsDir = new URL("../migrations", import.meta.url).pathname;

  const files = Array.from(new Bun.Glob("*.ts").scanSync({ cwd: migrationsDir, absolute: false }))
    .filter((f) => f.endsWith(".ts"))
    .sort()
    .reverse();

  for (const file of files) {
    if (!applied.has(file)) {
      console.log(`  skip ${file} (not applied)`);
      continue;
    }

    const mod = await import(`${migrationsDir}/${file}`);
    const down = mod.down;
    if (typeof down !== "function") {
      throw new Error(`Migration ${file} does not export a down function`);
    }

    console.log(`  revert ${file} …`);
    await down(sql);
    await sql`DELETE FROM _migrations WHERE name = ${file}`;
    console.log(`  done  ${file}`);
  }

  console.log("Rollback complete.");
}

async function run() {
  await ensureMigrationsTable();

  const direction = Bun.argv.includes("--down") ? "down" : "up";
  if (direction === "down") {
    await runDown();
  } else {
    await runUp();
  }
}

run()
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  })
  .finally(() => {
    sql.close();
  });
