# TravelBuddy storage architecture

## Invariants

1. `TripRepository` is the durable source of truth for trip preferences and the
   current itinerary revision.
2. Zustand is an in-memory working projection. Its persisted payload contains
   only the active trip id, creation timestamp, and model preference.
3. Eve is the durable source of truth for conversation events. The local
   conversation repository stores the TravelBuddy conversation id and an Eve
   session handle, then rebuilds the UI by replaying Eve from stream index `0`.
4. Eve's `defineState` itinerary is a session-scoped working cache, not a second
   application database. The canonical trip snapshot is attached to every turn.
   A new session or a different trip replaces the cache; an older snapshot can
   never overwrite a newer revision.
5. An itinerary is never stored on a conversation record. Switching chats must
   not publish, clear, or otherwise mutate the active trip's itinerary.

## Supabase adapter boundary

The local implementations intentionally satisfy asynchronous repository
contracts. Supabase can be introduced behind those contracts without changing
screen or agent-provider code.

Suggested initial tables:

- `trips`: owner, preferences, current itinerary JSON, revision, timestamps.
- `conversations`: trip id, Eve session id, title, timestamps.
- `trip_members`: user id, trip id, role (when group trips are enabled).
- `itinerary_versions`: optional immutable revision history after the first
  production version; it is not needed to make the current itinerary canonical.

Every write should compare revisions so a delayed client cannot replace a newer
itinerary. Supabase Auth identity and row-level security must be in place before
the repositories write user data remotely. The Eve channel should then validate
the same user token and enforce ownership of every continued session.

## Local migration

- `travelbuddy:eve-chats:v2` migrates to `v3`. Itinerary copies and persisted
  event logs are discarded; Eve session ids are retained and replayed.
- Zustand storage migrates to version `3`. On first launch, an existing v2
  active trip is imported into `TripRepository`, then Zustand is trimmed to an
  active-record pointer.
