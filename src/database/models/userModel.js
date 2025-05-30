import mongoose from "mongoose";
import validator from "validator";
import softDeleteFields from "../fields/softDeleteFields.js";

const { Schema } = mongoose;

const UserSchema = new Schema({
    name: {
        type: String,
        required: true,
        lowercase: true,
    },
    surname: {
        type: String,
        required: true,
        lowercase: true,
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
    // ? Kullanıcın bulundığı sınıfların listelenmesi için
    // ? Öğrenci ise
    enrolledClasses: [{
        type: Schema.Types.ObjectId,
        ref: "Class"
    }],
    // ? Öğretmen ise
    teachingClasses: [{
        type: Schema.Types.ObjectId,
        ref: "Class"
    }],

    // Bildirim tercihleri
    notificationPreferences: {
        type: Object,
        default: {
            new_assignment: true,
            assignment_graded: true,
            new_post: true,
            new_material: true,
            new_lesson: true,
            lesson_reminder: true,
            email_notifications: true,
            push_notifications: true
        }
    },

    // Kullanıcı profil bilgileri
    profile: {
        avatar: { type: Schema.Types.ObjectId, ref: "Attachment"},
        bio: {
            type: String,
            maxlength: [500, "Bio cannot exceed 500 characters"]
        },
        // Öğrenci numarası veya öğretmen ID'si
        institutionId: {
            type: String
        }
    },
    // Son giriş bilgisi
    lastLogin: {
        type: Date,
        default: null
    },
    // Hesap durumu
    accountStatus: {
        type: String,
        enum: ['active', 'inactive', 'suspended', 'pending', 'mailVerification'],
        default: 'active'
    },
    tokenVersion: {
        type: Number,
        default: 0
    },
    mailVerification: {
        type: Boolean,
        default: false
    },
    ...softDeleteFields
}, {timestamps: true});

UserSchema.index({ name: "text", surname: "text" });

const User = mongoose.model('User', UserSchema);

export { User };