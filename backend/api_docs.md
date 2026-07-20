# Authentication API Documentation

## 1. POST `/auth/login`

**Request Body:**
```json
{
  "username": "admin_user",
  "password": "securepassword123"
}
```

**Success Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "profile": {
    "user_id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    "username": "admin_user",
    "email": "admin@example.com",
    "phone": "0771234567",
    "status": "ACTIVE"
  },
  "roles": [
    "ADMIN"
  ]
}
```

**Error Response (401 Unauthorized):**
```json
{
  "error": "Invalid username or password"
}
```

---

## 2. GET `/auth/me`

**Request Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Success Response (200 OK):**
```json
{
  "profile": {
    "user_id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    "username": "admin_user",
    "email": "admin@example.com",
    "phone": "0771234567",
    "status": "ACTIVE",
    "created_at": "2024-01-01T10:00:00.000Z",
    "last_login": "2026-07-20T05:51:00.000Z"
  },
  "roles": [
    "ADMIN"
  ]
}
```

**Error Response (403 Forbidden):**
```json
{
  "error": "Invalid or expired token"
}
```

---

## 3. POST `/auth/logout`

**Request Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Success Response (200 OK):**
```json
{
  "message": "Successfully logged out"
}
```

**Error Response (401 Unauthorized):**
```json
{
  "error": "Access token is missing"
}
```
