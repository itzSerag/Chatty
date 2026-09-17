
import path from "node:path";
import dotenv from "dotenv";
import { defineConfig } from "prisma/config";

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
    url: process.env.DATABASE_URL,
  },
});
