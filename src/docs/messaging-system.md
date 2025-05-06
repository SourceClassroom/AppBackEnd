# Real-Time Messaging System

This document provides an overview of the real-time messaging system implemented in the application.

## Features

- One-to-one messaging
- Group messaging
- Real-time message delivery
- Typing indicators
- Read receipts
- Message history
- Offline message delivery

## API Endpoints

### Conversations

#### Create a conversation
```
POST /api/conversation
```
**Request Body:**
```json
{
  "participants": ["userId1", "userId2"],
  "isGroup": false,
  "groupName": "Optional Group Name"
}
```

#### Get user conversations
```
GET /api/conversation
```

#### Get a conversation by ID
```
GET /api/conversation/:id
```

#### Add a participant to a group conversation
```
POST /api/conversation/participant/add
```
**Request Body:**
```json
{
  "conversationId": "conversationId",
  "userId": "userId"
}
```

#### Remove a participant from a group conversation
```
POST /api/conversation/participant/remove
```
**Request Body:**
```json
{
  "conversationId": "conversationId",
  "userId": "userId"
}
```

#### Delete a conversation
```
DELETE /api/conversation/:id
```

### Messages

#### Send a message
```
POST /api/message
```
**Request Body:**
```json
{
  "conversationId": "conversationId",
  "content": "Message content",
  "attachments": ["attachmentId1", "attachmentId2"]
}
```

#### Get messages for a conversation
```
GET /api/message/:conversationId?limit=50&skip=0
```

#### Mark a message as read
```
PUT /api/message/read/:messageId
```

#### Delete a message
```
DELETE /api/message/:messageId
```

## Socket.IO Events

### Client to Server

#### Send a message
```javascript
socket.emit('send_message', {
  conversationId: 'conversationId',
  content: 'Message content',
  attachments: ['attachmentId1', 'attachmentId2']
});
```

#### Typing indicator
```javascript
socket.emit('typing', {
  conversationId: 'conversationId',
  isTyping: true // or false when stopped typing
});
```

#### Mark a message as read
```javascript
socket.emit('mark_read', {
  messageId: 'messageId'
});
```

### Server to Client

#### New message received
```javascript
socket.on('new_message', (data) => {
  // data.message - The new message
  // data.conversation - Basic conversation info
});
```

#### Message sent confirmation
```javascript
socket.on('message_sent', (data) => {
  // data.message - The sent message
});
```

#### Typing indicator
```javascript
socket.on('typing_indicator', (data) => {
  // data.conversationId - The conversation ID
  // data.userId - The user who is typing
  // data.isTyping - Whether the user is typing or stopped typing
});
```

#### Message read
```javascript
socket.on('message_read', (data) => {
  // data.messageId - The message ID
  // data.readBy - The user who read the message
  // data.conversationId - The conversation ID
});
```

#### Error
```javascript
socket.on('error', (data) => {
  // data.message - The error message
});
```

## Usage Example

### Frontend Example (JavaScript)

```javascript
// Connect to Socket.IO server
const socket = io('http://your-server-url', {
  auth: {
    token: 'your-jwt-token'
  }
});

// Send a message
socket.emit('send_message', {
  conversationId: 'conversationId',
  content: 'Hello, world!'
});

// Listen for new messages
socket.on('new_message', (data) => {
  console.log('New message:', data.message);
});

// Send typing indicator
socket.emit('typing', {
  conversationId: 'conversationId',
  isTyping: true
});

// Listen for typing indicators
socket.on('typing_indicator', (data) => {
  if (data.isTyping) {
    console.log(`User ${data.userId} is typing...`);
  } else {
    console.log(`User ${data.userId} stopped typing`);
  }
});

// Mark a message as read
socket.emit('mark_read', {
  messageId: 'messageId'
});

// Listen for read receipts
socket.on('message_read', (data) => {
  console.log(`Message ${data.messageId} was read by ${data.readBy}`);
});
```

## Database Models

### Conversation Model
```javascript
{
  participants: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
  isGroup: { type: Boolean, default: false },
  groupName: { type: String },
  lastMessage: { type: Schema.Types.ObjectId },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date }
}
```

### Message Model
```javascript
{
  conversation: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
  sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String, required: true },
  attachments: [{ type: Schema.Types.ObjectId, ref: "Attachment" }],
  readBy: { type: Schema.Types.ObjectId, ref: "User" },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  createdAt: { type: Date },
  updatedAt: { type: Date }
}
```