# Backend

The backend of **NestFrames** is built with **Node.js** and **Express.js**. It utilizes **JWT (JSON Web Tokens)** for authentication and **Mongoose** to interact with **MongoDB**. The backend supports real-time messaging and notifications via **Socket.io**, and handles image uploads using **AWS S3** and **Multer**.

## Getting Started

Follow these steps to set up and run the NestFrames backend locally.

### Prerequisites
Before you begin, ensure you have:
- **Git** installed ([Download Git](https://git-scm.com/downloads))
- **Node.js** (LTS version) installed ([Download Node.js](https://nodejs.org/))
- A **MongoDB database** (you can use a local or cloud-based database like MongoDB Atlas)

### Cloning the Repository
To get the backend running on your local machine:
```sh
# Clone the backend repository
git clone https://github.com/YOUR_GITHUB_USERNAME/NestFrames-Backend.git
cd NestFrames-Backend
```
### Setting Up the Environment

Before running the backend server, you'll need to configure some environment variables for the app to work properly.

1. **MongoDB Database**: Make sure you have access to a MongoDB instance:
   - Use a **local MongoDB server** (default connection string: `mongodb://localhost:27017/nestframes`)
   - Or use **MongoDB Atlas** (cloud-based MongoDB service) by creating a database and obtaining your connection string.
2. **AWS Credentials**: To enable AWS S3 image uploads, you need to configure your AWS credentials:
   - Create an IAM user in AWS with the appropriate permissions for S3.
   - Obtain your **AWS Access Key ID** and **AWS Secret Access Key**.
3. **Create the `.env` File**: In the root directory of the project, create a `.env` file with the following environment variables:

- `MONGO_URI`: The URI for your MongoDB database. If you're using MongoDB Atlas, this will be the connection string provided by Atlas.
- `JWT_SECRET`: A secret key for signing JWT tokens. You should replace `your_secret_key` with a strong and unique key.
- `AWS_ACCESS_KEY_ID`: Your AWS Access Key ID for accessing AWS services.
- `AWS_SECRET_ACCESS_KEY`: Your AWS Secret Access Key for accessing AWS services.

3. **Install Dependencies**: After setting up the `.env` file, run the following command to install the project dependencies:

```sh
npm install
```
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

### Real-Time Features

- **Socket.io**: Real-time messaging and notifications are powered by **Socket.io**. The backend listens for events like `sendMessage` and `sendNotification` to push updates to the frontend instantly.

### Security

- **JWT Authentication**: The app uses JWTs to ensure secure user sessions.
- **Password Hashing**: User passwords are hashed with **bcrypt** before being stored in the database.
