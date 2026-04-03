# Printsout - E-commerce Platform for Custom Photo Prints

## Original Problem Statement
E-commerce website called "Printsout" for custom photo prints on various products (mugs, t-shirts, posters, nametags, calendars, photo albums). Features live 3D/2D previews, custom editors for specialized products, cart/checkout flow, customer accounts, and comprehensive Admin Panel.

## User Language
Swedish (Svenska)

## Tech Stack
- Frontend: React, Tailwind CSS, @react-three/fiber, Canvas API
- Backend: FastAPI, MongoDB (Motor), JWT, pyotp (2FA), qrcode
- Payments: Stripe (LIVE mode)
- Deployment: Kubernetes container

## Core Features Implemented
- Product listing, categories, and detail pages
- 3D product customizer for mugs (drag, zoom, rotate)
- Multi-page calendar editor (12 months)
- Photo album editor with cover design, material selection, per-page captions (Canvas text burning)
- Name tag editor (inspired by namly.se)
- Cart & Stripe Checkout (LIVE)
- JWT authentication for users
- Admin Panel with Dashboard, Products, Users, Orders, Content, Payments, Tax, Reviews, Settings management
- Admin TOTP 2FA (Microsoft Authenticator) with setup, confirm, disable flows
- Admin Forgot Password / Reset Password flow
- Dynamic shipping, tax/VAT, global discount codes
- External review platform links (Google, Trustpilot)
- Cookie banner

## Admin Credentials
- URL: /admin
- Email: info@printsout.se
- Password: PrintoutAdmin2024!

## Key DB Collections
- users, products, orders, payment_settings, admin_settings_2fa, admin_password_resets, reviews, discount_codes, admin_logs, site_settings

## Completed Tasks (Latest Session - April 2026)
- [x] Fixed AdminContext.js to export setAdminToken (was breaking AdminLogin.js)
- [x] Added 2FA management UI to AdminSettings.js (setup QR code, confirm, disable)
- [x] Verified Admin 2FA flow end-to-end (17/17 backend tests, all frontend tests passed)
- [x] Made Admin 2FA MANDATORY - login always requires authenticator code, QR setup forced on first login (11/11 tests passed)
- [x] Verified Forgot Password + Reset Password flows
- [x] Added "Säkerhet" (Security) page to Admin Panel with activity log, 2FA status, login count, and security events
- [x] Added Customer "Glömt lösenord" (Forgot Password) flow with email reset code via Resend (12/12 tests passed)
- [x] Implemented real order confirmation email via Resend (replaces mock) - sent on both payment status check and Stripe webhook

## Pending Issues
- [P2] Cross-Origin Read Blocking on residual Unsplash images

## Upcoming Tasks
- [P1] Update database connection string (user mentioned switching databases)
- [P1] Refactor backend server.py (~2000 lines) into modular routers

## Future/Backlog
- [P2] Email confirmation for orders (Resend integration, needs verified domain)
- [P2] Klarna/Swish payment support
- [P2] Full customer account page (order history, saved designs)

## Mocked/Placeholder Features
- Email order confirmations (console.log only)
- Klarna/Swish payment methods
