# Industrial Standard NestJS Architecture Plan

## 1. Executive Summary
This document outlines the architectural blueprint for the `common-backend` project. The goal is to build a scalable, maintainable, and high-performance backend using **NestJS**, adhering to **Domain-Driven Design (DDD)** principles and **Industrial Best Practices**.

## 2. Technology Stack

| Component | Technology | Reasoning |
| :--- | :--- | :--- |
| **Framework** | NestJS (v11+) | Modular, scalable, efficient, TypeScript-first. |
| **Language** | TypeScript (Strict) | Type safety, maintainability. |
| **Database** | PostgreSQL (Supabase) | Robust, relational, cloud-hosted on Supabase. |
| **ORM** | Prisma | Type-safe queries with connection pooling (Direct URL). |
| **Caching** | Redis | High-performance caching for heavy reads. |
| **Queues** | BullMQ | Asynchronous background processing (emails, reports). |
| **Logging** | Winston | Structured JSON logging for production monitoring. |
| **Validation** | class-validator | Decorator-based DTO validation. |
| **Docs** | Swagger (OpenAPI) | Auto-generated API documentation. |

## 3. Directory Structure (Modular/DDD )

We will use a **Modular Architecture** where each feature is a self-contained module.

```text
src/
├── common/
│   ├── constants/
│   │   └── messages.constant.ts    # Success/Error messages
│   ├── decorators/
│   │   ├── current-user.decorator.ts
│   │   ├── public.decorator.ts     # Metadata to skip AuthGuard
│   │   └── roles.decorator.ts      # Metadata for RoleGuard
│   ├── filters/
│   │   └── all-exceptions.filter.ts # Global catch-all
│   ├── guards/
│   │   ├── jwt-auth.guard.ts       # Main security guard
│   │   └── roles.guard.ts          # RBAC guard
│   ├── interfaces/
│   │   ├── api-response.interface.ts
│   │   └── current-user.interface.ts
│   ├── dto/
│   │   └── pagination.dto.ts       # Common Pagination
│   ├── interceptors/
│   │   ├── logging.interceptor.ts  # Request logging
│   │   └── response.interceptor.ts # Standard API response wrapper
│   ├── logger/
│   │   ├── logger.module.ts
│   │   └── winston.config.ts       # Winston JSON config
│   └── utils/
│       ├── hash.util.ts            # Argon2 helper
│       └── response.util.ts        # Success/Error format helper
├── config/
│   ├── app.config.ts               # Port, Environment, Global prefix
│   ├── database.config.ts          # Database connection settings
│   ├── swagger.config.ts           # Swagger OpenAPI setup
│   ├── jwt.config.ts               # JWT Secret, Expiration
│   ├── redis.config.ts             # Redis Host, Port
│   ├── mail.config.ts              # SMTP/Email settings
│   └── env.validation.ts           # Joi Validation Schema
├── modules/
│   ├── auth/
│   │   ├── dto/                    # login.dto.ts, register.dto.ts
│   │   ├── strategies/             # jwt.strategy.ts
│   │   ├── auth.controller.ts
│   │   └── auth.service.ts
│   ├── users/
│   │   ├── dto/                    # create-user.dto.ts, user-response.dto.ts
│   │   ├── users.controller.ts
│   │   └── users.service.ts
│   ├── audit-logs/                 # System tracking
│   │   ├── dto/                    # create-audit.dto.ts
│   │   ├── audit-logs.consumer.ts  # BullMQ Worker
│   │   └── audit-logs.service.ts
│   ├── notifications/              # System alerts
│   │   ├── dto/                    # create-notification.dto.ts
│   │   └── notifications.service.ts
├── providers/                      # External services (Email/S3)
├── prisma/
│   ├── prisma.module.ts
│   ├── prisma.service.ts
│   └── schema.prisma
└── main.ts
```

## 4. Key Systems & Standards

### 4.1. Authentication & Security (JWT + RBAC)
- **Strategy**: Passport-JWT.
- **Tokens**:
    - `AccessToken` (Short-lived, eg: 15m)
    - `RefreshToken` (Long-lived, stored in Redis/DB).
- **RBAC**: Role-Based Access Control using `@Roles('ADMIN')` decorator.
    - **Roles**: `SUPER_ADMIN`, `ADMIN`, `USER`.

### 4.2. Logging (Winston)
- **Format**: JSON (for easy parsing by log aggregators).
- **Transports**: Console (Dev), File (Error/Info), potentially External (DataDog/ELK later).
- **Context**: Every log must include `context` (Module/Service name) and `traceId`.

### 4.3. Database Schema Concepts (Prisma)

**Global Standard Fields** (Applied to ALL Tables):
- `id`: Int (Auto-increment, Primary Key, **Internal Use Only**)
- `uuid`: String (UUID, Unique, **Public Use** in APIs)
- `createdAt`: DateTime (default: now)
- `updatedAt`: DateTime (updatedAt)
- `deletedAt`: DateTime (nullable, for Soft Delete)

#### **User Table**
- **Identity**: `id` (Int), `uuid` (String), `email` (Unique), `phoneNumber` (Unique, Optional).
- **Security**: `password` (Argon2 Hashed), `twoFactorEnabled` (Boolean).
- **Profile**: `firstName`, `lastName`, `avatarUrl`.
- **Access Control**:
    - `role`: Enum (`SUPER_ADMIN`, `ADMIN`, `USER`).
    - `status`: Enum (`ACTIVE`, `INACTIVE`, `SUSPENDED`, `BANNED`).
- **Activity**: `lastLoginAt`, `emailVerifiedAt`.
- **Timestamps**: `createdAt`, `updatedAt`, `deletedAt`.

#### **Audit Log Table**
- Goal: Track *who* did *what*, *when*.
- Fields:
    - `id` (Int), `uuid` (String)
    - `userId` (Action performer)
    - `action`: Enum (`CREATE`, `UPDATE`, `DELETE`, `LOGIN`, `LOGOUT`, `SYSTEM`, `AUTH_FAILURE`).
    - `resource` (e.g., 'Product', 'User')
    - `resourceId` (Affected Item ID)
    - `oldValues` (JSON - optional)
    - `newValues` (JSON - optional)
    - `ipAddress`
    - `userAgent`
    - **Timestamps**: `createdAt` (No update/delete for audit logs).

#### **Notification Table**
- Goal: System alerts for users.
- Fields:
    - `id` (Int), `uuid` (String)
    - `userId` (Recipient)
    - `type`: Enum (`INFO`, `WARNING`, `ERROR`, `SUCCESS`, `SYSTEM`, `AUTH`).
    - `title`
    - `message` (Text or JSON for rich content)
    - `isRead` (Boolean, default: false)
    - **Timestamps**: `createdAt`, `updatedAt`, `deletedAt`.

### 4.4. Coding Standards
- **Controllers** should be "skinny". They only handle HTTP requests, validation, and sending responses.
- **Services** should be "fat". They contain all business logic.
- **Dependency Injection**: Always use DI. Never instantiate classes manually with `new`.
- **DTOs**: `class-validator` for ALL inputs. No `any`.

### 4.5. Database (Prisma)
- **Explicit Selects**: Always use `select` to prevent over-fetching.
- **Transactions**: Use `$transaction` for operations modifying multiple tables (e.g., Create User + Create Audit Log).

## 5. Performance & Scalability

- **Redis**:
    - **Caching**: Cache public GET endpoints.
    - **Queues (BullMQ)**: Use for sending Notifications and creating Audit Logs asynchronously to not block the main thread.
- **Compression**: Enable Gzip/Brotli.

## 6. Implementation Roadmap

1.  **Setup Core**: NestJS, Winston Logger, Global Filters.
2.  **Database**: Prisma Setup with `User`, `AuditLog`, `Notification` models.
3.  **Auth Module**: JWT, Refresh Tokens, RBAC Guards.
4.  **Core Feature**: User Module.
5.  **Support Modules**: Audit Logs & Notifications (Queue-based).


---
*Created by Antigravity - Specialized NestJS Architect*
