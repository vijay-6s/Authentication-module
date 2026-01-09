# Authentication Module

A complete authentication system built with **Better Auth**, **Express**, and **MongoDB**. Supports email/password authentication and Google OAuth sign-in.

## 🚀 Features

- ✅ **Email & Password Authentication**
- ✅ **Google OAuth Sign-In**
- ✅ **JWT Token Support**
- ✅ **Session Management**
- ✅ **MongoDB Integration**
- ✅ **CORS Configured**
- ✅ **TypeScript**
- ✅ **Protected Routes with JWT Middleware**

## 📋 Prerequisites

- Node.js (v18 or higher)
- MongoDB Atlas account
- Google OAuth credentials

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/vijay-6s/Authentication-module.git
   cd Authentication-module
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority&appName=Cluster0
   DB_NAME=better-auth-database
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   PORT=3000
   BETTER_AUTH_SECRET=your-secret-key
   ```

4. **Build the project**
   ```bash
   npm run build
   ```

5. **Start the server**
   ```bash
   npm start
   ```

## 🔧 Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create OAuth 2.0 Client ID
3. Add authorized redirect URI:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
4. Copy Client ID and Client Secret to `.env`

## 📡 API Endpoints

### Authentication

#### Sign Up with Email
```http
POST /api/auth/sign-up/email
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

#### Sign In with Email
```http
POST /api/auth/sign-in/email
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Sign In with Google
```http
POST /api/auth/sign-in/social
Content-Type: application/json

{
  "provider": "google"
}
```

### Session & User Info

#### Get Current Session
```http
GET /api/me
```

#### Protected Route Example
```http
GET /api/protected
Authorization: Bearer <your-jwt-token>
```

### Health Check

#### Ping
```http
GET /api/ping
```

## 🏗️ Project Structure

```
auth_module/
├── src/
│   ├── app.ts                 # Express app configuration
│   ├── index.ts              # Server entry point
│   ├── controllers/          # Route controllers
│   │   ├── index.ts
│   │   └── sample.ts
│   ├── lib/
│   │   ├── auth.ts           # Better Auth configuration
│   │   └── db/
│   │       └── index.ts      # MongoDB client
│   ├── middlewares/
│   │   └── authenticationMiddleware.ts
│   └── routes/              # API routes
│       ├── index.ts
│       ├── ping.ts
│       └── sample.ts
├── .env                     # Environment variables (not in git)
├── package.json
└── tsconfig.json
```

## 🔐 Security Features

- **TLS Certificate Handling** for MongoDB Atlas
- **CORS Configuration** for frontend integration
- **JWT Verification** with JWKS
- **Session Cookies** with secure settings
- **Password Hashing** (handled by Better Auth)

## 🧪 Testing

Test the OAuth endpoint:
```bash
curl -X POST http://localhost:3000/api/auth/sign-in/social \
  -H "Content-Type: application/json" \
  -d '{"provider": "google"}'
```

## 🌐 Frontend Integration

For frontend integration, use the Better Auth React client:

```typescript
import { createAuthClient } from "better-auth/react";

const authClient = createAuthClient({
  baseURL: "http://localhost:3000"
});

// Sign in with Google
await authClient.signIn.social({
  provider: "google"
});
```

## 📝 Environment Variables

| Variable | Description |
|----------|-------------|
| `MONGODB_URL` | MongoDB connection string |
| `DB_NAME` | Database name |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret |
| `PORT` | Server port (default: 3000) |
| `BETTER_AUTH_SECRET` | Secret key for session encryption |

## 🚨 Development Mode

The project uses `NODE_TLS_REJECT_UNAUTHORIZED=0` for development to bypass certificate validation. **DO NOT use this in production.**

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

ISC

## 👤 Author

**vijay-6s**

- GitHub: [@vijay-6s](https://github.com/vijay-6s)
- Repository: [Authentication-module](https://github.com/vijay-6s/Authentication-module)

## 🙏 Acknowledgments

- [Better Auth](https://www.better-auth.com/) - Authentication framework
- [Express](https://expressjs.com/) - Web framework
- [MongoDB](https://www.mongodb.com/) - Database
- [TypeScript](https://www.typescriptlang.org/) - Type safety

---

Made with ❤️ by vijay-6s
