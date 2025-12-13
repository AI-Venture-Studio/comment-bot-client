# Instagram Marketing Automation Platform

**Version:** 2.0  
**Last Updated:** October 23, 2025  
**Tech Stack:** Next.js 14 + TypeScript + Supabase + Flask API

## 📋 Quick Navigation

- [Quick Start](#quick-start) - Get running in 5 minutes
- [Overview](#overview) - What this app does
- [Architecture](#architecture) - System design
- [Features](#features) - Core functionality
- [Database Schema](#database-schema) - Table structures
- [API Integration](#api-integration) - Backend endpoints
- [Environment Setup](#environment-setup) - Configuration
- [Deployment](#deployment) - Deploy checklist
- [Troubleshooting](#troubleshooting) - Common issues

---

## 🚀 Quick Start

### Prerequisites

```bash
- Node.js 18+
- npm or yarn
- Supabase account (PostgreSQL database)
- Python 3.9+ (backend API)
- Apify account (Instagram scraping)
- Airtable account (VA workspace)
```

### Installation (5 minutes)

```bash
# 1. Navigate to client directory
cd client

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# 4. Run development server
npm run dev

# 5. Open in browser
# http://localhost:3000
```

### First Time Setup

1. **Login:** Navigate to `/callum` route
   - Username: (from env `NEXT_PUBLIC_USERNAME`)
   - Password: (from env `NEXT_PUBLIC_PASSWORD`)
   - OTP: (from env `NEXT_PUBLIC_OTP`)

2. **Add Source Accounts:** Click "Edit Source Profiles" in Dependencies Card
   - Add Instagram usernames or URLs
   - Saves to Supabase `source_profiles` table

3. **Run Scraping:** Click "Find Accounts" button
   - Shows progress bar (scraping → ingesting → complete)

4. **Assign to VAs:** Click "Assign to VAs" button
   - Creates campaign and selects 14,400 profiles
   - Distributes to 80 VA tables
   - Syncs to Airtable

---

## 🎯 Overview

This is an Instagram marketing automation platform that:

1. **Scrapes Instagram followers** - Extract followers from source accounts
2. **Filters by gender** - Identify male profiles using name-based detection
3. **Manages database** - Store and deduplicate profiles in Supabase
4. **Creates campaigns** - Select daily batches of unused profiles
5. **Distributes to VAs** - Distribute profiles across 80 VA Airtable tables
6. **Syncs Airtable** - Push profiles to Airtable for VA access
7. **Manages lifecycle** - Track and cleanup 7-day old campaigns

### Key Metrics

- **Daily Target:** 14,400 unique male profiles
- **VA Count:** 80 virtual assistants
- **Profiles per VA:** 180 per day
- **Campaign Lifecycle:** 7 days
- **Total Capacity:** 1.008M profiles/week

---

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- Next.js 14.2.25 (App Router)
- TypeScript
- Tailwind CSS
- ShadCN UI (Radix UI primitives)
- Supabase Client

**Backend:**
- Flask API (Python)
- Apify (Instagram scraping)
- Supabase (PostgreSQL database)
- Airtable API

**Database:**
- Supabase PostgreSQL
- Row Level Security (RLS)
- Real-time subscriptions

### Application Flow

```
Source Profiles (Instagram IDs)
        ↓
   Apify Scraper (Extract Followers)
        ↓
   Gender Detection (Filter Males)
        ↓
   Supabase Storage (Deduplication)
        ↓
   Daily Selection (14,400 profiles)
        ↓
   VA Distribution (80 tables × 180)
        ↓
   Airtable Sync (VA Access)
```

---

## ✨ Features & Workflows

### 1. Instagram Account Management

**Component:** `dependencies-card.tsx`

**Features:**
- Add Instagram accounts (username or URL)
- Remove individual accounts
- Edit source profiles (dialog)
- Load profiles from database
- Validate Instagram URLs

**Database Table:** `source_profiles`

**Workflow:**
1. Click "Edit Source Profiles" button
2. Enter Instagram username or URL
3. Press Enter or click + button
4. Profile saved to Supabase

### 2. Follower Scraping & Auto-Ingest

**Component:** `dependencies-card.tsx`

**Features:**
- Scrape followers from source accounts
- Gender filtering (male profiles only)
- Auto-ingest to database
- Progress tracking
- Duplicate detection

**API Endpoints:**
- `/api/scrape-followers` - Scrapes Instagram followers
- `/api/ingest` - Saves to database

**Workflow:**
1. Click "Find Accounts" button
2. **Scraping Phase (10-50%):**
   - Calls Apify Instagram scraper
   - Extracts followers from all source accounts
   - Applies gender detection (male filtering)

3. **Ingesting Phase (60-80%):**
   - Auto-triggered after scraping
   - Saves to `raw_scraped_profiles` table
   - Deduplicates in `global_usernames` table

4. **Complete (100%):**
   - Shows success message
   - Updates UI components

### 3. Campaign Workflow & VA Assignment

**Component:** `payments-table.tsx`

**Features:**
- Display scraped accounts (paginated)
- One-click campaign creation
- VA distribution
- Airtable synchronization
- Progress tracking

**API Endpoints:**
1. `/api/daily-selection` - Creates campaign, selects 14,400 profiles
2. `/api/distribute/{id}` - Distributes to 80 VA tables
3. `/api/airtable-sync/{id}` - Syncs to Airtable

**Workflow:**
1. Click "Assign to VAs" button
2. **Creating Campaign (0-33%):**
   - Creates campaign in `campaigns` table
   - Selects 14,400 unused profiles
   - Marks profiles as used

3. **Distributing (33-66%):**
   - Distributes 14,400 profiles to 80 VA tables
   - Each VA gets 180 profiles

4. **Syncing to Airtable (66-100%):**
   - Pushes profiles to 80 Airtable tables
   - VAs can access via Airtable interface

### 4. Campaign History

**Component:** `campaigns-table.tsx`

**Features:**
- View all campaigns
- Color-coded status indicators
- Campaign details (date, count, status)

**Database Table:** `campaigns`

**Status Indicators:**
- 🟢 **Green (Success)** - Campaign completed successfully
- 🔴 **Red (Failed)** - Campaign failed
- ⚪ **Grey (Pending)** - Campaign in progress

### 5. Username Pool Status

**Component:** `username-status-card.tsx`

**Features:**
- Shows unused username count
- Daily target comparison (14,400)
- Manual refresh button
- Status warnings

**Status Messages:**
- **Ready (Grey):** Sufficient profiles (≥14,400)
- **Warning (Red):** Insufficient profiles (<14,400)

### 6. Scraping Job Configuration

**Components:** `configure-job-card.tsx`, `job-list-by-platform.tsx`

**Features:**
- Create scraping jobs for multiple platforms
- Platform-specific job lists (Instagram, Threads, TikTok, X)
- Real-time statistics (username count, assignment count)
- Status management (active/paused/archived)
- Sidebar with recents and platform navigation
- Airtable base linking with progress tracking

**Database Table:** `scraping_jobs`

**Workflow:**
1. Fill job form (Influencer name, Platform, Number of VAs)
2. Click "Create Job" → Saved to Supabase
3. Enter Airtable base URL → Non-skippable dialog
4. Setup progress (3-second animation)
5. Success → Redirect to dashboard

---

## 🗄️ Database Schema

### 1. source_profiles
Stores Instagram accounts to scrape from.

```sql
CREATE TABLE source_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 2. raw_scraped_profiles
Stores all scraped Instagram profiles.

```sql
CREATE TABLE raw_scraped_profiles (
  id TEXT PRIMARY KEY,
  username TEXT,
  full_name TEXT,
  follower_count INTEGER,
  following_count INTEGER,
  post_count INTEGER,
  is_verified BOOLEAN,
  is_private BOOLEAN,
  biography TEXT,
  url TEXT,
  detected_gender TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3. global_usernames
Deduplicated username pool.

```sql
CREATE TABLE global_usernames (
  username TEXT PRIMARY KEY,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 4. campaigns
Campaign tracking and status.

```sql
CREATE TABLE campaigns (
  campaign_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_date DATE NOT NULL,
  total_assigned INTEGER NOT NULL,
  status TEXT CHECK (status IN ('pending', 'success', 'failed')),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 5. daily_assignments
Profile-to-campaign assignments.

```sql
CREATE TABLE daily_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(campaign_id),
  username TEXT,
  va_table_number INTEGER,
  assigned_at TIMESTAMP DEFAULT NOW()
);
```

### 6. scraping_jobs
Multi-tenant scraping job management.

```sql
CREATE TABLE scraping_jobs (
  job_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  influencer_name TEXT NOT NULL,
  platform TEXT NOT NULL,
  airtable_base_id TEXT,
  num_vas INTEGER,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🔌 API Integration

### Backend API Endpoints

**Base URL:** `http://localhost:5001` (configurable via `NEXT_PUBLIC_API_URL`)

#### POST /api/scrape-followers
Scrapes Instagram followers from source accounts.

```json
{
  "accounts": ["username1", "username2"],
  "targetGender": "male"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "accounts": [...],
    "totalScraped": 1000,
    "totalFiltered": 450,
    "genderDistribution": {
      "male": 450,
      "female": 400,
      "unknown": 150
    }
  }
}
```

#### POST /api/ingest
Ingests profiles into database.

```json
{
  "profiles": [...]
}
```

Response:
```json
{
  "success": true,
  "message": "Profiles ingested successfully",
  "stats": {
    "total_processed": 450,
    "new_profiles": 380,
    "duplicates": 70
  }
}
```

#### POST /api/daily-selection
Creates campaign and selects 14,400 profiles.

Response:
```json
{
  "success": true,
  "campaign_id": "uuid-here",
  "total_selected": 14400,
  "campaign_date": "2025-10-06"
}
```

#### POST /api/distribute/{campaign_id}
Distributes profiles to VA tables.

Response:
```json
{
  "success": true,
  "campaign_id": "uuid-here",
  "va_tables": 80,
  "profiles_per_table": 180
}
```

#### POST /api/airtable-sync/{campaign_id}
Syncs profiles to Airtable.

Response:
```json
{
  "success": true,
  "campaign_id": "uuid-here",
  "tables_synced": 80,
  "total_records": 14400
}
```

#### POST /api/cleanup
Cleanup 7-day old campaigns.

Response:
```json
{
  "success": true,
  "campaigns_cleaned": 5,
  "profiles_freed": 72000
}
```

**Note:** Should be run as a cron job daily at 2 AM:
```bash
0 2 * * * curl -X POST http://localhost:5001/api/cleanup
```

---

## ⚙️ Environment Setup

### Frontend Environment Variables (.env.local)

```bash
# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:5001

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Authentication Credentials
NEXT_PUBLIC_USERNAME=your-username
NEXT_PUBLIC_PASSWORD=your-password
NEXT_PUBLIC_OTP=123456

# Campaign Configuration
NEXT_PUBLIC_DAILY_SELECTION_TARGET=14400

# Source Profiles Management
NEXT_PUBLIC_DELETE_PASSWORD=delete123
```

### Backend Environment Variables (.env)

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key

# Apify (Instagram Scraper)
APIFY_API_KEY=your-apify-key
APIFY_ACTOR_ID=your-actor-id

# Airtable
AIRTABLE_API_KEY=your-airtable-key
AIRTABLE_BASE_ID=your-base-id

# Gender Detection API (optional)
GENDER_API_KEY=your-gender-api-key
```

---

## 🧩 Component Reference

### Page Components

| Path | Purpose |
|------|---------|
| `/app/callum/page.tsx` | User authentication |
| `/app/callum-dashboard/page.tsx` | Main application interface |
| `/app/configure/page.tsx` | Scraping job configuration |
| `/app/instagram-jobs/page.tsx` | Instagram jobs list |
| `/app/threads-jobs/page.tsx` | Threads jobs list |
| `/app/tiktok-jobs/page.tsx` | TikTok jobs list |
| `/app/x-jobs/page.tsx` | X jobs list |

### Feature Components

| Component | File | Purpose |
|-----------|------|---------|
| **DependenciesCard** | `dependencies-card.tsx` | Instagram account management & scraping |
| **PaymentsTable** | `payments-table.tsx` | Scraped results & VA assignment |
| **CampaignsTable** | `campaigns-table.tsx` | Campaign history with status |
| **UsernameStatusCard** | `username-status-card.tsx` | Username pool status |
| **AppSidebar** | `app-sidebar.tsx` | Navigation and recents |
| **JobListByPlatform** | `job-list-by-platform.tsx` | Jobs display in table format |
| **ConfigureJobCard** | `configure-job-card.tsx` | Job creation form |
| **AirtableLinkDialog** | `airtable-link-dialog.tsx` | Airtable URL input |
| **AirtableProgressDialog** | `airtable-progress-dialog.tsx` | Setup progress bar |

### UI Components (ShadCN UI)

Located in `components/ui/`:
- `tabs.tsx` - Tab navigation
- `progress.tsx` - Progress bars
- `card.tsx` - Card containers
- `button.tsx` - Buttons
- `dialog.tsx` - Modal dialogs
- `input.tsx` - Text inputs
- `badge.tsx` - Status badges
- `table.tsx` - Data tables
- `skeleton.tsx` - Loading skeletons
- `toast.tsx` - Notifications

### Utilities & Hooks

| File | Purpose |
|------|---------|
| `lib/supabase.ts` | Supabase client initialization |
| `lib/scraping-jobs.ts` | Scraping job API functions |
| `lib/recents.ts` | localStorage management for recents |
| `lib/utils.ts` | Utility functions |
| `hooks/use-toast.ts` | Toast notification hook |
| `contexts/auth-context.tsx` | Authentication state management |

---

## 🐛 Troubleshooting

### Common Issues

#### "Cannot connect to Supabase"

**Problem:** Database connection failing

**Solution:**
1. Check `.env.local` has correct Supabase URL and anon key
2. Verify RLS policies are enabled for anon role
3. Check Supabase project is active (not paused)

#### "Scraping failed"

**Problem:** `/api/scrape-followers` returns error

**Solution:**
1. Check backend API is running (`python api.py`)
2. Verify Apify API key is valid
3. Check Instagram accounts are public
4. Ensure Apify actor has sufficient runs quota

#### "Campaign creation failed"

**Problem:** Daily selection returns insufficient profiles

**Solution:**
1. Check `global_usernames` table has ≥14,400 unused profiles
2. Run scraping workflow to add more profiles
3. Verify `used` column is updating correctly

```sql
-- Check unused profile count
SELECT COUNT(*) FROM global_usernames WHERE used = false;
```

#### "Airtable sync failed"

**Problem:** Profiles not appearing in Airtable

**Solution:**
1. Verify Airtable API key is valid
2. Check Airtable base ID is correct
3. Ensure VA tables exist (Table 1 - Table 80)
4. Check API rate limits not exceeded

#### TypeScript errors after changes

**Solution:**
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Restart dev server
npm run dev
```

---

## 📦 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint errors
npm run type-check   # TypeScript type checking
```

---

## 🔧 Development Notes

### Code Architecture

1. **Component Props vs Supabase:**
   - Components receive data via props (not direct Supabase)
   - Parent components manage state and pass down
   - Allows flexibility for future data sources

2. **Auto-Ingest Implementation:**
   - Scraping auto-triggers ingest (no manual step)
   - Progress bar shows both phases
   - Error handling for each phase separately

3. **Campaign Workflow:**
   - Sequential API calls (not parallel)
   - Each step validates before proceeding
   - Progress tracking for user feedback

4. **Database Deduplication:**
   - Two-table strategy: `raw_scraped_profiles` + `global_usernames`
   - Raw table keeps all data
   - Global table prevents duplicates

### Performance Considerations

1. **Pagination:** Tables show configurable items per page
2. **Database Limits:** Recent items loaded efficiently
3. **Scraping Batch Size:** Configurable in backend API
4. **Airtable Rate Limits:** Built-in delays between batch uploads

---

## 🚀 Deployment

### Deployment Checklist

```bash
# 1. Run type checking
npm run type-check

# 2. Run linting
npm run lint

# 3. Build for production
npm run build

# 4. Test production build locally
npm run start

# 5. Deploy to hosting service (Vercel, etc.)
```

### Environment Setup for Production

1. Update `.env.local` with production URLs
2. Ensure Supabase project is production-grade
3. Set up SSL/HTTPS
4. Configure CORS policies
5. Set up monitoring and logging
6. Configure backup strategies

---

## 📄 License

Proprietary - All rights reserved

---

## 📞 Support

For issues or questions:
1. Check this documentation first
2. Review error messages in browser console
3. Check backend logs
4. Verify database state in Supabase dashboard
5. Test API endpoints with curl/Postman

---

**Version:** 1.0 | **Last Updated:** October 23, 2025
