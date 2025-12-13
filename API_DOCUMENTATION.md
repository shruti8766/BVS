# 🌿 BVS API Documentation

**Bhairavnath Vegetable Supplier - Complete API Reference**

**Base URL:** `http://localhost:5000`  
**Version:** 1.0  
**Last Updated:** November 24, 2025

---

## 📑 Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Public & Chatbot Endpoints](#public--chatbot-endpoints)
4. [Authentication Endpoints](#authentication-endpoints)
5. [Hotel User Endpoints](#hotel-user-endpoints)
6. [Admin Endpoints](#admin-endpoints)
7. [Database Schema](#database-schema)
8. [External Integrations](#external-integrations)
9. [Error Codes](#error-codes)

---

## 🎯 Overview

The BVS API provides endpoints for:
- **Public Access**: Product listings, chatbot interaction
- **Hotel Users**: Order management, cart, billing, profile
- **Admin Users**: Full system management, analytics, user management

**Total Endpoints:** 61 active endpoints

### Technology Stack
- **Backend:** Python Flask
- **Database:** MySQL
- **Authentication:** JWT tokens
- **CORS:** Enabled for cross-origin requests

---

## 🔐 Authentication

### JWT Token Structure
```json
{
  "user": {
    "id": 123,
    "username": "hotel_name",
    "role": "hotel" | "admin"
  },
  "exp": 1234567890
}
```

### Authentication Headers
```
Authorization: Bearer <jwt_token>
```

### Token Storage
- **Admin Token:** `adminToken` (localStorage)
- **Hotel Token:** `hotelToken` (localStorage)

### Session Management
- Sessions are validated on each request
- Sessions expire after 24 hours of inactivity
- `last_activity` updated on each authenticated request

---

## 🌐 Public & Chatbot Endpoints

### 1. Health Check
```http
GET /health
```

**Description:** Check API health and service availability

**Response:**
```json
{
  "status": "healthy",
  "services": {
    "supabase": true,
    "deepseek": true,
    "translation": true,
    "tts": true
  },
  "timestamp": "2025-11-24T10:30:00Z"
}
```

---

### 2. Chatbot - CORS Preflight
```http
OPTIONS /chat
```

**Description:** CORS preflight for chatbot endpoint

---

### 3. Chatbot - Message
```http
POST /chat
```

**Description:** Main chatbot endpoint with multilingual support (English, Hindi, Marathi)

**Request Body:**
```json
{
  "message": "What vegetables are available?",
  "current_menu": "main_menu",
  "user_id": "optional_user_id"
}
```

**Response:**
```json
{
  "response": "Here are our available vegetables...",
  "menu_options": [
    {"text": "Vegetable Prices", "action": "vegetable_prices"},
    {"text": "Place Order", "action": "place_order"}
  ],
  "is_terminal": false,
  "current_menu": "price_list",
  "tts_text": "Here are our available vegetables",
  "tts_system": "mms_tts",
  "detected_language": "en",
  "user_id": "generated_or_provided_id",
  "status": "success"
}
```

---

### 4. Text-to-Speech
```http
POST /tts
```

**Description:** Convert text to speech for Indian languages (Hindi/Marathi)

**Request Body:**
```json
{
  "text": "नमस्ते, BVS में आपका स्वागत है",
  "language": "hi"
}
```

**Parameters:**
- `language`: `"hi"` (Hindi) or `"mr"` (Marathi)

**Response:**
```json
{
  "audio": "base64_encoded_audio_data",
  "format": "wav",
  "sample_rate": 16000
}
```

---

### 5. Home/Welcome
```http
GET /
```

**Description:** API welcome endpoint

**Response:**
```json
{
  "message": "Welcome to Bhairavnath Vegetable Supplier API",
  "company": "BVS - Farm se Foodservice, Seedha",
  "features": ["Vegetables", "Fruits", "Bulk Orders"],
  "contact": "9881325644"
}
```

---

### 6. Public Products List
```http
GET /api/public/products
```

**Description:** Get list of available products (public access)

**Query Parameters:**
- `limit`: Number of products to return (default: 20)

**Response:**
```json
{
  "products": [
    {
      "id": 1,
      "name": "Tomato",
      "price_per_unit": 40.00,
      "stock_quantity": 500,
      "unit_type": "kg",
      "is_available": true,
      "category": "vegetables",
      "image_url": "https://..."
    }
  ],
  "count": 20
}
```

---

### 7. Public Vegetables
```http
GET /api/public/vegetables
```

**Description:** Get vegetables grouped by category

**Response:**
```json
{
  "categories": {
    "leafy_vegetables": [
      {
        "id": 1,
        "name": "Spinach",
        "price_per_unit": 30.00,
        "stock_quantity": 200,
        "unit_type": "kg"
      }
    ],
    "root_vegetables": [...],
    "fruits": [...]
  }
}
```

---

### 8. Company History
```http
GET /api/public/history
```

**Description:** Get company information and history

**Response:**
```json
{
  "company": "Bhairavnath Vegetable Supplier",
  "tagline": "Farm se Foodservice, Seedha",
  "founded": "2020",
  "mission": "Providing fresh vegetables to hotels and caterers",
  "services": [
    "Bulk Vegetable Supply",
    "Fruit Supply",
    "Daily Delivery",
    "Custom Orders"
  ],
  "coverage": "Pune and surrounding areas",
  "contact": {
    "phone": "9881325644",
    "email": "info@bvs.com"
  }
}
```

---

## 🔑 Authentication Endpoints

### 9. Login
```http
POST /api/auth/login
```

**Description:** User login (both hotel and admin)

**Request Body:**
```json
{
  "username": "hotel_taj",
  "password": "secure_password"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 5,
    "username": "hotel_taj",
    "role": "hotel",
    "hotel_name": "Taj Hotel",
    "email": "taj@hotel.com",
    "phone": "9876543210",
    "address": "Pune, Maharashtra"
  },
  "session": {
    "expires_in": 86400,
    "created_at": "2025-11-24T10:00:00Z"
  }
}
```

**Possible Errors:**
- 401: Invalid credentials
- 403: Account locked/disabled

---

### 10. Logout
```http
POST /api/auth/logout
```

**Description:** Logout and invalidate session

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Logged out successfully",
  "timestamp": "2025-11-24T10:30:00Z"
}
```

---

### 11. Session Check
```http
GET /api/auth/session/check
```

**Description:** Verify if session is still valid

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "valid": true,
  "user": {
    "id": 5,
    "username": "hotel_taj",
    "role": "hotel"
  },
  "expires_in": 82800,
  "last_activity": "2025-11-24T10:25:00Z"
}
```

---

### 12. Change Password
```http
POST /api/auth/password/change
```

**Description:** Change user password (invalidates all sessions)

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "current_password": "old_password",
  "new_password": "new_secure_password"
}
```

**Response:**
```json
{
  "message": "Password changed successfully. Please login again.",
  "sessions_invalidated": 3
}
```

---

## 🏨 Hotel User Endpoints

### 13. Hotel Dashboard
```http
GET /api/hotel/dashboard
```

**Auth Required:** Yes (Hotel role)

**Description:** Get hotel dashboard overview with statistics

**Response:**
```json
{
  "hotel": {
    "id": 5,
    "hotel_name": "Taj Hotel",
    "email": "taj@hotel.com",
    "phone": "9876543210",
    "hotel_image": "https://..."
  },
  "stats": {
    "total_orders": 45,
    "pending_orders": 3,
    "total_spent": 125000.50,
    "pending_bills": 2
  },
  "recent_orders": [
    {
      "id": 123,
      "order_date": "2025-11-20",
      "delivery_date": "2025-11-21",
      "status": "delivered",
      "total_amount": 5500.00
    }
  ],
  "recent_bills": [
    {
      "id": 89,
      "bill_date": "2025-11-20",
      "amount": 5500.00,
      "paid": false,
      "due_date": "2025-11-30"
    }
  ]
}
```

---

### 14. Get Hotel Orders
```http
GET /api/hotel/orders
```

**Auth Required:** Yes (Hotel role)

**Description:** Get all orders for the logged-in hotel

**Response:**
```json
{
  "orders": [
    {
      "id": 123,
      "order_date": "2025-11-20T08:00:00Z",
      "delivery_date": "2025-11-21",
      "status": "delivered",
      "special_instructions": "Deliver before 8 AM",
      "items": [
        {
          "product_id": 1,
          "product_name": "Tomato",
          "quantity": 50,
          "unit_price": 40.00,
          "subtotal": 2000.00
        }
      ],
      "total_amount": 5500.00
    }
  ],
  "count": 45
}
```

---

### 15. Get Single Order
```http
GET /api/hotel/orders/<order_id>
```

**Auth Required:** Yes (Hotel role)

**Path Parameters:**
- `order_id`: Integer, order ID

**Response:**
```json
{
  "id": 123,
  "order_date": "2025-11-20T08:00:00Z",
  "delivery_date": "2025-11-21",
  "status": "delivered",
  "special_instructions": "Deliver before 8 AM",
  "items": [
    {
      "id": 456,
      "product_id": 1,
      "product_name": "Tomato",
      "quantity": 50,
      "unit_price": 40.00,
      "subtotal": 2000.00
    }
  ],
  "total_amount": 5500.00,
  "bill": {
    "id": 89,
    "amount": 5775.00,
    "paid": false,
    "due_date": "2025-11-30"
  }
}
```

---

### 16. Create Order
```http
POST /api/hotel/orders
```

**Auth Required:** Yes (Hotel role)

**Description:** Place a new order (automatically creates bill and sends WhatsApp notification to admin)

**Request Body:**
```json
{
  "delivery_date": "2025-11-25",
  "items": [
    {
      "product_id": 1,
      "quantity": 50
    },
    {
      "product_id": 3,
      "quantity": 30
    }
  ],
  "special_instructions": "Please deliver fresh vegetables"
}
```

**Response:**
```json
{
  "message": "Order placed successfully",
  "order_id": 124,
  "bill_id": 90,
  "total_amount": 6500.00,
  "delivery_date": "2025-11-25",
  "whatsapp_notification": {
    "sent": true,
    "message_sid": "SMxxxxxxxxxxxx"
  }
}
```

**Notes:**
- Order status is set to "pending"
- Bill is auto-generated with 5% tax
- WhatsApp notification sent to admin (+919881325644)

---

### 17. Get Hotel Bills
```http
GET /api/hotel/bills
```

**Auth Required:** Yes (Hotel role)

**Response:**
```json
{
  "bills": [
    {
      "id": 90,
      "order_id": 124,
      "bill_date": "2025-11-24",
      "amount": 6825.00,
      "tax_amount": 325.00,
      "discount": 0.00,
      "total_amount": 6825.00,
      "paid": false,
      "due_date": "2025-12-04",
      "payment_method": null,
      "order": {
        "delivery_date": "2025-11-25",
        "status": "pending"
      }
    }
  ],
  "summary": {
    "total_bills": 15,
    "paid_bills": 12,
    "unpaid_bills": 3,
    "total_outstanding": 18500.00
  }
}
```

---

### 18. Get Cart
```http
GET /api/hotel/cart
```

**Auth Required:** Yes (Hotel role)

**Response:**
```json
{
  "cart_items": [
    {
      "id": 1,
      "product_id": 1,
      "product_name": "Tomato",
      "quantity": 20,
      "unit_price": 40.00,
      "subtotal": 800.00,
      "unit_type": "kg"
    }
  ],
  "total_items": 1,
  "total_amount": 800.00
}
```

---

### 19. Add to Cart
```http
POST /api/hotel/cart
```

**Auth Required:** Yes (Hotel role)

**Request Body:**
```json
{
  "product_id": 1,
  "quantity": 20
}
```

**Response:**
```json
{
  "message": "Item added to cart",
  "cart_item_id": 1
}
```

---

### 20. Update Cart Item
```http
PUT /api/hotel/cart/<product_id>
```

**Auth Required:** Yes (Hotel role)

**Path Parameters:**
- `product_id`: Integer

**Request Body:**
```json
{
  "quantity": 30
}
```

**Response:**
```json
{
  "message": "Cart updated successfully",
  "new_quantity": 30
}
```

---

### 21. Remove from Cart
```http
DELETE /api/hotel/cart/<product_id>
```

**Auth Required:** Yes (Hotel role)

**Response:**
```json
{
  "message": "Item removed from cart"
}
```

---

### 22. Clear Cart
```http
DELETE /api/hotel/cart/clear
```

**Auth Required:** Yes (Hotel role)

**Response:**
```json
{
  "message": "Cart cleared successfully",
  "items_removed": 5
}
```

---

### 23. Calculate Cart Total
```http
POST /api/hotel/cart/calculate
```

**Auth Required:** Yes (Hotel role)

**Request Body:**
```json
{
  "items": [
    {
      "product_id": 1,
      "quantity": 50
    },
    {
      "product_id": 3,
      "quantity": 30
    }
  ]
}
```

**Response:**
```json
{
  "total_amount": 6500.00,
  "item_count": 2,
  "items": [
    {
      "product_id": 1,
      "product_name": "Tomato",
      "quantity": 50,
      "unit_price": 40.00,
      "subtotal": 2000.00
    }
  ],
  "tax": 325.00,
  "grand_total": 6825.00
}
```

---

### 24. Get Hotel Profile
```http
GET /api/hotel/profile
```

**Auth Required:** Yes (Hotel role)

**Response:**
```json
{
  "id": 5,
  "username": "hotel_taj",
  "hotel_name": "Taj Hotel",
  "email": "taj@hotel.com",
  "phone": "9876543210",
  "address": "Pune, Maharashtra",
  "hotel_image": "https://...",
  "created_at": "2025-01-15T10:00:00Z",
  "role": "hotel"
}
```

---

### 25. Update Hotel Profile
```http
PUT /api/hotel/profile
```

**Auth Required:** Yes (Hotel role)

**Request Body:**
```json
{
  "hotel_name": "The Taj Hotel",
  "email": "contact@tajhotel.com",
  "phone": "9876543210",
  "address": "123 MG Road, Pune"
}
```

**Response:**
```json
{
  "message": "Profile updated successfully",
  "profile": {
    "hotel_name": "The Taj Hotel",
    "email": "contact@tajhotel.com"
  }
}
```

---

### 26. Get Support Tickets
```http
GET /api/hotel/support-tickets
```

**Auth Required:** Yes (Hotel role)

**Response:**
```json
{
  "tickets": [
    {
      "id": 1,
      "subject": "Delivery Issue",
      "category": "delivery",
      "status": "open",
      "priority": "high",
      "created_at": "2025-11-23T10:00:00Z",
      "updated_at": "2025-11-23T10:30:00Z",
      "messages": [
        {
          "id": 1,
          "message": "Order was not delivered on time",
          "is_admin_reply": false,
          "created_at": "2025-11-23T10:00:00Z"
        }
      ]
    }
  ]
}
```

---

### 27. Create Support Ticket
```http
POST /api/hotel/support-tickets
```

**Auth Required:** Yes (Hotel role)

**Request Body:**
```json
{
  "subject": "Delivery Issue",
  "message": "My order was not delivered on time",
  "category": "delivery"
}
```

**Response:**
```json
{
  "message": "Support ticket created successfully",
  "ticket_id": 2,
  "status": "open"
}
```

---

## 👑 Admin Endpoints

### 28. Get All Products
```http
GET /api/products
```

**Auth Required:** Yes (Any authenticated user)

**Response:**
```json
{
  "products": [
    {
      "id": 1,
      "name": "Tomato",
      "price_per_unit": 40.00,
      "stock_quantity": 500,
      "unit_type": "kg",
      "is_available": true,
      "category": "vegetables",
      "description": "Fresh red tomatoes",
      "image_url": "https://..."
    }
  ],
  "count": 25
}
```

---

### 29. Admin Dashboard
```http
GET /api/admin/dashboard
```

**Auth Required:** Yes (Admin role)

**Response:**
```json
{
  "stats": {
    "total_hotels": 15,
    "total_orders": 450,
    "total_revenue": 1250000.50,
    "pending_orders": 8,
    "total_products": 45,
    "low_stock_products": 3
  },
  "recent_orders": [
    {
      "id": 124,
      "hotel_name": "Taj Hotel",
      "order_date": "2025-11-24",
      "delivery_date": "2025-11-25",
      "status": "pending",
      "total_amount": 6500.00
    }
  ],
  "recent_hotels": [
    {
      "id": 5,
      "hotel_name": "Taj Hotel",
      "created_at": "2025-11-15"
    }
  ],
  "low_stock_alerts": [
    {
      "id": 12,
      "name": "Onion",
      "stock_quantity": 10,
      "min_stock": 50
    }
  ]
}
```

---

### 30. Get All Orders (Admin)
```http
GET /api/admin/orders
```

**Auth Required:** Yes (Admin role)

**Query Parameters:**
- `user_id`: Filter by specific hotel user (optional)

**Response:**
```json
{
  "orders": [
    {
      "id": 124,
      "user_id": 5,
      "hotel_name": "Taj Hotel",
      "order_date": "2025-11-24T08:00:00Z",
      "delivery_date": "2025-11-25",
      "status": "pending",
      "special_instructions": "Deliver fresh",
      "items": [
        {
          "product_name": "Tomato",
          "quantity": 50,
          "unit_price": 40.00,
          "subtotal": 2000.00
        }
      ],
      "total_amount": 6500.00
    }
  ],
  "count": 450,
  "summary": {
    "pending": 8,
    "confirmed": 12,
    "delivered": 425,
    "cancelled": 5
  }
}
```

---

### 31. Create Order (Admin)
```http
POST /api/admin/orders
```

**Auth Required:** Yes (Admin role)

**Description:** Admin creates order on behalf of a hotel (auto-delivered status)

**Request Body:**
```json
{
  "user_id": 5,
  "delivery_date": "2025-11-25",
  "items": [
    {
      "product_id": 1,
      "quantity": 50
    }
  ],
  "special_instructions": "Direct billing"
}
```

**Response:**
```json
{
  "message": "Order created successfully",
  "order_id": 125,
  "bill_id": 91,
  "status": "delivered",
  "total_amount": 6825.00
}
```

**Notes:**
- Order status is automatically set to "delivered"
- Bill is auto-generated

---

### 32. Get Pending Orders
```http
GET /api/admin/orders/pending
```

**Auth Required:** Yes (Admin role)

**Response:**
```json
{
  "orders": [
    {
      "id": 124,
      "hotel_name": "Taj Hotel",
      "order_date": "2025-11-24",
      "delivery_date": "2025-11-25",
      "items_count": 3,
      "total_amount": 6500.00
    }
  ],
  "count": 8
}
```

---

### 33. Update Order Status
```http
PUT /api/admin/orders/<order_id>/status
```

**Auth Required:** Yes (Admin role)

**Path Parameters:**
- `order_id`: Integer

**Request Body:**
```json
{
  "status": "confirmed"
}
```

**Valid Status Values:**
- `pending`
- `confirmed`
- `preparing`
- `dispatched`
- `delivered`
- `cancelled`

**Response:**
```json
{
  "message": "Order status updated successfully",
  "order_id": 124,
  "new_status": "confirmed"
}
```

---

### 34. Get All Bills (Admin)
```http
GET /api/admin/bills
```

**Auth Required:** Yes (Admin role)

**Query Parameters:**
- `user_id`: Filter by specific hotel (optional)

**Response:**
```json
{
  "bills": [
    {
      "id": 91,
      "order_id": 125,
      "hotel_name": "Taj Hotel",
      "bill_date": "2025-11-24",
      "amount": 6500.00,
      "tax_amount": 325.00,
      "total_amount": 6825.00,
      "paid": false,
      "due_date": "2025-12-04",
      "payment_method": null
    }
  ],
  "summary": {
    "total_bills": 450,
    "total_amount": 1250000.00,
    "paid_amount": 1100000.00,
    "unpaid_amount": 150000.00
  }
}
```

---

### 35. Create Bill (Admin)
```http
POST /api/admin/bills
```

**Auth Required:** Yes (Admin role)

**Request Body:**
```json
{
  "order_id": 125,
  "amount": 6500.00,
  "tax_rate": 5,
  "discount": 100.00,
  "due_date": "2025-12-04",
  "bill_date": "2025-11-24",
  "paid": false,
  "payment_method": null,
  "comments": "Bulk order discount applied"
}
```

**Response:**
```json
{
  "message": "Bill created successfully",
  "bill_id": 92,
  "total_amount": 6725.00
}
```

---

### 36. Update Bill
```http
PUT /api/admin/bills/<bill_id>
```

**Auth Required:** Yes (Admin role)

**Request Body:**
```json
{
  "paid": true,
  "payment_method": "UPI",
  "paid_date": "2025-11-24",
  "comments": "Paid via Google Pay"
}
```

**Response:**
```json
{
  "message": "Bill updated successfully",
  "bill_id": 92
}
```

---

### 37. Get All Hotel Users
```http
GET /api/admin/users
```

**Auth Required:** Yes (Admin role)

**Response:**
```json
{
  "users": [
    {
      "id": 5,
      "username": "hotel_taj",
      "hotel_name": "Taj Hotel",
      "email": "taj@hotel.com",
      "phone": "9876543210",
      "address": "Pune",
      "hotel_image": "https://...",
      "created_at": "2025-01-15T10:00:00Z",
      "role": "hotel"
    }
  ],
  "count": 15
}
```

---

### 38. Get Single User
```http
GET /api/admin/users/<user_id>
```

**Auth Required:** Yes (Admin role)

**Response:**
```json
{
  "id": 5,
  "username": "hotel_taj",
  "hotel_name": "Taj Hotel",
  "email": "taj@hotel.com",
  "phone": "9876543210",
  "address": "Pune",
  "hotel_image": "https://...",
  "created_at": "2025-01-15T10:00:00Z",
  "stats": {
    "total_orders": 45,
    "total_spent": 125000.50,
    "pending_bills": 2
  }
}
```

---

### 39. Create Hotel User
```http
POST /api/admin/users
```

**Auth Required:** Yes (Admin role)

**Request Body:**
```json
{
  "username": "hotel_oberoi",
  "password": "secure_password",
  "hotel_name": "Oberoi Hotel",
  "email": "contact@oberoi.com",
  "phone": "9123456789",
  "address": "Mumbai",
  "hotel_image": "https://..."
}
```

**Response:**
```json
{
  "message": "User created successfully",
  "user_id": 16,
  "username": "hotel_oberoi"
}
```

---

### 40. Update Hotel User
```http
PUT /api/admin/users/<user_id>
```

**Auth Required:** Yes (Admin role)

**Request Body:**
```json
{
  "hotel_name": "The Oberoi",
  "email": "info@oberoi.com",
  "phone": "9123456789",
  "address": "Nariman Point, Mumbai",
  "hotel_image": "https://..."
}
```

**Response:**
```json
{
  "message": "User updated successfully",
  "user_id": 16
}
```

---

### 41. Delete Hotel User
```http
DELETE /api/admin/users/<user_id>
```

**Auth Required:** Yes (Admin role)

**Response:**
```json
{
  "message": "User deleted successfully",
  "user_id": 16,
  "cascade_deleted": {
    "orders": 45,
    "bills": 45,
    "cart_items": 3
  }
}
```

**Note:** Cascading delete removes all associated data

---

### 42. Create Product
```http
POST /api/admin/products
```

**Auth Required:** Yes (Admin role)

**Request Body:**
```json
{
  "name": "Carrot",
  "price_per_unit": 35.00,
  "stock_quantity": 300,
  "unit_type": "kg",
  "category": "root_vegetables",
  "description": "Fresh orange carrots",
  "image_url": "https://...",
  "is_available": true
}
```

**Response:**
```json
{
  "message": "Product created successfully",
  "product_id": 46
}
```

---

### 43. Update Product
```http
PUT /api/admin/products/<product_id>
```

**Auth Required:** Yes (Admin role)

**Request Body:**
```json
{
  "name": "Carrot (Premium)",
  "price_per_unit": 40.00,
  "stock_quantity": 350,
  "is_available": true,
  "description": "Premium quality carrots"
}
```

**Response:**
```json
{
  "message": "Product updated successfully",
  "product_id": 46
}
```

---

### 44. Delete Product
```http
DELETE /api/admin/products/<product_id>
```

**Auth Required:** Yes (Admin role)

**Response:**
```json
{
  "message": "Product deleted successfully",
  "product_id": 46
}
```

---

### 45. Update Product Stock
```http
PATCH /api/admin/products/<product_id>/stock
```

**Auth Required:** Yes (Admin role)

**Request Body:**
```json
{
  "stock_quantity": 500
}
```

**Response:**
```json
{
  "message": "Stock updated successfully",
  "product_id": 1,
  "new_stock": 500
}
```

---

### 46. Get Active Sessions
```http
GET /api/admin/sessions
```

**Auth Required:** Yes (Admin role)

**Response:**
```json
{
  "sessions": [
    {
      "user_id": 5,
      "username": "hotel_taj",
      "role": "hotel",
      "login_time": "2025-11-24T08:00:00Z",
      "last_activity": "2025-11-24T10:30:00Z",
      "ip_address": "192.168.1.100"
    }
  ],
  "active_count": 8
}
```

---

### 47. Revoke User Session
```http
DELETE /api/admin/sessions/<user_id>
```

**Auth Required:** Yes (Admin role)

**Description:** Force logout specific user

**Response:**
```json
{
  "message": "Sessions revoked successfully",
  "user_id": 5,
  "sessions_deleted": 2
}
```

---

### 48. Get All Suppliers
```http
GET /api/admin/suppliers
```

**Auth Required:** Yes (Admin role)

**Response:**
```json
{
  "suppliers": [
    {
      "id": 1,
      "name": "Farm Fresh Supplies",
      "email": "contact@farmfresh.com",
      "phone": "9998887770",
      "address": "Rural Pune",
      "created_at": "2025-01-01T00:00:00Z"
    }
  ],
  "count": 5
}
```

---

### 49. Get Single Supplier
```http
GET /api/admin/suppliers/<supplier_id>
```

**Auth Required:** Yes (Admin role)

**Response:**
```json
{
  "id": 1,
  "name": "Farm Fresh Supplies",
  "email": "contact@farmfresh.com",
  "phone": "9998887770",
  "address": "Rural Pune",
  "created_at": "2025-01-01T00:00:00Z"
}
```

---

### 50. Update Supplier
```http
PUT /api/admin/suppliers/<supplier_id>
```

**Auth Required:** Yes (Admin role)

**Request Body:**
```json
{
  "name": "Farm Fresh Supplies Ltd",
  "email": "info@farmfresh.com",
  "phone": "9998887771",
  "address": "Pune, Maharashtra"
}
```

**Response:**
```json
{
  "message": "Supplier updated successfully",
  "supplier_id": 1
}
```

---

### 51. Delete Supplier
```http
DELETE /api/admin/suppliers/<supplier_id>
```

**Auth Required:** Yes (Admin role)

**Response:**
```json
{
  "message": "Supplier deleted successfully",
  "supplier_id": 1
}
```

---

### 52. Get Revenue Trends
```http
GET /api/admin/analytics/trends
```

**Auth Required:** Yes (Admin role)

**Description:** Get daily revenue for last 30 days

**Response:**
```json
{
  "trends": [
    {
      "date": "2025-11-24",
      "revenue": 25000.00,
      "orders": 12
    },
    {
      "date": "2025-11-23",
      "revenue": 18500.00,
      "orders": 8
    }
  ],
  "period": "30_days",
  "total_revenue": 750000.00,
  "total_orders": 300
}
```

---

### 53. Get Admin Profile
```http
GET /api/admin/profile
```

**Auth Required:** Yes (Admin role)

**Response:**
```json
{
  "id": 1,
  "username": "admin",
  "email": "admin@bvs.com",
  "phone": "9881325644",
  "hotel_name": "BVS Admin",
  "role": "admin"
}
```

---

### 54. Update Admin Profile
```http
PUT /api/admin/profile
```

**Auth Required:** Yes (Admin role)

**Request Body:**
```json
{
  "email": "contact@bvs.com",
  "phone": "9881325644",
  "hotel_name": "BVS Administration"
}
```

**Response:**
```json
{
  "message": "Profile updated successfully"
}
```

---

### 55. Get System Settings
```http
GET /api/admin/settings
```

**Auth Required:** Yes (Admin role)

**Response:**
```json
{
  "company_name": "Bhairavnath Vegetable Supplier",
  "tax_rate": 5.0,
  "currency": "INR",
  "min_order_amount": 1000.00,
  "delivery_charges": 100.00,
  "free_delivery_above": 5000.00,
  "business_hours": "6:00 AM - 8:00 PM",
  "contact_phone": "9881325644",
  "contact_email": "info@bvs.com"
}
```

---

### 56. Update System Settings
```http
PUT /api/admin/settings
```

**Auth Required:** Yes (Admin role)

**Request Body:**
```json
{
  "tax_rate": 5.5,
  "min_order_amount": 1500.00,
  "delivery_charges": 150.00
}
```

**Response:**
```json
{
  "message": "Settings updated successfully"
}
```

---

### 57. Get All Support Tickets
```http
GET /api/admin/support/tickets
```

**Auth Required:** Yes (Admin role)

**Response:**
```json
{
  "tickets": [
    {
      "id": 1,
      "user_id": 5,
      "hotel_name": "Taj Hotel",
      "subject": "Delivery Issue",
      "category": "delivery",
      "status": "open",
      "priority": "high",
      "created_at": "2025-11-23T10:00:00Z",
      "message_count": 3
    }
  ],
  "count": 15,
  "summary": {
    "open": 8,
    "in_progress": 4,
    "closed": 3
  }
}
```

---

### 58. Get Single Ticket
```http
GET /api/admin/support/tickets/<ticket_id>
```

**Auth Required:** Yes (Admin role)

**Response:**
```json
{
  "id": 1,
  "user_id": 5,
  "hotel_name": "Taj Hotel",
  "subject": "Delivery Issue",
  "category": "delivery",
  "status": "open",
  "priority": "high",
  "created_at": "2025-11-23T10:00:00Z",
  "messages": [
    {
      "id": 1,
      "message": "Order was not delivered on time",
      "is_admin_reply": false,
      "created_at": "2025-11-23T10:00:00Z"
    },
    {
      "id": 2,
      "message": "We apologize. Will check immediately.",
      "is_admin_reply": true,
      "created_at": "2025-11-23T10:15:00Z"
    }
  ]
}
```

---

### 59. Create Support Ticket (Admin)
```http
POST /api/admin/support/tickets
```

**Auth Required:** Yes (Admin role)

**Request Body:**
```json
{
  "subject": "System Maintenance",
  "message": "Scheduled maintenance on Nov 25"
}
```

**Response:**
```json
{
  "message": "Ticket created successfully",
  "ticket_id": 16
}
```

---

### 60. Reply to Ticket
```http
POST /api/admin/support/tickets/<ticket_id>/reply
```

**Auth Required:** Yes (Admin role)

**Request Body:**
```json
{
  "message": "Your issue has been resolved. Please check."
}
```

**Response:**
```json
{
  "message": "Reply added successfully",
  "reply_id": 3
}
```

---

### 61. Close Support Ticket
```http
PATCH /api/admin/support/tickets/<ticket_id>/close
```

**Auth Required:** Yes (Admin role)

**Response:**
```json
{
  "message": "Ticket closed successfully",
  "ticket_id": 1,
  "status": "closed"
}
```

---

## 🗄️ Database Schema

### Tables

#### `users`
```sql
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('hotel', 'admin') NOT NULL,
    hotel_name VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(20),
    address TEXT,
    hotel_image TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);
```

#### `products`
```sql
CREATE TABLE products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    price_per_unit DECIMAL(10, 2) NOT NULL,
    stock_quantity INT DEFAULT 0,
    unit_type VARCHAR(20) DEFAULT 'kg',
    category VARCHAR(50),
    description TEXT,
    image_url TEXT,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### `orders`
```sql
CREATE TABLE orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delivery_date DATE NOT NULL,
    status ENUM('pending', 'confirmed', 'preparing', 'dispatched', 'delivered', 'cancelled') DEFAULT 'pending',
    special_instructions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### `order_items`
```sql
CREATE TABLE order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);
```

#### `bills`
```sql
CREATE TABLE bills (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    bill_date DATE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    tax_rate DECIMAL(5, 2) DEFAULT 5.0,
    tax_amount DECIMAL(10, 2),
    discount DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL,
    paid BOOLEAN DEFAULT FALSE,
    payment_method VARCHAR(50),
    paid_date DATE,
    due_date DATE,
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);
```

#### `carts`
```sql
CREATE TABLE carts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
```

#### `sessions`
```sql
CREATE TABLE sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    token VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### `suppliers`
```sql
CREATE TABLE suppliers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `support_tickets`
```sql
CREATE TABLE support_tickets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    subject VARCHAR(200) NOT NULL,
    category VARCHAR(50),
    status ENUM('open', 'in_progress', 'closed') DEFAULT 'open',
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### `supportreplies`
```sql
CREATE TABLE supportreplies (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ticket_id INT NOT NULL,
    message TEXT NOT NULL,
    is_admin_reply BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE
);
```

---

## 🔗 External Integrations

### 1. **Twilio WhatsApp**
- **Purpose:** Send order notifications to admin
- **Trigger:** When hotel places new order
- **Number:** +919881325644
- **Configuration:**
  ```python
  TWILIO_ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID')
  TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN')
  TWILIO_WHATSAPP_NUMBER = 'whatsapp:+14155238886'
  ```

### 2. **Supabase**
- **Purpose:** Alternative product data source
- **Usage:** Fallback for product listings
- **Configuration:**
  ```python
  SUPABASE_URL = os.getenv('SUPABASE_URL')
  SUPABASE_KEY = os.getenv('SUPABASE_KEY')
  ```

### 3. **DeepSeek AI (OpenAI Compatible)**
- **Purpose:** LLM for chatbot responses
- **Endpoint:** `https://api.deepseek.com`
- **Model:** `deepseek-chat`
- **Configuration:**
  ```python
  DEEPSEEK_API_KEY = os.getenv('DEEPSEEK_API_KEY')
  ```

### 4. **Google Translator (deep-translator)**
- **Purpose:** Translate between English, Hindi, Marathi
- **Library:** `deep-translator`
- **Languages:** `en`, `hi`, `mr`

### 5. **MMS-TTS (Meta)**
- **Purpose:** Text-to-speech for Indian languages
- **Model:** `facebook/mms-tts-hin` (Hindi), `facebook/mms-tts-mar` (Marathi)
- **Library:** Hugging Face Transformers

---

## ⚠️ Error Codes

### HTTP Status Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 200 | OK | Successful request |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Missing required fields, invalid data |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Insufficient permissions, wrong role |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate entry (username, etc.) |
| 500 | Internal Server Error | Database error, server issue |

### Common Error Response Format
```json
{
  "error": "Error description",
  "message": "Detailed error message",
  "code": "ERROR_CODE",
  "timestamp": "2025-11-24T10:30:00Z"
}
```

### Authentication Errors
```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

```json
{
  "error": "Forbidden",
  "message": "Admin access required"
}
```

### Validation Errors
```json
{
  "error": "Validation failed",
  "fields": {
    "username": "Username is required",
    "password": "Password must be at least 8 characters"
  }
}
```

---

## 📝 Notes

### Rate Limiting
- Currently no rate limiting implemented
- Consider implementing for production

### CORS
- CORS is enabled for all origins (`CORS(app)`)
- Configure specific origins for production

### Security Recommendations
1. Use HTTPS in production
2. Implement rate limiting
3. Add request validation middleware
4. Enable SQL injection protection
5. Implement CSRF protection for state-changing operations
6. Use environment variables for all secrets
7. Implement proper password policies

### WhatsApp Notifications
- Sent only when hotel creates order
- Admin number: +919881325644
- Message format includes hotel name, order ID, delivery date, total amount

### Session Management
- Sessions expire after 24 hours inactivity
- Password change invalidates all sessions
- Admin can force logout any user

---

## 🚀 Getting Started

### Environment Variables Required
```bash
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=bvs_database

# JWT
JWT_SECRET=your_jwt_secret_key

# Twilio
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token

# DeepSeek AI
DEEPSEEK_API_KEY=your_deepseek_key

# Supabase (Optional)
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

### Starting the Server
```bash
python combine_api.py
```

Server runs on: `http://localhost:5000`

---

## 📧 Contact & Support

**Company:** Bhairavnath Vegetable Supplier (BVS)  
**Phone:** +91 9881325644  
**Email:** info@bvs.com  
**Tagline:** Farm se Foodservice, Seedha.

---

**Documentation Version:** 1.0  
**Last Updated:** November 24, 2025  
**Maintained By:** BVS Development Team
