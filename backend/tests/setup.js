import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env.test");
const examplePath = path.join(__dirname, "..", ".env.test.example");

dotenv.config({ path: envPath });
dotenv.config({ path: examplePath });

process.env.NODE_ENV = "test";
