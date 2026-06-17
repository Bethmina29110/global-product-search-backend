# Backend Implementation Plan - Auth Module (Industrial Standard)

**Date:** February 2026
**Status:** In Progress / Refactoring
**Goal:** Implement a production-ready, highly secure Authentication module strictly adhering to the classifieds backend industrial standards, avoiding Redis and WebSockets for simplicity in the common backend.

## 1. Goal Description
To provide a rock-solid `Auth Module` using NestJS, Prisma, and PostgreSQL (Supabase). It manages user registration, login, token refresh, and session management using purely database-backed storage.

## 2. Core Features & Routes
The Auth Module implements the following endpoints, complying with the ID-at-end routing rule and proper HTTP methods:

### Public Routes
- `POST /auth/create/register` - User registration with Argon2/Bcrypt hash.
- `POST /auth/create/login` - Authenticates and issues Access & Refresh tokens.
- `POST /auth/create/refresh` - Issues new tokens using a valid refresh token.
- `POST /auth/create/forgot-password` - Request password reset link.
- `POST /auth/create/reset-password` - Reset password using token.

### Protected Routes (Requires JWT)
- `POST /auth/create/logout` - Revokes the current session.
- `GET /auth/get/profile` - Retrieves current logged-in user profile.
- `GET /auth/get/sessions` - Lists active sessions for the user.
- `DELETE /auth/sessions/delete/:id` - Revoke a specific session.
- `POST /auth/create/change-password` - Change the password of the active user.

## 3. Industrial Standards Compliance

### 3.1. Controller Layer (`auth.controller.ts`)
- Skinny controllers; all business logic strictly resides in `AuthService`.
- `@ResponseMessage()` decorator applied to standardize responses via `TransformInterceptor`.
- `@HttpCode(HttpStatus.OK)` applied to non-creation POST requests (like login).
- Input strictly validated using `class-validator` DTOs with whitelist enabled.

### 3.2. Service Layer (`auth.service.ts`)
- **Transactions:** Use `this.prisma.$transaction` for all multi-table writes (e.g., Create User + Log Audit).
- **Audit Logging:** Integrate the `logAudit` utility for `AUTH_REGISTER`, `AUTH_LOGIN`, `AUTH_LOGOUT`, `AUTH_SESSION_REVOKE`, and `AUTH_PASSWORD_CHANGE`.
- **Session Management:** DB-backed multi-device sessions (`UserSession` table). Max 5 sessions per user (evict oldest upon limit).
- **Response Formatting:** Return properly mapped response DTOs using `plainToInstance` from `class-transformer` to safely exclude passwords and sensitive data automatically.

### 3.3. DTO Patterns
- **Requests:** Located in `dto/requests/` (e.g. `register-user.request.dto.ts`, `login-user.request.dto.ts`, `change-password.request.dto.ts`).
- **Responses:** Located in `dto/responses/` (e.g. `auth.response.dto.ts`, `user-profile.response.dto.ts`, `session-list.response.dto.ts`).

## 4. Database Setup & Architecture
- **No Redis / Queues** for the core auth implementation.
- Email triggers (like welcome/password reset) will execute synchronously or directly wait on basic SMTP transports unless `BullMQ` is structurally required later, but omitted here per user request to purely focus on auth without redis.
- Uses `deletedAt: null` checks for active users everywhere to prevent deleted accounts from authenticating.
