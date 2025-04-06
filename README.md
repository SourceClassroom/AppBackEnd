# Source Classroom: A Modern Learning Management System API

Source Classroom is a comprehensive learning management system (LMS) API that enables educational institutions to create, manage, and deliver online courses efficiently. It provides a robust backend infrastructure for managing classes, assignments, submissions, and student-teacher interactions with real-time notifications and file management capabilities.

The system is built using Node.js and Express.js, featuring a MongoDB database for data persistence and Redis for caching. It implements role-based access control, secure file uploads, and JWT-based authentication to ensure secure and controlled access to educational resources. The API supports essential LMS features including class management, weekly course scheduling, assignment submissions, grading, and announcements, making it suitable for both synchronous and asynchronous learning environments.

## Repository Structure
```
src/
├── controller/         # Business logic for handling API requests
│   ├── userController.js         # User authentication and profile management
│   ├── classController.js        # Class creation and management
│   ├── assignmentController.js   # Assignment handling
│   └── submissionController.js   # Submission processing and grading
├── database/          # Database configuration and models
│   ├── mongodbConnection.js            # MongoDB connection setup
│   └── models/                  # Mongoose schemas and models
├── middlewares/       # Request processing middleware
│   ├── authMiddleware.js        # JWT authentication
│   ├── roleCheck.js            # Role-based access control
│   └── upload.js               # File upload handling
├── routes/           # API route definitions
│   ├── userRoute.js            # User-related endpoints
│   ├── classRoute.js           # Class management endpoints
│   └── assignmentRoute.js      # Assignment endpoints
├── services/         # Reusable business logic
│   ├── jwtService.js           # JWT token management
│   ├── cacheService.js         # Redis caching logic
│   └── fileService.js          # File processing
└── utils/            # Helper functions and constants
    ├── apiResponse.js          # Standardized API responses
    └── validator.js            # Request validation rules
```

## Usage Instructions
### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- Redis (v6 or higher)
- npm or yarn package manager

### Installation
1. Clone the repository:
```bash
git clone <repository-url>
cd source-classroom
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start Redis server:
```bash
# MacOS
brew services start cache
# Linux
sudo service cache-server start
# Windows
cache-server
```

5. Start the application:
```bash
# Development mode
npm run dev

# Production mode
npm start
```

### Quick Start
1. Create a new user account:
```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"name": "John", "surname": "Doe", "email": "john@example.com", "password": "Password123", "role": "teacher"}'
```

2. Login to get authentication token:
```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email": "john@example.com", "password": "Password123"}'
```

3. Create a new class:
```bash
curl -X POST http://localhost:3000/api/class/create \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{"title": "Mathematics 101"}'
```

### More Detailed Examples
1. Creating and managing assignments:
```bash
# Create a new assignment
curl -X POST http://localhost:3000/api/assignment/create \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "classId": "<class-id>",
    "title": "Midterm Assignment",
    "description": "Complete chapters 1-5",
    "dueDate": "2024-03-01T23:59:59Z"
  }'
```

2. Submitting assignments:
```bash
# Submit an assignment
curl -X POST http://localhost:3000/api/submission/submit \
  -H "Authorization: Bearer <your-token>" \
  -F "files=@assignment.pdf" \
  -F "assignmentId=<assignment-id>" \
  -F "description=My submission"
```

### Troubleshooting
1. Authentication Issues
- Error: "Token validation failed"
  - Check token expiration
  - Ensure token is included in Authorization header
  - Verify JWT_SECRET in .env matches the one used to generate tokens

2. File Upload Issues
- Error: "File size too large"
  - Check file size limits in upload middleware
  - Default limit is 1GB per file
  - Modify limits in upload.js if needed

3. Database Connection Issues
- Error: "MongoDB connection failed"
  - Verify MongoDB is running
  - Check MONGO_URI in .env
  - Ensure network connectivity to MongoDB server

## Data Flow
The application follows a request-response cycle with caching and authentication layers for optimized performance and security.

```ascii
Client Request → Authentication → Role Check → Controller → Service Layer → Cache/Database
     ↑                                                                          ↓
     └──────────────── API Response ←────────────── Data Transformation ←──────┘
```

Key component interactions:
1. Requests are first authenticated using JWT tokens
2. Role-based middleware validates user permissions
3. Controllers handle business logic and coordinate services
4. Services manage data operations and external integrations
5. Redis cache improves response times for frequently accessed data
6. MongoDB provides persistent storage for all application data
7. File uploads are processed and stored in the filesystem
8. Real-time notifications are handled through the notification service