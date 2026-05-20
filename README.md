# Credit Package System

Full-stack SaaS credit package system built with NestJS, React, PostgreSQL, Prisma, and Docker.

## Features

- User register/login with JWT
- Role-based access control: USER / ADMIN
- Admin package management: create, update, soft delete, list
- Public package listing and package detail
- Purchase credit packages with fake payment
- Add credits to user balance after purchase
- Unlock features based on purchased package
- Feature permission guard
- Use feature and deduct credits
- Credit usage history
- User dashboard: current credits, purchase history, unlocked features
- Swagger API documentation

## Tech Stack

### Backend
- NestJS
- Prisma ORM
- PostgreSQL
- JWT Authentication
- Swagger / OpenAPI

### Frontend
- React
- Vite
- TypeScript
- CSS

## Project Structure

```txt
credit-package-system/
├── backend/
│   ├── src/
│   ├── prisma/
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── README.md
```

# How to Run Locally
## 1. Create Database

Create a PostgreSQL database:
```env
CREATE DATABASE subscription_credit_db;
```

## 2. Environment Variables

Create backend/.env:
```env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/subscription_credit_db?schema=public"
JWT_SECRET="your_jwt_secret"
```

## 3. Run Backend
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run build
npm run start
```

Backend runs at:
```txt
http://localhost:3000
```
Health check:
```txt
http://localhost:3000/health
```
Swagger:
```txt
http://localhost:3000/api/docs
```

## 4. Run Frontend
```bash
cd frontend
npm install
npm run dev
```

## Run With Docker
```bash
docker compose up --build
```

# Main API Endpoints
## Auth
POST /auth/register
POST /auth/login
GET  /auth/me

## Packages
GET    /packages
GET    /packages/:id
GET    /packages/admin
POST   /packages/admin
PUT    /packages/admin/:id
DELETE /packages/admin/:id

## Purchases
POST /purchases/packages/:packageId
GET  /purchases/history

## User Dashboard
GET /users/me/credits
GET /users/me/features
GET /users/me/credit-usages

## Feature Usage
POST /features/use/ai-chat
POST /features/use/auto-post

## Screenshots

1. Dashboard / Overview

![Dashboard](screenshots/dashboard.png)

2. Packages page

![Packages](screenshots/packages.png)

3. Admin package management

![Admin Packages](screenshots/admin-packages.png)

# Notes
- Payment is simulated with FAKE_PAYMENT.
- Package delete is soft delete using isActive = false.
- Feature access is checked by custom NestJS Guard.
- Credit deduction is handled inside Prisma transaction.
- Database schema is managed with Prisma.

## Author

**Ho Ngoc Quy**

- GitHub: https://github.com/ng-quys
- Email: hnquy08@gmail.com




