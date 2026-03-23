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
- Design-editor (muggar, t-shirts, posters etc. med bilduppladdning, text, position)
- Varukorg, Kassa, Auth (register/login), Konto
- Admin Panel (dashboard, produkter, användare, ordrar, betalningar, innehåll)
- Dropdown produktmeny i navbar (9 kategorier)
- Footer-länkar kopplade till admin-innehåll (7 sidor)

### Säkerhet (2026-03-23)
1. Rate limiting, Security headers, Input-sanitering (bleach)
2. Lösenordskrav, JWT 8h timeout, Admin-lösenord hashad i .env

### Orderhantering - Alla produkttyper (2026-03-23) - FIXAD
- **Problem**: CartItem/OrderItem modeller saknade customization-fält. CalendarEditor använde `addItem` som inte existerade.
- **Fix**: 
  - Backend: Lade till `name`, `price`, `image`, `customization` i CartItem och OrderItem
  - DesignEditor: Laddar upp bild till server, skickar customization (text, font, färg, position, placeringsönskemål)
  - CalendarEditor: Fixade `addItem` → `addToCart`, laddar upp månadsbilder
  - Cart.js/Checkout.js: Använder `item.price` istället för alltid `product.price`
  - AdminOrders: Visar detaljer för alla 4 typer (nametag, calendar, design, photoalbum) med bilder & nedladdning
- **Testat**: Backend 11/11, Frontend 100% - iteration_5.json & iteration_6.json

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
- Iteration 5: Order customization E2E (nametag + photoalbum) - 100%
- Iteration 6: ALL 4 order types (nametag, calendar, design, photoalbum) - 100% (Backend 11/11, Frontend 100%)
- Security: Rate limiting, headers, JWT timeout, password validation - ALL VERIFIED

## Preview URL
https://printout-lab.preview.emergentagent.com
