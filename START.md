# CodeFusion – Fix "Cannot reach server" / ERR_CONNECTION_REFUSED

## What the error means

| Error | Meaning |
|-------|---------|
| `ERR_CONNECTION_REFUSED` on `:5000/api/...` | **Backend is not running** on port 5000 |
| `Cannot reach server. Start the backend on port 5000` | Same – frontend is fine, API server is down |

This is **not** caused by missing Cloudinary keys. Cloudinary is only for profile photo upload.

## What you need in `.env`

### `backend/.env` (required)

| Variable | Required? | Notes |
|----------|-----------|--------|
| `MONGODB_URI` | **YES** | Must connect or server will not start |
| `JWT_SECRET` | **YES** | Any long random string (you already have one) |
| `PORT` | optional | Default `5000` |
| `CLIENT_URL` | optional | `http://localhost:5173` |
| `CLOUDINARY_*` | **NO** for projects/editor | Only for Settings avatar upload |

### `frontend/.env` (required)

```
VITE_API_URL=http://localhost:5000/api
```

## Your current issue

The backend **exits immediately** because MongoDB Atlas `mongodb+srv://` DNS lookup fails on your network:

```
querySrv ECONNREFUSED _mongodb._tcp.cluster0.wofao8i.mongodb.net
```

So port 5000 never opens → browser shows `ERR_CONNECTION_REFUSED`.

## Fix (pick one)

### Option A – Local MongoDB with Docker (fastest)

1. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/)
2. From project root:
   ```powershell
   docker compose up -d
   ```
3. Edit `backend/.env` – set:
   ```
   MONGODB_URI=mongodb://127.0.0.1:27017/codefusion
   ```
4. Start backend:
   ```powershell
   cd backend
   npm run dev
   ```
   You must see: `MongoDB connected` and `Server running on port 5000`

### Option B – Fix MongoDB Atlas

1. Atlas → **Network Access** → Add IP Address → **Allow Access from Anywhere** (`0.0.0.0/0`)
2. Atlas → **Database** → **Connect** → **Drivers** → copy connection string
3. If `mongodb+srv://` fails on your PC, click **"Edit"** and use **Standard connection string** (`mongodb://host:27017/...`)
4. Paste into `MONGODB_URI` in `backend/.env`
5. Restart backend

### Option C – Change DNS (if SRV is blocked)

Windows: Settings → Network → DNS → set to `8.8.8.8` and `8.8.4.4`, then retry backend.

## Run the app (always 2 terminals)

**Terminal 1 – Backend:**
```powershell
cd "c:\Projects\CodeFusion - CodeEditor\backend"
npm run dev
```

**Terminal 2 – Frontend:**
```powershell
cd "c:\Projects\CodeFusion - CodeEditor\frontend"
npm run dev
```

Test backend in browser: http://localhost:5000/api/health → should show `{"status":"ok"}`

Then open http://localhost:5173
