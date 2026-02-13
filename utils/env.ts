import { z } from "zod";
import logger from "../logger.js";

// Handle incase of missing or incorrect env variables
const envSchema = z.object({
    DATABASE_URL: z.string().url("DATABASE_URL must be a valid URL"),
    JWT_SECRET: z.string().min(10, "JWT_SECRET should be at least 10 characters for security"),
    PORT: z.string().default("3000"),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

// Throw an error if any of the variables are missing
const _env = envSchema.safeParse(process.env);

if(!_env.success){
    logger.error("Invalid Environment Variables ", _env.error.format());
    process.exit(1); // Stop the server
}

export const env = _env.data; 