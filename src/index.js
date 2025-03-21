import dotenv from 'dotenv';
import conn from "./database/connection.js";

dotenv.config();

conn();