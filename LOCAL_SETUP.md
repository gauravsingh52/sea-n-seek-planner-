# Local Development Setup Guide

## Quick Start (5 minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Verify `.env.local` Exists
Your `.env.local` file should contain:
```
VITE_SUPABASE_URL=https://looklerxuuodggtntfdl.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_I1MD0gb5f9RidkbNa6QnSg_9N33QMeQ
```

### 3. Start Dev Server
```bash
npm run dev
```

### 4. Open Browser
Visit: http://localhost:8080/

---

## Complete Setup Instructions

### Prerequisites
- Node.js 16+ 
- npm or bun
- Git
- `.env.local` file with Supabase credentials

### Installation Steps

1. **Clone Repository**
   ```bash
   git clone https://github.com/gauravsingh52/sea-n-seek-planner-.git
   cd sea-n-seek-planner-main
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Create `.env.local`** (if not present)
   ```bash
   cp .env.example .env.local
   ```
   Then edit `.env.local` and add:
   ```
   VITE_SUPABASE_URL=https://looklerxuuodggtntfdl.supabase.co
   VITE_SUPABASE_ANON_KEY=sb_publishable_I1MD0gb5f9RidkbNa6QnSg_9N33QMeQ
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

5. **Open in Browser**
   - Local: http://localhost:8080/
   - Network: http://10.36.32.173:8080/ (from other machines on network)

---

## Testing Authentication

### Create Account
1. Click "Sign Up" on home page
2. Enter:
   - Full Name (any name)
   - Email (any email format)
   - Password (8+ characters)
3. Click "Create Account"
4. Success message appears

### Log In
1. Click "Sign In" 
2. Enter email and password from signup
3. Click "Sign In"
4. Redirected to home page (logged in)

### Access Protected Routes
Once logged in:
- `/itinerary` - Trip planning interface
- `/saved` - Saved trips
- Click logout to test auth flow

---

## Useful Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server (http://localhost:8080) |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run test` | Run tests |
| `npm run type-check` | Check TypeScript errors |

---

## Project Structure

```
src/
├── pages/
│   ├── Index.tsx          # Home page
│   ├── Login.tsx          # Login page (PHASE 1)
│   ├── Signup.tsx         # Signup page (PHASE 1)
│   ├── Itinerary.tsx      # Trip planning
│   └── SavedTrips.tsx     # Saved trips
├── components/
│   ├── ProtectedRoute.tsx # Auth guard (PHASE 1)
│   └── ... other components
├── contexts/
│   └── AuthContext.tsx    # Auth state (PHASE 1)
├── integrations/
│   └── supabase.ts        # Supabase setup (PHASE 1)
└── hooks/
    └── ... custom hooks
```

---

## Troubleshooting

### Dev Server Won't Start
```bash
# Kill any existing process on port 8080
# Then try again
npm run dev
```

### Port Already in Use
The dev server will automatically use next available port.

### Supabase Connection Failed
- Verify internet connection
- Check `.env.local` has correct URL and key
- Verify Supabase project is active at: https://app.supabase.com

### Page Shows Blank
1. Open DevTools: F12
2. Check Console tab for errors
3. Clear cache: Ctrl+Shift+Delete
4. Hard refresh: Ctrl+Shift+R

### Module Not Found Error
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

### TypeScript Errors
```bash
npm run type-check
```
Shows all type errors. Fix them before deploying.

---

## Deployment

### Build for Production
```bash
npm run build
```
Creates `dist/` folder ready for deployment.

### Deploy to Netlify
1. Commit changes: `git add . && git commit -m "your message"`
2. Push to GitHub: `git push origin main`
3. Netlify auto-deploys on push (if connected)

OR manually:
```bash
npm run build
netlify deploy --prod --dir=dist
```

### Environment Variables on Netlify
Add to Netlify > Site settings > Build & deploy > Environment:
```
VITE_SUPABASE_URL=https://looklerxuuodggtntfdl.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_I1MD0gb5f9RidkbNa6QnSg_9N33QMeQ
```

---

## Development Workflow

1. **Make changes** to source files (auto-refreshes)
2. **Test locally** with dev server running
3. **Build** to verify production build: `npm run build`
4. **Commit** changes: `git add . && git commit -m "feature: description"`
5. **Push** to GitHub: `git push origin main`
6. **Deploy** to Netlify (automatic or manual)

---

## Current Phase

**Phase 1: Supabase Authentication** ✅ COMPLETE
- [x] Supabase integration
- [x] Email/password auth
- [x] Sign up & login pages
- [x] Protected routes
- [x] Local development setup

**Next Phase:** User Profiles & Preferences

---

## Support

For issues:
1. Check this guide
2. Check browser console (F12)
3. Check Supabase dashboard
4. Review GitHub issues: https://github.com/gauravsingh52/sea-n-seek-planner-/issues

---

## Technology Stack

- **React** 18.3.1
- **TypeScript** 5.0
- **Vite** (build tool)
- **Supabase** (auth & database)
- **Tailwind CSS** (styling)
- **Shadcn/UI** (components)

---

**Last Updated:** April 7, 2026
**Status:** Ready for local development
