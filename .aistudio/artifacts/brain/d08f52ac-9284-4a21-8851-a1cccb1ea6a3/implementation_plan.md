# Furniture Fix — Interactive Map-Based Chatbot & Operations Web App

A production-grade, full-stack web application for **Furniture Fix** (Mohd Anwar Khan, Diva/Thane) that combines an interactive Google Maps-grounded AI assistant, a transparent 2026 itemized rate card booking engine, and a complete operations dispatch system with technician portals and financial settlement ledgers for the Mumbai Metropolitan Region (MMR).

### User Review & Critical Decisions

> [!IMPORTANT]
> The clarifying questions were answered with recommended defaults to preserve full alignment with your Business Plan, 2026 Rate Card Proposal, and interactive map chatbot brief:
> - **Unified Architecture**: Both customer-facing acquisition (booking, rates, live map chatbot) and operational command (Technician mobile portal for Mohd Anwar Khan, Prakash Vishwakarma, Swapnil Panchal, and Admin Dispatcher) in one coordinated application.
> - **Interactive Map & AI Grounding**: Visual Mumbai MMR serviceability map centered on the Diva/Thane hub with real-time zone boundary checks (Thane, Mumbai, Navi Mumbai, Kalyan, Dombivli, etc.), distance/travel calculations, and a Gemini 3.8 Flash location chatbot with Google Search and Maps Grounding.
> - **Instant Role Switcher**: A seamless role switcher in the bottom utility area allowing you to instantly test the **Customer Booking View**, the **Technician On-Site Execution View** (Start Job, Add-on Requests, Photo Evidence, OTP Completion), and the **Admin Dispatcher View** (Auto-scoring assignment, Payout calculations, Commission ledger).

---

## 1. Overview & Core Concept

- **What It Does**:
  1. **Customer Front-End**: Instant rate card lookup and transparent booking for furniture assembly (beds, wardrobes, hydraulic beds, office chairs, dining sets, TV units, etc.), wall mounting, dismantling, and minor repair.
  2. **Location-Aware Map Assistant**: An interactive map and Gemini AI chatbot grounded with real-time Google Search and Google Maps data that evaluates user addresses/pincodes across Mumbai MMR, checks serviceability, calculates travel allowances outside the core zone, and generates accurate quotes.
  3. **Technician Mobile Portal**: Mobile-optimized workflow for TECH-001 (Mohd Anwar Khan), TECH-002 (Prakash Vishwakarma), and TECH-003 (Swapnil Panchal) to accept jobs, navigate via Google Maps, start jobs, propose customer-approved add-ons (wall anchoring, channel replacement), capture completion photos, and track earnings.
  4. **Admin Dispatch & Financial Ledger**: Live status machine (New → Scheduled → Assigned → Accepted → En Route → In Progress → Work Completed → Customer Confirmed → Paid → Settled), assisted dispatch scoring, customer invoices with no-advance payment policy, and technician payout reconciliation (company base minus commission).

- **Target Audience / Persona**:
  - **Mumbai Households & Renters**: Looking for verified furniture assemblers with clear upfront pricing, no advance payment, and polite in-home service.
  - **Furniture Fix Technicians**: Needing a frictionless mobile web interface to manage assigned jobs, navigate, request extras, and verify payout details.
  - **Business Owner / Dispatcher (Mohd Anwar Khan)**: Needing real-time visibility into today's bookings, unassigned jobs, technician status, cash/UPI collections, and payout obligations.

- **Key Value**:
  - Eliminates quote surprises with an exact 2026 itemized rate card.
  - Protects operational margins by enforcing customer approval for all onsite add-ons before work begins.
  - Enhances trust with verified location intelligence, live status tracking, and strict adherence to the payment-after-completion promise.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Customer Discovery & Interactive Map Consultation**:
   - Customer lands on the Furniture Fix homepage with a clean navy, teal, and warm amber theme.
   - They can browse popular furniture categories or open the **Location & Chat Assistant**.
   - In the Chat Assistant, the user asks: *"I live in Hiranandani Powai and need a 3-door sliding wardrobe and queen bed assembled tomorrow afternoon. Can you do it and how much will it cost?"*
   - The AI uses Gemini 3.8 Flash with Google Maps/Search grounding to confirm Powai is in the core serviceable MMR zone, computes the itemized estimate (Queen bed ₹699 + Sliding wardrobe ₹1,899 = ₹2,598 total), plots the location on the interactive map, and offers a 1-click **Proceed to Book** action.

2. **Booking & Status Confirmation**:
   - Fast 3-step booking flow: Item selection & quantity → Address & Pincode with serviceability check → Preferred time slot (8:00 AM – 10:00 PM) and optional furniture photo.
   - Generates a human-friendly Job ID (e.g., `FF-26-04287`) with no advance payment required.
   - Customer receives a live status link showing technician assignment, appointment confirmation, and direct WhatsApp/Phone contact.

3. **Technician Onsite Workflow**:
   - Technician logs in on mobile, reviews today's route with Google Maps directions, and taps **Accept Job**.
   - Upon arrival at the customer's home, technician taps **Start Job** (with arrival timestamp).
   - If a wall anchor or hinge fix is needed, technician submits an **Add-On Request** (e.g. Wall Anchoring ₹300).
   - The customer is prompted to approve the add-on on their device before drilling begins.
   - On completion, technician logs before/after photos and requests customer sign-off.
   - Payment method (Cash or UPI) is recorded, updating the job to `Paid`.

4. **Admin Dispatch & Commission Settlement**:
   - Admin monitors the 8 key business metrics (Today's Jobs, New Leads, Pending Jobs, Revenue Received, Outstanding, Payout Due, Expenses, Net Cash).
   - Assisted dispatch engine calculates score based on skill match, pincode proximity, and technician workload.
   - Double-entry commission ledger tracks Gross Revenue, Platform Share, and Technician Payout.

### Visual Identity & Theme

- **Aesthetic Direction**: Utilitarian, reliable, clean service marketplace inspired by modern logistics and precision home-services (Navy `#0A192F`, Deep Teal `#0D9488`, Warm Amber/Orange `#EA580C`, Soft Off-White `#F8FAFC`, Crisp Slate `#334155`).
- **Color Palette & Tailwind Tokens**:
  - Background Neutral: `--color-slate-50` (`#F8FAFC`) / Card Surfaces `--color-white` (`#FFFFFF`).
  - Brand Primary: Deep Navy `#0F172A` / `#0A192F`.
  - Brand Accent: Warm Amber `#F97316` / `#EA580C` for primary conversion buttons.
  - Service Active / Status: Emerald `#10B981` (Completed), Amber `#F59E0B` (In Progress), Sky `#0284C7` (Assigned).
- **Typography & Hierarchy**:
  - Display Font: `Plus Jakarta Sans` for clean, professional headings.
  - Body Prose: `Plus Jakarta Sans` / `Inter` with 15px–16px sizing and 1.5–1.6 line height.
  - Tabular Figures: `font-mono tabular-nums` for prices, timestamps, and Job IDs.
- **Top Bar Contract**:
  - Strict 3-zone header:
    - Zone 1: Wordmark `Furniture Fix` with subtle tagline in body.
    - Zone 2: Navigation links (`Services`, `Rate Card`, `Service Areas`, `Track Job`).
    - Zone 3: Primary CTA button (`Book a Service` + Call/WhatsApp shortcut).
  - No decorative status pills, pulsing dots, or mechanical comment headers (`//`).

---

## 3. Key Product Decisions & Trade-Offs

### Decision 1: Two-Engine Business in a Unified Full-Stack Application
- **Chosen Approach**: Build a single high-performance web application containing both the public customer experience (SEO landing, rate card, booking, map chatbot) and the internal operations console (Technician mobile cards, Admin dispatch board, Ledger), switchable via role navigation.
- **Why**: Allows Mohd Anwar Khan and his 3 technicians to test and run the entire business lifecycle end-to-end without managing separate databases or hosting accounts during the MVP phase.
- **Alternatives Considered**: Splitting into separate codebases or installing Dokan/WooCommerce; rejected because Dokan requires expensive extensions ($249-$499/yr) and fails to address the custom Mumbai dispatch/add-on workflow.

### Decision 2: Interactive MMR Map with Real-Time Serviceability & Zone Geometry
- **Chosen Approach**: Built-in Leaflet/Mapbox-compatible SVG interactive map layer detailing Mumbai, Thane, Navi Mumbai, Kalyan, Dombivli, Diva, Mumbra, Kalwa, Mulund, Powai, Andheri East, Ghatkopar, and Kanjurmarg, with exact distance calculations from the Diva hub (400612).
- **Why**: Gives customers immediate visual certainty that their neighborhood is covered, calculates travel add-ons for outlying areas automatically, and visualizes technician dispatch.

### Decision 3: Server-Side Gemini 3.8 Flash with Google Search & Maps Grounding
- **Chosen Approach**: Express backend proxy (`/api/chat`, `/api/quote`) invoking `@google/genai` with `gemini-3.8-flash` using `tools: [{ googleSearch: {} }]` and function calling (`calculateFurnitureQuote`, `checkServiceability`, `findTechnicianAvailability`).
- **Why**: Keeps API keys completely private on the server, provides verified real-time Mumbai location answers, and performs accurate rate calculations directly from the 2026 Furniture Fix master price list.

### Decision 4: Immutable Status Machine & Double-Entry Commission Ledger
- **Chosen Approach**: State-machine transitions with timestamped logs (`ff_status_history`) and append-only commission entries (`ff_commission_ledger`).
- **Why**: Ensures no dispute over who handled a job, when add-ons were approved, and how technician payouts (e.g. ₹120 for stool, ₹450 for king bed, ₹500 for wardrobe) are calculated.

---

## 4. Technical Architecture & Data Strategy

### System Architecture & Component Hierarchy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        FURNITURE FIX WEB APP                           │
├──────────────────────────────────┬─────────────────────────────────────┤
│      CUSTOMER FRONT-END          │       OPERATIONS CONSOLE            │
│  ┌────────────────────────────┐  │  ┌───────────────────────────────┐  │
│  │ Navigation & Brand Header  │  │  │ Admin Dispatcher Board        │  │
│  │ Hero & Rate Calculator     │  │  │ • 8 Core KPI Metric Cards     │  │
│  │ Interactive MMR Map Canvas │  │  │ • Assisted Dispatch Scorer    │  │
│  │ Gemini AI Chat Assistant   │  │  │ • Financial Settlement Ledger │  │
│  │ Fast 3-Step Booking Modal  │  │  ├───────────────────────────────┤  │
│  │ Live Job Status Tracker    │  │  │ Technician Mobile Cards       │  │
│  └────────────────────────────┘  │  │ • TECH-001 (Mohd Anwar Khan)  │  │
│                                  │  │ • TECH-002 (Prakash V.)       │  │
│                                  │  │ • TECH-003 (Swapnil P.)       │  │
│                                  │  │ • Job Start / OTP / Add-ons   │  │
│                                  │  └───────────────────────────────┘  │
├──────────────────────────────────┴─────────────────────────────────────┤
│                    SHARED REACT STATE & STORAGE STORE                  │
│   • LocalStorage Reactive Repository (Jobs, Technicians, Rates, Logs) │
├────────────────────────────────────────────────────────────────────────┤
│                    EXPRESS SERVER-SIDE BACKEND (/api)                  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ POST /api/chat — @google/genai (gemini-3.8-flash + googleSearch) │  │
│  │ POST /api/quote — Deterministic Rate Engine + Distance Scorer    │  │
│  │ GET  /api/health — Server Status & Gemini Connectivity Check     │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### Data Model & Core Entities

1. **`ServiceItem` & `RateCard`**:
   - `id`: e.g. `bed_queen`
   - `category`: `Bedroom`, `Living Room`, `Study & Office`, `Storage`, `Mounting`, `Repair`
   - `name`: "Queen bed, standard"
   - `customerPrice`: ₹699
   - `technicianPayout`: ₹300 (Large band)
   - `complexity`: `Standard` | `Quote Required`
   - `includedScope`: "Unbox, frame assembly, slat fixing, alignment check"

2. **`Job`**:
   - `id`: e.g. `FF-26-04287`
   - `customer`: `{ name, mobile, address, locality, pincode }`
   - `items`: `Array<{ serviceId, name, quantity, unitPrice, total }>`
   - `addOns`: `Array<{ id, description, amount, status: 'pending'|'approved'|'declined', timestamp }>`
   - `status`: `New` → `Scheduled` → `Assigned` → `Accepted` → `In Progress` → `Completed` → `Paid`
   - `assignedTechId`: `TECH-001` | `TECH-002` | `TECH-003`
   - `appointmentSlot`: Date & time window (e.g., "Tomorrow, 2:00 PM – 4:00 PM")
   - `payment`: `{ method: 'Cash' | 'UPI', amountCollected, collectedAt }`
   - `payout`: `{ techPayout, platformMargin, settled: boolean }`

3. **`Technician`**:
   - `id`: `TECH-001` (Mohd Anwar Khan), `TECH-002` (Prakash Vishwakarma), `TECH-003` (Swapnil Panchal)
   - `skills`: Bedroom, Modular, Hydraulic, Wall Mounting, Repair
   - `activeJobs`: number
   - `baseLocality`: Diva, Thane, Mumbai
   - `rating`: 4.9

4. **`ServiceZone`**:
   - `name`: "Diva (Hub)", "Thane", "Navi Mumbai", "Powai", "Andheri East", "Mulund", "Kalyan", "Dombivli", etc.
   - `pincodes`: `["400612", "400601", "400076", "400069", ...]`
   - `zoneType`: `Core (Free Travel)` | `Outer (Quoted Distance Surcharge)`
   - `coordinates`: `{ lat, lng }`

### Verification & Implementation Steps

1. **Server Setup**:
   - Create Express server (`server.ts`) with `@google/genai` integration using `gemini-3.8-flash` and `googleSearch` tool.
   - Configure Vite proxy for seamless full-stack dev.
2. **Design & Core Layout**:
   - Implement the Furniture Fix brand identity: Top Bar Contract, Hero with instant rate estimation, Service Grid with 20+ authentic items.
3. **Interactive Map & Location Assistant**:
   - Interactive SVG/Canvas map of Mumbai MMR showing Diva Hub, Core zones, and Outer zones.
   - Grounded Gemini Chatbot drawer capable of answering location, serviceability, pricing, and scheduling queries.
4. **Operations Portal (Technician & Admin)**:
   - Mobile-first Technician dashboard with job actions (Accept, Start, Request Add-on, Complete with photo).
   - Admin command dashboard with real-time KPI metrics, dispatch assignments, and financial settlement ledger.
5. **Compilation & End-to-End Validation**:
   - Run `compile_applet` and test all end-to-end user workflows.
