# Printout - E-commerce för Personliga Produkter

## Projektöversikt
En e-commerce webbplats där användare kan ladda upp egna bilder, anpassa designen på produkter, se en förhandsvisning och beställa tryck på olika artiklar.

## Tech Stack
- **Frontend**: React 19, Tailwind CSS, Shadcn/UI, React Router, Google Fonts
- **Backend**: FastAPI, Motor (MongoDB), bleach (sanitering), slowapi (rate limiting)
- **Databas**: MongoDB
- **Auth**: JWT (8h timeout) + bcrypt
- **Betalning**: Stripe (testläge)
- **3D**: @react-three/fiber, @react-three/drei

## Implementerat

### Core Features
- Hemsida, Produktsida, Produktdetaljer, 3D mugg-preview
- Kalender-editor (12 månader)
- Namnskylts-editor (namly.se-stil, tab-baserad)
- Fotoalbum-editor (multi-bild per sida, 5 layouter)
- Varukorg, Kassa, Auth (register/login), Konto
- Admin Panel (dashboard, produkter, användare, ordrar, betalningar, innehåll)
- Dropdown produktmeny i navbar (9 kategorier)
- Footer-länkar kopplade till admin-innehåll (7 sidor)

### Säkerhet (2026-03-23)
1. **Rate limiting**: 5/min register, 10/min login, 5/min admin login
2. **Security headers**: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy
3. **Input-sanitering**: bleach saniterar HTML i innehållssidor (XSS-skydd)
4. **Lösenordskrav**: Min 8 tecken, stor+liten bokstav, siffra, specialtecken (frontend + backend)
5. **JWT Timeout**: 8 timmars session, auto-logout vid expired token
6. **Admin-lösenord**: Hashad med bcrypt, lagrad i .env (ej hårdkodad)

### Pågående (P1)
1. Stripe Checkout - Komplett betalningsflöde
2. Kundkontosida - Orderhistorik, sparade designer

### Framtida (P2)
1. E-postbekräftelse, Klarna/Swish, Backend-refaktorisering

## Credentials
- **Admin**: admin@printout.se / PrintoutAdmin2024!
- **User**: Registrera via /registrera

## Test Status
- Iteration 1: Core app - PASS
- Iteration 2: NameTagEditor - 100% (19/19)
- Iteration 3: PhotoAlbumEditor - 100% (17/17)
- Iteration 4: PhotoAlbumEditor multi-image - 100% (19/19)
- Security: Rate limiting, headers, JWT timeout, password validation - ALL VERIFIED

## Preview URL
https://printout-lab.preview.emergentagent.com
