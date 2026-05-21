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
## Run With Docker
```bash
cd D:\Downloads
git clone https://github.com/ng-quys/credit-package-system.git test-credit-package-system
cd test-credit-package-system
docker compose up --build
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



# Main API Endpoints

## Auth

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register new account |
| POST | `/auth/login` | Login and receive JWT |
| GET | `/auth/me` | Get current user profile |

## Packages

| Method | Endpoint | Description |
|---|---|---|
| GET | `/packages` | Get active packages |
| GET | `/packages/:id` | Get package details |
| GET | `/packages/admin` | Admin get all packages |
| POST | `/packages/admin` | Create package |
| PUT | `/packages/admin/:id` | Update package |
| DELETE | `/packages/admin/:id` | Soft delete package |

## Purchases

| Method | Endpoint | Description |
|---|---|---|
| POST | `/purchases/packages/:packageId` | Purchase package |
| GET | `/purchases/history` | Get purchase history |

## User Dashboard

| Method | Endpoint | Description |
|---|---|---|
| GET | `/users/me/credits` | Get current credits |
| GET | `/users/me/features` | Get unlocked features |
| GET | `/users/me/credit-usages` | Get credit usage history |

## Feature Usage

| Method | Endpoint | Description |
|---|---|---|
| POST | `/features/use/ai-chat` | Use AI Chat feature |
| POST | `/features/use/auto-post` | Use Auto Post feature |

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




