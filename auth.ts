import bcrypt from "bcrypt";
import type { RequestHandler, Request, Response } from 'express';
import pool from './db.js';
import jwt from 'jsonwebtoken';
import { Router } from "express";
import { AppError, asyncHandler } from "./utils/utils.js";
import { promisify } from "node:util";
import { validate } from "./middleware/validate.js";
import { loginSchema, signUpSchema } from "./auth_schema.js";
import { env } from "./utils/env.js";

// Define a model structure for users
interface User{
    id: number;
    email: string;
    password_hash: string;
    created_at: Date;
}

// Define what a decoded JWT Payload looks like
// Describes the contents
interface JWTPayload{
    userId: number;
    email: string;
}

// Extend the Express Request to include our user data 
export interface AuthRequest extends Request{
    user?: JWTPayload;
}

const router : Router = Router();

// We define the function signature explicitly
// We also convert the jwt.verify to a promise version hence escaping callbacks
const verifyAsync = promisify(jwt.verify) as (
    token: string, 
    secret: string
) => Promise<unknown>;

// This is a middleware function that protects routes and auto-catches errors
export const authGate: RequestHandler = asyncHandler(
  async (req: AuthRequest, _res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader?.split(" ")[1];

    if (!token) {
      throw new AppError("No Token Provided", 401);
    }

    const decoded = (await verifyAsync(token, env.JWT_SECRET)) as JWTPayload;

    req.user = decoded;
    next();
  }
);


// Signup endpoint
router.post('/signup', validate(signUpSchema), asyncHandler(async (req: Request, res: Response) => {
        const { email, password } = req.body;

        const hashedPassword = await bcrypt.hash(password,10);

        // Save to postgres
        const query = 'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING *';
        const result = await pool.query<User>(query, [email, hashedPassword]);

        if(result.rows.length === 0){
            throw new AppError('Failed to create user', 500)
        }

        res.status(201).json({ 
            message: 'Registration successful. If this is a new email, you can now log in.' 
        });
       
}));


// login endpoint
router.post('/login', validate(loginSchema), asyncHandler(async(req: Request, res: Response) =>{
        const {email, password} = req.body;

        // Message for all failures
        const authError = 'Invalid Email or Password';

        const query = 'SELECT * FROM users WHERE email = $1';
        const result = await pool.query<User>(query, [email]);
        const user = result.rows[0];

        // Simulate a fake hash
        // if no user is found, we use this dummmy hash for comparison
        const dummyHash = '$2b$10$verylongdummyhashplaceholderforsecurity';
        const hashToCompare = user ? user.password_hash : dummyHash;


        // Compare the plain password with the hashed one
        const isPasswordValid = await bcrypt.compare(password, hashToCompare);

        if(!user || !isPasswordValid) {
            throw new AppError(authError, 401)
        }

        // Create the JWT
        const token = jwt.sign(
            {userId: user.id, email: user.email},
            env.JWT_SECRET,
            {expiresIn: '1h'}
        );

        res.json({message: 'Login successful', token});
}));

export default router;