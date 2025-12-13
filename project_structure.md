# Bhairavnath Vegetable Supplier (BVS) - Complete Project Structure & Documentation

**Generated:** December 12, 2025  
**Project Type:** Full-Stack Web Application (React + Flask + MySQL)  
**Purpose:** B2B Vegetable & Fruit Supplier Platform for Hotels, Canteens & Caterers

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Backend Endpoints](#backend-endpoints)
4. [Frontend Structure](#frontend-structure)
5. [Database Schema](#database-schema)
6. [Key Features](#key-features)
7. [Technology Stack](#technology-stack)
8. [How Everything Works](#how-everything-works)

---

## Project Overview

**BVS (Bhairavnath Vegetable Supplier)** is a comprehensive web platform designed for:
- **Hotels, Canteens, Caterers** - Browse, order, and manage bulk vegetable & fruit supplies
- **Admin Dashboard** - Manage products, orders, inventory, suppliers, analytics
- **Hotel Dashboard** - Place orders, view bill history, manage cart, track deliveries
- **AI Chatbot** - Multi-language (English, Hindi, Marathi) support with text-to-speech

### Key Business Details
- **Company:** Bhairavnath Vegetable Supplier (BVS)
- **Location:** Gultekdi, Market Yard, Pune - 411037
- **Contact Phone:** 9881325644
- **Contact Email:** surajgaikwad9812@gmail.com
- **Focus:** Bulk supply to hotels, canteens, caterers in Pune region
- **Service Hours:** 6 AM - 10 PM (Daily)

---

## Architecture

### High-Level System Design

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                         │
│  ┌────────────────┬──────────────┬──────────────┐          │
│  │   Hotel       │    Admin     │   Chatbot   │           │
│  │  Dashboard    │  Dashboard   │   Widget    │           │
│  └────────────────┴──────────────┴──────────────┘          │
└─────────────────────────────────────────────────────────────┘
                          ↓ REST API
┌─────────────────────────────────────────────────────────────┐
│                 Backend (Flask Python)                      │
│  ┌────────────────┬──────────────┬──────────────┐          │
│  │   API Core    │   Chatbot    │  Auth &      │           │
│  │  (api.py)     │ (combine_api)│ Session Mgmt │           │
│  └────────────────┴──────────────┴──────────────┘          │
│  • User Authentication (JWT)                               │
│  • Order Management (CRUD)                                 │
│  • Product Management                                      │
│  • Inventory & Stock Tracking                              │
│  • Billing & Invoice Generation                            │
│  • Supplier Management                                     │
│  • Analytics & Reporting                                   │
│  • Multi-Language Support (English, Hindi, Marathi)        │
│  • Text-to-Speech (MMS-TTS, ElevenLabs)                   │
│  • AI Chat Integration (DeepSeek)                          │
└─────────────────────────────────────────────────────────────┘
                          ↓ MySQL Queries
┌─────────────────────────────────────────────────────────────┐
│              Database (MySQL - BVS Database)                │
│  Tables: users, products, orders, order_items, bills,       │
│          suppliers, sessions, cart, support_tickets        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│         External Services Integration                       │
│  • Supabase (Fallback Database)                            │
│  • DeepSeek AI (LLM for Chat)                              │
│  • Google Translator (Multi-language)                      │
│  • MMS-TTS (Voice for Hindi/Marathi)                       │
│  • Twilio (SMS/WhatsApp notifications)                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Backend Endpoints

### Base URL
- **Production:** http://localhost:5000 (or deployed URL)
- **API Base:** `/api/`

### 1. Public Routes (No Authentication Required)

#### Home & Info
```
GET /
Response: Welcome message, app features, contact info

GET /api/public/vegetables
Response: List of all available vegetables with prices

GET /api/public/history
Response: Company background, mission, services, history

GET /api/public/products
Response: All available products (vegetables & fruits)
Query Params: ?limit=20
```

#### Health Check
```
GET /health
Response: Server status, service availability (Supabase, DeepSeek, TTS, etc.)
```

---

### 2. Authentication Routes

```
POST /api/auth/login
Body: { "username": "string", "password": "string" }
Response: { token, user_data, session_info, message }
Status: 200 (Success), 401 (Invalid credentials)

POST /api/auth/logout
Headers: Authorization: Bearer <token>
Response: { message, timestamp }
Status: 200

GET /api/auth/session/check
Headers: Authorization: Bearer <token>
Response: { valid, user, session_details, time_remaining }
Status: 200 (Valid), 401 (Invalid/Expired)

POST /api/auth/password/change
Headers: Authorization: Bearer <token>
Body: { "current_password": "string", "new_password": "string" }
Response: { message }
Status: 200 (Success), 400 (Invalid current password), 500 (Error)
```

---

### 3. Hotel Dashboard Routes (Authentication Required)

#### Dashboard Overview
```
GET /api/hotel/dashboard
Headers: Authorization: Bearer <token>
Response: {
  hotel_info: { name, email, phone, address },
  stats: { total_orders, total_spent, pending_orders, delivered_orders, this_month_total },
  recent_orders: [ {...}, ... ],
  recent_bills: [ {...}, ... ]
}
Status: 200
```

#### Orders Management
```
GET /api/hotel/orders
Headers: Authorization: Bearer <token>
Response: Array of all hotel's orders with items

GET /api/hotel/orders/<int:order_id>
Headers: Authorization: Bearer <token>
Response: {
  order_details,
  items: [ { product_name, quantity, unit_price, total }, ... ]
}
Status: 200

POST /api/hotel/orders
Headers: Authorization: Bearer <token>
Body: {
  "delivery_date": "YYYY-MM-DD",
  "delivery_time": "HH:MM",
  "delivery_address": "string",
  "items": [ { "product_id": int, "quantity": float }, ... ]
}
Response: {
  order_id,
  message,
  order_details
}
Status: 201 (Created), 400 (Invalid), 500 (Error)
```

#### Bills & Invoicing
```
GET /api/hotel/bills
Headers: Authorization: Bearer <token>
Response: Array of all hotel's bills with details

GET /api/hotel/bills/<int:bill_id>
Headers: Authorization: Bearer <token>
Response: Complete bill details with order information

POST /api/hotel/bills
Headers: Authorization: Bearer <token>
Body: { "order_id": int, ... }
Response: { bill_id, message, bill_data }
Status: 201
```

#### Cart Management
```
GET /api/hotel/cart
Headers: Authorization: Bearer <token>
Response: {
  cart_items: [ { product_id, product_name, quantity, unit_price, total }, ... ],
  total_items,
  total_amount
}

POST /api/hotel/cart
Headers: Authorization: Bearer <token>
Body: { "product_id": int, "quantity": float }
Response: { message, cart_id, items_count }
Status: 201

PUT /api/hotel/cart/<int:product_id>
Headers: Authorization: Bearer <token>
Body: { "quantity": float }
Response: { message, updated_item }
Status: 200

DELETE /api/hotel/cart/<int:product_id>
Headers: Authorization: Bearer <token>
Response: { message, remaining_items }
Status: 200

DELETE /api/hotel/cart/clear
Headers: Authorization: Bearer <token>
Response: { message }
Status: 200

POST /api/hotel/cart/calculate
Headers: Authorization: Bearer <token>
Body: { "items": [ { "product_id": int, "quantity": float }, ... ] }
Response: {
  subtotal,
  delivery_charges,
  total_amount,
  breakdown: { ... }
}
```

#### Profile Management
```
GET /api/hotel/profile
Headers: Authorization: Bearer <token>
Response: { hotel_name, email, phone, address, since_date }

PUT /api/hotel/profile
Headers: Authorization: Bearer <token>
Body: { "email": "string", "phone": "string", "address": "string" }
Response: { message, updated_profile }
```

#### Support Tickets
```
GET /api/hotel/support-tickets
Headers: Authorization: Bearer <token>
Response: Array of support tickets

POST /api/hotel/support-tickets
Headers: Authorization: Bearer <token>
Body: { "subject": "string", "message": "string", "category": "string" }
Response: { ticket_id, message }
Status: 201
```

---

### 4. Admin Dashboard Routes (Authentication Required - Admin Role Only)

#### Admin Dashboard Overview
```
GET /api/admin/dashboard
Headers: Authorization: Bearer <token>
Response: {
  stats: {
    total_orders,
    total_revenue,
    pending_orders,
    total_customers,
    low_stock_products,
    top_products
  },
  recent_orders: [ {...}, ... ],
  revenue_by_month: { ... }
}
```

#### Product Management
```
GET /api/products
Response: All products with details

POST /api/admin/products
Headers: Authorization: Bearer <token>
Body: {
  "name": "string",
  "description": "string",
  "category": "string",
  "price_per_unit": float,
  "unit_type": "string",
  "image_url": "string"
}
Response: { product_id, message }
Status: 201

PUT /api/admin/products/<int:product_id>
Headers: Authorization: Bearer <token>
Body: { "name", "description", "category", "price_per_unit", "unit_type", "image_url" }
Response: { message, updated_product }

DELETE /api/admin/products/<int:product_id>
Headers: Authorization: Bearer <token>
Response: { message }
Status: 200

PATCH /api/admin/products/<int:product_id>/stock
Headers: Authorization: Bearer <token>
Body: { "quantity": float, "action": "add|reduce" }
Response: { message, new_stock_level }
```

#### Orders Management
```
GET /api/admin/orders
Headers: Authorization: Bearer <token>
Response: Array of all orders with details

GET /api/admin/orders/pending
Headers: Authorization: Bearer <token>
Response: Array of pending orders only

POST /api/admin/orders
Headers: Authorization: Bearer <token>
Body: { "user_id": int, "items": [ {...} ], ... }
Response: { order_id, message }
Status: 201

PUT /api/admin/orders/<int:order_id>/status
Headers: Authorization: Bearer <token>
Body: { "status": "pending|confirmed|dispatched|delivered|cancelled" }
Response: { message, updated_order }
```

#### Billing Management
```
GET /api/admin/bills
Headers: Authorization: Bearer <token>
Response: Array of all bills

POST /api/admin/bills
Headers: Authorization: Bearer <token>
Body: { "order_id": int, ... }
Response: { bill_id, message }
Status: 201

PUT /api/admin/bills/<int:bill_id>
Headers: Authorization: Bearer <token>
Body: { "status": "pending|paid|overdue|cancelled" }
Response: { message, updated_bill }
```

#### User Management
```
GET /api/admin/users
Headers: Authorization: Bearer <token>
Response: Array of all users

POST /api/admin/users
Headers: Authorization: Bearer <token>
Body: {
  "username": "string",
  "password": "string",
  "email": "string",
  "hotel_name": "string",
  "phone": "string",
  "address": "string"
}
Response: { user_id, message }
Status: 201

GET /api/admin/users/<int:user_id>
Headers: Authorization: Bearer <token>
Response: User details

PUT /api/admin/users/<int:user_id>
Headers: Authorization: Bearer <token>
Body: { "email", "phone", "hotel_name", "address" }
Response: { message, updated_user }

DELETE /api/admin/users/<int:user_id>
Headers: Authorization: Bearer <token>
Response: { message }
```

#### Supplier Management
```
GET /api/admin/suppliers
Headers: Authorization: Bearer <token>
Response: Array of all suppliers

GET /api/admin/suppliers/<int:supplier_id>
Headers: Authorization: Bearer <token>
Response: Supplier details

POST /api/admin/suppliers
Headers: Authorization: Bearer <token>
Body: { "name", "contact_person", "phone", "email", "address" }
Response: { supplier_id, message }

PUT /api/admin/suppliers/<int:supplier_id>
Headers: Authorization: Bearer <token>
Body: { "name", "contact_person", "phone", "email", "address" }
Response: { message, updated_supplier }

DELETE /api/admin/suppliers/<int:supplier_id>
Headers: Authorization: Bearer <token>
Response: { message }
```

#### Analytics
```
GET /api/admin/analytics/trends
Headers: Authorization: Bearer <token>
Query Params: ?period=monthly|weekly|daily&months=6
Response: {
  trends: { order_count, revenue, avg_order_value },
  product_trends: [ {...}, ... ],
  customer_trends: [ {...}, ... ]
}
```

#### Support Tickets
```
GET /api/admin/support/tickets
Headers: Authorization: Bearer <token>
Response: Array of all support tickets

POST /api/admin/support/tickets
Headers: Authorization: Bearer <token>
Body: { "subject", "message", "category" }
Response: { ticket_id, message }

GET /api/admin/support/tickets/<int:ticket_id>
Headers: Authorization: Bearer <token>
Response: Ticket details with messages

POST /api/admin/support/tickets/<int:ticket_id>/reply
Headers: Authorization: Bearer <token>
Body: { "reply": "string" }
Response: { message }

PATCH /api/admin/support/tickets/<int:ticket_id>/close
Headers: Authorization: Bearer <token>
Response: { message }
```

#### Admin Profile & Settings
```
GET /api/admin/profile
Headers: Authorization: Bearer <token>
Response: Admin profile details

PUT /api/admin/profile
Headers: Authorization: Bearer <token>
Body: { "name", "email", "phone" }
Response: { message, updated_profile }

GET /api/admin/settings
Headers: Authorization: Bearer <token>
Response: System settings

PUT /api/admin/settings
Headers: Authorization: Bearer <token>
Body: Settings data
Response: { message, updated_settings }
```

#### Session Management
```
GET /api/admin/sessions
Headers: Authorization: Bearer <token>
Response: Array of active user sessions

DELETE /api/admin/sessions/<int:user_id>
Headers: Authorization: Bearer <token>
Response: { message } (Forces user logout)
```

---

### 5. Chatbot Routes

#### Chat Endpoint
```
OPTIONS /chat
Response: { status: "success" }

POST /chat
Body: { "message": "string" }
Response: {
  response: "string",
  menu: [ { text, action }, ... ] | null,
  is_terminal: boolean,
  current_menu: "string" | null,
  detected_language: "en|hi|mr|te"
}
```

#### Text-to-Speech
```
POST /tts
Body: { "text": "string", "language": "hi|mr" }
Response: {
  audio_data: "base64_encoded_audio",
  language: "string",
  status: "success"
}
```

---

## Frontend Structure

### Directory Layout

```
src/
├── App.js                           # Main app router & layout
├── App.css                          # Global styles
├── index.js                         # React entry point
├── index.css                        # Global CSS
├── setupTests.js                    # Test setup
├── reportWebVitals.js               # Performance metrics
│
├── frontend/                        # Public pages (no auth)
│   ├── home.js                      # Landing page
│   ├── vegetables.js                # Browse vegetables
│   ├── fruits.js                    # Browse fruits
│   ├── login.js                     # Login page
│   ├── about.js                     # About company
│   ├── more.js                      # More information
│   ├── FAQSection.js                # FAQ component
│   └── features.js                  # Features showcase
│
├── admin_dashboard/                 # Admin dashboard (protected)
│   ├── pages/
│   │   ├── admindash.js             # Admin home dashboard
│   │   ├── orders.js                # All orders management
│   │   ├── hotels.js                # Hotel/customer management
│   │   ├── products.js              # Product catalog management
│   │   ├── suppliers.js             # Supplier management
│   │   ├── inventory.js             # Stock/inventory tracking
│   │   ├── billing.js               # Invoicing & billing
│   │   ├── analytics.js             # Reports & analytics
│   │   ├── users.js                 # User accounts
│   │   ├── settings.js              # System settings
│   │   ├── support.js               # Support tickets
│   │   ├── profile.js               # Admin profile
│   │   └── HotelDetail.js           # Hotel details view
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Layout.js            # Main layout wrapper
│   │   │   ├── Sidebar.js           # Navigation sidebar
│   │   │   ├── Topbar.js            # Top navigation bar
│   │   │   └── NavLink.js           # Nav link component
│   │   │
│   │   ├── ui/
│   │   │   ├── KPI.js               # Key Performance Indicator cards
│   │   │   ├── ChartCard.js         # Chart display component
│   │   │   ├── OrdersTable.js       # Orders data table
│   │   │   ├── InventoryTable.js    # Inventory table
│   │   │   ├── StatusBadge.js       # Order status badge
│   │   │   ├── EmptyState.js        # Empty state UI
│   │   │   └── InvoiceTemplate.js   # Invoice layout
│   │   │
│   │   ├── modals/
│   │   │   ├── CreateOrderModal.js  # Order creation modal
│   │   │   ├── UpdateStatusModal.js # Status update modal
│   │   │   ├── AddProductModal.js   # Add product modal
│   │   │   └── SlideOver.js         # Slide-over panel
│   │   │
│   │   └── hooks/
│   │       ├── useAdminDashboard.js # Dashboard data hook
│   │       └── useAuth.js           # Authentication hook
│   │
│   └── utils/
│       ├── api.js                   # API client for admin
│       └── i18n.js                  # Internationalization
│
├── hotel_dashboard/                 # Hotel user dashboard (protected)
│   ├── pages/
│   │   ├── dashbaord.js             # Hotel home dashboard
│   │   ├── orders.js                # My orders
│   │   ├── products.js              # Browse products
│   │   ├── cart.js                  # Shopping cart
│   │   ├── bills.js                 # Invoice history
│   │   ├── profile.js               # Hotel profile
│   │   ├── settings.js              # Account settings
│   │   └── support.js               # Support & help
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Layout.js            # Layout wrapper
│   │   │   ├── Sidebar.js           # Side navigation
│   │   │   ├── Topbar.js            # Top bar
│   │   │   ├── NavLink.js           # Nav link
│   │   │   └── Slideover.js         # Slide panel
│   │   │
│   │   ├── pages/
│   │   │   └── (page-specific components)
│   │   │
│   │   ├── ui/
│   │   │   ├── KPIcard.js           # KPI card display
│   │   │   ├── Modal.js             # Modal dialog
│   │   │   ├── Toast.js             # Toast notifications
│   │   │   └── Skeleton.js          # Loading skeleton
│   │   │
│   │   ├── modals/
│   │   │   ├── NewOrderModal.js     # Place order modal
│   │   │   └── ChangePasswordModal.js
│   │   │
│   │   └── hooks/
│   │       └── useAuth.js           # Auth hook
│   │
│   ├── styles.css                   # Dashboard styles
│   ├── assets/                      # Images & assets
│   └── utils/
│       └── api.js                   # API client for hotel
│
├── chatbot/
│   └── ChatBot.js                   # Chatbot widget component
│
└── Invoices/
    └── invoice.html                 # Invoice HTML template

public/
├── index.html                       # HTML entry point
├── bill.html                        # Bill template
└── manifest.json                    # PWA manifest

leaveslogo/                          # Logo assets

package.json                         # NPM dependencies & scripts
tailwind.config.js                   # Tailwind CSS config
tailwind.config.cjs                  # Alternative config

Configuration Files:
├── API_DOCUMENTATION.md             # API reference
├── BACKEND_API_ENDPOINTS.md         # Backend endpoints doc
├── ADMIN_DASHBOARD_STATUS.md        # Admin dashboard status
├── HOTEL_DASHBOARD_STATUS.md        # Hotel dashboard status
└── README.md                        # Project readme
```

---

## Database Schema

### Core Tables

#### 1. users (Authentication & Hotel Info)
```sql
- id (INT, PRIMARY KEY)
- username (VARCHAR, UNIQUE)
- password_hash (VARCHAR)
- email (VARCHAR)
- hotel_name (VARCHAR)
- phone (VARCHAR)
- address (TEXT)
- role (ENUM: 'admin', 'hotel')
- last_login (DATETIME)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### 2. products (Inventory Catalog)
```sql
- id (INT, PRIMARY KEY)
- name (VARCHAR)
- description (TEXT)
- category (VARCHAR: Vegetables, Fruits, Leafy, etc.)
- price_per_unit (DECIMAL)
- unit_type (VARCHAR: kg, dozen, bunch, etc.)
- current_stock (INT)
- is_available (BOOLEAN)
- image_url (VARCHAR)
- supplier_id (INT, FOREIGN KEY)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### 3. orders (Order Management)
```sql
- id (INT, PRIMARY KEY)
- user_id (INT, FOREIGN KEY -> users)
- order_date (DATETIME)
- delivery_date (DATE)
- delivery_time (TIME)
- delivery_address (TEXT)
- status (ENUM: pending, confirmed, dispatched, delivered, cancelled)
- total_amount (DECIMAL)
- payment_status (ENUM: unpaid, paid, overdue)
- special_instructions (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### 4. order_items (Order Line Items)
```sql
- id (INT, PRIMARY KEY)
- order_id (INT, FOREIGN KEY -> orders)
- product_id (INT, FOREIGN KEY -> products)
- quantity (DECIMAL)
- unit_price (DECIMAL)
- total_price (DECIMAL)
```

#### 5. bills (Invoicing)
```sql
- id (INT, PRIMARY KEY)
- order_id (INT, FOREIGN KEY -> orders)
- bill_date (DATE)
- amount (DECIMAL)
- status (ENUM: pending, paid, overdue, cancelled)
- notes (TEXT)
- created_at (TIMESTAMP)
- paid_at (DATETIME)
```

#### 6. cart (Shopping Cart - Session Based)
```sql
- id (INT, PRIMARY KEY)
- user_id (INT, FOREIGN KEY -> users)
- product_id (INT, FOREIGN KEY -> products)
- quantity (DECIMAL)
- added_at (TIMESTAMP)
```

#### 7. suppliers (Supplier Information)
```sql
- id (INT, PRIMARY KEY)
- name (VARCHAR)
- contact_person (VARCHAR)
- phone (VARCHAR)
- email (VARCHAR)
- address (TEXT)
- created_at (TIMESTAMP)
```

#### 8. support_tickets (Customer Support)
```sql
- id (INT, PRIMARY KEY)
- user_id (INT, FOREIGN KEY -> users)
- subject (VARCHAR)
- message (TEXT)
- category (VARCHAR)
- status (ENUM: open, in_progress, resolved, closed)
- created_at (TIMESTAMP)
- resolved_at (DATETIME)
```

---

## Key Features

### 1. **Authentication & Authorization**
- JWT-based token authentication
- Session management with 8-hour expiry
- Role-based access control (Admin, Hotel User)
- Password hashing with bcrypt
- Session tracking & active user management

### 2. **Hotel Dashboard**
- Order placement with real-time cart
- Order history & tracking
- Bill management & invoice download
- Profile & settings management
- Support ticket system
- Delivery address management

### 3. **Admin Dashboard**
- Complete order management
- Product catalog CRUD
- Inventory & stock tracking
- Supplier management
- Hotel/customer management
- Billing & invoice generation
- User account management
- Session monitoring & control
- Sales analytics & reporting
- Support ticket handling

### 4. **Chatbot System**
- Multi-language support (English, Hindi, Marathi)
- Intent detection for user queries
- Menu-driven navigation
- AI-powered responses (DeepSeek integration)
- Text-to-speech capabilities (MMS-TTS)
- Language auto-detection
- Real-time translation (Google Translator)

### 5. **Product Management**
- Comprehensive vegetable & fruit catalog
- Category-based filtering
- Real-time price updates
- Stock level tracking
- Product images & descriptions
- Availability status management

### 6. **Order Management**
- Shopping cart system
- Bulk order support
- Delivery scheduling
- Order status tracking (pending → delivered)
- Special instructions/notes
- Order history & reporting

### 7. **Billing & Invoicing**
- Automated bill generation
- Multiple payment status tracking
- Invoice downloads
- Payment history
- Outstanding amount tracking

### 8. **Analytics & Reporting**
- Sales trends & graphs
- Revenue analysis
- Order analytics
- Top products
- Customer insights
- Monthly/weekly/daily breakdowns

---

## Technology Stack

### Frontend
- **React.js** - UI framework
- **React Router DOM** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Axios/Fetch API** - HTTP client
- **JavaScript (ES6+)** - Language

### Backend
- **Flask** - Python web framework
- **Flask-CORS** - Cross-origin resource sharing
- **MySQL** - Relational database
- **JWT** - Token-based authentication
- **Bcrypt** - Password hashing
- **Supabase** - Fallback cloud database

### AI/ML & NLP
- **DeepSeek API** - LLM for chatbot
- **Google Translator** - Multi-language translation
- **Langdetect** - Language detection
- **MMS-TTS** (Transformers) - Text-to-speech for Indian languages
  - Hindi: `Anjan9320/fb-mms-tts-hin-ft-male`
  - Marathi: `facebook/mms-tts-mar`
- **ElevenLabs** - English TTS (optional)

### External Services
- **Twilio** - SMS/WhatsApp notifications
- **MySQL Connector** - Database connection
- **OpenAI SDK** - LLM integration

### Development Tools
- **npm** - Package manager
- **Create React App** - React boilerplate
- **Python 3.x** - Backend runtime

---

## How Everything Works

### 1. **User Authentication Flow**

```
1. Hotel User visits login page
2. Submits username & password via POST /api/auth/login
3. Backend verifies credentials against MySQL
4. If valid:
   - Creates JWT token with 8-hour expiry
   - Stores session in active_sessions dict
   - Returns token to frontend
5. Frontend stores token in localStorage
6. All subsequent requests include: Authorization: Bearer <token>
7. Token middleware validates & updates last_activity timestamp
8. On logout: Session marked as blacklisted, token becomes invalid
```

### 2. **Order Placement Flow**

```
Hotel User:
1. Browses products via GET /api/public/vegetables
2. Adds items to cart via POST /api/hotel/cart
3. Reviews cart via GET /api/hotel/cart
4. Updates quantities via PUT /api/hotel/cart/<product_id>
5. Gets total via POST /api/hotel/cart/calculate
6. Places order via POST /api/hotel/orders
   - Sends: delivery_date, delivery_time, items, address
   - Backend creates order + order_items records
   - Returns order_id

Admin:
1. Receives new order notification
2. Views via GET /api/admin/orders
3. Updates status via PUT /api/admin/orders/<id>/status
4. Generates bill via POST /api/admin/bills
5. Marks as dispatched/delivered
```

### 3. **Chatbot Flow**

```
User:
1. Types message in chatbot widget
2. Frontend detects language via detect_language()
3. If Hindi/Marathi: Translates to English for processing
4. Sends to POST /chat endpoint

Backend:
1. Receives message
2. Detects intent (e.g., "QUOTE", "DELIVERY", "CONTACT")
3. Intent maps to predefined responses or menu actions
4. For unknown: Uses DeepSeek AI with context
5. If needed: Translates response back to user's language
6. Sends response + menu options (if any)

Frontend:
1. Displays response
2. Shows menu buttons (if is_terminal=false)
3. For Indian languages: Calls POST /tts for audio
4. Plays audio via Web Audio API
```

### 4. **Inventory Management**

```
Admin:
1. Adds product via POST /api/admin/products
2. Updates price via PUT /api/admin/products/<id>
3. Adjusts stock via PATCH /api/admin/products/<id>/stock
4. Marks unavailable if stock=0

System:
1. Product visibility controlled by is_available flag
2. Cart checks availability before adding
3. Order placement validates stock levels
4. Stock auto-updates when order placed
```

### 5. **Analytics Flow**

```
Admin requests GET /api/admin/analytics/trends

Backend:
1. Queries all orders from past N months
2. Calculates:
   - Order count
   - Total revenue
   - Average order value
   - Top products by sales
   - Customer trends
3. Groups by timeframe (daily/weekly/monthly)
4. Returns structured data for charts
```

### 6. **Multi-Language Support**

```
Chatbot User (Any Language):
1. Types in English/Hindi/Marathi

System:
1. Detects language: detect_language(text)
   - Uses langdetect library
   - Falls back to word/character matching
2. If not English:
   - Translates to English: translate_text_to_english()
   - Processes intent in English
   - Gets response in English
3. Translates back: translate_response_from_english()
4. For TTS: Loads language-specific model (MMS-TTS)
5. Returns in user's original language
```

### 7. **Session Management**

```
Active Sessions Dict:
{
  "token_abc123": {
    "user_id": 5,
    "username": "hotel_name",
    "role": "hotel",
    "created_at": datetime,
    "last_activity": datetime,
    "expires_at": datetime + 8 hours,
    "blacklisted": False
  }
}

Cleanup:
1. Periodic check removes expired sessions
2. On logout: Marks as blacklisted
3. On password change: All user sessions invalidated
4. Last activity: Updated on every request
```

### 8. **Error Handling**

```
HTTP Status Codes:
- 200: Success
- 201: Created
- 400: Bad request (missing fields, invalid data)
- 401: Unauthorized (missing/invalid token)
- 403: Forbidden (insufficient permissions)
- 404: Not found
- 500: Server error

Response Format:
{
  "status": "success|error",
  "message": "descriptive message",
  "data": { ... },
  "error": "error details if failed"
}
```

---

## File Descriptions

### Backend Files

| File | Purpose | Lines | Key Functions |
|------|---------|-------|----------------|
| `api.py` | Core API server | ~2674 | Login, orders, hotel dashboard, billing, cart |
| `chatbot_backend.py` | Chatbot-only server | ~1175 | Chat logic, TTS, language detection |
| `combine_api.py` | Combined server | ~4250 | All features: API + Chatbot + Admin |

### Key Frontend Components

| Component | Purpose | Role |
|-----------|---------|------|
| `admin_dashboard/pages/admindash.js` | Admin home & KPIs | Dashboard overview |
| `admin_dashboard/pages/orders.js` | Order management | View/update all orders |
| `admin_dashboard/pages/products.js` | Product CRUD | Manage catalog |
| `admin_dashboard/pages/suppliers.js` | Supplier management | Vendor info |
| `hotel_dashboard/pages/dashbaord.js` | Hotel home | Overview & stats |
| `hotel_dashboard/pages/orders.js` | My orders | Order history |
| `hotel_dashboard/pages/cart.js` | Shopping cart | Place orders |
| `chatbot/ChatBot.js` | Chatbot widget | AI assistant |

---

## Deployment & Running

### Backend Setup
```bash
# Install Python dependencies
pip install flask flask-cors mysql-connector-python pyjwt bcrypt twilio
pip install supabase openai deep-translator langdetect
pip install transformers torch soundfile

# Run Flask server
python api.py       # Main API only
python chatbot_backend.py  # Chatbot only
python combine_api.py      # Both (recommended)

# Default: http://localhost:5000
```

### Frontend Setup
```bash
# Install dependencies
npm install

# Start development server
npm start           # http://localhost:3000

# Build for production
npm run build       # Creates build/ folder
```

### Database Setup
```bash
# Create MySQL database
CREATE DATABASE BVS;

# Run migrations (create tables)
# See schema in "Database Schema" section above
```

---

## Future Enhancements

1. **Payment Gateway Integration** - Razorpay/PayPal
2. **Real-time Notifications** - WebSocket for live order updates
3. **Mobile App** - React Native version
4. **Delivery Tracking** - GPS integration
5. **Subscription Plans** - Auto-replenishment orders
6. **Advanced Analytics** - ML-based demand forecasting
7. **Multi-warehouse** - Support multiple locations
8. **API Rate Limiting** - Prevent abuse
9. **Data Export** - CSV/PDF reports
10. **Dark Mode** - UI theme toggle

---

**Last Updated:** December 12, 2025  
**Version:** 1.0  
**Status:** Production Ready
