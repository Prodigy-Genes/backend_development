import type {NextFunction, Request, Response } from 'express';
import pool from './db.js';
import { authGate } from './auth.js';
import type{ AuthRequest } from './auth.js';
import { Router } from 'express';
import { AppError, asyncHandler } from './utils/utils.js';
import { createTaskSchema, updateTaskSchema } from './tasks_schema.js';
import { validate } from './middleware/validate.js';



// Define a task model
interface Task{
    id: number;
    title: string;
    description: string | null;
    completed: boolean;
}

// Add a total_count parameter to find out how many tasks a user mighht have
interface TaskWithCount extends Task{
    total_count: number;
}

const router : Router = Router();

// Fetching tasks from the table
router.get('/tasks', authGate, asyncHandler( async(req: AuthRequest, res: Response) => {

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    // Calculate the offset
    const offset = (page - 1) * limit;

    const userId = req.user?.userId;
    const result = await pool.query<TaskWithCount>(
        `
        SELECT *, 
        COUNT(*) OVER() AS total_count 
        FROM tasks 
        WHERE user_id = $1 
        ORDER BY id 
        ASC LIMIT $2 OFFSET $3
        `, 
        
        [userId, limit, offset]
    );


    if(result.rows.length === 0){
        throw new AppError('No tasks found', 404);
    }        
    res.status(200).json({
        page,
        limit,
        data: result.rows
    });
    
}));

// Fetching a single task
router.get('/tasks/:id', authGate, asyncHandler(async(req: AuthRequest, res: Response) => {
    const id = parseInt(req.params.id as string);
    const userId = req.user?.userId;

        const query = 'SELECT * FROM tasks WHERE user_id =$1 AND id = $2';

        const result = await pool.query<Task>(query, [userId, id]);
        
        if(result.rows.length === 0){
            throw new AppError('Task not found', 404);
        }

        res.status(200).json(result.rows[0]);
    
}))

// Adding tasks to the table on supabase
router.post('/tasks', authGate, validate(createTaskSchema),  asyncHandler(async(req: AuthRequest,  res: Response) => {
    const {title, description} = req.body;

    const userId = req.user?.userId;
        const query = 'INSERT INTO tasks (title, description, user_id)  VALUES ($1, $2, $3 ) RETURNING *';
        
        const result = await pool.query<Task>(query, [title, description, userId]);
    

        res.status(201).json(result.rows[0]);
}));

// Update tasks
router.put('/tasks/:id', authGate, validate(updateTaskSchema), asyncHandler(async(req: AuthRequest, res: Response) => {
    const id = parseInt(req.params.id as string);
    const userId = req.user?.userId;
    // fields to update
    const updates = req.body;

    // Get the names of the fields, say; title.
    const keys = Object.keys(updates);

    if(keys.length === 0){
        throw new AppError('Atleast one field must be provided for an update', 400);
    }

    //Build the SET clause: "title = $1, completed = $2"
    //Using index + 1 because Postgres placeholders start at $1
    const setClause = keys
        .map((key, index) => `${key} = $${index + 1}`)
        .join(', ');

    // Collect the values in the same order as the keys 
    const values = keys.map(key => updates[key]);

    // Add the UserID and TaskID as the final parameters
    // Their placeholder numbers will be after the dynamic values

    const userIdPlaceholder = `$${values.length + 1}`;
    const taskIdPlaceholder = `$${values.length + 2}`;
    
    values.push(userId, id);

    const query = `
    UPDATE tasks SET ${setClause} 
    WHERE user_id = ${userIdPlaceholder} 
    AND id = ${taskIdPlaceholder} 
    RETURNING *
    `

    const result = await pool.query<Task>(query, values);
      if(result.rows.length === 0){
        throw new AppError('Task not found', 404);
    }

      res.status(200).json(result.rows[0]);
}));


// Delete a task
router.delete('/tasks/:id', authGate, asyncHandler(async(req: AuthRequest, res: Response) => {
    const id = parseInt(req.params.id as string);
    const userId = req.user?.userId;
      const query = 'DELETE FROM tasks WHERE user_id = $1 AND id = $2 RETURNING *';

      const result = await pool.query<Task>(query, [userId,id]);

      if(result.rows.length === 0){
        throw new AppError('Task not found', 404);
      }

      res.status(200).json({message:'Task deleted successfully', result: result.rows[0]});

}));

export default router