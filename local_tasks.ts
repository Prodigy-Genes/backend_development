import express from 'express';
import type { Request, Response } from 'express';

// Define a task model 
interface Task {
    id: number;
    title: string;
    description: string | null;
    completed: boolean;
}


// Create an array of tasks to use
const tasks : Task[] = [
    { id: 1, title: "Sample Task", description: "This is a sample task", completed: false},
    { id: 2, title: "Another Task", description:null, completed: true}
]

// Create an Express application
const app = express();

// Define the PORT number
const PORT = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Fetch tasks from the array
app.get('/tasks', (req: Request, res: Response) => {
    res.status(200).json(tasks);
});

// Fetch a single task
app.get("/tasks/:id", (req: Request, res: Response) => {
    const id = parseInt(req.params.id as string)
    const task = tasks.find(task => task.id === id)

    if(!task){
        res.status(404).json("{error: 'Task not found'}")
    }
    // Get the tasks
    res.status(200).json({message: 'Task fetched successfully', task:task})
})

// Create a new task
app.post('/tasks', (req: Request, res: Response) =>{
    // We use this to find out the maximum id number so as to not create duplications
    const maxId = tasks.length > 0 ? Math.max(...tasks.map(task => task.id)) : 0 
    const newTask: Task = {
        id: maxId + 1,
        title: req.body.title,
        description: req.body.description || null,
        completed: false
    };
    tasks.push(newTask);
    res.status(201).json(newTask);
});

// Update task
app.put('/tasks/:id', (req: Request, res: Response) => {
    // convert the retrieved id to a number
    const id = parseInt(req.params.id as string);

    // Find the index of the task in the array
    const taskIndex = tasks.findIndex(task => task.id === id)

    // Check if task exists
    if(taskIndex === -1){
        res.status(404).json({error: 'Task not found'})
    }

    const existingTask = tasks[taskIndex] as Task;

    // Update the task
    const updatedTask = {
        ...tasks[taskIndex],
        id: existingTask.id,
        title: req.body.title ?? existingTask.title,
        description: req.body.description ?? existingTask.description,
        completed: req.body.completed ?? existingTask.completed
    };

    tasks[taskIndex] = updatedTask;
    
    res.status(200).json({message: 'Task updated successfully'});
    res.json(updatedTask);
})

// Delete route
app.delete('/tasks/:id', (req: Request, res: Response) => {
    const id = parseInt(req.params.id as string)

    const taskIndex = tasks.findIndex(task => task.id === id)

    if(taskIndex === -1){
        res.status(404).json({error: 'Task not found'})
    }

    // Remove the item from the array
    tasks.splice(taskIndex, 1)

    res.status(200).json({message : 'Task deleted successfully'})
})

app.listen(PORT, () =>{
    console.log(`Server is running at http://localhost:${PORT}`);
})