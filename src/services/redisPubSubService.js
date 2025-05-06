/*
import { publisher, subscriber } from "../cache/client/redisClient.js";
import { getSocketServer } from "../sockets/socketInstance.js";
import { getUserSockets } from "../cache/modules/onlineUserModule.js";

// Define Redis channels
const CHANNELS = {
    NEW_MESSAGE: 'channel:new_message',
    MESSAGE_READ: 'channel:message_read',
    TYPING_INDICATOR: 'channel:typing_indicator',
};

/!**
 * Initialize Redis pub/sub subscribers
 * This should be called when the application starts
 *!/
export const initializeSubscribers = () => {
    // Subscribe to the new message channel
    subscriber.subscribe(CHANNELS.NEW_MESSAGE, (err) => {
        if (err) {
            console.error(`Error subscribing to ${CHANNELS.NEW_MESSAGE}:`, err);
        } else {
            console.log(`Subscribed to ${CHANNELS.NEW_MESSAGE}`);
        }
    });

    // Subscribe to the message read channel
    subscriber.subscribe(CHANNELS.MESSAGE_READ, (err) => {
        if (err) {
            console.error(`Error subscribing to ${CHANNELS.MESSAGE_READ}:`, err);
        } else {
            console.log(`Subscribed to ${CHANNELS.MESSAGE_READ}`);
        }
    });

    // Subscribe to the typing indicator channel
    subscriber.subscribe(CHANNELS.TYPING_INDICATOR, (err) => {
        if (err) {
            console.error(`Error subscribing to ${CHANNELS.TYPING_INDICATOR}:`, err);
        } else {
            console.log(`Subscribed to ${CHANNELS.TYPING_INDICATOR}`);
        }
    });

    // Handle incoming messages from Redis channels
    subscriber.on('message', (channel, message) => {
        try {
            const data = JSON.parse(message);
            
            switch (channel) {
                case CHANNELS.NEW_MESSAGE:
                    handleNewMessage(data);
                    break;
                case CHANNELS.MESSAGE_READ:
                    handleMessageRead(data);
                    break;
                case CHANNELS.TYPING_INDICATOR:
                    handleTypingIndicator(data);
                    break;
                default:
                    console.warn(`Received message on unknown channel: ${channel}`);
            }
        } catch (error) {
            console.error(`Error handling Redis message on channel ${channel}:`, error);
        }
    });
};

/!**
 * Publish a new message event to Redis
 * @param {Object} message - The message object
 * @param {Object} conversation - Basic conversation info
 * @param {Array} recipientIds - Array of recipient user IDs
 *!/
export const publishNewMessage = async (message, conversation, recipientIds) => {
    try {
        await publisher.publish(
            CHANNELS.NEW_MESSAGE,
            JSON.stringify({
                message,
                conversation,
                recipientIds
            })
        );
    } catch (error) {
        console.error('Error publishing new message to Redis:', error);
    }
};

/!**
 * Publish a message read event to Redis
 * @param {String} messageId - The message ID
 * @param {String} readBy - User ID who read the message
 * @param {String} conversationId - The conversation ID
 * @param {String} senderId - The original message sender ID
 *!/
export const publishMessageRead = async (messageId, readBy, conversationId, senderId) => {
    try {
        await publisher.publish(
            CHANNELS.MESSAGE_READ,
            JSON.stringify({
                messageId,
                readBy,
                conversationId,
                recipientIds: [senderId]
            })
        );
    } catch (error) {
        console.error('Error publishing message read to Redis:', error);
    }
};

/!**
 * Publish a typing indicator event to Redis
 * @param {String} conversationId - The conversation ID
 * @param {String} userId - The user ID who is typing
 * @param {Boolean} isTyping - Whether the user is typing or stopped typing
 * @param {Array} recipientIds - Array of recipient user IDs
 *!/
export const publishTypingIndicator = async (conversationId, userId, isTyping, recipientIds) => {
    try {
        await publisher.publish(
            CHANNELS.TYPING_INDICATOR,
            JSON.stringify({
                conversationId,
                userId,
                isTyping,
                recipientIds
            })
        );
    } catch (error) {
        console.error('Error publishing typing indicator to Redis:', error);
    }
};

/!**
 * Handle new message events from Redis
 * @param {Object} data - The message data
 *!/
const handleNewMessage = async (data) => {
    try {
        const { message, conversation, recipientIds } = data;
        const io = getSocketServer();
        
        // Emit to each recipient's sockets
        for (const userId of recipientIds) {
            const socketIds = await getUserSockets(userId);
            
            for (const socketId of socketIds) {
                io.to(socketId).emit('new_message', {
                    message,
                    conversation
                });
            }
        }
    } catch (error) {
        console.error('Error handling new message from Redis:', error);
    }
};

/!**
 * Handle message read events from Redis
 * @param {Object} data - The message read data
 *!/
const handleMessageRead = async (data) => {
    try {
        const { messageId, readBy, conversationId, recipientIds } = data;
        const io = getSocketServer();
        
        // Emit to each recipient's sockets
        for (const userId of recipientIds) {
            const socketIds = await getUserSockets(userId);
            
            for (const socketId of socketIds) {
                io.to(socketId).emit('message_read', {
                    messageId,
                    readBy,
                    conversationId
                });
            }
        }
    } catch (error) {
        console.error('Error handling message read from Redis:', error);
    }
};

/!**
 * Handle typing indicator events from Redis
 * @param {Object} data - The typing indicator data
 *!/
const handleTypingIndicator = async (data) => {
    try {
        const { conversationId, userId, isTyping, recipientIds } = data;
        const io = getSocketServer();
        
        // Emit to each recipient's sockets
        for (const userId of recipientIds) {
            const socketIds = await getUserSockets(userId);
            
            for (const socketId of socketIds) {
                io.to(socketId).emit('typing_indicator', {
                    conversationId,
                    userId,
                    isTyping
                });
            }
        }
    } catch (error) {
        console.error('Error handling typing indicator from Redis:', error);
    }
};*/
