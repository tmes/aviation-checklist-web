# FRONTEND/BACKEND SEPARATION GUIDE

**TL;DR:** Frontend en backend kunnen **op elk moment** gescheiden worden - het is letterlijk 5 minuten werk.

---

## WAAROM HET MAKKELIJK IS

De architectuur is **al volledig gescheiden**:

```
┌─────────────────────────────────┐
│  Frontend (React)               │
│  - Volledig statisch            │
│  - Geen server-side rendering   │
│  - Geen PHP dependencies        │
│  - Gebouwd tot HTML/CSS/JS      │
└─────────────────────────────────┘
              │
              │ HTTP Requests
              │ (JSON over HTTPS)
              ▼
┌─────────────────────────────────┐
│  Backend (PHP API)              │
│  - Volledig stateless           │
│  - REST API (JSON responses)    │
│  - JWT authentication           │
│  - CORS enabled                 │
└─────────────────────────────────┘
```

**Geen tight coupling:**
- ❌ Geen shared sessions
- ❌ Geen server-side rendering
- ❌ Geen server variables in frontend
- ❌ Geen hardcoded URLs
- ✅ Alleen API calls via environment variable
- ✅ Stateless JWT tokens
- ✅ Pure REST API

---

## HUIDIGE SETUP (SAMEN)

**Shared Hosting:**
```
public_html/
├── index.html              # Frontend
├── assets/
└── api/
    └── public/
        └── index.php       # Backend
```

**Frontend roept backend aan:**
```typescript
// frontend/src/lib/api/client.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// In productie:
// VITE_API_URL = "/api" (relative URL, zelfde domein)
```

**Backend CORS:**
```apache
# .htaccess
Header set Access-Control-Allow-Origin "https://aerocheck.com"
# Of relatief: zelfde domein, geen CORS headers nodig
```

---

## SCENARIO 1: FRONTEND NAAR VERCEL/NETLIFY

**Stap 1: Frontend deployen op Vercel**
```bash
cd frontend

# Update .env voor productie
echo "VITE_API_URL=https://aerocheck.com/api" > .env.production

# Build
npm run build

# Deploy naar Vercel (automatisch via GitHub of CLI)
vercel deploy
```

**Stap 2: Backend CORS updaten**
```apache
# backend/public/.htaccess
<IfModule mod_headers.c>
    # Update origin naar Vercel URL
    Header set Access-Control-Allow-Origin "https://app-aerocheck.vercel.app"
    Header set Access-Control-Allow-Methods "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type, Authorization"
    Header set Access-Control-Allow-Credentials "true"
</IfModule>
```

**Klaar!** Frontend draait op Vercel, backend op shared hosting.

**Result:**
```
Frontend: https://app-aerocheck.vercel.app
Backend:  https://aerocheck.com/api
```

---

## SCENARIO 2: BEIDE SCHEIDEN (VERSCHILLENDE DOMEINEN)

**Frontend op Vercel/Cloudflare:**
```bash
cd frontend
echo "VITE_API_URL=https://api.aerocheck.com" > .env.production
npm run build
vercel deploy --prod
```

**Backend op aparte VPS/hosting:**
```bash
# Verplaats backend naar api.aerocheck.com
cd backend

# Update .htaccess CORS
Header set Access-Control-Allow-Origin "https://app.aerocheck.com"
```

**DNS Setup:**
```
app.aerocheck.com → Vercel (CNAME)
api.aerocheck.com → Shared Hosting IP (A record)
```

**Result:**
```
Frontend: https://app.aerocheck.com (Vercel)
Backend:  https://api.aerocheck.com (Shared Hosting)
```

---

## SCENARIO 3: BACKEND NAAR VPS (SCHALEN)

Als je later meer performance nodig hebt:

**Backend verhuizen naar VPS (DigitalOcean, AWS, etc.):**

```bash
# 1. Setup VPS met nginx + PHP 8.2
ssh user@vps-ip

# 2. Clone backend code
git clone your-repo.git
cd backend
composer install --no-dev

# 3. Setup nginx config
server {
    listen 80;
    server_name api.aerocheck.com;
    root /var/www/backend/public;

    location / {
        try_files $uri /index.php$is_args$args;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        # ...
    }
}

# 4. Setup SSL
certbot --nginx -d api.aerocheck.com
```

**Frontend blijft ongewijzigd:**
```typescript
// Nog steeds dezelfde API URL
VITE_API_URL=https://api.aerocheck.com
```

**Result:**
```
Frontend: https://app.aerocheck.com (Vercel)
Backend:  https://api.aerocheck.com (VPS met nginx)
Database: MySQL op VPS of managed service (AWS RDS, PlanetScale)
```

---

## SCENARIO 4: MICROSERVICES (TOEKOMST)

Als je ooit wilt schalen naar microservices:

```
Frontend: https://app.aerocheck.com
  │
  ├─→ Auth API:      https://auth.aerocheck.com
  ├─→ Aircraft API:  https://aircraft.aerocheck.com
  ├─→ Checklist API: https://checklists.aerocheck.com
  └─→ Sync API:      https://sync.aerocheck.com
```

**Aanpassing frontend:**
```typescript
// frontend/src/lib/api/client.ts
const API_URLS = {
  auth: import.meta.env.VITE_AUTH_API_URL,
  aircraft: import.meta.env.VITE_AIRCRAFT_API_URL,
  checklists: import.meta.env.VITE_CHECKLISTS_API_URL,
  sync: import.meta.env.VITE_SYNC_API_URL,
};
```

Elk API kan op eigen server/container draaien.

---

## CHECKLIST VOOR SCHEIDING

**Wat moet je wijzigen:**
- [ ] Frontend: Update `VITE_API_URL` in `.env.production`
- [ ] Frontend: Rebuild (`npm run build`)
- [ ] Frontend: Deploy naar nieuwe hosting
- [ ] Backend: Update CORS origin in `.htaccess` of nginx config
- [ ] DNS: Update A/CNAME records (if different domains)
- [ ] Test: Verify API calls work from new frontend URL

**Wat blijft hetzelfde:**
- ✅ Alle API endpoints blijven identiek
- ✅ Database blijft op backend server
- ✅ JWT tokens blijven werken
- ✅ Geen code changes nodig (alleen env vars)
- ✅ Gebruikers merken niets

**Tijd nodig:** 5-30 minuten (afhankelijk van DNS propagatie)

---

## WAAROM DIT ZO GOED WERKT

**1. Stateless Backend**
```php
// Geen PHP sessions
// Geen cookies voor auth
// Alles via JWT tokens in Authorization header
// Elk request is independent
```

**2. Environment Variables**
```typescript
// Geen hardcoded URLs
const API_URL = import.meta.env.VITE_API_URL;

// Frontend weet niet waar backend draait
// Backend weet niet waar frontend draait
// Perfect loose coupling
```

**3. CORS Configuration**
```apache
# Makkelijk aan te passen
Header set Access-Control-Allow-Origin "https://nieuwe-frontend-url.com"
```

**4. REST API**
```
# Geen server-side rendering
# Geen PHP templates
# Pure JSON API
# Frontend is compiled static files
```

---

## VOORBEELD: GELEIDELIJKE MIGRATIE

**Week 1:** Alles op shared hosting
```
https://aerocheck.com/          → Frontend
https://aerocheck.com/api       → Backend
```

**Week 2:** Frontend naar Cloudflare Pages (gratis)
```
https://aerocheck.pages.dev/    → Frontend (Cloudflare)
https://aerocheck.com/api       → Backend (shared hosting)
```

**Week 3:** Custom domain voor frontend
```
https://app.aerocheck.com/      → Frontend (Cloudflare)
https://aerocheck.com/api       → Backend (shared hosting)
```

**Week 4:** Backend naar subdomain
```
https://app.aerocheck.com/      → Frontend (Cloudflare)
https://api.aerocheck.com/      → Backend (shared hosting)
```

**Later:** Backend naar VPS (als nodig)
```
https://app.aerocheck.com/      → Frontend (Cloudflare)
https://api.aerocheck.com/      → Backend (VPS met nginx)
```

Elk van deze stappen kan **onafhankelijk** en **zonder downtime** gebeuren.

---

## KOSTEN VERGELIJKING

**Optie 1: Alles samen (nu)**
```
Shared Hosting: €5-15/maand
Total: €5-15/maand
```

**Optie 2: Frontend gescheiden**
```
Frontend (Vercel/Cloudflare): €0 (gratis tier)
Backend (Shared Hosting): €5-15/maand
Total: €5-15/maand
```

**Optie 3: Beide gescheiden**
```
Frontend (Vercel/Cloudflare): €0 (gratis tier)
Backend (VPS): €5-40/maand
Database (managed): €0-10/maand
Total: €5-50/maand
```

**Optie 4: Enterprise scale**
```
Frontend (Cloudflare): €20/maand
Backend (AWS/GCP): €50-500/maand
Database (AWS RDS): €30-200/maand
Total: €100-720/maand
```

Je kunt **groeien naarmate je schaalt**.

---

## CONCLUSIE

**Kan het gescheiden worden?**
✅ JA - op elk moment, binnen 5 minuten

**Is het makkelijk?**
✅ JA - alleen environment variables wijzigen

**Verlies je functionaliteit?**
❌ NEE - alles blijft exact hetzelfde werken

**Moet je code aanpassen?**
❌ NEE - alleen configuratie (.env + CORS)

**Is de architectuur toekomstbestendig?**
✅ JA - kan groeien van shared hosting tot enterprise microservices

---

## SAMENVATTING

De architectuur is **perfect ontworpen** voor scheiding:

- Frontend = statische build (kan overal draaien)
- Backend = REST API (stateless, schaalbaar)
- Communicatie = HTTP/JSON (universeel)
- Auth = JWT tokens (geen server-side sessions)
- URLs = environment variables (makkelijk te wijzigen)
- CORS = configureerbaar (support voor elk domein)

**Je bent niet locked-in.** Je kunt **altijd** scheiden, **op elk moment**, met **minimale moeite**.

**Start samen, schaal later.** 🚀
