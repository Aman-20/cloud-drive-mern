# PersonalDrive

A personal cloud drive built with the MERN stack. Sign up with email OTP verification, upload your images, documents, audio and video, and manage them from anywhere. Every file is private to the account that uploaded it.

**Live:** [https://drive.amancode.in](https://drive.amancode.in)

## Features

- **Email OTP signup**: new accounts must verify their email with a 6 digit code before they can log in.
- **Login and logout** with a JWT stored in an `httpOnly` cookie (1 hour expiry).
- **Forgot and reset password** through an emailed reset link. Resetting a password logs out every older session.
- **Upload files**: single upload, or up to 5 files at once, 5 MB each. In a multi file upload, one failure does not stop the rest.
- **File type validation** twice: first by the declared MIME type, then by sniffing the real file contents with `file-type`.
- **My Files page** with a thumbnail grid, pagination (12 per page), open in a new tab, delete one file, or select many and delete them together.
- **Private by design**: every file query is scoped to the logged in owner.
- **Abuse protection**: per IP rate limits, per account OTP, reset and login attempt limits, a 60 second OTP resend cooldown, and OTPs that expire after 10 minutes with at most 5 tries.
- **Security headers** with Helmet, bcrypt password hashing, and a CORS allowlist for the frontend origin.

### Supported file types

| Category | Formats |
| --- | --- |
| Images | PNG, JPEG, GIF, WebP, SVG |
| Audio | MP3, WAV, OGG, AAC |
| Video | MP4, WebM, AVI, MPEG |
| Documents | PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX |

## Tech stack

| Layer | Tools |
| --- | --- |
| Frontend | React 19, React Router 7, Vite, CSS Modules |
| Backend | Node.js, Express 5 |
| Database | MongoDB with Mongoose |
| File storage | Cloudinary |
| Email | Resend |
| Auth | JWT, bcrypt, cookie-parser |
| Upload handling | Multer, file-type |
| Hardening | Helmet, express-rate-limit, CORS |

## Project structure

```
cloud-drive-mern/
├── backend/
│   ├── config/         # MongoDB and Cloudinary setup
│   ├── controller/     # user.js (auth flows), file.js (upload, list, delete)
│   ├── middleware/     # auth check, multer, rate limits, error handler
│   ├── model/          # User, Otp, File schemas
│   ├── router/         # /user, /file and static routes
│   ├── service/        # JWT, password hashing, OTP and token generation, mailer
│   ├── localUploads/   # temporary folder, files are removed after upload
│   └── index.js        # server entry point
└── frontend/
    ├── public/         # favicon and Open Graph image
    ├── src/
    │   ├── Component/  # Signup, Login, VerifyOtp, ForgotPass, ResetPass,
    │   │               # Upload, Files, HomePage, Navbar, route guards
    │   ├── config.js   # reads the backend URL from the environment
    │   └── App.jsx     # routes
    ├── index.html
    └── vercel.json     # SPA rewrite for Vercel
```

## Getting started

### Prerequisites

- Node.js 20.19 or newer (required by Vite 8)
- A MongoDB database (local or [Atlas](https://www.mongodb.com/atlas))
- A [Cloudinary](https://cloudinary.com) account
- A [Resend](https://resend.com) account with a verified sending domain

### 1. Clone the repo

```bash
git clone https://github.com/Aman-20/cloud-drive-mern.git
cd cloud-drive-mern
```

### 2. Set up the backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=3000
MONGO_URL=mongodb+srv://<user>:<password>@<cluster>/?retryWrites=true&w=majority
JWT_SECRET=replace_with_a_long_random_string
FRONTEND_URL=http://localhost:5173

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=PersonalDrive <no-reply@yourdomain.com>
```

Start the server:

```bash
npm start
```

The API runs on `http://localhost:3000`. The database name used is `dashboard`.

### 3. Set up the frontend

```bash
cd ../frontend
npm install
```

`frontend/.env` should point at the backend:

```env
VITE_BACKEND_URL=http://localhost:3000
```

Start the dev server:

```bash
npm run dev
```

Open `http://localhost:5173`.

### Running locally over HTTP

The auth cookie is set with `secure: true` and `sameSite: "none"`, which is what you need when the frontend and backend live on different domains in production. Browsers treat `localhost` as a secure context, so this works in Chrome and Firefox, but Safari may refuse the cookie over plain HTTP. If that happens, switch the cookie options in `backend/controller/user.js` to `secure: false` and `sameSite: "lax"` for local development only. The original values are left in comments next to each option.

## API reference

All file routes require the auth cookie. Responses are JSON shaped like `{ success, msg, ... }`.

### Auth, `/user`

| Method | Route | Description | Rate limit |
| --- | --- | --- | --- |
| GET | `/user/me` | Current logged in user | none |
| POST | `/user/signup` | Create an account and email an OTP | 10 per hour |
| POST | `/user/verify-otp` | Verify the OTP and log in | 20 per 15 min |
| POST | `/user/resend-otp` | Send a new OTP | 10 per hour |
| POST | `/user/login` | Log in with email and password | 20 per 15 min |
| POST | `/user/logout` | Clear the auth cookie | none |
| POST | `/user/forgot-password` | Email a reset link | 10 per hour |
| POST | `/user/reset-password` | Set a new password with the token | 20 per 15 min |

### Files, `/file`

| Method | Route | Description |
| --- | --- | --- |
| POST | `/file/upload` | Upload one file (form field `avatar`) |
| POST | `/file/upload-multiple` | Upload up to 5 files (form field `avatar`) |
| GET | `/file/my-files?page=1&limit=20&type=image` | List your files, newest first. `limit` is capped at 100, `type` is `image`, `video` or `raw` |
| DELETE | `/file/:id` | Delete one file from Cloudinary and the database |
| POST | `/file/delete-multiple` | Delete up to 100 files, body `{ "ids": [...] }` |

## How it works

**Signup.** The password is hashed with bcrypt and the account is created unverified. A 6 digit OTP is stored in the `Otp` collection and emailed. Verifying the OTP marks the account verified and logs the user in. Unverified accounts cannot log in.

**Uploads.** Multer writes the file to `backend/localUploads`, the real file type is checked, the file is pushed to Cloudinary under `clouddrive/<userId>`, and its metadata is saved in MongoDB. The temporary local file is always removed afterwards. If saving to the database fails, the Cloudinary copy is deleted so nothing is left orphaned.

**Deletes.** Files are removed from Cloudinary first and from MongoDB second. Bulk delete groups files by Cloudinary resource type and reports partial failures with a `207` response.

**Sessions.** The JWT lives in an `httpOnly` cookie. On every protected request the server also checks `passwordChangedAt`, so a token issued before a password reset is rejected.

## Deployment

The frontend includes a `vercel.json` that rewrites every route to `index.html`, so it deploys to Vercel as a static Vite app. Set `VITE_BACKEND_URL` in the project environment to your backend URL. The backend runs on any Node host (Render, Railway, a VPS). Set the environment variables listed above, and make sure `FRONTEND_URL` matches your frontend origin exactly, since it is used for both CORS and the reset password link.

## Author

Built by [Aman](https://github.com/Aman-20).