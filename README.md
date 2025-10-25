# Aerocheck - Aviation Checklist Management

Progressive Web App for aviation checklist management with multi-tenant support.

## 🚀 Tech Stack

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS
- **Backend:** PHP 8.2 + Slim Framework
- **Database:** MySQL 8.0 (MAMP Pro)

## 📁 Project Structure

aerocheck/ ├── frontend/ # React PWA ├── backend/ # PHP REST API └── README.md

## 🛠️ Development Setup

### Frontend

````bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
Backend
cd backend
composer install
cp .env.example .env
# Edit .env with database credentials
php -S localhost:8000 -t public
# → http://localhost:8000
Database
CREATE DATABASE aerocheck;
-- Run schema from backend/database/schema.sql
🎯 Features
Phase 1 (Current)
✅ Project setup
✅ Database schema
✅ TypeScript types
✅ Aircraft types & flight phases data
🔄 Authentication (in progress)
🔄 Aircraft management
🔄 Checklist CRUD
Phase 2 (Planned)
Multi-tenant organizations
Checklist distribution
Skip tracking & analytics
Compliance reporting
📄 License
MIT


---

## 📋 **Stage Files**

```bash
cd /Users/tommesselis/Sites/aerocheck

# Check wat er is
git status

# Add alles BEHALVE .env (die staat al in .gitignore)
git add .

# Check wat staged is
git status
💾 Commit
git commit -m "Initial setup: Aerocheck Aviation Checklist

✨ Features:
- Frontend: React 19 + TypeScript + Vite + Tailwind CSS
- Backend: PHP 8.2 + Slim framework structure
- Database: MySQL schema with aircraft types seeded
- Types: Complete TypeScript definitions
- Data: Aircraft types (8) and flight phases (14+2)
- CORS: Frontend ↔ Backend communication configured

🎯 Status:
- Frontend running on localhost:5173
- Backend running on localhost:8000
- Database 'aerocheck' with 8 tables
- Health check endpoint functional

📝 Next:
- Authentication system (JWT)
- Aircraft CRUD endpoints
- Checklist management"
````
