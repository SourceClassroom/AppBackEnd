import mongoose from "mongoose";

const conn = () => {
    mongoose.connect(process.env.MONGO_URI, {
        dbName: "source_classroom"
    }).then(() => {
        console.log("Connected to the DB succesfully!")
    }).catch((err) => {
        console.log(`DB Connect Error: ${err}`)
    })
}

export default conn;