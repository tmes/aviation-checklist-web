# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Aerocheck is a Progressive Web App for aviation checklist management with multi-tenant support. The application uses a monorepo structure with separate frontend and backend directories.

**Tech Stack:**
- Frontend: React 19 + TypeScript + Vite + Tailwind CSS + Zustand + TanStack Query
- Backend: PHP 8.2 + Slim Framework
- Database: MySQL 8.0

## Development Commands

### Frontend (React/TypeScript)
```bash
cd frontend
npm install           # Install dependencies
npm run dev          # Start dev server at http://localhost:5173
npm run build        # Build for production (runs TypeScript compiler + Vite)
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

### Backend (PHP)
```bash
cd backend
composer install     # Install dependencies
composer start       # Start PHP dev server at http://localhost:8000
composer test        # Run PHPUnit tests
```

### Database Setup
```bash
# Create database
CREATE DATABASE aerocheck;

# Configure backend/.env with database credentials:
# DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS, JWT_SECRET, JWT_EXPIRY
```

## Architecture

### Backend Structure

**Entry Point:** `backend/public/index.php` - Simple custom router (no Slim App bootstrap yet)
- Handles CORS for frontend at `http://localhost:5173`
- Manual routing with if/else statements for each endpoint
- Loads environment variables via `phpdotenv`

**Authentication Flow:**
1. `AuthController` handles registration/login at `/api/auth/*`
2. `JWTService` generates/validates JWT tokens using `firebase/php-jwt`
3. `AuthMiddleware::authenticate()` validates tokens and returns userId for protected routes
4. JWT tokens are passed via `Authorization: Bearer <token>` header

**Database:**
- `App\Database\Connection` - Singleton PDO connection with MySQL
- Uses environment variables for configuration
- PSR-4 autoloading: `App\` namespace maps to `backend/src/`

**Current API Endpoints:**
- `GET /api/health` - Health check with database status
- `POST /api/auth/register` - User registration with JWT response
- `POST /api/auth/login` - User login with JWT response
- `GET /api/users/me` - Get current user (requires auth)

### Frontend Structure

**State Management:**
- Zustand for global state
- TanStack Query (@tanstack/react-query) for server state/caching

**Routing:**
- React Router DOM v7 for navigation

**TypeScript Types:**
- Complete type definitions in `frontend/src/types/index.ts`
- Includes: User, Auth, Aircraft, FlightPhases, Checklists, ChecklistExecution, API responses

**Data Files:**
- `frontend/src/lib/data/aircraftTypes.ts` - 8 predefined aircraft types (SEP, MEP, JET, etc.)
- `frontend/src/lib/data/flightPhases.ts` - 14 normal + 2 emergency flight phases

**Build Tool:**
- Uses `rolldown-vite@7.1.14` (Vite alternative) via npm overrides

## Development Notes

### CORS Configuration
- Backend allows `http://localhost:5173` origin with credentials
- Headers: `Content-Type`, `Authorization`
- Methods: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`

### Database Schema
According to README, there are 8 tables in the schema (not yet visible in codebase). Tables likely include:
- users (with id, email, password_hash, first_name, last_name, is_active, created_at, updated_at, last_login_at)
- aircraft_types
- aircraft
- checklists
- checklist_items
- checklist_executions
- checklist_item_actions
- user_settings

### Authentication
- Uses JWT tokens with configurable expiry (default 7 days)
- UUIDs generated via `AuthController::generateUUID()` for user IDs
- Passwords hashed with `PASSWORD_BCRYPT`
- Last login timestamp updated on successful login

### Current Development Status
According to README:
- ✅ Project setup, database schema, TypeScript types, aircraft data
- 🔄 Authentication (in progress)
- 🔄 Aircraft management
- 🔄 Checklist CRUD

### Planned Features (Phase 2)
- Multi-tenant organizations
- Checklist distribution
- Skip tracking & analytics
- Compliance reporting
