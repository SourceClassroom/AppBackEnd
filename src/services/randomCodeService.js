import {Class} from "../database/models/classModel.js"

function generateCode(length = 6, chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789') {
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