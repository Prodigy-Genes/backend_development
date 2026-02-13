import { z } from "zod";

export const createTaskSchema = z.object({
    body: z.object({
        // Task title must be a string atleast 3 chars and maximum of 100
        title: z.string({
            error: "Title must be a string"
        })
        .min(3, "Title must be at least 3 characters long")
        .max(100, "Title must be less than 100 characters long"),

        // Description is optional, if available must be a string
        description: z.string().max(500).optional(),
    })
});

export const updateTaskSchema = z.object({
    body: z.object({
        title: z.string().min(3, "Title must be at least 3 characters long")
        .max(100, "Title must be less than 100 characters long").optional(),
        
        description: z.string().max(500).optional(),
        completed: z.boolean({
            error: "Completed must be a boolean"
        }).optional()
    })
});