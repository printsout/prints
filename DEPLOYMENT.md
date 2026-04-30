# Deployment Guide — Printsout

Backend → Railway · Frontend → Vercel · Databas → MongoDB Atlas

## Steg 1: Pusha kod till GitHub

I Emergent-chatten, klicka **"Save to Github"** (ikonen i chatten).
Skapa ett nytt repo, t.ex. `printsout`. När det är klart har du en GitHub-länk till repot.

## Steg 2: MongoDB Atlas (databas — gratis)

1. Gå till [mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register)
2. Skapa konto → välj **Build a Database** → **M0 Free**
3. Välj region **Frankfurt (eu-central-1)** för snabbast åt Sverige
4. Skapa en databasanvändare:
   - Username: `printsout-admin`
   - Password: generera ett starkt
   - Spara dessa
5. Network Access → **Add IP Address → Allow Access from Anywhere** (0.0.0.0/0)
6. Connect → Drivers → kopiera connection string:
   ```
   mongodb+srv://printsout-admin:<password>@cluster0.xxxxx.mongodb.net
   ```

## Steg 3: Migrera MongoDB-data från Emergent → Atlas

I Emergents preview-terminal (eller jag kan hjälpa till):

```bash
# Exportera lokalt
cd /app
mongodump --uri="$MONGO_URL" --db=$DB_NAME --out=/tmp/dbdump

# Importera till Atlas (byt ut Atlas-URL)
mongorestore --uri="mongodb+srv://printsout-admin:<password>@cluster0.xxxxx.mongodb.net" --db=printsout /tmp/dbdump/$DB_NAME
```

## Steg 4: Deploya backend till Railway

1. Gå till [railway.com](https://railway.com) → skapa konto (anslut GitHub)
2. **New Project → Deploy from GitHub repo** → välj ditt printsout-repo
3. **Add a service → Empty Service** (vi konfigurerar manuellt)
4. **Settings → Service**:
   - **Root Directory**: `backend`
   - **Build Command**: (lämna tomt — Nixpacks auto-detekterar)
   - **Start Command**: `uvicorn server:app --host 0.0.0.0 --port $PORT`
5. **Variables → Raw Editor**, klistra in (byt värden):

```
MONGO_URL=mongodb+srv://printsout-admin:<password>@cluster0.xxxxx.mongodb.net
DB_NAME=printsout
CORS_ORIGINS=https://printsout.vercel.app,https://printsout.se
JWT_SECRET=generera-32-tecken-slumpmässigt
JWT_ALGORITHM=HS256
ADMIN_EMAIL=info@printsout.se
ADMIN_PASSWORD_HASH=$2b$12$...
STRIPE_API_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=re_...
SENDER_EMAIL=info@printsout.se
NOTIFICATION_EMAIL=info@printsout.se
FRONTEND_URL=https://printsout.vercel.app
```

6. **Settings → Networking → Generate Domain** → kopiera URL:en (t.ex. `printsout-backend.railway.app`)

## Steg 5: Deploya frontend till Vercel

1. Gå till [vercel.com](https://vercel.com) → logga in med GitHub
2. **Add New → Project** → välj ditt repo
3. **Framework Preset**: Create React App (auto-detekteras)
4. **Root Directory**: `frontend`
5. **Environment Variables**:
   - `REACT_APP_BACKEND_URL` = `https://printsout-backend.railway.app` (URL från Steg 4)
6. **Deploy** → vänta 2-3 min → klart!

## Steg 6: Uppdatera CORS

Gå tillbaka till Railway → Variables och uppdatera:
```
CORS_ORIGINS=https://din-vercel-url.vercel.app
```
Railway redeployar automatiskt.

## Steg 7: Stripe webhook (för live-betalningar)

1. [dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks) → **Add endpoint**
2. URL: `https://printsout-backend.railway.app/api/webhook/stripe`
3. Events: `checkout.session.completed`, `payment_intent.succeeded`
4. Kopiera **Signing secret** → uppdatera `STRIPE_WEBHOOK_SECRET` i Railway

## Steg 8: Egen domän (valfritt)

**På Vercel:**
- Settings → Domains → lägg till `printsout.se`
- Lägg till DNS-records hos din domänleverantör (visas i Vercel)

**På Railway (för API-subdomain):**
- Settings → Networking → Custom Domain → `api.printsout.se`
- Lägg till CNAME-record

## ⚠️ Viktiga åtgärder INNAN deploy

- [ ] **Stripe Live-nycklar** (sk_live_..., webhook secret)
- [ ] **Resend domän verifierad** för `info@printsout.se`
- [ ] **JWT_SECRET** byts till nytt produktionsvärde (ej testvärdet)
- [ ] **Filuppladdningar**: lokala uploads i `/app/backend/uploads/` försvinner vid Railway-deploy. Bör migreras till AWS S3 eller Cloudflare R2 (kan göras separat — ~30 min jobb)

## Kostnadsöversikt

| Tjänst | Kostnad |
|---|---|
| MongoDB Atlas M0 | Gratis (512MB) |
| Vercel Hobby | Gratis |
| Railway | $5 gratiskredit/mån, sen $0.000231/GB-h (~$3-8/mån) |
| Domän | ~150 kr/år |
| **Totalt** | **~$5-10/månad + domän** |
