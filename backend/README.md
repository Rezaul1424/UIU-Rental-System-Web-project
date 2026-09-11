# UIU Rental System - Backend API

Built with **Node.js**, **Express**, and **MySQL**.

---

## 1. Database Setup (MySQL)

You can import the schema and seed data into your local MySQL server using MySQL CLI or MySQL Workbench:

### Option A: Via Command Line
```bash
mysql -u root -p < database/schema.sql
```

### Option B: Via MySQL Workbench / DBeaver / phpMyAdmin
1. Open MySQL Workbench.
2. Open `backend/database/schema.sql`.
3. Execute the script to create `uiu_rental_system` and all 12 tables + seed data.

---

## 2. Environment Configuration

Copy the example environment file:
```bash
cp .env.example .env
```
Edit `.env` with your local MySQL credentials:
```ini
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=uiu_rental_system
DB_PORT=3306
JWT_SECRET=your_secret_key
```

---

## 3. Installation & Running

```bash
# Install dependencies
npm install

# Start in development mode (with auto-reload)
npm run dev
```

The server will be running at `http://localhost:5000`.
Test health endpoint: `GET http://localhost:5000/api/health`.

---

## 4. Team Division of Modules

- **Student & Landlord Modules**:
  - `src/routes/student.routes.js`: Browse, apply, pay rent, view receipts, submit maintenance, favorites.
  - `src/routes/landlord.routes.js`: My listings, add/edit listing, approve/reject applications, rent tracking, maintenance resolve.
  - `src/controllers/student.controller.js`
  - `src/controllers/landlord.controller.js`

- **Remaining Modules (Auth, Admin, Public)**:
  - `src/routes/auth.routes.js`: Register, login, forgot password, JWT generation.
  - `src/middlewares/auth.middleware.js`: Token verification & role checking (`verifyToken`, `requireRole`).
  - `src/routes/admin.routes.js`: Manage users, resolve complaints, monitor chats.
  - `src/routes/public.routes.js`: Public listings & search.
