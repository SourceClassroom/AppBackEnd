import {client} from "../client/redisClient.js";

const VERIFICATION_KEY = (mail) => `code:${mail}`;

export const getVerificationCode = async (mail) => {
    try {
        return await client.get(VERIFICATION_KEY(mail));
    } catch (error) {
        console.error('Redis get error:', error);
        throw error;
    }
};

export const setVerificationCode = async (mail, code) => {
    try {
        //return await client.set(VERIFICATION_KEY(mail), code, 'EX', 5 * 60);
        await client.setEx(VERIFICATION_KEY(mail), 5 * 60, code)
    } catch (error) {
        console.error('Redis set error:', error);
        throw error;
    }
};