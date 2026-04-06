

## Real-Time Collaborative Editing for Itineraries

### How It Works

When a user opens a shared trip (`/trip/:shareCode`), they join a real-time channel. Any user on the same page can:
- **Add stops** to the itinerary
- **Remove stops** from the itinerary  
- **Reorder stops** via drag-and-drop
- **See who's online** (presence indicators)
- All changes sync instantly across all connected browsers

### Architecture

```text
User A (browser)  ──┐
                    ├──  Supabase Realtime Channel  ──  shared_trips table (JSONB)
User B (browser)  ──┘
```

- Use **Supabase Realtime Presence** for online user indicators
- Use **Postgres Changes** subscription on `shared_trips` table to sync itinerary edits
- Each edit writes to the `shared_trips.itinerary_data` JSONB column, which triggers a broadcast to all subscribers

### Implementation

**1. Enable Realtime on `shared_trips` table** (migration)
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.shared_trips;
```

**2. New hook: `src/hooks/useCollaborativeTrip.ts`**
- Subscribes to `postgres_changes` on `shared_trips` filtered by `share_code`
- Tracks presence (each user picks a random color + name)
- Provides `updateItinerary(newData)` that writes to DB → triggers broadcast
- Debounces writes to avoid conflicts (last-write-wins for simplicity)

**3. Update `src/pages/SharedTrip.tsx`**
- Use the new `useCollaborativeTrip` hook instead of one-time fetch
- Add online user avatars bar at the top
- Add "Add Stop" form (reuse `CustomStop` component)
- Add drag-and-drop reordering (reuse `SortableLegCard` from Itinerary page)
- Add delete button on each leg card
- Show real-time cursor/presence dots

**4. Update RLS** — Already has public INSERT/SELECT. Need public UPDATE policy for collaborative edits:
- Add UPDATE policy: `true` (anyone with the link can edit — this matches the collaboration model)

Wait — UPDATE policy already exists but restricted to `auth.uid() = created_by`. Need a new policy allowing anyone to update.

**5. Extract `SortableLegCard` and `LegCard`** from `src/pages/Itinerary.tsx` into `src/components/LegCard.tsx` for reuse on SharedTrip page.

### Files Modified

| File | Change |
|------|--------|
| Migration | Enable realtime on `shared_trips`, add open UPDATE policy |
| `src/hooks/useCollaborativeTrip.ts` | New hook: realtime subscription + presence + write-back |
| `src/components/LegCard.tsx` | Extract SortableLegCard and LegCard from Itinerary page |
| `src/pages/SharedTrip.tsx` | Add collaborative editing UI: presence bar, add/delete/reorder stops, real-time sync |
| `src/pages/Itinerary.tsx` | Import LegCard from new shared component |

