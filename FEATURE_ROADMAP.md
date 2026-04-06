# Sea n Seek Planner - Feature Roadmap & Implementation Plan

## Project Overview

**Sea n Seek** is an AI-powered travel planning application that helps users create, manage, and share travel itineraries with real-time collaboration features.

**Current Stack:**
- Frontend: React 18 + TypeScript + Vite
- UI: Shadcn/UI + Tailwind CSS
- Storage: Currently localStorage (base state)
- Build: 0 errors, fast compilation

---

## Phase 1: Supabase Authentication (PRIORITY)

### 1.1 Setup Supabase Project
- [ ] Create Supabase project at https://supabase.com
- [ ] Get project URL and API key
- [ ] Configure authentication providers:
  - [ ] Email/Password
  - [ ] Google OAuth
  - [ ] GitHub OAuth (optional)

### 1.2 Install Dependencies
```bash
npm install @supabase/supabase-js @supabase/auth-helpers-react
```

### 1.3 Create Supabase Client
- [ ] Create `src/integrations/supabase.ts`:
  - Initialize Supabase client
  - Export auth and database references
  - Setup error handling

### 1.4 Create Auth Context
- [ ] Create `src/contexts/AuthContext.tsx`:
  - useAuth hook
  - useAuthStateChange hook
  - User provider component
  - Login/Signup/Logout functions
  - Protected routes wrapper

### 1.5 Create Auth Pages
- [ ] `src/pages/Login.tsx`:
  - Email/password form
  - OAuth buttons
  - Sign up link
  - Password recovery link
  
- [ ] `src/pages/Signup.tsx`:
  - Registration form
  - Email verification flow
  - Profile setup (name, avatar)
  
- [ ] `src/pages/ForgotPassword.tsx`:
  - Password reset form
  - Email verification

### 1.6 Update App.tsx
- [ ] Wrap app with AuthContext provider
- [ ] Add ProtectedRoute component
- [ ] Add route guards for authenticated pages
- [ ] Add redirect logic (logged-in users can't access login, etc.)

**Deliverable:** Users can sign up, log in, log out with email/password or OAuth

---

## Phase 2: User Profile & Preferences

### 2.1 Database Schema
- [ ] Create `users` table in Supabase:
  - id (UUID)
  - email
  - full_name
  - avatar_url
  - bio
  - preferences (JSON)
  - created_at
  - updated_at

### 2.2 Create Profile Page
- [ ] `src/pages/Profile.tsx`:
  - Display user info
  - Edit name, bio
  - Upload avatar
  - Manage email preferences
  - Security settings

### 2.3 Create User Settings Panel
- [ ] Theme preferences (dark/light)
- [ ] Currency preference
- [ ] Language preference
- [ ] Notification settings
- [ ] Privacy settings

**Deliverable:** Users have personalized profiles and preferences

---

## Phase 3: Trip Management with Supabase

### 3.1 Database Schema
- [ ] Create `trips` table:
  - id (UUID)
  - user_id (FK to users)
  - title
  - destination
  - start_date
  - end_date
  - budget
  - cover_image_url
  - description
  - is_public (boolean)
  - created_at
  - updated_at

- [ ] Create `trip_members` table:
  - trip_id (FK)
  - user_id (FK)
  - role (owner, editor, viewer)
  - added_at

### 3.2 Create Trip APIs
- [ ] `useTrips` hook:
  - Fetch user's trips
  - Create new trip
  - Update trip
  - Delete trip
  - Archive trip

- [ ] `useTripCollaboration` hook:
  - Add/remove collaborators
  - Update member permissions
  - Get trip members

### 3.3 Update Trip Pages
- [ ] Modify `src/pages/SavedTrips.tsx`:
  - Load from Supabase instead of localStorage
  - Show trips owned and shared with user
  - Create new trip button
  - Delete/archive functionality

- [ ] Modify `src/pages/Itinerary.tsx`:
  - Save to Supabase
  - Real-time sync with collaborators
  - Auto-save functionality
  - Conflict resolution

**Deliverable:** Trips persisted in Supabase with cloud sync

---

## Phase 4: Real-Time Collaboration

### 4.1 Setup Realtime Subscriptions
- [ ] Subscribe to trip changes in real-time
- [ ] Broadcast user presence (who's editing)
- [ ] Implement conflict resolution

### 4.2 Collaborative Editing
- [ ] Live cursor positions
- [ ] Real-time update indicators
- [ ] Collaborative leg/activity editing
- [ ] Change history/audit log

### 4.3 Comments & Discussions
- [ ] Add comments on trips
- [ ] Mention users (@username)
- [ ] Threaded replies
- [ ] Email notifications for mentions

**Deliverable:** Multiple users can edit trips simultaneously

---

## Phase 5: Advanced Features

### 5.1 Trip Templates
- [ ] Create templates from existing trips
- [ ] Browse community templates
- [ ] Clone templates for new trips

### 5.2 Expense Tracking
- [ ] Track expenses by category
- [ ] Split bills between collaborators
- [ ] Generate expense reports
- [ ] Export as CSV

### 5.3 Weather Integration
- [ ] Multi-day weather forecast
- [ ] Weather alerts
- [ ] Pack recommendations based on weather

### 5.4 Map Integration
- [ ] Interactive map visualization
- [ ] Draw routes between destinations
- [ ] POI (Points of Interest) display
- [ ] Distance & duration calculations

### 5.5 Notifications
- [ ] Email notifications:
  - Trip invitations
  - Collaborator activity
  - Trip reminders
  - Shared updates
  
- [ ] In-app notifications:
  - Real-time activity feed
  - Mention alerts
  - Comment replies

**Deliverable:** Rich travel planning experience

---

## Phase 6: Mobile & Offline Support

### 6.1 Progressive Web App
- [ ] Service worker setup
- [ ] Offline trip access
- [ ] Offline editing with sync queue
- [ ] Home screen installation

### 6.2 Mobile Optimization
- [ ] Responsive design enhancements
- [ ] Mobile-friendly navigation
- [ ] Touch-optimized controls
- [ ] Mobile app upload

**Deliverable:** Works great on mobile devices

---

## Phase 7: Advanced Sharing & Discovery

### 7.1 Public Trip Sharing
- [ ] Share trip via unique URL
- [ ] View-only links
- [ ] Expiring share links
- [ ] Download trip as PDF

### 7.2 Social Features
- [ ] User profiles with bio
- [ ] Follow other travelers
- [ ] Discover public trips
- [ ] Like/bookmark trips
- [ ] Trip ratings & reviews

### 7.3 Analytics
- [ ] Trip statistics (duration, cost, distance)
- [ ] Map heatmap (most visited places)
- [ ] Travel history
- [ ] Insights & recommendations

**Deliverable:** Community features & discoverability

---

## Implementation Priority

### CRITICAL (Do First)
1. ✅ Supabase Authentication
2. ✅ User profiles
3. ✅ Trip management (CRUD)

### HIGH (Do Next)
4. Real-time collaboration
5. Expense tracking
6. Basic notifications

### MEDIUM (Nice to Have)
7. Weather integration
8. Templates
9. Social features

### LOW (Future)
10. Analytics
11. Mobile app
12. Advanced sharing

---

## Technology Stack

### Current
- React 18.3.1
- TypeScript 5.0
- Vite (build tool)
- Tailwind CSS
- Shadcn/UI components

### To Add
- Supabase SDK
- Realtime subscriptions
- Authentication helpers
- File uploads (storage)
- Email service (transactional)

### Optional
- TanStack Query (data fetching)
- Zustand (state management)
- Day.js (date handling)
- Chart.js (analytics)
- Leaflet (maps)

---

## Database Schema Summary

```
users
├── id (UUID, PK)
├── email (unique)
├── full_name
├── avatar_url
├── preferences (JSON)
└── timestamps

trips
├── id (UUID, PK)
├── user_id (FK)
├── title
├── destination
├── dates
├── budget
├── cover_image
├── is_public
└── timestamps

trip_members
├── trip_id (FK)
├── user_id (FK)
├── role (owner/editor/viewer)
└── added_at

trip_legs (itinerary items)
├── id (UUID, PK)
├── trip_id (FK)
├── day
├── location
├── activities
├── budget
├── notes
└── timestamps

expenses
├── id (UUID, PK)
├── trip_id (FK)
├── user_id (FK)
├── amount
├── category
├── description
├── split_with (array of user IDs)
└── timestamps

comments
├── id (UUID, PK)
├── trip_id (FK)
├── user_id (FK)
├── content
├── mentions (array)
├── parent_id (for replies)
└── timestamps
```

---

## Environment Variables Needed

```env
# Supabase
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyxxxxxxxx

# Optional: OAuth
VITE_GOOGLE_CLIENT_ID=xxxxx
VITE_GITHUB_CLIENT_ID=xxxxx

# Optional: File uploads
VITE_SUPABASE_BUCKET_NAME=trip-images

# Optional: Email
VITE_RESEND_API_KEY=xxxxx
```

---

## Development Roadmap Timeline

| Phase | Duration | Status |
|-------|----------|--------|
| 1. Supabase Auth | 1-2 weeks | 🎯 START HERE |
| 2. User Profiles | 1 week | ⏳ Next |
| 3. Trip Management | 2 weeks | ⏳ Next |
| 4. Real-time Collab | 2 weeks | ⏳ Future |
| 5. Advanced Features | 3 weeks | ⏳ Future |
| 6. Mobile & Offline | 2 weeks | ⏳ Future |
| 7. Social Features | 2 weeks | ⏳ Future |

**Total Estimated Time:** 2-3 months for complete feature set

---

## Getting Started

### Step 1: Setup Supabase
1. Create account at https://supabase.com
2. Create new project
3. Get API credentials
4. Add environment variables

### Step 2: Install Dependencies
```bash
npm install @supabase/supabase-js @supabase/auth-helpers-react
```

### Step 3: Create Supabase Integration
- Create `src/integrations/supabase.ts`
- Initialize client
- Export auth and db references

### Step 4: Build Auth Pages
- Login.tsx
- Signup.tsx
- Profile.tsx

### Step 5: Test & Deploy
- Test locally
- Commit to GitHub
- Deploy to Netlify

---

## Success Metrics

- ✅ Users can sign up & log in
- ✅ Trips persisted across sessions
- ✅ Multiple users can collaborate
- ✅ Real-time updates work
- ✅ Mobile responsive
- ✅ < 3s page load time
- ✅ 95+ Lighthouse score

---

## Notes

- Start with Phase 1 (Supabase Auth)
- Build incrementally, test after each phase
- Use the environment variables for sensitive data
- Commit after each major feature
- Keep components small and reusable
