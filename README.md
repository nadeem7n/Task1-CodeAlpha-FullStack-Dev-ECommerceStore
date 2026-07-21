# CodeAlpha_ECommerceStore

A simple full-stack e-commerce store built for the **CodeAlpha Full Stack Development Internship — Task 1**.

## Features
- Product listing with search & category filters
- Product detail view
- Shopping cart (persisted in browser localStorage)
- User registration & login (passwords hashed with Node's `crypto.scrypt`, token-based sessions)
- Order processing / checkout that reduces product stock
- Order history per user

## Tech Stack
- **Backend:** Node.js + Express
- **Frontend:** HTML, CSS, vanilla JavaScript (no framework, no build step)
- **Database:** Lightweight JSON-file storage (`/data`) — easy to swap for MongoDB/PostgreSQL later

## Project Structure
```
CodeAlpha_ECommerceStore/
├── server.js        # Express app & all API routes
├── db.js            # tiny JSON-file "database" helper
├── auth.js          # password hashing + bearer-token auth middleware
├── package.json
├── data/             # auto-created: products.json, users.json, orders.json
└── public/           # frontend
    ├── index.html
    ├── style.css
    └── app.js
```

## How to Run
```bash
cd CodeAlpha_ECommerceStore
npm install
npm start
```
Then open **http://localhost:3001** in your browser.

## API Endpoints
| Method | Endpoint            | Auth | Description                     |
|--------|----------------------|------|----------------------------------|
| POST   | /api/register        | No   | Create account                  |
| POST   | /api/login            | No   | Login, returns token             |
| POST   | /api/logout           | Yes  | Invalidate token                 |
| GET    | /api/me                | Yes  | Current user info                |
| GET    | /api/products          | No   | List products (supports `?category=` `?search=`) |
| GET    | /api/products/:id      | No   | Product detail                   |
| POST   | /api/orders            | Yes  | Place an order `{ items: [{productId, qty}] }` |
| GET    | /api/orders            | Yes  | List current user's orders       |

## Notes / Next Steps
- Replace the JSON-file store with MongoDB (Mongoose) or PostgreSQL for production.
- Add payment gateway integration (Stripe/PayPal) for real checkout.
- Add product images upload & an admin panel to manage products.
