# Student Database Management System (Node.js + MySQL)

MMCA314D – Web Development Using Full Stack Open — **Assignment 2, Question 1**

Demonstrates every basic MySQL operation from Node.js, plus a small menu app to manage students.

## Setup

1. Make sure MySQL 8 is running (Windows: `services.msc` → **MySQL80** → Start).
2. Install the package:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and put your MySQL password in it:
   ```
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=student_db
   ```
   `.env` is in `.gitignore`, so your password is never pushed to GitHub.

Needs Node.js 20.6+ (uses `node --env-file`).

## Database operations

Run each step on its own:

| Step | Command | SQL used |
|---|---|---|
| Create connection | (every script, via `db.js`) | `mysql.createConnection()` |
| 1. Create database | `npm run create-db` | `CREATE DATABASE IF NOT EXISTS student_db` |
| 2. Create table | `npm run create-table` | `CREATE TABLE students (...)`, `DESCRIBE` |
| 3. Insert records | `npm run insert` | `INSERT` (single with `?` placeholders, and bulk) |
| 4. Retrieve records | `npm run select` | `SELECT` with `WHERE`, `LIKE`, `ORDER BY`, `LIMIT`, `COUNT/AVG/MAX` |
| 5. Update records | `npm run update` | `UPDATE ... WHERE` |
| 6. Delete records | `npm run delete` | `DELETE ... WHERE` |
| 7. Drop table | `npm run drop-table` | `DROP TABLE IF EXISTS students` |

Or run all seven in order: `npm run all` (add `-- --keep` to skip the drop at the end).

## Menu app

```bash
npm start
```

```
===== Student Database =====
1. Add student
2. List all students
3. Search student
4. Update student
5. Delete student
0. Exit
```

## Table design

```sql
CREATE TABLE students (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  usn        VARCHAR(15)  NOT NULL UNIQUE,
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(100) NOT NULL,
  course     VARCHAR(50)  NOT NULL DEFAULT 'MCA',
  semester   TINYINT      NOT NULL CHECK (semester BETWEEN 1 AND 8),
  marks      DECIMAL(5,2) DEFAULT NULL,
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);
```

## Project structure

```
student-db-mysql/
├── package.json          Scripts for each operation, mysql2 dependency
├── .env.example          Connection settings template (copy to .env)
├── db.js                 Create connection + friendly error messages
├── app.js                Interactive menu (add, list, search, update, delete)
└── operations/
    ├── 1-create-database.js
    ├── 2-create-table.js
    ├── 3-insert.js
    ├── 4-select.js
    ├── 5-update.js
    ├── 6-delete.js
    ├── 7-drop-table.js
    └── run-all.js        Runs steps 1–7 on one connection
```

## Notes

- All queries use `?` placeholders (`conn.execute`), which protects against SQL injection.
- Uses `mysql2/promise` with async/await; connections are always closed in `finally`.
- Common errors (MySQL not running, wrong password, missing database, duplicate USN) show a clear message.

## Commit history

1. Initial commit: npm project with mysql2 and .env config template
2. Add MySQL connection module with error handling
3. Add create database and create table operations
4. Add insert and retrieve records operations
5. Add update, delete and drop table operations
6. Add script to run all operations in order
7. Add interactive menu app for student CRUD
8. Add README with setup, operations and table design
