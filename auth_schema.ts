import {z} from "zod";

export const signUpSchema = z.object({
    body: z.object({
        email: z.string().email("Please provide a valid email"),
        password: z.string().min(8, "Pasword must be at least 8 characters long")
        .max(100, "Password is too long")
    })
});

// We can reuse the same for login
export const loginSchema = signUpSchema; 