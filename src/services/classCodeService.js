import {Class} from "../database/models/classModel.js"

const length = 6;
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function generateCode() {
    let code = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * chars.length);
        code += chars[randomIndex];
    }
    return code;
}

async function generateUniqueCode() {
    let code;
    let isUnique = false;

    while (!isUnique) {
        code = generateCode();
        const exists = await Class.findOne({ code });
        if (!exists) {
            isUnique = true;
        }
    }
    return code;
}

export { generateUniqueCode, generateCode };