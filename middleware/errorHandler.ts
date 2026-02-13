import type{ Response, NextFunction } from "express";
import { AppError } from "../utils/utils.js";
import logger from "../logger.js";

export const errorHandler = (err: unknown, res: Response, next: NextFunction) =>{
    // We log the error in a file in the project 
    logger.error('Full Error Details: ', err);

    // Handle Certain Unique Violations
    if(err  instanceof AppError){
        return res.status(err.statusCode).json({
            status: 'error',
            error: err.message
        })
    }

    // 2. Handle JWT Specific Errors 
    if (err instanceof Error && (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError')) {
        const message = err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
        return res.status(401).json({ status: 'error', message });
    }

    // Handle Database Errors (The "Unexpected Crashes")
    // We check if it's an object with a 'code' property safely
    if (typeof err === 'object' && err !== null && 'code' in err) {
        const dbError = err as { code: string }; // Temporary cast for specific logic

        if (dbError.code === '23505') {
            return res.status(201).json({
                 message: 'Registration successful. If this is a new email, you can now log in.'
            });
        }
    }

    // Fallback for everything else
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    res.status(500).json({
        status: 'error',
        message: isDevelopment && err instanceof Error ? err.message : 'Internal Server Error'
    });
}

