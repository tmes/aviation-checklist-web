# Aerocheck - Aviation Checklist Management

Multi-tenant Progressive Web App for aviation checklist management.

## Quick Start

### Development

**Frontend:**
```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

**Backend:**
```bash
cd backend
composer install
cp .env.example .env
# Edit .env with database credentials
php -S localhost:8000 -t public
# → http://localhost:8000
```

**Database:**
```sql
CREATE DATABASE aerocheck;
-- Import schema: backend/database/schema.sql
```

---

## Documentation

**Complete documentation is in:**
- **ARCHITECTURE.md** - Complete system architecture, database schema, API endpoints
- **SECURITY.md** - Security implementation and best practices
- **DESIGN_SYSTEM.md** - Icon system and UI guidelines
- **ARCHITECTURE_SUMMARY.md** - Quick overview of changes and setup
- **CLAUDE.md** - Development guidance for Claude Code

---

## Tech Stack

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS + Lucide Icons
- **Backend:** PHP 8.2 + Slim Framework + MySQL 8.0
- **Auth:** JWT (firebase/php-jwt)
- **Hosting:** Shared Webhosting (cPanel compatible)

---

## Deployment

Both frontend and backend run on the same shared hosting account.

**Build & Upload:**
```bash
# Frontend
cd frontend
npm run build
# Upload dist/ contents to public_html/

# Backend
cd backend
composer install --no-dev --optimize-autoloader
# Upload to public_html/api/
```

See **ARCHITECTURE.md** → Deployment Strategy for full details.

---

## License

MIT
