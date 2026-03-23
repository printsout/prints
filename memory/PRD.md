# Printout - E-commerce för Personliga Produkter

## Projektöversikt
En e-commerce webbplats där användare kan ladda upp egna bilder, anpassa designen på produkter, se en förhandsvisning och beställa tryck på olika artiklar.

## Tech Stack
- **Frontend**: React 19, Tailwind CSS, Shadcn/UI, React Router, Google Fonts
- **Backend**: FastAPI, Motor (MongoDB), bleach (sanitering), slowapi (rate limiting)
- **Databas**: MongoDB
- **Auth**: JWT (8h timeout) + bcrypt
- **Betalning**: Stripe Checkout (live-redo, testat med test-nycklar)
- **3D**: @react-three/fiber, @react-three/drei

## Implementerat

### Core Features
- Hemsida, Produktsida, Produktdetaljer, 3D mugg-preview
- Kalender-editor (12 månader med bilduppladdning)
- Namnskylts-editor (namly.se-stil, tab-baserad)
- Fotoalbum-editor (multi-bild per sida, 5 layouter)
- Design-editor (muggar, t-shirts, posters med bilduppladdning, text, position)
- Varukorg med anpassningsdetaljer, Kassa med Stripe redirect
- Auth (register/login), Konto
- Admin Panel (dashboard, produkter, användare, ordrar, betalningar, innehåll)
- Dropdown produktmeny i navbar (9 kategorier)
- Footer-länkar kopplade till admin-innehåll (7 sidor)
- Orderbekräftelsesida med polling av betalningsstatus

### Stripe Checkout (2026-03-23) - KOMPLETT
- Backend skapar Stripe Checkout Session med korrekta belopp i SEK
- Frontend omdirigerar kund till Stripe betalningssida
- Success/Cancel URL:er konfigurerade
- Webhook-hantering för betalningsbekräftelse
- Orderbekräftelsesida pollar betalningsstatus

### Säkerhet
- Rate limiting, Security headers, Input-sanitering (bleach)
- Lösenordskrav, JWT 8h timeout, Admin-lösenord hashad i .env

### DB-optimeringar (2026-03-23)
- Admin Revenue: MongoDB aggregation pipeline istället för Python-loop
- Användarordrar/designer: Paginering + sortering

### Pågående (P1)
- Kundkontosida (orderhistorik)

### Framtida (P2)
1. E-postbekräftelse, Klarna/Swish, Backend-refaktorisering
2. Fixa Unsplash/ORB bildproblem

## Credentials
- **Admin**: admin@printout.se / PrintoutAdmin2024!
- **User**: Registrera via /registrera

## Preview URL
https://printout-lab.preview.emergentagent.com
