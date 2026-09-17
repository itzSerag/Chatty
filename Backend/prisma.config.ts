
import path from "node:path";
import dotenv from "dotenv";
import { defineConfig, env } from "prisma/config";

// Load .env from current directory or Backend directory
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, ".env") });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: env("DATABASE_URL")
  },
});
