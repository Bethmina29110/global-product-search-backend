# Project Structure & File details

This document provides a comprehensive breakdown of the project's file structure and the purpose of each file.

## 1. Global Shared Resources (`src/common`)

```text
src/common/
├── constants/
│   └── messages.constant.ts    # Success/Error messages
├── decorators/
│   ├── current-user.decorator.ts # Param decorator to get user from Request
│   ├── public.decorator.ts     # Metadata decorator to skip AuthGuard
│   └── roles.decorator.ts      # Metadata decorator to set required Roles
├── filters/
│   └── all-exceptions.filter.ts # Global catch-all filter (Uniform Error JSON)
├── guards/
│   ├── jwt-auth.guard.ts       # Extends Passport JWT Guard (Main security)
│   └── roles.guard.ts          # Checks User Role vs Required Role
├── dto/
│   └── pagination.dto.ts       # Common Pagination (page, limit, search)
├── interceptors/
│   ├── logging.interceptor.ts  # Logs HTTP Request/Response time & details
│   └── response.interceptor.ts # Wraps successful data in { success: true, data: ... }
├── interfaces/
│   ├── api-response.interface.ts # TypeScript interface for standard response
│   └── current-user.interface.ts # Interface for User payload in Request
├── logger/
│   ├── logger.module.ts        # Exports Winston Logger
│   └── winston.config.ts       # Winston Transports (Console, File) setup
└── utils/
    ├── hash.util.ts            # Argon2 hashing helper
    ├── response.util.ts        # Helper to format Success/Error responses
    └── shared.util.ts          # Common helper functions
```

## 2. Core Modules (`src/modules`)

Each module follows the **DDD** principles.

### 2.1. Auth Module (`src/modules/auth`)
Handles Login, Registration, JWT Token generation.

```text
src/modules/auth/
├── dto/
│   ├── login.dto.ts            # Email/Password validation
│   ├── register.dto.ts         # Registration fields
│   └── refresh-token.dto.ts    # For refreshing access tokens
├── strategies/
│   ├── jwt.strategy.ts         # Validates Access Token
│   └── jwt-refresh.strategy.ts # Validates Refresh Token
├── guards/                     # (Optional: specialized auth guards)
├── auth.controller.ts          # Endpoints: /auth/login, /auth/register
├── auth.module.ts              # Imports UsersModule, JwtModule
└── auth.service.ts             # Logic: Validate User, Sign Tokens
```

### 2.2. Users Module (`src/modules/users`)
Manages User profiles, administration.

```text
src/modules/users/
├── dto/
│   ├── create-user.dto.ts      # Admin creation
│   ├── update-user.dto.ts      # Profile updates
│   ├── user-response.dto.ts    # Response with 'class-transformer' (Excludes password)
│   └── query-user.dto.ts       # Pagination/Filter DTO
├── users.controller.ts         # Endpoints: /users (CRUD)
├── users.module.ts             # Exports UsersService
└── users.service.ts            # CRUD Logic, Password Hashing
```

### 2.3. Audit Logs Module (`src/modules/audit-logs`)
Tracks system activity (Asynchronous/Queue based).

```text
src/modules/audit-logs/
├── dto/
│   └── create-audit.dto.ts     # Internal DTO
├── audit-logs.controller.ts    # Endpoints: /audit-logs (Admin only, Read-only)
├── audit-logs.module.ts        # Imports Types
├── audit-logs.service.ts       # Writes logs to DB
└── audit-logs.consumer.ts      # BullMQ Worker (Processes logs from Queue)
```

### 2.4. Notifications Module (`src/modules/notifications`)
Manages User Alerts.

```text
src/modules/notifications/
├── dto/
│   └── create-notification.dto.ts
├── notifications.controller.ts # Endpoints: /notifications (Get my notifications)
├── notifications.module.ts
├── notifications.service.ts    # Save to DB, optionally send Email
└── notifications.gateway.ts    # (Optional) WebSocket Gateway for Real-time
```

## 3. Configuration & Database

```text
src/config/
├── env.validation.ts           # Joi validation schema for .env variables
└── configuration.ts            # ConfigService factory

src/prisma/
├── prisma.module.ts            # Global Module
├── prisma.service.ts           # Extends PrismaClient (connect/disconnect)
└── schema.prisma               # Database Schema Definitions
```
