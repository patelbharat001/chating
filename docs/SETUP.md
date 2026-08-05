# chating.ai — setup

What this is: a Yahoo-chat-style room list. Anyone who opens the site sees
every open room live and can join one, or create their own. Supabase (free
tier) is only used as the "room directory" — actual chat messages travel
directly between browsers over WebRTC (via PeerJS's free public broker), so
they never touch the database and cost nothing regardless of traffic.

## 1. Backend — already done

`index.html` is already wired up to a live Supabase project (in your
"Swarneevtech" organization):

- Project URL: `https://tsvgxlmrgqlfkyijnllj.supabase.co`
- A `rooms` table exists with columns `id, name, host_id, created_at,
  last_active, user_count`
- Row-Level Security is on, with policies that mirror what a Firestore rules
  file would do: anyone can read the room list and create/heartbeat a room,
  but a database trigger blocks a client from renaming a room or hijacking
  its `host_id` through an "update" — only `last_active`/`user_count` can
  actually change no matter what a client sends.
- Realtime is enabled on the table, so every visitor's lobby gets new/updated/
  removed rooms pushed to it live.
- I tested the table directly (insert/select/delete, and a live fetch through
  the public REST endpoint with the anon key) — it works.

You don't need to do anything in the Supabase dashboard. If you ever want to
inspect it yourself: console.supabase.com → Swarneevtech org → this project
→ Table Editor / SQL Editor.

The anon key embedded in `index.html` is meant to be public (it's what every
visitor's browser uses) — it is not a secret, and it can't do anything
outside what the RLS policies above allow.

## 2. Free tier limits (so you know where the ceiling is)

Supabase's free plan includes a 500MB database and 2GB of realtime/bandwidth
a month, no card required. Only the room *directory* touches Supabase
(create room, heartbeat every 15s, join/leave listeners) — not the chat
messages themselves — so this comfortably supports a small-to-medium hobby
site. A free project pauses automatically after 7 days with zero API
activity (it wakes back up on the next request/visit — the very first load
after a pause takes a few extra seconds).

PeerJS's public broker (`0.peerjs.com`) is also free and only handles the
initial handshake between two browsers — the actual chat traffic afterward
is a direct peer-to-peer connection.

## 3. Deploy `index.html` for free

Any static host works since there's no server code to run — `index.html` is
the entire app. Drag-and-drop it into any of these free static hosts:

- Netlify (drag-and-drop deploy)
- Cloudflare Pages
- GitHub Pages
- Vercel

Then point `chating.ai`'s DNS at whichever host you choose (each gives you
either an A record or a CNAME to set at your domain registrar).

## 4. How the room mechanics work (for your reference)

- **Create room**: your browser opens a WebRTC "host" peer, inserts a row
  into the `rooms` table (`name`, `host_id`, timestamps, `user_count`), and
  pings that row every 15 seconds to prove the room is still alive.
- **Room list**: every visitor's lobby screen subscribes to Supabase
  Realtime on `rooms`, so new rooms appear for everyone within about a
  second.
- **Join room**: your browser connects directly to the host's peer ID over
  WebRTC. All chat after that point is host-relayed peer-to-peer — the host
  browser fans messages out to everyone else in the room.
- **Stale rooms**: if a host closes the tab without cleanly leaving, their
  room's heartbeat stops. Any other visitor's browser that notices a room
  hasn't pinged in 45 seconds deletes that row, so the list self-cleans
  without needing a paid backend job.

## Video chat

Each room has a "Turn on camera" button. Camera/mic are off by default — nothing
is requested until someone clicks it (per your choice: explicit opt-in, not
auto-on-join).

How it works: unlike text chat (which the host relays to everyone), video is a
true peer-to-peer mesh — when you turn your camera on, your browser opens a
direct WebRTC video connection to every other participant currently in the
room, and answers anyone who calls you the same way. No media ever passes
through Supabase or any server; it's a direct connection between browsers,
same as the text chat's underlying transport, so it stays free regardless of
usage.

Two deliberate simplifications worth knowing about:
- **You only see others' video once your own camera is on.** Turning your
  camera on is what triggers you to call everyone else, so it doubles as
  "opt in to watch." There's no watch-only mode in this version.
- **A room with roughly 6+ people on video will show a warning banner**
  ("things may get choppy") rather than blocking anyone — per your choice.
  This is a soft, not hard, cap. Mesh video like this scales by everyone's
  upload bandwidth, so large video rooms will genuinely degrade; if you want
  a hard cap instead, or want to support real double-digit video rooms, that
  needs a proper SFU media server (e.g. LiveKit, Daily.co) — those have free
  tiers but with real usage limits, unlike everything else in this app.
- **No TURN server configured.** PeerJS's default free setup uses public STUN
  servers only, which is enough for most home networks but can fail behind
  strict corporate/school NATs. If video connections fail for some users but
  not others, that's the likely cause — a free TURN relay (e.g. the Open
  Relay Project, or Metered's free tier) can be added to the `Peer()` config
  in `index.html` if this becomes a real problem.

## Known limits worth knowing

- Because chat is peer-to-peer with the host relaying, a room's size is
  practically capped by the host's upload bandwidth — fine for casual rooms
  of a handful of people, not built for hundreds.
- If the host leaves, the room ends for everyone (no automatic hand-off of
  "host" duty to another participant). That's a reasonable v1 trade-off; let
  me know if you'd like host migration added later.
- No message history/persistence — refreshing the page clears the chat,
  matching the "no database for chat content" idea.
- `firestore.rules` in this folder is leftover from an earlier draft that
  used Firebase — it's no longer used now that the app runs on Supabase, and
  can be ignored/deleted.
