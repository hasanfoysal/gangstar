# Deshal 13 (দেশাল ১৩) — University Hostel Room Portal

A production-ready, 100% free-to-host community portal for **Deshal 13 (দেশাল ১৩)** built with **Next.js 14 (App Router)**, **Tailwind CSS**, and **Supabase** (Auth, Postgres, RLS, Storage), ready for **Vercel Free Tier** + **Supabase Free Tier**.

---

## 3-Step 1-Click Launch Guide

### Step 1: Create Your Free Supabase Project & Run `schema.sql`
1. Go to [supabase.com](https://supabase.com) and create a **Free** project.
2. Open **SQL Editor → New Query**, paste the entire contents of `supabase/schema.sql`, and click **Run**.
   - This creates all 5 tables (`profiles`, `hero_slides`, `event_albums`, `album_photos`, `site_settings`), RLS security policies, the 3 public storage buckets (`avatars`, `covers`, `memories`), seed data, and the automatic first-user Super Admin trigger.
3. *(Recommended for instant registration)* Go to **Authentication → Providers → Email** and toggle **Confirm email** OFF so members can register and immediately see their pending status screen.
4. Go to **Project Settings → API** and copy your:
   - `Project URL` (`NEXT_PUBLIC_SUPABASE_URL`)
   - `anon public` key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)

### Step 2: Push to GitHub & Import in Vercel (Free Tier)
1. Push this `deshal-13` folder to a GitHub repository.
2. Go to [vercel.com](https://vercel.com), click **Add New → Project**, and import your GitHub repository.
3. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Click **Deploy**. In ~60 seconds, Vercel gives you a single live shareable link (e.g., `https://deshal13.vercel.app`).

### Step 3: Register First Account to Become Super Admin
1. Open your live Vercel URL and click **Join Room 13** (`/join`).
2. Register your own account first.
3. The database trigger automatically promotes the **very first registered user** to `role = 'admin'` and `status = 'approved'`.
4. You now have full access to `/admin` (Pending Approvals, All Members Manager, One-Click Batch Promotion to Alumni, Hero Slider Manager, Memories & Albums Bulk Uploader, and Site/Notice Board Editor). Share the live link with all Deshal 13 batches!

---

## Local Development (Optional)

```bash
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
npm install
npm run dev
```
