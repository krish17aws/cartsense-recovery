# CartSense Recovery AI — Vercel Edition

A production-shaped Next.js TypeScript portfolio application for AI-assisted abandoned-cart recovery. It combines a 100-product multi-customer storefront, an operations dashboard, Neon PostgreSQL, Gemini recommendations, human approval guardrails, generated cart images and Meta WhatsApp Cloud API delivery.

## Recovery policy

- Process carts after 180 minutes of inactivity.
- New customer with cart above ₹500: automatically send a fixed ₹100 welcome offer.
- New customer at ₹500 or below: send without a discount.
- Standard returning-customer recovery: automatic send.
- Percentage discount above 15%: pause for human approval.
- Vercel Cron runs the recovery processor every 10 minutes.

## Stack

- Next.js 16, React 19 and TypeScript
- Neon PostgreSQL with Drizzle ORM
- Gemini API with an explicit policy-engine fallback
- Meta WhatsApp Cloud API
- Vercel Cron
- Dynamic PNG cart-summary images

## Local setup

Requirements: Node.js 22.13 or newer and a Neon database.

```bash
npm install
cp .env.example .env.local
npm run db:migrate
npm run dev
```

Open `http://localhost:3000/shop` for the storefront and `http://localhost:3000` for the recovery overview.

## Environment variables

Use `.env.example` as the source of truth. Never commit `.env`, `.env.local`, database passwords, Gemini keys or Meta tokens.

`APP_BASE_URL` must be a public HTTPS URL when testing WhatsApp because Meta downloads the generated cart image from `/api/cart-image`.

## Meta template contract

The configured template must contain:

- image header;
- body `{{1}}`: customer first name;
- body `{{2}}`: formatted cart total;
- body `{{3}}`: Gemini or fallback recovery copy; and
- one dynamic URL button.

## Vercel deployment

1. Push this folder to a private GitHub repository.
2. Import the repository into Vercel.
3. Add every `.env.example` key under Project Settings → Environment Variables.
4. Set `APP_BASE_URL` to the final Vercel production URL.
5. Run `npm run db:migrate` against the rotated Neon database before the first test.
6. Redeploy after environment-variable changes.

Vercel supplies `Authorization: Bearer $CRON_SECRET` to `/api/cron/recovery`. The included `vercel.json` schedules it every ten minutes.

## Commands

```bash
npm run dev
npm run lint
npm run build
npm test
npm run db:generate
npm run db:migrate
```

## Security

All credentials previously pasted into chats, screenshots or source files must be rotated before testing. This package intentionally contains placeholders only.
