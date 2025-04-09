import path from 'path';
import cors from "cors";
import dotenv from 'dotenv';
import express from 'express';
import { fileURLToPath } from 'url';
import cookieParser from "cookie-parser"
import conn from "./database/client/mongodbConnection.js";
import {redisConnect} from "./cache/client/redisClient.js";
import hostnameCheck from "./middlewares/hostnameCheck.js"

//Routes
import userRouter from './routes/userRoute.js';
import weekRouter from './routes/weekRoute.js';
import postRouter from './routes/postRoute.js';
import classRouter from './routes/classRoute.js';
import commentRoute from "./routes/commentRoute.js";
import attachmentRoute from './routes/attachmentRoute.js'
import assignmentRouter from './routes/assignmentRoute.js';
import submissionRouter from './routes/submissionRoute.js';
import notificationRouter from './routes/notificationRoute.js';


dotenv.config();

//Database Connection
conn();

//Redis connection
redisConnect()

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT

app.use(hostnameCheck)

app.use(express.json())
app.use(cors());
app.use(cookieParser())
app.use(express.urlencoded({extended: true}))


app.use('/api/week', weekRouter)
app.use('/api/post', postRouter)
app.use('/api/users', userRouter)
app.use('/api/class', classRouter)
app.use('/api/comment', commentRoute)
app.use('/api/attachment', attachmentRoute)
app.use('/api/assignment', assignmentRouter)
app.use('/api/submission', submissionRouter)
app.use('/api/notification', notificationRouter)

//app.use('/public', express.static(path.join(__dirname, 'public')));

app.listen(port, () => {
    console.log((`Application running on port: ${port}`))
})