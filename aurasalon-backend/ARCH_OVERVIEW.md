# AuraSalon Architecture & System Overview

## System Goal
AuraSalon is a multi-tenant salon booking and management platform designed specifically for the Ethiopian market. It facilitates real-time slot bookings, staff assignment, and mobile payments (Telebirr, Chapa, CBE Birr).

## Core Domain Architecture

### 1. Database Entity Overview
- **User & Roles**: `User` table supporting `CUSTOMER`, `SALON_OWNER`, `STAFF`, and `SUPER_ADMIN`. Key identification is via `phoneNumber` (E.164 standard format, e.g., `+2519...`).
- **Salon & Staff**: `Salon` entity owned by a `SALON_OWNER`. Salons host multiple `StaffProfile` records and `Service` categories.
- **Service Catalog**: `Category` and `Service` models handling durations (`durationMin`) and pricing in Ethiopian Birr (`priceETB`).
- **Booking Engine**: `Appointment` and `AppointmentService` entities tracking booking slots, QR check-in codes (`bookingCode`), and statuses (`PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`).
- **Payment Layer**: `Payment` and `PaymentWebhookLog` models handling external payment gateway integrations and transaction references.

### 2. High-Level Backend Modules (NestJS)
- `AuthModule`: Handles OTP authentication via phone number, password hashing, and JWT generation/validation.
- `SalonModule`: CRUD endpoints for salons, operating hours, gallery image URLs, and sub-city searches.
- `ServiceModule`: Service catalog management, pricing, and duration handling.
- `BookingModule`: Handles time-slot calculation, Redis distributed lock checks, and appointment creation.
- `PaymentModule`: Webhook endpoints for Telebirr, Chapa, and CBE Birr callbacks.
- `RedisModule`: Wrapper around `ioredis` for fast temporary locking during checkout.

### 3. Business Critical Rules
1. **Double-Booking Prevention**: When a customer initiates checkout, a Redis key (`lock:slot:{staffId}:{startTime}`) is reserved with a 5-minute Time-To-Live (TTL) to block concurrent bookings.
2. **Payment Lifecycle**: Appointments are marked `PENDING` until a payment webhook fires with `SUCCESSFUL`, changing status to `CONFIRMED`.
3. **Localisation**: All currency calculations use exact ETB Decimal fields (`@db.Decimal(10, 2)`). Default timezone is Africa/Addis_Ababa (EAT).