const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // مكتبة تشفير كلمات المرور

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true, // عشان مفيش اتنين مستخدمين بنفس اسم المستخدم
        trim: true,
        minlength: 3
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    }
}, {
    timestamps: true // عشان MongoDB يضيف حقلين للتاريخ (createdAt, updatedAt)
});

// --- (Pre-save Hook) تشفير كلمة المرور قبل حفظها في قاعدة البيانات ---
// الـ 'pre' hook دي بتشتغل قبل ما أي مستخدم جديد يتحفظ أو يتعدل
UserSchema.pre('save', async function(next) {
    // لو كلمة المرور مش اتغيرت، خلاص عدي (أو لو المستخدم جديد ومفيش كلمة مرور أصلاً)
    if (!this.isModified('password')) {
        return next();
    }

    try {
        // توليد "salt" (سلسلة عشوائية بتضاف لكلمة المرور قبل التشفير عشان تزيد الأمان)
        const salt = await bcrypt.genSalt(10); // 10 هنا هو عدد مرات التشفير (كل ما يزيد كل ما يكون آمن أكتر بس أبطأ)
        // تشفير كلمة المرور
        this.password = await bcrypt.hash(this.password, salt);
        next(); // كمل عملية الحفظ
    } catch (err) {
        next(err); // لو فيه خطأ، ابعت الخطأ
    }
});

// --- (Method for Password Comparison) دالة لمقارنة كلمة المرور بعد التشفير ---
// دي دالة هنعملها لـ User model عشان نقارن كلمة المرور اللي يدخلها المستخدم بكلمة المرور المشفرة في الـ DB
UserSchema.methods.matchPassword = async function(enteredPassword) {
    // بتقارن كلمة المرور اللي المستخدم دخلها بالكلمة المشفرة اللي متخزنة في الـ DB
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', UserSchema);

module.exports = User;