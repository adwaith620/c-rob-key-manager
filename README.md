# C-ROB Key Manager

Build a web application called "C-ROB Smart Key Locker" — a role-based system for booking and managing access to a physical room key stored in a smart locker. This is the initial scaffold only: focus on a clean, professional UI shell with working navigation and Supabase auth. Don't build hardware integration, OTP delivery, or notification logic yet — just the structure and placeholder states for them.

VISUAL STYLE
Before building, visit https://crobtkmcee.vercel.app (this is the existing C-ROB / TKMCE Centre for Robotics website) and match its visual style for this new app — color palette, typography, spacing, button/card styling, and overall look and feel. This is a different application (key locker booking system, not the club's main site), so don't copy its content or page structure, just the visual design language, so it feels like it belongs to the same organization.

PROJECT CONTEXT
C-ROB Smart Key Locker controls access to a physical key. Normal members book a time slot on the website and get an OTP to use on a physical keypad. Execom members (student leadership/staff) use fingerprint auth on the hardware directly. A Hall Effect sensor confirms whether the key is physically in the locker. This web app is the software side: registration, booking, and role-based dashboards.

TECH PREFERENCES
- Use Supabase for auth and database (I'll connect my own Supabase project).
- Use React + TypeScript + Tailwind for the frontend.
- Match the visual style of https://crobtkmcee.vercel.app as described above.

USER ROLES (3 roles, stored on a `profiles` table linked to auth.users)
1. Member — normal registered user, books time slots.
2. Execom — elevated role, approves requests, sees operational dashboard.
3. Admin — full system access.

PAGES TO BUILD

Public pages:
- Landing page: explain what C-ROB Smart Key Locker is, how booking works, and Execom vs Member access, with a clear "Register" / "Login" call to action.
- Registration page: email + password + full name + phone number. Show a clear inline validation message if the email doesn't end in "@tkmce.ac.in" (real enforcement happens server-side, see EMAIL RESTRICTION below — this client-side check is just for immediate user feedback). After signup, show a "check your email to verify" screen. Default new users to the "Member" role.
- Login page: email + password.
- Forgot password / reset password flow using Supabase auth.

EMAIL RESTRICTION — MUST BE SERVER-SIDE (not just form validation)
Registration must be restricted to institutional emails ending in "@tkmce.ac.in", enforced at the database level so it cannot be bypassed by calling the Supabase API directly:
- Create a Postgres trigger function that runs BEFORE INSERT on auth.users.
- The function should check the new row's email against the pattern for "@tkmce.ac.in" (case-insensitive) and raise an exception with a clear message (e.g. "Registration is restricted to @tkmce.ac.in email addresses") if it doesn't match.
- Attach this as a trigger named something like check_college_email on auth.users.
- On the frontend, catch this error when it comes back from the signup call and display it as a friendly inline form error, not a raw database error message.
- Write this as a proper Supabase migration file, not an ad-hoc one-off script.

Member Dashboard (after login, role = Member):
- Header showing current locker/key status as a simple badge: "Available" / "Booked" / "Key Out" (use placeholder/mock state for now).
- A booking section: pick a future date/time and a duration (1, 2, 3, 4, or 5 hours) from a dropdown, then a "Request Booking" button. Show a list of the user's upcoming and past bookings below (use mock data for now — 2-3 example rows).
- A "Current Session" card that would show OTP/return-deadline info when active — for now just build the empty and "active" visual states with mock data, no real OTP generation yet.
- A placeholder "Notifications" panel (empty state: "No new notifications").

Execom Dashboard (after login, role = Execom):
- Operational overview: current key holder, active session, today's bookings (mock data table).
- Pending extension requests list with Approve/Reject buttons (non-functional for now, just UI).
- A placeholder "Delegated Authority" section.

Admin Dashboard (after login, role = Admin):
- Overview cards: total members, active sessions, today's bookings, overdue keys (mock numbers).
- A users table (mock data) with role shown per user.
- A basic audit log table (mock rows: actor, action, timestamp).

NAVIGATION
- Persistent sidebar or top nav that changes visible links based on role (Member sees only Member Dashboard, Execom sees Execom + Member views, Admin sees everything).
- Simple logout button.

DATABASE (create these Supabase tables via migration, with RLS enabled)
- `profiles`: id (uuid, references auth.users), full_name, phone, role (text, default 'member'), created_at.
- `bookings`: id (uuid), user_id (references profiles), start_time (timestamptz), duration_hours (int), status (text: 'pending', 'confirmed', 'cancelled', 'completed'), created_at.
Add RLS so users can only see/edit their own bookings, but Execom and Admin roles can see all bookings.
Also include the email-restriction trigger described above as part of this same migration set.

WHAT NOT TO BUILD YET
- No real OTP generation/email sending.
- No ESP32/hardware communication.
- No real-time reminder/escalation scheduling.
- No handover or takeover logic beyond static UI placeholders.
These will be added in a later phase once the base app is scaffolded.

Start by scaffolding the project structure, Supabase schema (including the email-restriction trigger), auth flow, and the four main pages/dashboards described above with mock data where noted, styled to match https://crobtkmcee.vercel.app.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/64d6d200-3c43-42dc-b7c2-6f8cb3b9ebd2).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
