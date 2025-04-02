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
            // Bildirim türlerine göre tercihler (varsayılan olarak hepsi açık)
            new_assignment: true,
            assignment_graded: true,
            new_announcement: true,
            new_material: true,
            new_comment: true,
            assignment_due_reminder: true,
            submission_reminder: true,
            // Bildirim kanalları için tercihler
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
        enum: ['active', 'inactive', 'suspended', 'pending'],
        default: 'active'
    },
    tokenVersion: {
        type: Number,
        default: 0
    }
}, {timestamps: true});

const User = mongoose.model('User', UserSchema);

export { User };