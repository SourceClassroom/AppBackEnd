import dotenv from 'dotenv';
import express from 'express';
import cookieParser from "cookie-parser"
import conn from "./database/connection.js";

//Routes
import userRouter from './routes/userRoute.js';
import weekRouter from './routes/weekRoute.js';
import classRouter from './routes/classRoute.js';
import notificationRouter from './routes/notificationRoute.js';


dotenv.config();

//Database Connection
conn();

const app = express();
const port = process.env.PORT

app.use(express.json())
app.use(cookieParser())
app.use(express.urlencoded({extended: true}))
app.use('/api/week', weekRouter)
app.use('/api/users', userRouter)
app.use('/api/class', classRouter)
app.use('/api/notification', notificationRouter)

app.listen(port, () => {
    console.log((`Application running on port: ${port}`))
})