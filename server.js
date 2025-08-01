// (1) Import necessary modules
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { protect } = require('./middleware/authMiddleware');

// (2) Load environment variables
dotenv.config();

// (3) Create Express app
const app = express();

// (4) Import Models
const User = require('./models/User');
const Task = require('./models/Task');

// (5) Middleware
// Cors middleware (This must come first to handle pre-flight requests)
app.use(cors({
    origin: ['http://127.0.0.1:5500', 'https://frontend-task-manager-app.vercel.app'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// express.json() middleware (This parses the request body)
app.use(express.json());

// Diagnostic log middleware
app.use((req, res, next) => {
    console.log(`Incoming Request: ${req.method} ${req.url}`);
    if (req.method === 'POST' || req.method === 'PUT') {
        console.log('Request Body:', req.body);
    }
    next();
});

// (6) Database Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('MongoDB Connected Successfully!');
    })
    .catch((err) => {
        console.error('MongoDB Connection Error:', err);
        process.exit(1);
    });

// (7) Define Routes
app.use('/api/auth', require('./routes/auth'));

// Task routes (now protected)
app.get('/api/tasks', protect, async (req, res) => {
    try {
        const tasks = await Task.find({ owner: req.user });
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching tasks', error: error.message });
    }
});

app.post('/api/tasks', protect, async (req, res) => {
    const { text } = req.body;
    if (!text) {
        return res.status(400).json({ message: 'Task text is required' });
    }
    try {
        const newTask = new Task({
            text,
            owner: req.user
        });
        await newTask.save();
        res.status(201).json(newTask);
    } catch (error) {
        res.status(500).json({ message: 'Error creating task', error: error.message });
    }
});

app.put('/api/tasks/:id', protect, async (req, res) => {
    const { id } = req.params;
    const { text, completed } = req.body;
    try {
        const task = await Task.findById(id);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        if (task.owner.toString() !== req.user) {
            return res.status(401).json({ message: 'Not authorized to update this task' });
        }

        task.text = text !== undefined ? text : task.text;
        task.completed = completed !== undefined ? completed : task.completed;
        await task.save();

        res.json(task);
    } catch (error) {
        res.status(500).json({ message: 'Error updating task', error: error.message });
    }
});

app.delete('/api/tasks/:id', protect, async (req, res) => {
    const { id } = req.params;
    try {
        const task = await Task.findById(id);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        if (task.owner.toString() !== req.user) {
            return res.status(401).json({ message: 'Not authorized to delete this task' });
        }

        await Task.findByIdAndDelete(id);
        res.status(200).json({ message: 'Task deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting task', error: error.message });
    }
});

// (8) Start the Express server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log('API Endpoints:');
    console.log(`- POST /api/auth/register`);
    console.log(`- POST /api/auth/login`);
    console.log(`- GET /api/tasks (currently unprotected)`);
    console.log(`- POST /api/tasks (currently unprotected)`);
    console.log(`- PUT /api/tasks/:id (currently unprotected)`);
    console.log(`- DELETE /api/tasks/:id (currently unprotected)`);
});