import dotenv from 'dotenv';
import express from 'express';
import cookieParser from "cookie-parser"
import conn from "./database/connection.js";
import userRouter from './routes/userRoute.js';

dotenv.config();

//Database Connection
conn();

const app = express();
const port = process.env.PORT

app.use(express.json())
app.use(cookieParser())
app.use(express.urlencoded({extended: true}))

app.use('/api/users', userRouter)

app.listen(port, () => {
    console.log((`Application running on port: ${port}`))
})