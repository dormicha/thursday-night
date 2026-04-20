# Thursday Night

A lightweight real-time party game for 4–8 friends: one **host** screen (TV) and **players** on phones using a room code. Built with Next.js (App Router), Firestore, and Tailwind CSS.

## Quick start

1. **Install dependencies**

   ```bash
   cd thursday-night
   npm install
   ```

2. **Firebase**

   - Create a project at [Firebase Console](https://console.firebase.google.com/).
   - Enable **Firestore** (start in test mode for local play, or use the rules below).
   - Project settings → General → Your apps → add a **Web** app and copy the config.

3. **Environment**

   Copy `.env.example` to `.env.local` and fill in the `NEXT_PUBLIC_FIREBASE_*` values from the Firebase web app config.

4. **Firestore rules (development only)**

   For a same-room prototype, you can use open rules while testing on a trusted network:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /rooms/{roomId} {
         allow read, write: if true;
       }
     }
   }
   ```

   Tighten this before any public deployment.

5. **Run**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). Create a room on the machine connected to the TV, then open the **host** URL on that display:

   `http://localhost:3000/r/<ROOM_CODE>/host`

   Players join from the home page with the numeric code.

### Phones on the same Wi‑Fi

Start the dev server bound to all interfaces so phones can connect:

```bash
npx next dev -H 0.0.0.0
```

Use your computer’s LAN IP (for example `http://192.168.1.10:3000`) on both the TV and phones.

## Game flow

Six rounds in a fixed order: Most Likely To → Draw & Guess → Two Truths & a Lie → Lucky 7 Buzz → 10 Second Challenge → Story Chain. Points carry across rounds; the host advances phases from the TV after each reveal and leaderboard.

## Sounds and UI

Timer ticks use short beeps (unlock audio with any tap). The host screen highlights the winner at the end with a simple bounce animation.
