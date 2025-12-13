
# Bhairavnath Vegetable Supplier (BVS) — Backend API Overview

Welcome! This document explains, in simple terms, what our backend does and how the web app talks to it. If you’re new, you’ll quickly understand the main features, the API structure, and what each endpoint is for.

---

## What is this App?

BVS is a web platform for hotels, canteens, and caterers in Pune to:
- Browse fresh vegetables and fruits
- Place and manage bulk orders
- Track deliveries and bills
- Use a chatbot for quick info, price lists, and support

The backend is built with Flask (Python) and exposes REST API endpoints for all these features.

---

## Main API Structure

Our backend is split into three main files:
- **api.py** — Handles user accounts, hotel dashboards, orders, cart, and billing
- **chatbot_backend.py** — Powers the chatbot, price info, and text-to-speech
- **combine_api.py** — Combines chatbot and main API for some deployments

---

## Key API Endpoints (What They Do)

### 1. Public Info (No Login Needed)
- `GET /` — Welcome message and app info
- `GET /api/public/vegetables` — List all available vegetables (for anyone)
- `GET /api/public/history` — Company background and services

### 2. User Authentication
- `POST /api/auth/login` — Log in (get a token)
- `POST /api/auth/logout` — Log out (invalidate session)
- `GET /api/auth/session/check` — Check if you’re still logged in
- `POST /api/auth/password/change` — Change your password

### 3. Hotel Dashboard (Login Required)
- `GET /api/hotel/dashboard` — See your hotel’s stats, recent orders, and bills
- `GET /api/hotel/orders` — List all your orders
- `GET /api/hotel/orders/<order_id>` — Details for a specific order
- `GET /api/hotel/bills` — All your bills

### 4. Cart & Order Management
- `GET /api/hotel/cart` — View your cart
- `POST /api/hotel/cart` — Add or update items in your cart
- `PUT /api/hotel/cart/<product_id>` — Change quantity of a cart item
- `DELETE /api/hotel/cart/<product_id>` — Remove an item from your cart
- `DELETE /api/hotel/cart/clear` — Empty your cart
- `POST /api/hotel/cart/calculate` — Get the total price for your cart
- `POST /api/hotel/orders` — Place a new order

### 5. Chatbot & Utility
- `GET /health` — Check if the backend is running
- `POST /tts` — Convert text to speech (for Indian languages)
- `OPTIONS /chat` — Preflight for chatbot requests
- `GET /api/public/products` — List all products (public, via chatbot)

---

## How Does the Frontend Use These?

- The React frontend calls these endpoints to log users in, show product lists, manage carts, place orders, and display dashboards.
- The chatbot widget uses `/chat` and `/tts` for interactive help and voice responses.
- All data is sent/received as JSON.

---

## Need More Details?

Each endpoint can return errors (like 401 for unauthorized, 400 for bad input). Most hotel/order endpoints require a valid login token.

For more technical details, see the code in `api.py`, `chatbot_backend.py`, and `combine_api.py`.

---

**Generated on: 2025-11-25**

---

## Notes
- Endpoints in `chatbot_backend.py` and `combine_api.py` are similar, with chatbot and TTS features.
- Some endpoints are commented out or planned for future use.
- All endpoints use JSON for request/response.
- Authentication is required for most `/api/hotel/*` endpoints.

---

**Generated on: 2025-11-25**
