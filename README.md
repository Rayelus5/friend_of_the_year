# Pollnow

> Internal codename: `friend_of_the_year (FOTY)`  
> Oficial final product name: **POLLNOW**

<!-- ![Next](https://img.shields.io/badge/-Next.js-20232a?logo=nextdotjs&logoColor=white) -->
![React](https://img.shields.io/badge/-React-20232a?logo=react&logoColor=61dafb)
![TypeScript](https://img.shields.io/badge/-TypeScript-3178c6?logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/-Prisma-2D3748?logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/-PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![Stripe](https://img.shields.io/badge/-Stripe-635bff?logo=stripe&logoColor=white)

---

<img width="1194" height="744" alt="canvas" src="https://github.com/user-attachments/assets/be3269ce-fd39-4e25-94c8-9d7b5a512435" />

---

## 📝 Project Description

POLLNOW is a full-stack awards & voting platform built on top of **Next.js (App Router)**, designed for creating, managing, and analyzing structured events with multi-category voting.

The application combines:

- A **public-facing voting experience** (anonymous, device-bound, anti-duplicate),
- A **multi-tenant user dashboard** for event owners,
- A **moderation-oriented admin panel**,
- A **subscription system** based on Stripe, and
- Supporting modules for **support tickets**, **notifications**, and **analytics**.

The goal of this project is not just to “make something work”, but to explore how a modern SaaS-style system can be built with:

- **React Server Components + Server Actions**
- **Prisma with a non-trivial relational schema**
- **NextAuth with custom flows (email verification, Google, password reset)**
- **Stripe billing & webhooks**
- **Production-oriented patterns** (middleware, modular server actions, strict validation).

---

## 🔑 Core Concepts & Domain Model

The application revolves around **events** (award ceremonies, competitions, polls) and their **voting lifecycle**.

### Main Entities

- **User**
  - Owns events
  - Has a subscription status (free / premium tiers)
  - Can authenticate via credentials or Google
  - Receives notifications and support messages

- **Event**
  - Represents a specific awards ceremony / poll session
  - Controls:
    - Visibility (public list vs direct link access)
    - Voting mode (anonymous vs identified)
    - Gala date and result visibility
    - Status (`DRAFT`, `PENDING`, `APPROVED`, `DENIED`)

- **Participant**
  - A nominee / candidate that can be reused across polls in the same event

- **Poll**
  - A category inside an event (e.g. “Best Movie”, “Best Streamer”)
  - Associated with:
    - Order (for linear voting flow)
    - Options
    - Optional max options / selection rules

- **Option**
  - Link between a `Participant` and a `Poll`
  - Defines which participant is part of which category
  - Maintains its own order inside a poll

- **Vote**
  - A vote for a specific `Option` in a `Poll`
  - Contains:
    - Timestamps
    - Optional `userId` when the voter's identity is known
    - An associated **voter hash** for anonymous / device-bound tracking

- **SupportChat / SupportMessage**
  - Used for in-app support ticketing between users and admins

- **Notification**
  - Server-side generated events rendered in the dashboard

- **Billing / Tokens**
  - Subscription & Stripe metadata
  - Verification tokens
  - Password reset tokens

All of this is expressed in `prisma/schema.prisma` and evolved via many migrations under `prisma/migrations`.

---

## 🧱 Architecture & Runtime Model

POLLNOW is structured around **Next.js App Router** and uses a combination of:

- **Server Components** for data-fetching routes,
- **Client Components** for interactive UI,
- **Server Actions** for mutations and business logic,
- **API Routes** for Stripe webhooks and legacy-style endpoints.

High-level view:

```text
Client (React/Tailwind)  ➡️  Next.js App Router
                         ➡️  Server Components & Actions
                         ➡️  Prisma (PostgreSQL)
                         ➡️  External services (Stripe, email provider)
```

### Key Architectural Choices

* **Server Actions** in `src/app/lib/*-actions.ts` (e.g. `dashboard-actions`, `event-actions`, `stats-actions`) encapsulate business logic instead of pushing everything into API routes.
* **NextAuth** is configured in `src/auth.config.ts` and `src/auth.ts`, using Prisma as the adapter and Postgres as the storage.
* **Stripe** integration is handled via:

  * Server-side actions in `stripe-actions.ts`
  * Webhook route in `app/api/webhooks/stripe/route.ts`
* **Middleware** (`src/middleware.ts`) is used to:

  * Protect admin routes
  * Enforce auth in certain sections
  * Potentially handle maintenance mode and public/private logic.

---

## 🧩 Major Subsystems

### 1. Authentication & User Lifecycle

Located mainly in:

* `src/auth.config.ts`
* `src/auth.ts`
* `src/app/lib/auth-actions.ts`
* `src/app/api/auth/[...nextauth]/route.ts`

Capabilities:

* Email/password login with bcrypt-hashed passwords.
* Google OAuth login (`authenticateGoogle`).
* Email verification flow:

  * Verification tokens (`lib/tokens.ts`)
  * Verification page under `app/auth/new-verification/page.tsx`.
* Password reset support via tokens (`reset-password.ts`, tokens model).
* Session-based role handling (`USER`, `MODERATOR`, `ADMIN`).

Authentication is consumed in server components via `auth()` calls and used to gate entire routes (`dashboard`, `admin`, etc.).

---

### 2. Event Management & Dashboard

Key paths & modules:

* `src/app/dashboard/page.tsx`
* `src/app/dashboard/event/[id]/page.tsx`
* `src/app/lib/dashboard-actions.ts`
* `src/app/lib/event-actions.ts`
* `src/components/dashboard/*`

The dashboard provides:

* **Events tab**

  * Create event (`CreateEventButton` + `dashboard-actions.ts`)
  * List events (`DashboardEventCard`)
  * Per-event link into `/dashboard/event/[id]`

* **Event detail page**

  * `EventTabs` wraps:

    * `EventSettings` (configuration, gala date, visibility, anonymous voting)
    * `ParticipantList` (add/edit/remove participants)
    * `PollList` (categories, drag & drop ordering, max options)
    * `EventStatistics` (aggregated stats, breakdown by category, premium gating)

* **Notifications & Support**

  * `DashboardTabs` also exposes:

    * Notifications tab (`NotificationsTab`, `user-notification-actions.ts`)
    * Support tab (`SupportTab`, support ticket list + `CreateTicketButton`)

All writes are performed via server actions invoked from forms and interactive clients.

---

### 3. Public Voting Flow

Public event access is organized under:

* `src/app/e/[slug]/page.tsx`        → Voting entry for a specific event
* `src/app/e/[slug]/completed/page.tsx` → Post-voting “thank you” page
* `src/app/e/[slug]/results/page.tsx`   → Results page (time-gated)
* `src/app/polls/*`                     → Public explore & listing pages
* `src/app/api/polls/*`                 → Voting & result APIs

Voting UX:

1. User lands on `/e/[slug]`.
2. A **linear voting flow** guides them through each poll (category) in order.
3. Votes are validated and stored via:

   * `public-actions.ts`
   * `event-actions.ts`
   * `stats-actions.ts`
4. When finished, the user is redirected to a completion page.
5. Results may be:

   * Hidden until a gala date,
   * Partially visible (e.g. aggregated only),
   * Or fully visible if configuration & time allow.

---

### 4. Anonymous Voting Engine

Core implementation lives in:

* Prisma models (`Vote`, `Event`, etc.)
* `stats-actions.ts`
* `public-actions.ts` & `polls` API routes

Mechanisms:

* Each anonymous visitor is assigned a **voter hash**:

  * Derived from device/session information.
  * Stored in the DB to prevent re-votes per poll/event.
* **HttpOnly cookies** + **hashes** are used to:

  * Avoid exposing identifiers to the client.
  * Distinguish “already voted” states.
* If a user is authenticated, their `userId` may be attached to the vote (depending on event configuration).
* Events have an `isAnonymousVoting` flag:

  * When `true`, identities are hidden even from premium analytics.
  * When `false`, premium tiers (or admins) can see who voted for what (when allowed).

---

### 5. Statistics & Analytics

`src/app/lib/stats-actions.ts` exposes a high-level `getEventStats(eventId)` function that:

* Fetches polls, options, and votes for the event.
* Computes:

  * `totalVotes`
  * `totalPolls`
  * `votesByPoll` (for bar charts)
  * Per-poll breakdown:

    * Options with their `votesCount`
    * List of voters (if allowed)
* Builds an `activityTimeline` from recent votes grouped by date.
* Reads `event.isAnonymousVoting` to ensure privacy is respected in the UI.

The client-side visualization is handled by:

* `src/components/dashboard/EventStatistics.tsx`

Features include:

* KPIs (total votes, active categories, participation status).
* Progress-bar style charts for vote distribution.
* Scrollable list of polls with per-category modals.
* Conditional UI:

  * Free plan: blurred/gated UI + mock stats.
  * Premium: real numbers.
  * Premium+ or Admin: voter identities (if event is not anonymous).

---

### 6. Admin Panel

Admin routes are located under:

* `src/app/admin/*`

Modules:

* `admin/page.tsx` – Admin dashboard root.
* `admin/events` – Event list & review.
* `admin/reviews` – Content moderation for event reviews.
* `admin/users` – User list and user detail view.
* `admin/notifications` – Admin notifications UI.
* `admin/chats` – Support chats view.

Supporting business logic:

* `src/app/lib/admin-actions.ts` – Approvals, rejections, user updates, etc.

Admins have elevated visibility and control:

* Can inspect any event and its stats.
* May override limitations imposed on regular users.
* Serve as moderators for reports and abuse.

---

### 7. Support & Notifications

**Support system**:

* `src/app/dashboard/support/*`
* `src/app/admin/chats/*`
* `src/app/lib/support-actions.ts`
* `src/app/api/support/messages/[chatId]/route.ts`

Users can open support chats; admins reply via the admin interface.

**Notifications**:

* `src/app/lib/user-notification-actions.ts`
* Rendered in the dashboard `Notifications` tab.
* Allow marking single notifications as read or all at once.

---

### 8. Billing & Subscription Plans

Billing logic is spread across:

* `src/app/lib/plans.ts` – Plan metadata (slug, features, pricing tiers).
* `src/app/lib/stripe-actions.ts` – Checkout, portal, and subscription-related actions.
* `src/app/api/webhooks/stripe/route.ts` – Stripe webhook handler.
* `src/app/premium/page.tsx` – Pricing / upsell page.
* `src/components/premium/*` – `PricingSection`, `CheckoutButton`, `ManageButton`.

User subscription data is persisted in the `User` model:

* `subscriptionStatus`
* `stripeCustomerId`
* `stripeSubscriptionId`
* `stripePriceId`
* `subscriptionEndDate`
* `cancelAtPeriodEnd`

The dashboard and event statistics use these fields to conditionally enable premium features.

---

## 🛠️ Tech Stack

Core stack:

* **Framework:** Next.js (App Router, RSC, Server Actions)
* **Language:** TypeScript
* **Frontend:** React, Tailwind CSS, Framer Motion
* **Backend:** Node.js (via Next.js runtime)
* **ORM:** Prisma
* **Database:** PostgreSQL
* **Auth:** NextAuth + @auth/prisma-adapter
* **Payments:** Stripe
* **Mail:** Resend (email verification, transactional emails)
* **3D / Visuals:** `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`
* **Validation:** Zod
* **Utilities:** date-fns, clsx, use-debounce, canvas-confetti, bcryptjs

---

## 📦 Selected Dependencies

Some key packages used throughout the project:

```txt
@auth/prisma-adapter
@hello-pangea/dnd
@pmndrs/assets
@pmndrs/branding
@prisma/client
@react-spring/web
@react-three/drei
@react-three/fiber
@react-three/postprocessing
bcryptjs
canvas-confetti
clsx
date-fns
framer-motion
ldrs
lucide-react
resend
zod
```

---

## 📜 Tooling & NPM Scripts

The project defines a set of scripts for development, database workflows, and quality checks (from `package.json`):

* `dev` – Development server
* `prodev` – Development with production-like settings
* `build` – Next.js production build
* `start` – Start the production server
* `lint` – Run ESLint

Database-related scripts:

* `db:reset` – Reset and reseed the database
* `db:push` – `prisma db push`
* `db:seed` – Execute `prisma/seed.ts`
* `db:studio` – Launch Prisma Studio
* `db:migrate` – Apply migrations

These scripts are used throughout the development workflow to iterate on both schema and application behavior.

---

## 📁 Project Structure (High-Level)

```text
.
├── prisma/
│   ├── migrations/          # Full migration history
│   ├── schema.prisma        # Main Prisma schema
│   └── seed.ts              # Seed script
├── public/                  # Static assets
├── src/
│   ├── app/
│   │   ├── admin/           # Admin dashboard
│   │   ├── api/             # API routes (auth, polls, support, webhooks)
│   │   ├── auth/            # Email verification flow
│   │   ├── dashboard/       # User dashboard & event management
│   │   ├── e/[slug]/        # Public voting flow for events
│   │   ├── polls/           # Public poll discovery & results
│   │   ├── login/           # Login page
│   │   ├── logout/          # Logged-in guard explanation page
│   │   ├── register/        # Registration page
│   │   ├── premium/         # Pricing / subscriptions
│   │   ├── legal/           # Legal pages (terms, privacy, cookies)
│   │   ├── about/           # About page
│   │   ├── maintenance/     # Maintenance / holding page
│   │   └── page.tsx         # Landing page
│   ├── components/
│   │   ├── dashboard/       # Dashboard components (tabs, forms, stats, lists)
│   │   ├── admin/           # Admin-only UI
│   │   ├── polls/           # Public poll UI
│   │   ├── premium/         # Billing & pricing components
│   │   ├── home/            # Landing, hero, 3D award mockup
│   │   └── shared UI        # Navbar, forms, confetti, etc.
│   ├── lib/
│   │   ├── prisma.ts        # Prisma client singleton
│   │   ├── config.ts        # App configuration
│   │   ├── plans.ts         # Plan definitions
│   │   ├── tokens.ts        # Token generation helpers
│   │   ├── mail.ts          # Email sending helpers
│   │   ├── validations.ts   # Zod schemas
│   │   ├── countResults.ts  # Result aggregation helpers
│   │   ├── *_actions.ts     # Server Actions for each domain area
│   │   └── stripe-actions.ts# Stripe integration helpers
│   ├── middleware.ts        # Route guarding & cross-cutting concerns
│   └── types/next-auth.d.ts # NextAuth type augmentation
└── reset-password.ts        # Standalone entry for password reset
```

---

## ✅ Testing & Quality

* `src/__test__/results.test.ts` covers result aggregation logic.
* ESLint is configured via `eslint.config.mjs`.
* TypeScript is used across the entire codebase (`strict`-oriented setup).
* The codebase is organized to keep **UI**, **server actions**, and **business logic** cleanly separated, making it easier to extend or refactor.

---

## 🎓 Learning Focus

This project served as a deep-dive into:

* Designing a **non-trivial relational schema** (with many migrations and iterative improvements).
* Structuring a large **Next.js App Router** application with:

  * Multiple segments (public, dashboard, admin)
  * Mixed Server/Client components
  * Server Actions as the main mutation layer.
* Implementing **secure anonymous voting** with:

  * Cookie-based identity
  * Hashing
  * Duplicate prevention.
* Adding **real subscription tiers** using Stripe and handling webhooks safely.
* Building a real-world level **admin panel**, **support system**, and **notification layer**.
* Polishing UX with motion, dark theme, and consistent component patterns.

This repository is intended as a **complete, production-style reference** for a modern SaaS-like voting platform, showcasing how all these pieces can work together coherently in a single codebase.

---

Last update: 30/11/2025

> Made with ♥️ by Rayelus
