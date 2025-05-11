import path from 'path';
import cors from "cors";
import dotenv from 'dotenv';
import helmet from "helmet"
import express from 'express';
import { fileURLToPath } from 'url';
import { createServer } from "http";
import cookieParser from "cookie-parser"
import initQueues from './queue/initQueues.js';
import socketHandler from "./sockets/socketIndex.js";
import conn from "./database/client/mongodbConnection.js";
import hostnameCheck from "./middlewares/hostnameCheck.js";
import {redisConnect} from "./cache/client/redisClient.js";

//Routes
import userRouter from './routes/userRoute.js';
import weekRouter from './routes/weekRoute.js';
import postRouter from './routes/postRoute.js';
import adminRouter from './routes/adminRoute.js';
import classRouter from './routes/classRoute.js';
import eventRouter from './routes/eventRoute.js';
import healthRoute from "./routes/healthRoute.js";
import lessonRouter from "./routes/lessonRoute.js";
import commentRoute from "./routes/commentRoute.js";
import messageRoute from "./routes/messageRoute.js";
import materialRoute from "./routes/materialRoute.js";
import attachmentRoute from './routes/attachmentRoute.js'
import assignmentRouter from './routes/assignmentRoute.js';
import submissionRouter from './routes/submissionRoute.js';
import conversationRouter from "./routes/conversationRoute.js";
import notificationRouter from './routes/notificationRoute.js';


dotenv.config();

//Database Connection
conn();

//Redis connection
redisConnect()

//Init Queues
initQueues();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT

const httpServer = createServer(app); // Express'i HTTP serverla sarmalıyoruz

app.use(hostnameCheck)

app.use(helmet())
app.use(express.json())
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()),
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true
}));
app.use(cookieParser())
app.use(express.urlencoded({extended: true}))


app.use('/api/week', weekRouter)
app.use('/api/post', postRouter)
app.use('/api/users', userRouter)
app.use('/api/admin', adminRouter)
app.use('/api/class', classRouter)
app.use('/api/event', eventRouter)
app.use('/api/health', healthRoute)
app.use('/api/lesson', lessonRouter)
app.use('/api/comment', commentRoute)
app.use('/api/message',  messageRoute)
app.use('/api/material', materialRoute)
app.use('/api/attachment', attachmentRoute)
app.use('/api/assignment', assignmentRouter)
app.use('/api/submission', submissionRouter)
app.use('/api/conversation', conversationRouter)
app.use('/api/notification', notificationRouter)

//app.use('/public', express.static(path.join(__dirname, 'public')));

socketHandler(httpServer);

httpServer.listen(port, () => {
    console.log(`Application running on port: ${port}`);
});