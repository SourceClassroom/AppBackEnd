import mongoose from "mongoose";
import validator from "validator";

const { Schema } = mongoose;

const UserSchema = new Schema({
    name: {
        type: String,
        required: true,
        lowercase: true,
        validate: [validator.isAlphanumeric, "Only Alphanumeric characters"]
    },
    surname: {
        type: String,
        required: true,
        lowercase: true,
        validate: [validator.isAlphanumeric, "Only Alphanumeric characters"]
    },
    email: {
        type: String,
        required: true,
        unique: true,
        validate: [validator.isEmail, "Valid email is required"]
    },
    password: {
        type: String,
        required: true,
        minlength: [8, "Password must be at least 8 characters"],
    },
    role: {
        type: String,
        default: "student",
        enum: ["student", "teacher", "sysadmin"]
    },
    // ? Kullanıcın bulundığu sınıfların listelenmesi için
    // ? Öğrenci ise
    enrolledClasses: [{
        type: Schema.Types.ObjectId,
        ref: "Class"
    }],
    // ? Öğretmen ise
    teachingClasses: [{
        type: Schema.Types.ObjectId,
        ref: "Class"
    }]
})

const User = mongoose.model('User', UserSchema)

export { User }