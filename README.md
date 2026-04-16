# Zelta Premium — Telegram Mini App + Bot

## Production-Ready Lead Funnel System

Premium furniture brand lead capture system built as a Telegram Mini App with an integrated Telegram Bot and Admin Panel.

---

## Architecture Overview

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Mini App Frontend** | Vanilla HTML/CSS/JS | 6-screen bilingual lead funnel (Uzbek + Russian) |
| **Backend API** | Node.js + Express | REST API for leads, file uploads, admin |
| **Database** | SQLite (sql.js) | Lead storage, status tracking, audit log |
| **File Storage** | Local filesystem | Uploaded room photos stored in `/public/uploads/` |
| **Telegram Bot** | node-telegram-bot-api | `/start` entry, Mini App launcher, admin notifications |
| **Admin Panel** | HTML/CSS/JS | Lead management, status updates, CSV export |

---

## Project Structure

```
zelta-premium/
├── server.js              # Express server + API routes
├── bot.js                 # Telegram Bot (separate process)
├── package.json
├── public/
│   ├── index.html         # Mini App — main funnel UI
│   ├── app.js             # Mini App — frontend logic
│   ├── uploads/           # Uploaded photos (auto-created)
│   └── images/            # Static assets
├── admin/
│   └── index.html         # Admin Panel
├── data/
│   └── zelta.db           # SQLite database (auto-created)
└── src/
    └── locales/
        └── translations.js # Full Uzbek + Russian translations
```

---

## Funnel Flow (6 Screens)

| Screen | Purpose | Key Elements |
|--------|---------|-------------|
| **1. Landing** | Brand intro + trust | Language switcher, logo, call card, showroom, Instagram/Telegram links, privacy line |
| **2. Offer** | Explain limited offer | Counter (36th client), 3-step process explanation |
| **3. Photos** | Collect 3 room photos | Upload grid, tips, preview, replace functionality |
| **4. Phone** | Capture phone number | +998 prefix, formatting, privacy reassurance |
| **5. Qualification** | Optional furniture/room type | Low-friction selection grid, skip option |
| **6. Success** | Confirmation | 20-min SLA promise, portfolio + call buttons |

---

## Setup & Deployment

### Prerequisites

- Node.js 18+ installed
- A Telegram Bot token (from [@BotFather](https://t.me/BotFather))
- A public HTTPS URL for the Mini App (required by Telegram)

### 1. Install Dependencies

```bash
cd zelta-premium
npm install
```

### 2. Configure Environment Variables

```bash
# Required for Telegram Bot
export TELEGRAM_BOT_TOKEN="your_bot_token_here"

# Required for Mini App URL (must be HTTPS)
export MINI_APP_URL="https://your-domain.com"

# Optional: Admin notifications
export ADMIN_CHAT_ID="your_admin_chat_id"

# Optional: Custom port (default: 3000)
export PORT=3000
```

### 3. Start the Server

```bash
# Start the web server (Mini App + API + Admin)
npm start

# In a separate terminal, start the bot
npm run bot
```

### 4. Configure Telegram Bot

1. Open [@BotFather](https://t.me/BotFather) in Telegram
2. Send `/mybots` → select your bot
3. Go to **Bot Settings** → **Menu Button**
4. Set the menu button URL to your Mini App URL (e.g., `https://your-domain.com`)
5. Go to **Bot Settings** → **Configure Mini App**
6. Set the Mini App URL

### 5. Deploy to Production

**Option A: VPS / Cloud Server**

```bash
# Install PM2 for process management
npm install -g pm2

# Start server
pm2 start server.js --name zelta-server

# Start bot
pm2 start bot.js --name zelta-bot

# Save PM2 config
pm2 save
pm2 startup
```

**Option B: Vercel (Frontend) + Railway/Render (Backend)**

The project can be split:
- Deploy `public/` to Vercel as static site
- Deploy `server.js` to Railway/Render as Node.js app
- Point API calls to the backend URL

**Option C: Docker**

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

---

## API Reference

### Submit Lead
```
POST /api/leads
Content-Type: multipart/form-data

Fields:
- lead_data: JSON string with lead information
- photo_1: Image file
- photo_2: Image file
- photo_3: Image file
```

### Get All Leads
```
GET /api/leads?status=new&limit=50&offset=0&search=phone
```

### Get Single Lead
```
GET /api/leads/:lead_id
```

### Update Lead
```
PATCH /api/leads/:lead_id
Content-Type: application/json

Body: { "status": "contacted", "notes": "Called client", "manager_assigned": "John" }
```

### Export CSV
```
GET /api/export/csv
```

### Dashboard Stats
```
GET /api/stats
```

---

## Lead Statuses

| Status | Meaning |
|--------|---------|
| `new` | Just submitted, awaiting first contact |
| `waiting` | Waiting for client response |
| `contacted` | First contact made |
| `render_progress` | 3D render being prepared |
| `render_sent` | Render delivered to client |
| `qualified` | Client qualified for sale |
| `closed` | Sale completed |
| `lost` | Lead lost / not interested |

---

## Database Schema

### `leads` Table

| Column | Type | Description |
|--------|------|-------------|
| lead_id | TEXT PK | Auto-generated (ZP-XXXXX-XXXXXX) |
| created_at | TEXT | ISO timestamp |
| telegram_user_id | TEXT | Telegram user ID |
| telegram_username | TEXT | Telegram @username |
| full_name | TEXT | First + last name |
| selected_language | TEXT | 'uz' or 'ru' |
| photo_1, photo_2, photo_3 | TEXT | File paths |
| phone_number | TEXT | +998XXXXXXXXX format |
| furniture_interest | TEXT | bedroom/living/dining/other |
| room_type | TEXT | new/renovation/existing |
| current_status | TEXT | Lead pipeline status |
| source | TEXT | Traffic source |
| session_metadata | TEXT | Full JSON session data |
| submitted_at | TEXT | Form submission time |
| manager_assigned | TEXT | Assigned manager name |
| first_contact_at | TEXT | When first contacted |
| notes | TEXT | Manager notes |
| sla_deadline | TEXT | 20-min callback deadline |

### `lead_status_log` Table

Tracks all status changes for audit trail.

---

## Bilingual Support

The app supports full **Uzbek** and **Russian** localization:

- Language switcher on Screen 1 (embedded, not a separate page)
- All UI text, labels, buttons, tips, and messages are translated
- Russian translations are polished business-friendly text (not literal translations)
- Selected language is saved in session and submitted with lead data

---

## Key Features

- **Premium dark UI**: Black/graphite background with muted gold accents
- **Mobile-first**: Optimized for Telegram Mini App viewport
- **Click actions**: Phone call, Instagram link, Telegram deep link with prefilled message
- **Photo upload**: 3 required photos with preview and replace
- **Phone validation**: Uzbekistan format (+998) with auto-formatting
- **20-minute SLA**: Tracked in database with admin dashboard indicator
- **Admin notifications**: Telegram message to admin on new lead
- **CSV export**: One-click download of all leads
- **Status pipeline**: Full lead lifecycle tracking
- **Auto-refresh**: Admin panel refreshes every 30 seconds

---

## Access Points

| URL | Purpose |
|-----|---------|
| `http://localhost:3000` | Mini App (main funnel) |
| `http://localhost:3000/admin` | Admin Panel |
| `http://localhost:3000/api/leads` | Leads API |
| `http://localhost:3000/api/stats` | Stats API |
| `http://localhost:3000/api/export/csv` | CSV Export |

---

## Security Notes

- In production, add authentication to `/admin` and `/api/*` routes
- Use HTTPS (required for Telegram Mini Apps)
- Consider rate limiting on `/api/leads` POST endpoint
- Move file uploads to cloud storage (S3, Cloudflare R2) for production
- Add CORS configuration for production domain

---

## Future Enhancements

- Dynamic counter (backend-driven, currently static at 36)
- SLA escalation alerts (auto-remind if 20 min exceeded)
- Manager assignment automation
- Webhook integration for CRM systems
- Analytics dashboard with conversion metrics
- A/B testing for funnel copy
- Push notification reminders via Telegram Bot
