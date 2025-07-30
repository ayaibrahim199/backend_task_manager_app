// Import necessary modules
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); 
const app = express();

// Use CORS to allow connections from your frontend
app.use(cors({
    origin: ['http://127.0.0.1:5500', 'https://frontend-task-manager-app.vercel.app'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'], 
    allowedHeaders: ['Content-Type', 'Authorization'] 
}));

// Middleware: Add Express.json() to parse JSON body
app.use(express.json());

// Connect to MongoDB (using Mongoose)
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('MongoDB Connected Successfully!');
    })
    .catch((err) => {
        console.error('MongoDB Connection Error:', err);
    });

// Define a Mongoose Schema and Model for Tasks
const taskSchema = new mongoose.Schema({
    text: {
        type: String,
        required: [true, 'Task text is required!'],
        trim: true,
        maxlength: [100, 'Task text cannot be more than 100 characters']
    },
    completed: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Task = mongoose.model('Task', taskSchema);

// API Routes (CRUD operations using MongoDB)

// GET /api/tasks: Get all tasks
app.get('/api/tasks', async (req, res) => {
    try {
        const tasks = await Task.find({});
        res.status(200).json(tasks);
    } catch (error) {
        console.error("Error fetching tasks:", error);
        res.status(500).json({ message: 'Error fetching tasks', error: error.message });
    }
});

// POST /api/tasks: Add a new task
app.post('/api/tasks', async (req, res) => {
    try {
        const { text } = req.body;
        const newTask = await Task.create({ text });
        res.status(201).json(newTask);
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        console.error("Error adding task:", error);
        res.status(500).json({ message: 'Error adding task', error: error.message });
    }
});

// PUT /api/tasks/:id: Update a task
app.put('/api/tasks/:id', async (req, res) => {
    try {
        const { id: taskId } = req.params;
        const { text, completed } = req.body;

        if (!mongoose.Types.ObjectId.isValid(taskId)) {
            return res.status(400).json({ message: 'Invalid Task ID format' });
        }

        const updatedTask = await Task.findByIdAndUpdate(
            taskId,
            { text, completed },
            { new: true, runValidators: true }
        );

        if (!updatedTask) {
            return res.status(404).json({ message: 'Task not found' });
        }

        res.status(200).json(updatedTask);
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        console.error("Error updating task:", error);
        res.status(500).json({ message: 'Error updating task', error: error.message });
    }
});

// DELETE /api/tasks/:id: Delete a task
app.delete('/api/tasks/:id', async (req, res) => {
    try {
        const { id: taskId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(taskId)) {
            return res.status(400).json({ message: 'Invalid Task ID format' });
        }

        const deletedTask = await Task.findByIdAndDelete(taskId);

        if (!deletedTask) {
            return res.status(404).json({ message: 'Task not found' });
        }

        res.status(200).json({ message: 'Task deleted successfully', task: deletedTask });
    } catch (error) {
        console.error("Error deleting task:", error);
        res.status(500).json({ message: 'Error deleting task', error: error.message });
    }
});

// Start the Express server
const startServer = async () => {
    try {
        await mongoose.connection.once('open', () => {
            console.log('MongoDB connection opened and ready.');
        });
        app.listen(process.env.PORT || 3000, () => {
            console.log(`Server is running on port ${process.env.PORT || 3000}`);
            console.log('API Endpoints:');
            console.log(`- GET /api/tasks`);
            console.log(`- POST /api/tasks`);
            console.log(`- PUT /api/tasks/:id`);
            console.log(`- DELETE /api/tasks/:id`);
        });
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
};

startServer();