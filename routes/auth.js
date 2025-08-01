const express = require('express');
const router = express.Router();
const User = require('../models/User'); // استدعاء الـ User Model اللي عملناه
const jwt = require('jsonwebtoken'); // مكتبة الـ JWT

// توليد JWT Token (هذه الدالة هتستخدم في كل من التسجيل والدخول)
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '1h', // صلاحية التوكن ساعة واحدة
    });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
    const { username, password } = req.body; // نستقبل اسم المستخدم وكلمة المرور من الـ body بتاع الـ request

    // 1. التحقق من وجود كل البيانات المطلوبة
    if (!username || !password) {
        return res.status(400).json({ message: 'Please enter all fields' });
    }

    try {
        // 2. التحقق لو فيه مستخدم بنفس اسم المستخدم ده موجود بالفعل
        let user = await User.findOne({ username });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // 3. إنشاء مستخدم جديد
        // الـ password hashing هيتم تلقائيًا بواسطة الـ 'pre' hook في الـ User Model
        user = new User({ username, password });
        await user.save(); // حفظ المستخدم في قاعدة البيانات

        // 4. توليد Token للمستخدم الجديد وتسجيل الدخول تلقائياً
        const token = generateToken(user._id);

        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: user._id,
                username: user.username,
            },
            token, // إرسال الـ token للـ frontend
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
    const { username, password } = req.body; // نستقبل اسم المستخدم وكلمة المرور

    // 1. التحقق من وجود البيانات المطلوبة
    if (!username || !password) {
        return res.status(400).json({ message: 'Please enter all fields' });
    }

    try {
        // 2. البحث عن المستخدم في قاعدة البيانات
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // 3. مقارنة كلمة المرور المدخلة بكلمة المرور المشفرة
        // هنستخدم الدالة اللي عملناها في الـ User Model (matchPassword)
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // 4. لو كلمة المرور صحيحة، نولد Token
        const token = generateToken(user._id);

        res.json({
            message: 'Logged in successfully',
            user: {
                id: user._id,
                username: user.username,
            },
            token, // إرسال الـ token للـ frontend
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;