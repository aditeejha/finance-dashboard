# Finance Dashboard Backend

A RESTful API backend for a Finance Dashboard system, built with **Node.js**, **Express**, **MySQL**, and **Sequelize**. Supports role-based access control, financial record management, and dashboard analytics.

---

## Tech Stack

| Layer        | Technology              |
|--------------|-------------------------|
| Runtime      | Node.js                 |
| Framework    | Express.js              |
| Database     | MySQL                   |
| ORM          | Sequelize               |
| Auth         | JSON Web Tokens (JWT)   |
| Validation   | express-validator       |
| Password     | bcryptjs                |

---

## Project Structure

```
src/
├── config/
│   ├── database.js         # Sequelize connection setup
│   └── seed.js             # Script to populate DB with sample data
├── models/
│   ├── User.js             # User model (with password hashing hooks)
│   ├── Transaction.js      # Transaction model (with soft delete)
│   └── index.js            # Loads models and sets up associations
├── middleware/
│   ├── auth.js             # JWT authentication + role authorization
│   ├── validators.js       # express-validator chains for all routes
│   └── errorHandler.js     # Global error handler + 404 handler
├── services/
│   ├── authService.js      # Register/login business logic
│   ├── userService.js      # User management logic
│   ├── transactionService.js # Transaction CRUD + filtering
│   └── dashboardService.js # Aggregation queries for analytics
├── controllers/
│   ├── authController.js
│   ├── userController.js
│   ├── transactionController.js
│   └── dashboardController.js
├── routes/
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── transactionRoutes.js
│   └── dashboardRoutes.js
├── app.js                  # Express app setup (routes + middleware)
└── index.js                # Entry point (DB sync + server start)
```

---

## Setup Instructions

### 1. Prerequisites
- Node.js v16+
- MySQL server running locally

### 2. Clone and Install

```bash
git clone <your-repo-url>
cd finance-dashboard-backend
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and fill in your MySQL credentials:

```
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=finance_dashboard
DB_USER=root
DB_PASSWORD=your_password_here
JWT_SECRET=change_this_to_a_long_random_string
JWT_EXPIRES_IN=7d
```

### 4. Create the Database

In your MySQL client:

```sql
CREATE DATABASE finance_dashboard;
```

Sequelize will create all tables automatically when the server starts.

### 5. Start the Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

### 6. Seed Sample Data (Optional but Recommended)

```bash
npm run seed
```

This creates 3 users and 14 sample transactions so you can test everything right away.

**Seeded credentials:**

| Role    | Email                   | Password    |
|---------|-------------------------|-------------|
| Admin   | admin@finance.com       | admin123    |
| Analyst | analyst@finance.com     | analyst123  |
| Viewer  | viewer@finance.com      | viewer123   |

---

## Role Permissions

| Action                        | Viewer | Analyst | Admin |
|-------------------------------|--------|---------|-------|
| Login / View own profile      | ✅     | ✅      | ✅    |
| View transactions             | ✅     | ✅      | ✅    |
| View dashboard analytics      | ❌     | ✅      | ✅    |
| Create / Edit / Delete records| ❌     | ❌      | ✅    |
| Manage users                  | ❌     | ❌      | ✅    |

---

## API Reference

All protected routes require the header:
```
Authorization: Bearer <token>
```

---

### Auth

#### Register
```
POST /api/auth/register
```
**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secret123",
  "role": "viewer"
}
```

#### Login
```
POST /api/auth/login
```
**Body:**
```json
{
  "email": "admin@finance.com",
  "password": "admin123"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "user": { "id": 1, "name": "Admin User", "role": "admin" },
    "token": "eyJhbGci..."
  }
}
```

#### Get My Profile
```
GET /api/auth/me
```
*(Requires auth)*

---

### Users *(Admin only except where noted)*

| Method | Endpoint         | Access        | Description            |
|--------|-----------------|---------------|------------------------|
| GET    | /api/users       | Admin         | List all users         |
| GET    | /api/users/:id   | Any auth user | Get user by ID         |
| PUT    | /api/users/:id   | Self or Admin | Update user            |
| DELETE | /api/users/:id   | Admin         | Deactivate a user      |

**Update User Body (Admin can change role/status):**
```json
{
  "name": "New Name",
  "role": "analyst",
  "status": "inactive"
}
```

**Pagination (GET /api/users):**
```
GET /api/users?page=1&limit=10
```

---

### Transactions

| Method | Endpoint               | Access          | Description              |
|--------|------------------------|-----------------|--------------------------|
| GET    | /api/transactions      | Any auth user   | List transactions        |
| GET    | /api/transactions/:id  | Any auth user   | Get single transaction   |
| POST   | /api/transactions      | Admin only      | Create transaction       |
| PUT    | /api/transactions/:id  | Admin only      | Update transaction       |
| DELETE | /api/transactions/:id  | Admin only      | Soft delete transaction  |

**Create / Update Body:**
```json
{
  "amount": 5000,
  "type": "income",
  "category": "Freelance",
  "date": "2025-04-01",
  "notes": "Website redesign project"
}
```

**Filtering & Pagination:**
```
GET /api/transactions?type=expense&category=rent&startDate=2025-01-01&endDate=2025-03-31&page=1&limit=10
```

| Query Param | Type   | Description                        |
|-------------|--------|------------------------------------|
| type        | string | `income` or `expense`              |
| category    | string | Partial match, case-insensitive    |
| startDate   | date   | YYYY-MM-DD                         |
| endDate     | date   | YYYY-MM-DD                         |
| page        | number | Page number (default: 1)           |
| limit       | number | Items per page (default: 10, max 100) |

---

### Dashboard *(Analyst + Admin only)*

| Method | Endpoint                    | Description                          |
|--------|-----------------------------|--------------------------------------|
| GET    | /api/dashboard/summary      | Total income, expenses, net balance  |
| GET    | /api/dashboard/categories   | Totals grouped by category           |
| GET    | /api/dashboard/trends       | Monthly income vs expense (6 months) |
| GET    | /api/dashboard/recent       | Most recent transactions             |

**Summary Response:**
```json
{
  "success": true,
  "data": {
    "totalIncome": 173000,
    "totalExpenses": 50500,
    "netBalance": 122500,
    "totalTransactions": 14
  }
}
```

**Trends Query Param:**
```
GET /api/dashboard/trends?months=3
```

**Recent Activity Query Param:**
```
GET /api/dashboard/recent?limit=10
```

---

## Error Responses

All errors follow a consistent format:

```json
{
  "success": false,
  "message": "A human-readable error message."
}
```

Validation errors include a field breakdown:
```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": [
    { "field": "amount", "message": "Amount must be a positive number." }
  ]
}
```

| Status | Meaning                                   |
|--------|-------------------------------------------|
| 400    | Bad request / validation error            |
| 401    | Not authenticated (missing/invalid token) |
| 403    | Forbidden (correct token, wrong role)     |
| 404    | Resource not found                        |
| 409    | Conflict (e.g. duplicate email)           |
| 500    | Internal server error                     |

---

## Design Decisions & Assumptions

1. **Soft Deletes** — Transactions are never permanently removed. The `isDeleted` flag hides them from all queries without losing historical data. Users are "deleted" by setting `status: inactive`.

2. **Role Hierarchy** — Three roles are defined: `viewer` (read-only), `analyst` (read + analytics), and `admin` (full access). Viewers cannot access dashboard analytics since that is considered an advanced feature.

3. **JWT Authentication** — Tokens are stateless and expire in 7 days by default. No refresh token mechanism is implemented to keep the scope reasonable.

4. **Password Hashing** — Passwords are hashed with bcrypt (salt rounds: 10) using Sequelize model hooks, so they are always hashed regardless of how the model is called.

5. **Service Layer** — Business logic lives in services, not controllers. Controllers only handle HTTP request/response. This makes logic reusable and easier to test.

6. **Pagination** — All list endpoints support `page` and `limit` query parameters, defaulting to page 1 with 10 items.

7. **Database Sync** — `sequelize.sync({ alter: true })` is used on startup, which updates tables to match models without dropping data. In a production system, migrations would be used instead.

8. **Category Filter** — The category filter uses a SQL `LIKE` query for partial matching (e.g. `?category=rent` will match "Rent", "Office Rent", etc.).

---

## Testing with Postman

1. Import the base URL: `http://localhost:3000`
2. Login with a seeded user to get a JWT token
3. Copy the token and set it as a Bearer token in Postman's Authorization tab
4. Test protected routes — try accessing admin routes with a viewer token to see access control in action

**Suggested test flow:**
1. `POST /api/auth/login` with admin credentials → copy token
2. `POST /api/transactions` → create a transaction
3. `GET /api/transactions` → list with filters
4. `GET /api/dashboard/summary` → view analytics
5. Login as viewer → try `POST /api/transactions` → expect 403 Forbidden

---

## Optional Enhancements

All optional enhancements from the assignment are now implemented:

| Enhancement | Status | Details |
|---|---|---|
| Authentication (tokens) | ✅ | JWT via `jsonwebtoken`, 7-day expiry |
| Pagination | ✅ | `?page=1&limit=10` on all list endpoints |
| Search support | ✅ | `?search=keyword` searches category + notes |
| Soft delete | ✅ | `isDeleted` flag on transactions; `status: inactive` on users |
| Rate limiting | ✅ | 10 req/15min on auth routes; 100 req/15min on all others |
| Unit + Integration tests | ✅ | Jest + Supertest, no DB required |
| API documentation | ✅ | Postman collection included |

---

## Running Tests

Tests use Jest and Supertest. All models are mocked so **no database connection is needed** to run tests.

```bash
npm test
# or with coverage report:
npm run test:coverage
```

**Test coverage includes:**
- `tests/unit/authService.test.js` — register/login business logic
- `tests/unit/transactionService.test.js` — CRUD, soft delete, search filters
- `tests/unit/dashboardService.test.js` — summary calculations, edge cases
- `tests/integration/auth.test.js` — HTTP-level register/login/me endpoints
- `tests/integration/transactions.test.js` — role access control + validation
- `tests/integration/dashboard.test.js` — analytics access by role

---

## Search Support

Search works across `category` and `notes` fields using a partial match:

```
GET /api/transactions?search=salary
GET /api/transactions?search=rent&type=expense
GET /api/transactions?search=project&startDate=2025-01-01
```

---

## Rate Limiting

Implemented without extra dependencies using an in-memory request counter per IP.

| Route Group | Limit |
|---|---|
| `POST /api/auth/login` and `/register` | 10 requests per 15 minutes |
| All other `/api/*` routes | 100 requests per 15 minutes |

When the limit is exceeded the API returns:
```json
{
  "success": false,
  "message": "Too many login attempts. Please try again after 15 minutes.",
  "retryAfter": "847 seconds"
}
```
The response also includes a `Retry-After` header.

> **Note:** This in-memory limiter resets when the server restarts. In a multi-instance production setup, replace the `Map` store in `rateLimiter.js` with a Redis-backed solution.

---

## Postman Collection

A ready-to-use Postman collection is included: **`Finance_Dashboard_API.postman_collection.json`**

**To use it:**
1. Open Postman → Import → select the file
2. Run **"Login as Admin"** first — the token is saved automatically via a test script
3. All other requests use `{{token}}` automatically
4. Switch roles by running a different Login request

The collection includes a dedicated **"Access Control Tests"** folder to verify that role restrictions work — expected 401, 403, 400, and 429 responses are all documented there.
