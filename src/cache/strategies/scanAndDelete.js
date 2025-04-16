import { client } from "../client/redisClient.js";

//TODO  test this thing

export default async (prefix) => {
    try {
        const pattern = `${prefix}*`;
        const keys = await client.keys(pattern);

        if (keys.length > 0) {
            await client.del(keys);
            //console.log(`${keys.length} key silindi.`);
        } else {
            //console.log('Silinecek key bulunamadı.');
        }
    } catch (error) {
        console.error('Hata:', error);
        throw error
    }
}