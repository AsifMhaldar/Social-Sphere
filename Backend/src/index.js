const express = require('express');
const app = express();
require('dotenv').config();
const main = require('./config/db');
const cookieParser = require('cookie-parser');
const authRouter = require('./routes/user.routes');
const redisClient = require('./config/redis');
const cors = require('cors');
const postRouter = require('./routes/post.route');
const profileRouter = require('./routes/profile.routes');


app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.use('/uploads', express.static('uploads'));

app.use('/user', authRouter);
app.use('/posts', postRouter);
app.use('/profile', profileRouter);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

const initializedConnection = async () => {
    try {
        // Connect to MongoDB
        await main();
        console.log("✅ MongoDB connected...");
        
        // Connect to Redis
        await redisClient.connect();
        console.log("✅ Redis connected...");
        
        // Start server
        const PORT = process.env.PORT;
        app.listen(PORT, () => {
            console.log(`✅ Server listening at http://localhost:${PORT}`);
        });

    } catch(err) {
        console.error("❌ Connection Error:", err.message);
        console.error("Full Error:", err);
        process.exit(1);
    }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Rejection:', err);
    process.exit(1);
});

initializedConnection();