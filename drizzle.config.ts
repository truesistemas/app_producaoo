import { defineConfig } from "drizzle-kit";

// Use the new PostgreSQL database URL
const DATABASE_URL = process.env.DATABASE_URL || "postgres://app_producao:@Wsr461300321321@54.242.187.130:5432/app-producao-postegres?sslmode=disable";

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: DATABASE_URL,
  },
});
