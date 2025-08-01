const mongoose = require('mongoose');

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
    // **هذا هو الحقل الجديد الذي يربط المهمة بالمستخدم**
    owner: {
        type: mongoose.Schema.Types.ObjectId, // نوع البيانات هو معرف (ID) من MongoDB
        required: true,                     // يجب أن تكون المهمة مرتبطة بمستخدم
        ref: 'User'                         // تشير إلى الـ 'User' model
    }
}, {
    timestamps: true // لإنشاء حقول createdAt و updatedAt تلقائيًا
});

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;