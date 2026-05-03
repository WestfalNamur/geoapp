const connectionString = `postgres://${Bun.env["POSTGRES_USER"]}:${Bun.env["POSTGRES_PASSWORD"]}@${Bun.env["DB_HOST"] ?? "db"}:${Bun.env["DB_PORT"] ?? "5432"}/${Bun.env["POSTGRES_DB"]}`;

const sql = new Bun.SQL(connectionString);

export { sql };
export * from "./controllers/users";
