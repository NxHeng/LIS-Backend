# Legal Information System - Backend

This is the backend of the Legal Information System, built using ExpressJS and MongoDB. It provides API endpoints for managing cases, tasks, users, and documents.

## Prerequisites

Before setting up the project, ensure you have the following installed:

- [Node.js](https://nodejs.org/)
- [MongoDB](https://www.mongodb.com/)
- [Git](https://git-scm.com/)
- **npm** package manager

## Installation Steps

1. **Clone the repository**
   ```
   git clone https://github.com/NxHeng/LIS-Backend.git
   ```
2. **Make sure to navigate into the project folder**

3. **Install dependencies**
   ```
   npm install
   ```
4. **Set up environment variables**\
   Create a `.env` file in the root directory and configure the following variables:
   ```
   PORT=5000 
   MONGO_URI=<your-mongodb-connection-string>  # Connection string for MongoDB database
   JWT_SECRET=<your-secret-key>  # Secret key for signing JWT authentication tokens
   EMAIL_USER=<your-email>  # Email address used for sending notifications
   EMAIL_PASS=<your-email-password>  # Email's app password for authentication
   FRONTEND_URL=http://localhost:5173  
   GOOGLE_PROJECT_ID=<your-google-project-id>  # Google Cloud Project ID
   GOOGLE_APPLICATION_CREDENTIALS=<path-to-your-google-credentials.json>  # Path to Google Cloud service account credentials
   BUCKET_NAME=<your-bucket-name>  # Name of the Google Cloud Storage bucket for file uploads
   ```
   - [Request](https://docs.google.com/document/d/1JRDCyuWEUfdjvmf_ZfIg-ixe6L9pXi9z_0bGDjFGHFQ/edit?usp=sharing) to obtain the credentials as it contains sensitive information.
   - [Download](https://docs.google.com/document/d/1JRDCyuWEUfdjvmf_ZfIg-ixe6L9pXi9z_0bGDjFGHFQ/edit?tab=t.8cn0uyyi1yob) google key file in order to allow GOOGLE_APPLICATION_CREDENTIALS to function properly.

6. **Start the development server**
   ```
   npm run dev
   ```
7. The backend will run on `http://localhost:5000/`


## Contact
For any issues, please contact the project author.
