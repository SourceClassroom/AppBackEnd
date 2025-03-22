import path from 'path';
import cors from "cors";
import dotenv from 'dotenv';
import express from 'express';
import { fileURLToPath } from 'url';
import cookieParser from "cookie-parser"
import conn from "./database/connection.js";

//Routes
import userRouter from './routes/userRoute.js';
import weekRouter from './routes/weekRoute.js';
import classRouter from './routes/classRoute.js';
import assignmentRouter from './routes/assignmentRoute.js';
import notificationRouter from './routes/notificationRoute.js';

dotenv.config();

//Database Connection
conn();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT

app.use(express.json())
app.use(cors());
app.use(cookieParser())
app.use(express.urlencoded({extended: true}))


app.use('/api/week', weekRouter)
app.use('/api/users', userRouter)
app.use('/api/class', classRouter)
app.use('/api/assignment', assignmentRouter)
app.use('/api/notification', notificationRouter)

app.use('/public', express.static(path.join(__dirname, 'public')));

app.listen(port, () => {
    console.log((`Application running on port: ${port}`))
})