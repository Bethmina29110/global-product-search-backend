# API Endpoints Reference

> **Base URL:** `http://localhost:3000/api/v1`
> **Content-Type:** `application/json`

All protected endpoints require a `Bearer` token in the `Authorization` header:
```
Authorization: Bearer <access_token>
```

---

## Standard Response Envelope

Every endpoint returns a consistent response shape:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation successful",
  "data": { ... },
  "timestamp": "2026-03-06T01:00:00.000Z"
}
```

---

## 🔐 Auth Module — `/api/v1/auth`

### `POST /auth/register`
**Access:** Public

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Password@123",
  "fullName": "John Doe",
  "address": "123 Main St",
  "phoneNo": "+94771234567"
}
```

| Field | Type | Required | Constraint |
|-------|------|----------|------------|
| `email` | string | ✅ | Valid email format |
| `password` | string | ✅ | Min 8 characters |
| `firstName` | string | ❌ | — |
| `lastName` | string | ❌ | — |

**Response (201):**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "User registered successfully. Please check your email for verification.",
  "data": {
    "id": "1",
    "uuid": "a1b2c3d4-...",
    "email": "user@example.com",
    "fullName": "John Doe",
    "email": "user@example.com",
    "role": "USER",
    "status": "PENDING"
  }
}
```

---

### `POST /auth/login`
**Access:** Public

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Password@123"
}
```

| Field | Type | Required | Constraint |
|-------|------|----------|------------|
| `email` | string | ✅ | Valid email format |
| `password` | string | ✅ | — |

**Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "1",
      "uuid": "a1b2c3d4-...",
      "email": "user@example.com",
      "fullName": "John Doe",
      "role": "USER",
      "status": "ACTIVE"
    }
  }
}
```

---

### `POST /auth/refresh`
**Access:** Public

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

| Field | Type | Required |
|-------|------|----------|
| `refreshToken` | string | ✅ |
| `deviceId` | string | ✅ |

**Response (200):** Same shape as `/login` response.

---

### `POST /auth/logout`
**Access:** 🔒 Authenticated

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Logged out successfully",
  "data": null
}
```

---

### `GET /auth/get/profile`
**Access:** 🔒 Authenticated

**No request body.**

**Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Profile retrieved successfully",
  "data": {
    "id": "1",
    "uuid": "a1b2c3d4-...",
    "email": "user@example.com",
    "fullName": "John Doe",
    "role": "USER",
    "status": "ACTIVE",
    "createdAt": "2026-03-06T00:00:00.000Z"
  }
}
```

---

### `GET /auth/get/sessions`
**Access:** 🔒 Authenticated

**No request body.**

**Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Sessions retrieved successfully",
  "data": [
    {
      "id": "1",
      "deviceName": "Chrome / MacOS",
      "createdAt": "2026-03-06T00:00:00.000Z",
      "expiresAt": "2026-03-13T00:00:00.000Z"
    }
  ]
}
```

---

### `DELETE /auth/sessions/delete/:id`
**Access:** 🔒 Authenticated

**URL Params:** `id` — Session ID to revoke.

**Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Session revoked successfully",
  "data": null
}
```

---

### `POST /auth/create/change-password`
**Access:** 🔒 Authenticated

**Request Body:**
```json
{
  "oldPassword": "OldPassword@123",
  "newPassword": "NewPassword@456"
}
```

| Field | Type | Required | Constraint |
|-------|------|----------|------------|
| `oldPassword` | string | ✅ | Current password |
| `newPassword` | string | ✅ | Min 8 characters |

**Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Password changed successfully",
  "data": null
}
```

---

### `POST /auth/create/forgot-password`
**Access:** Public

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "If the email exists, a reset link has been sent.",
  "data": null
}
```

> **Note:** Always returns 200 even if email is not found (security by design — prevents email enumeration).

---

### `POST /auth/create/reset-password`
**Access:** Public

**Request Body:**
```json
{
  "email": "user@example.com",
  "token": "reset-token-from-email",
  "newPassword": "NewPassword@789"
}
```

| Field | Type | Required | Constraint |
|-------|------|----------|------------|
| `email` | string | ✅ | Must be a valid email |
| `token` | string | ✅ | Token received from email |
| `newPassword` | string | ✅ | Min 8 characters |

**Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Password has been reset successfully.",
  "data": null
}
```

---

## 👤 Users Module — `/api/v1/users`

### `GET /users/profile`
**Access:** 🔒 Authenticated

**Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "User profile retrieved successfully",
  "data": {
    "id": "1",
    "uuid": "a1b2c3d4-...",
    "email": "user@example.com",
    "role": "USER",
    "status": "ACTIVE",
    "fullName": "John Doe",
    "phoneNo": "+94771234567",
    "address": "123 Main St",
    "profileImage": "https://cdn.example.com/avatar.jpg"
  }
}
```

---

### `PATCH /users/profile`
**Access:** 🔒 Authenticated

All fields are optional. Only send fields you want to update.

**Request Body:**
```json
{
  "fullName": "John Doe",
  "address": "123 Main St, Colombo",
  "phoneNo": "+94771234567",
  "profileImage": "https://cdn.example.com/avatar.jpg"
}
```

| Field | Type | Required | Constraint |
|-------|------|----------|------------|
| `fullName` | string | ❌ | — |
| `address` | string | ❌ | — |
| `phoneNo` | string | ❌ | Valid phone number format |
| `profileImage` | string | ❌ | Valid URL |

**Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "User profile updated successfully",
  "data": { ... }
}
```

---

### `GET /users`
**Access:** 🔒 `ADMIN`, `SUPER_ADMIN` only

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | `1` | Page number |
| `limit` | number | `10` | Results per page |

**Example:** `GET /api/v1/users?page=1&limit=20`

**Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Users retrieved successfully",
  "data": {
    "items": [ { ... }, { ... } ],
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

---

### `DELETE /users/:id`
**Access:** 🔒 `SUPER_ADMIN` only

**URL Params:** `id` — User ID to soft-delete.

**Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "User deleted successfully",
  "data": null
}
```

---

## 🔔 Notifications Module — `/api/v1/notifications`

### `GET /notifications`
**Access:** 🔒 Authenticated

**Query Parameters:**

| Param | Type | Default |
|-------|------|---------|
| `page` | number | `1` |
| `limit` | number | `10` |

**Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Notifications retrieved successfully",
  "data": {
    "items": [
      {
        "id": "1",
        "title": "Welcome!",
        "message": "Your account has been created.",
        "isRead": false,
        "createdAt": "2026-03-06T00:00:00.000Z"
      }
    ],
    "total": 5,
    "page": 1,
    "limit": 10
  }
}
```

---

### `PATCH /notifications/read-all`
**Access:** 🔒 Authenticated

**No request body.**

**Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "All notifications marked as read",
  "data": null
}
```

---

### `PATCH /notifications/:id/read`
**Access:** 🔒 Authenticated

**URL Params:** `id` — Notification ID.

**Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Notification marked as read",
  "data": null
}
```

---

## 📋 Audit Logs Module — `/api/v1/audit-logs`

### `GET /audit-logs`
**Access:** 🔒 `ADMIN`, `SUPER_ADMIN` only

**Query Parameters:**

| Param | Type | Default |
|-------|------|---------|
| `page` | number | `1` |
| `limit` | number | `10` |

**Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Audit logs retrieved successfully",
  "data": {
    "items": [
      {
        "id": "1",
        "userId": "42",
        "action": "USER_LOGIN",
        "entity": "User",
        "entityId": "42",
        "ipAddress": "192.168.1.1",
        "userAgent": "Mozilla/5.0...",
        "createdAt": "2026-03-06T00:00:00.000Z"
      }
    ],
    "total": 500,
    "page": 1,
    "limit": 10
  }
}
```

---

## ❌ Error Responses

All errors follow this structure:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    "email must be a valid email",
    "password must be longer than or equal to 8 characters"
  ],
  "timestamp": "2026-03-06T01:00:00.000Z",
  "path": "/api/v1/auth/register"
}
```

### Common Error Codes

| Status | Description |
|--------|-------------|
| `400` | Bad Request — Validation failed |
| `401` | Unauthorized — Missing or invalid token |
| `403` | Forbidden — Insufficient role/permissions |
| `404` | Not Found — Resource does not exist |
| `409` | Conflict — Duplicate resource (e.g., email) |
| `429` | Too Many Requests — Rate limit exceeded |
| `500` | Internal Server Error |

---

## 🔐 Role Hierarchy

| Role | Level | Notes |
|------|-------|-------|
| `USER` | 1 | Default registered user |
| `MODERATOR` | 2 | Can view all users |
| `ADMIN` | 3 | Manage users, view audit logs |
| `SUPER_ADMIN` | 4 | Full access, can delete users |