# Backend

The backend of **NestFrames** is built with **Node.js** and **Express.js**. It utilizes **JWT (JSON Web Tokens)** for authentication and **Mongoose** to interact with **MongoDB**. The backend supports real-time messaging and notifications via **Socket.io**, and handles image uploads using **AWS S3** and **Multer**.

## Features

- **Authentication**: Users authenticate using **JWTs** to securely manage user sessions.
- **Database Models**: The backend uses **Mongoose** to manage the following schemas:
  - **User**: Stores user details like username, email, hashed password, profile information, etc.
  - **Album**: Represents user-created albums with metadata and associated photos.
  - **Post**: Stores user posts, including text and photo content.
  - **Photo**: Stores individual photos within albums or posts.
  - **Conversation**: Manages private messaging between users with real-time capabilities.
  - **Notification**: Handles notifications for various events like new messages or friend requests.
  
- **Real-Time Messaging**: Using **Socket.io**, the app supports real-time messaging with events like `sendMessage` and `sendNotification`.
  
- **File Uploads**: The app supports file uploads for photos via **Multer**, which stores the images in **AWS S3** for persistent storage.

- **Error Handling**: Errors are caught and managed using **try-catch** blocks. Custom error messages are returned to ensure users receive clear and actionable feedback.

- **Security**: Sensitive user information such as passwords is securely stored by hashing passwords with **bcrypt**.



## API Endpoints

All routes except public ones require a token. Use the `verifyToken` middleware to validate requests.

The backend exposes several RESTful API endpoints to interact with the frontend:

---

### Album Routes

#### `GET /album/get/popular`
Returns the top 6 popular albums sorted by views.

#### `GET /album/:albumId`
Get a specific album by its ID.

#### `POST /album/Create`
Create a new album with cover photo, photos, and posts.

#### `PATCH /album/:id/name`
Update the album name by its ID.

#### `PATCH /album/:id/collaborators`
Add new collaborators to an album.

#### `POST /album/:id/accept-request`
Accept an album collaboration request.

#### `POST /album/:id/decline-request`
Decline an album collaboration request.

---

### Messaging Routes

#### `GET /message/:userId`
Get all conversations for a specific user by their ID.

#### `GET /message/:userUsername/with/:receiverUsername`
Get the conversation between two users.

#### `GET /message/Conversation/:conversationId`
Get a conversation by its ID.

#### `POST /message/:id`
Start a new conversation between two users.

### Real-Time Features

- **Socket.io**: Real-time messaging and notifications are powered by **Socket.io**. The backend listens for events like `sendMessage` and `sendNotification` to push updates to the frontend instantly.

### Security

- **JWT Authentication**: The app uses JWTs to ensure secure user sessions.
- **Password Hashing**: User passwords are hashed with **bcrypt** before being stored in the database.
