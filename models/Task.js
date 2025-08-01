const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    description: { // تم تعديل الاسم من text إلى description
        type: String,
        required: [true, 'Task description is required!'],
        trim: true,
        maxlength: [100, 'Task text cannot be more than 100 characters']
    },
    completed: {
        type: Boolean,
        default: false
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    }
}, {
    timestamps: true
});

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;