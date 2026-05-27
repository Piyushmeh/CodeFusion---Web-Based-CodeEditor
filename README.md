# CodeFusion

A production-ready MERN stack code editor and project management platform with dark neon purple UI.

## Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, Framer Motion, Monaco Editor, Axios
- **Backend:** Node.js, Express, MongoDB, Mongoose, JWT, Cloudinary
- **Auth:** JWT + bcrypt

## Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Cloudinary account (for profile uploads)

## Installation

### 1. Clone and install dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 2. Backend environment

Copy `backend/.env.example` to `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/codefusion
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 3. Frontend environment

Copy `frontend/.env.example` to `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

### 4. Run the app

**Terminal 1 – Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 – Frontend:**
```bash
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Sign up |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Current user |
| PUT | `/api/users/profile` | Update profile |
| POST | `/api/users/avatar` | Upload avatar |
| GET | `/api/projects` | List projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/stats` | Dashboard stats |
| GET | `/api/files/project/:id` | List files |
| PUT | `/api/files/:id/save` | Save file content |
| GET | `/api/teams` | List teams |
| POST | `/api/teams` | Create team |

## Features

- JWT authentication with protected routes
- Project CRUD with real boilerplate files per language
- Monaco code editor with tabs and auto-save
- Profile settings with Cloudinary image upload
- Teams with invite system
- Activity logging
- Responsive dark neon UI

## Project Structure

```
CodeFusion/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   └── server.js
└── frontend/
    └── src/
        ├── api/
        ├── components/
        ├── context/
        ├── pages/
        └── utils/
```

## Production Build

```bash
cd frontend
npm run build

cd ../backend
npm start
```

Serve `frontend/dist` via your host or set `CLIENT_URL` to your production domain.
