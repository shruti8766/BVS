from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from datetime import datetime, timedelta
import bcrypt
import jwt
import os
from functools import wraps
import json
import random
from twilio.rest import Client

app = Flask(__name__)
CORS(app)

# ======================
# CONFIGURATION
# ======================
app.config['SECRET_KEY'] = 'your-secret-key-here-change-in-production'
app.config['SESSION_TIMEOUT'] = 8 * 60 * 60  # 8 hours


# Database configuration
db_config = {
    "host": "localhost",
    "user": "root",
    "passwd": "123456",
    "database": "BVS"
}

# In-memory session store (use Redis in production)
active_sessions = {}


# ======================
# HELPER FUNCTIONS
# ======================
def get_db_connection():
    return mysql.connector.connect(**db_config)


def create_session(token, user_data):
    """Create a new session for the user"""
    expires_at = datetime.utcnow() + timedelta(hours=8)
    active_sessions[token] = {
        'user_id': user_data['id'],
        'username': user_data['username'],
        'role': user_data['role'],
        'created_at': datetime.utcnow(),
        'last_activity': datetime.utcnow(),
        'expires_at': expires_at,
        'blacklisted': False
    }
    return active_sessions[token]


def invalidate_session(token):
    """Invalidate a session (logout)"""
    if token in active_sessions:
        active_sessions[token]['blacklisted'] = True


def cleanup_expired_sessions():
    """Clean up expired sessions"""
    current_time = datetime.utcnow()
    expired_tokens = [
        token for token, session in active_sessions.items()
        if current_time > session['expires_at']
    ]
    for token in expired_tokens:
        del active_sessions[token]


# ======================
# AUTHENTICATION MIDDLEWARE
# ======================
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')

        if not token:
            return jsonify({'error': 'Token is missing'}), 401

        try:
            if token.startswith('Bearer '):
                token = token[7:]

            # Check if token is blacklisted (logged out)
            if token in active_sessions and active_sessions[token].get('blacklisted'):
                return jsonify({'error': 'Session expired. Please login again.'}), 401

            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = data['user']

            # Check session expiry
            if token in active_sessions:
                session_data = active_sessions[token]
                if datetime.utcnow() > session_data['expires_at']:
                    del active_sessions[token]
                    return jsonify({'error': 'Session expired. Please login again.'}), 401

                # Update last activity
                active_sessions[token]['last_activity'] = datetime.utcnow()

        except jwt.ExpiredSignatureError:
            if token in active_sessions:
                del active_sessions[token]
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401

        return f(current_user, *args, **kwargs)

    return decorated


def admin_required(f):
    @wraps(f)
    def decorated(current_user, *args, **kwargs):
        if current_user['role'] != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        return f(current_user, *args, **kwargs)

    return decorated


# ======================
# PUBLIC ROUTES
# ======================
@app.route('/')
def home():
    return jsonify({
        'message': 'Welcome to BVS Vegetable Suppliers',
        'info': 'Premium vegetable suppliers for hotels, events, and caterings',
        'features': [
            'Fresh vegetables directly from market',
            'Bulk supply for businesses',
            'Reliable daily delivery',
            'Quality guaranteed'
        ],
        'contact_required': True,
        'contact_message': 'For business accounts, please call: +91-XXXXXXXXXX'
    })


@app.route('/api/public/vegetables', methods=['GET'])
def get_public_vegetables():
    """Public endpoint for anyone to view available vegetables"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT id, name, description, price_per_unit, image_url, 
                   category, unit_type, is_available 
            FROM products 
            WHERE is_available = 1
            ORDER BY category, name
        """)
        products = cursor.fetchall()

        # Group by category for better frontend display
        categorized = {}
        for product in products:
            category = product['category'] or 'Other'
            if category not in categorized:
                categorized[category] = []
            categorized[category].append(product)

        return jsonify({
            'products': products,
            'categorized': categorized,
            'total_products': len(products)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@app.route('/api/public/history', methods=['GET'])
def get_company_history():
    """Company history and information"""
    return jsonify({
        'company_name': 'BVS Vegetable Suppliers',
        'established': '2010',
        'history': """
        For over a decade, BVS Vegetable Suppliers has been the trusted partner 
        for hotels, events, and catering businesses across the region. 
        We source the freshest vegetables directly from local markets and 
        ensure timely delivery to your doorstep. Our commitment to quality 
        and reliability has made us the preferred choice for businesses 
        that value excellence.
        """,
        'mission': 'To provide fresh, quality vegetables with reliable service to our business partners.',
        'vision': 'To be the leading vegetable supplier for hospitality industry in the region.',
        'services': [
            'Daily vegetable supply for hotels',
            'Bulk orders for events and weddings',
            'Regular supply for catering services',
            'Customized vegetable packages',
            'Emergency supply services'
        ],
        'contact_required': True,
        'contact_message': 'For account registration and inquiries, please call us at: +91-XXXXXXXXXX'
    })


# ======================
# AUTHENTICATION ROUTES
# ======================
@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
        user = cursor.fetchone()

        if user and user['password_hash'] == password:
            # Update last login
            cursor.execute("UPDATE users SET last_login = %s WHERE id = %s",
                           (datetime.now(), user['id']))
            conn.commit()

            user_data = {
                'id': user['id'],
                'username': user['username'],
                'role': user['role'],
                'hotel_name': user['hotel_name'],
                'email': user['email'],
                'phone': user['phone'],
                'address': user['address']
            }

            # Create token
            payload = {
                'user': user_data,
                'exp': datetime.utcnow() + timedelta(hours=8)
            }

            token = jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')
            if hasattr(token, 'decode'):
                token = token.decode('utf-8')

            # Create session
            session_data = create_session(token, user_data)

            return jsonify({
                'token': token,
                'user': user_data,
                'session': {
                    'created_at': session_data['created_at'].isoformat(),
                    'expires_at': session_data['expires_at'].isoformat()
                },
                'message': f'Welcome back, {user["hotel_name"]}!'
            })
        else:
            return jsonify({'error': 'Invalid credentials'}), 401

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@app.route('/api/auth/logout', methods=['POST'])
@token_required
def logout(current_user):
    """Logout user and invalidate session"""
    token = request.headers.get('Authorization')
    if token and token.startswith('Bearer '):
        token = token[7:]
        invalidate_session(token)

    return jsonify({
        'message': 'Successfully logged out',
        'timestamp': datetime.utcnow().isoformat()
    })


@app.route('/api/auth/session/check', methods=['GET'])
@token_required
def check_session(current_user):
    """Check if session is still valid"""
    token = request.headers.get('Authorization')
    if token and token.startswith('Bearer '):
        token = token[7:]

        if token in active_sessions:
            session_data = active_sessions[token]
            return jsonify({
                'valid': True,
                'user': current_user,
                'session': {
                    'created_at': session_data['created_at'].isoformat(),
                    'last_activity': session_data['last_activity'].isoformat(),
                    'expires_at': session_data['expires_at'].isoformat(),
                    'time_remaining': (session_data['expires_at'] - datetime.utcnow()).total_seconds()
                }
            })

    return jsonify({'valid': False, 'error': 'Session not found'}), 401


@app.route('/api/auth/password/change', methods=['POST'])
@token_required
def change_password(current_user):
    """Allow users to change their password"""
    data = request.get_json()
    current_password = data.get('current_password')
    new_password = data.get('new_password')

    if not current_password or not new_password:
        return jsonify({'error': 'Both current and new password are required'}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # Verify current password
        cursor.execute("SELECT password_hash FROM users WHERE id = %s", (current_user['id'],))
        user = cursor.fetchone()

        if user and user['password_hash'] == current_password:
            # Update to new password
            cursor.execute("UPDATE users SET password_hash = %s WHERE id = %s",
                           (new_password, current_user['id']))
            conn.commit()

            # Logout all sessions for this user
            tokens_to_remove = []
            for token, session in active_sessions.items():
                if session['user_id'] == current_user['id']:
                    tokens_to_remove.append(token)

            for token in tokens_to_remove:
                del active_sessions[token]

            return jsonify({'message': 'Password changed successfully. Please login again.'})
        else:
            return jsonify({'error': 'Current password is incorrect'}), 400

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


# ======================
# HOTEL USER ROUTES
# ======================
@app.route('/api/hotel/dashboard', methods=['GET'])
@token_required
def get_hotel_dashboard(current_user):
    """Hotel user dashboard with overview"""
    if current_user['role'] != 'hotel':
        return jsonify({'error': 'Access denied'}), 403

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        user_id = current_user['id']

        # Recent orders (last 5)
        cursor.execute("""
            SELECT id, order_date, delivery_date, total_amount, status 
            FROM orders 
            WHERE user_id = %s 
            ORDER BY order_date DESC 
            LIMIT 5
        """, (user_id,))
        recent_orders = cursor.fetchall()

        # Order statistics
        cursor.execute("""
            SELECT 
                COUNT(*) as total_orders,
                SUM(total_amount) as total_spent,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
                COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_orders
            FROM orders 
            WHERE user_id = %s
        """, (user_id,))
        stats = cursor.fetchone()

        # Recent bills
        cursor.execute("""
            SELECT b.*, o.order_date 
            FROM bills b 
            JOIN orders o ON b.order_id = o.id 
            WHERE o.user_id = %s 
            ORDER BY b.bill_date DESC 
            LIMIT 5
        """, (user_id,))
        recent_bills = cursor.fetchall()

        # This month total
        cursor.execute("""
            SELECT SUM(total_amount) as this_month_total 
            FROM orders 
            WHERE user_id = %s AND MONTH(order_date) = MONTH(CURRENT_DATE()) 
            AND YEAR(order_date) = YEAR(CURRENT_DATE())
        """, (user_id,))
        this_month = cursor.fetchone()

        return jsonify({
            'hotel_info': {
                'name': current_user['hotel_name'],
                'email': current_user['email'],
                'phone': current_user['phone'],
                'address': current_user['address']
            },
            'stats': {
                'total_orders': stats['total_orders'] or 0,
                'total_spent': float(stats['total_spent'] or 0),
                'pending_orders': stats['pending_orders'] or 0,
                'delivered_orders': stats['delivered_orders'] or 0,
                'this_month_total': float(this_month['this_month_total'] or 0)
            },
            'recent_orders': recent_orders,
            'recent_bills': recent_bills
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@app.route('/api/hotel/orders', methods=['GET'])
@token_required
def get_hotel_orders(current_user):
    """Get all orders for the logged-in hotel"""
    if current_user['role'] != 'hotel':
        return jsonify({'error': 'Access denied'}), 403

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT o.*, u.hotel_name 
            FROM orders o 
            JOIN users u ON o.user_id = u.id 
            WHERE o.user_id = %s 
            ORDER BY o.order_date DESC
        """, (current_user['id'],))

        orders = cursor.fetchall()

        # Get items for each order
        for order in orders:
            cursor.execute("""
                SELECT oi.*, p.name as product_name, p.unit_type 
                FROM order_items oi 
                JOIN products p ON oi.product_id = p.id 
                WHERE oi.order_id = %s
            """, (order['id'],))
            order['items'] = cursor.fetchall()

        return jsonify(orders)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@app.route('/api/hotel/orders/<int:order_id>', methods=['GET'])
@token_required
def get_hotel_order_details(current_user, order_id):
    """Get specific order details for hotel"""
    if current_user['role'] != 'hotel':
        return jsonify({'error': 'Access denied'}), 403

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT o.*, u.hotel_name, u.email, u.phone, u.address 
            FROM orders o 
            JOIN users u ON o.user_id = u.id 
            WHERE o.id = %s AND o.user_id = %s
        """, (order_id, current_user['id']))

        order = cursor.fetchone()

        if not order:
            return jsonify({'error': 'Order not found'}), 404

        # Get order items
        cursor.execute("""
            SELECT oi.*, p.name as product_name, p.unit_type 
            FROM order_items oi 
            JOIN products p ON oi.product_id = p.id 
            WHERE oi.order_id = %s
        """, (order_id,))

        items = cursor.fetchall()
        order['items'] = items

        return jsonify(order)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@app.route('/api/hotel/bills', methods=['GET'])
@token_required
def get_hotel_bills(current_user):
    """Get all bills for the logged-in hotel"""
    if current_user['role'] != 'hotel':
        return jsonify({'error': 'Access denied'}), 403

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT b.*, o.order_date, u.hotel_name 
            FROM bills b 
            JOIN orders o ON b.order_id = o.id 
            JOIN users u ON o.user_id = u.id 
            WHERE o.user_id = %s 
            ORDER BY b.bill_date DESC
        """, (current_user['id'],))

        bills = cursor.fetchall()
        return jsonify(bills)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


# ======================
# CART & ORDER MANAGEMENT
# ======================
@app.route('/api/hotel/cart', methods=['GET'])
@token_required
def get_hotel_cart(current_user):
    """Get user's cart items"""
    if current_user['role'] != 'hotel':
        return jsonify({'error': 'Access denied'}), 403

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT product_id, quantity 
            FROM carts 
            WHERE user_id = %s
        """, (current_user['id'],))
        cart_items = cursor.fetchall()

        return jsonify({'items': cart_items})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@app.route('/api/hotel/cart', methods=['POST'])
@token_required
def add_to_cart(current_user):
    """Add or update item in cart"""
    if current_user['role'] != 'hotel':
        return jsonify({'error': 'Access denied'}), 403

    data = request.get_json()
    product_id = data.get('product_id')
    quantity = data.get('quantity', 1)

    if not product_id or quantity < 1:
        return jsonify({'error': 'Invalid product_id or quantity'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Check if exists
        cursor.execute("""
            SELECT id, quantity FROM carts WHERE user_id = %s AND product_id = %s
        """, (current_user['id'], product_id))
        existing = cursor.fetchone()

        if existing:
            new_quantity = existing[1] + quantity
            cursor.execute("""
                UPDATE carts SET quantity = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s
            """, (new_quantity, existing[0]))
        else:
            cursor.execute("""
                INSERT INTO carts (user_id, product_id, quantity) VALUES (%s, %s, %s)
            """, (current_user['id'], product_id, quantity))

        conn.commit()
        return jsonify({'message': 'Added to cart'}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@app.route('/api/hotel/cart/<int:product_id>', methods=['PUT'])
@token_required
def update_cart_item(current_user, product_id):
    """Update quantity of cart item"""
    if current_user['role'] != 'hotel':
        return jsonify({'error': 'Access denied'}), 403

    data = request.get_json()
    quantity = data.get('quantity')

    if quantity is None or quantity < 0:
        return jsonify({'error': 'Invalid quantity'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            UPDATE carts SET quantity = %s, updated_at = CURRENT_TIMESTAMP 
            WHERE user_id = %s AND product_id = %s
        """, (quantity, current_user['id'], product_id))

        if cursor.rowcount == 0:
            return jsonify({'error': 'Item not found in cart'}), 404

        conn.commit()
        return jsonify({'message': 'Cart updated'})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@app.route('/api/hotel/cart/<int:product_id>', methods=['DELETE'])
@token_required
def remove_from_cart(current_user, product_id):
    """Remove item from cart"""
    if current_user['role'] != 'hotel':
        return jsonify({'error': 'Access denied'}), 403

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            DELETE FROM carts WHERE user_id = %s AND product_id = %s
        """, (current_user['id'], product_id))

        if cursor.rowcount == 0:
            return jsonify({'error': 'Item not found in cart'}), 404

        conn.commit()
        return jsonify({'message': 'Item removed from cart'})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@app.route('/api/hotel/cart/clear', methods=['DELETE'])
@token_required
def clear_cart(current_user):
    """Clear entire cart"""
    if current_user['role'] != 'hotel':
        return jsonify({'error': 'Access denied'}), 403

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            DELETE FROM carts WHERE user_id = %s
        """, (current_user['id'],))
        conn.commit()
        return jsonify({'message': 'Cart cleared'})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@app.route('/api/hotel/cart/calculate', methods=['POST'])
@token_required
def calculate_cart_total(current_user):
    """Calculate total for cart items"""
    if current_user['role'] != 'hotel':
        return jsonify({'error': 'Access denied'}), 403

    data = request.get_json()
    cart_items = data.get('items', [])

    if not cart_items:
        return jsonify({'total': 0, 'item_count': 0})

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        total_amount = 0.0
        item_details = []

        for item in cart_items:
            product_id = item['product_id']
            quantity = item['quantity']

            cursor.execute("SELECT name, price_per_unit, unit_type FROM products WHERE id = %s AND is_available = 1",
                           (product_id,))
            product = cursor.fetchone()

            if product:
                item_total = float(product['price_per_unit']) * quantity
                total_amount += item_total

                item_details.append({
                    'product_id': product_id,
                    'name': product['name'],
                    'quantity': quantity,
                    'unit_price': float(product['price_per_unit']),
                    'unit_type': product['unit_type'],
                    'item_total': item_total
                })

        return jsonify({
            'total_amount': total_amount,
            'item_count': len(cart_items),
            'item_details': item_details
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/hotel/orders', methods=['POST'])
@token_required
def create_hotel_order(current_user):
    """Hotel user places a new order"""
    print(f"[{datetime.now()}] Order request from {current_user['hotel_name']} (ID: {current_user['id']})")  # Log entry
    if current_user['role'] != 'hotel':
        return jsonify({'error': 'Access denied'}), 403

    data = request.get_json()
    print(f"[{datetime.now()}] Request data: {data}")  # Log input
    required_fields = ['delivery_date', 'items']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400

    if not isinstance(data['items'], list) or len(data['items']) == 0:
        return jsonify({'error': 'Order must have at least one item'}), 400
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)  # Use dictionary for easier access

    try:
        user_id = current_user['id']
        print(f"[{datetime.now()}] Calculating total for user {user_id}...")
        # Calculate total amount and fetch product details for message
        total_amount = 0.0
        order_items_details = []  # List to hold formatted item strings
        for item in data['items']:
            cursor.execute("""
                SELECT price_per_unit, is_available, name, unit_type 
                FROM products 
                WHERE id = %s
            """, (item['product_id'],))
            product = cursor.fetchone()
            if not product:
                print(f"[{datetime.now()}] ERROR: Product {item['product_id']} not found")
                return jsonify({'error': f"Product with ID {item['product_id']} not found"}), 400
            if not product['is_available']:
                print(f"[{datetime.now()}] ERROR: Product {item['product_id']} unavailable")
                return jsonify({'error': f"Product with ID {item['product_id']} is not available"}), 400
            price = float(product['price_per_unit'])
            quantity = float(item['quantity'])
            item_total = price * quantity
            total_amount += item_total
            # Format item for message: "Product Name : quantity unit_type | ₹item_total"
            item_str = f"{product['name']} :{quantity}{product['unit_type']} | ₹{item_total:.0f}"
            order_items_details.append(item_str)
        print(f"[{datetime.now()}] Total calculated: ₹{total_amount}")

        order_date = datetime.now().strftime('%d-%m-%Y')  # Format for message: DD-MM-YYYY
        # Create order with 'pending' status
        print(f"[{datetime.now()}] Creating order...")
        cursor.execute("""
            INSERT INTO orders (user_id, order_date, delivery_date, total_amount,
                              status, special_instructions)
            VALUES (%s, %s, %s, %s, 'pending', %s)
        """, (
            user_id,
            datetime.now().strftime('%Y-%m-%d'),  # DB format YYYY-MM-DD
            data['delivery_date'],
            total_amount,
            data.get('special_instructions', '')
        ))
        order_id = cursor.lastrowid
        print(f"[{datetime.now()}] Order created: ID #{order_id}")

        # Create order items (revert to non-dict cursor for inserts)
        cursor = conn.cursor()  # Switch back to tuple cursor for inserts
        print(f"[{datetime.now()}] Adding {len(data['items'])} items...")
        for item in data['items']:
            cursor.execute("SELECT price_per_unit FROM products WHERE id = %s", (item['product_id'],))
            price_at_order_result = cursor.fetchone()
            price_at_order = float(price_at_order_result[0])
            cursor.execute("""
                INSERT INTO order_items (order_id, product_id, quantity, price_at_order)
                VALUES (%s, %s, %s, %s)
            """, (order_id, item['product_id'], item['quantity'], price_at_order))
        print(f"[{datetime.now()}] Items added successfully")

        # Create bill automatically
        due_date = (datetime.now() + timedelta(days=10)).strftime('%Y-%m-%d')
        bill_date = datetime.now().strftime('%Y-%m-%d')  # Bill date same as order
        cursor.execute("""
            INSERT INTO bills (order_id, bill_date, total_amount, paid, payment_method, due_date, comments)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (
            order_id,
            bill_date,
            total_amount,
            False,
            '',
            due_date,
            ''
        ))
        bill_id = cursor.lastrowid  # Get bill ID if needed
        conn.commit()
        print(f"[{datetime.now()}] Bill created: ID #{bill_id} for order #{order_id}. DB commit success!")

        # Send WhatsApp notification via Twilio (formatted with inline bill details)
        print(f"[{datetime.now()}] About to send WhatsApp...")
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        # Build formatted message body
        items_list = "\n".join(order_items_details)
        message_body = f"""🚨 New Pending Order #{order_id} from {current_user['hotel_name']}
order placed on {order_date}
_____________________________
Products:
_____________________________
{items_list}
_____________________________
Total : ₹{total_amount:.0f}
_____________________________
Phone: {current_user['phone']}
Login to dashboard for details."""
        print(f"[{datetime.now()}] Message body prepared: {message_body[:150]}...")  # Truncate for log

        whatsapp_sent = False
        try:
            message = client.messages.create(
                body=message_body,
                from_=WHATSAPP_FROM,
                to=ADMIN_WHATSAPP
            )
            print(f"[{datetime.now()}] WhatsApp sent successfully! SID: {message.sid}, Status: {message.status}")
            whatsapp_sent = True
        except Exception as whatsapp_err:
            error_msg = str(whatsapp_err)
            print(f"[{datetime.now()}] WhatsApp FAILED: {error_msg}")
            # Optional: Fallback to SMS
            # try:
            #     sms_message = client.messages.create(
            #         body=message_body.replace('\n', ' '),  # Flatten for SMS
            #         from_=TWILIO_PHONE_NUMBER,
            #         to=ADMIN_PHONE
            #     )
            #     print(f"[{datetime.now()}] SMS fallback sent! SID: {sms_message.sid}")
            #     whatsapp_sent = True
            # except Exception as sms_err:
            #     print(f"[{datetime.now()}] SMS fallback FAILED: {str(sms_err)}")

        print(f"[{datetime.now()}] Order #{order_id} fully processed. WhatsApp success: {whatsapp_sent}")

        return jsonify({
            'message': 'Order placed successfully! We will contact you for confirmation.',
            'order_id': order_id,
            'bill_id': bill_id,
            'total_amount': total_amount,
            'delivery_info': 'Your order will be delivered between 11 AM to 3 PM tomorrow.',
            'notification_sent': whatsapp_sent
        }), 201
    except Exception as e:
        conn.rollback()
        error_str = str(e)
        print(f"[{datetime.now()}] CRITICAL: Order creation FAILED: {error_str}")
        return jsonify({'error': error_str}), 500
    finally:
        cursor.close()
        conn.close()
        print(f"[{datetime.now()}] DB connection closed for order attempt")
# @app.route('/api/hotel/orders', methods=['POST'])
# @token_required
# def create_hotel_order(current_user):
#     """Hotel user places a new order"""
#     if current_user['role'] != 'hotel':
#         return jsonify({'error': 'Access denied'}), 403

#     data = request.get_json()

#     required_fields = ['delivery_date', 'items']
#     for field in required_fields:
#         if not data.get(field):
#             return jsonify({'error': f'{field} is required'}), 400

#     if not isinstance(data['items'], list) or len(data['items']) == 0:
#         return jsonify({'error': 'Order must have at least one item'}), 400

#     conn = get_db_connection()
#     cursor = conn.cursor()

#     try:
#         user_id = current_user['id']

#         # Calculate total amount
#         total_amount = 0.0
#         for item in data['items']:
#             cursor.execute("SELECT price_per_unit, is_available FROM products WHERE id = %s", (item['product_id'],))
#             product = cursor.fetchone()
#             if not product:
#                 return jsonify({'error': f"Product with ID {item['product_id']} not found"}), 400
#             if not product[1]:  # is_available
#                 return jsonify({'error': f"Product with ID {item['product_id']} is not available"}), 400

#             price = float(product[0])
#             quantity = float(item['quantity'])
#             total_amount += price * quantity

#         # Create order with 'pending' status
#         cursor.execute("""
#             INSERT INTO orders (user_id, order_date, delivery_date, total_amount, 
#                               status, special_instructions)
#             VALUES (%s, %s, %s, %s, 'pending', %s)
#         """, (
#             user_id,
#             datetime.now().strftime('%Y-%m-%d'),
#             data['delivery_date'],
#             total_amount,
#             data.get('special_instructions', '')
#         ))

#         order_id = cursor.lastrowid

#         # Create order items
#         for item in data['items']:
#             cursor.execute("SELECT price_per_unit FROM products WHERE id = %s", (item['product_id'],))
#             price_at_order_result = cursor.fetchone()
#             price_at_order = float(price_at_order_result[0])

#             cursor.execute("""
#                 INSERT INTO order_items (order_id, product_id, quantity, price_at_order)
#                 VALUES (%s, %s, %s, %s)
#             """, (order_id, item['product_id'], item['quantity'], price_at_order))

#         # Create bill automatically
#         due_date = (datetime.now() + timedelta(days=10)).strftime('%Y-%m-%d')
#         cursor.execute("""
#             INSERT INTO bills (order_id, bill_date, total_amount, paid, payment_method, due_date)
#             VALUES (%s, %s, %s, %s, %s, %s)
#         """, (
#             order_id,
#             datetime.now().strftime('%Y-%m-%d'),
#             total_amount,
#             False,
#             '',
#             due_date
#         ))

#         conn.commit()

#         # Simulate SMS notification to admin (integrate with Twilio in production)
#         admin_phone = '8766665913'
#         print(f"SMS Notification to Admin {admin_phone}: New pending order #{order_id} from {current_user['hotel_name']} - Total: ₹{total_amount:.2f}")

#         return jsonify({
#             'message': 'Order placed successfully! We will contact you for confirmation.',
#             'order_id': order_id,
#             'total_amount': total_amount,
#             'delivery_info': 'Your order will be delivered between 11 AM to 4 PM tomorrow.'
#         }), 201

#     except Exception as e:
#         conn.rollback()
#         return jsonify({'error': str(e)}), 500
#     finally:
#         cursor.close()
#         conn.close()
# ======================
# PRODUCT ROUTES
# ======================
@app.route('/api/products', methods=['GET'])
@token_required
def get_products(current_user):
    """Get all available products (for logged-in users)"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT id, name, description, price_per_unit, image_url, 
                   category, unit_type, stock_quantity, is_available 
            FROM products 
            WHERE is_available = 1
            ORDER BY category, name
        """)
        products = cursor.fetchall()
        return jsonify(products)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


# ======================
# ADMIN ROUTES
# ======================
@app.route('/api/admin/dashboard', methods=['GET'])
@token_required
@admin_required
def get_admin_dashboard(current_user):
    """Admin dashboard overview"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # Total statistics
        cursor.execute("SELECT COUNT(*) as total_hotels FROM users WHERE role = 'hotel'")
        total_hotels = cursor.fetchone()['total_hotels']

        cursor.execute("SELECT COUNT(*) as total_orders FROM orders")
        total_orders = cursor.fetchone()['total_orders']

        cursor.execute("SELECT SUM(total_amount) as total_revenue FROM orders WHERE status != 'cancelled'")
        total_revenue = cursor.fetchone()['total_revenue'] or 0

        cursor.execute("SELECT COUNT(*) as pending_orders FROM orders WHERE status = 'pending'")
        pending_orders = cursor.fetchone()['pending_orders']

        cursor.execute("SELECT COUNT(*) as total_products FROM products WHERE is_available = 1")
        total_products = cursor.fetchone()['total_products']

        # Recent orders
        cursor.execute("""
            SELECT o.*, u.hotel_name 
            FROM orders o 
            JOIN users u ON o.user_id = u.id 
            ORDER BY o.order_date DESC 
            LIMIT 10
        """)
        recent_orders = cursor.fetchall()

        # Recent hotels
        cursor.execute("""
            SELECT username, hotel_name, email, created_at 
            FROM users 
            WHERE role = 'hotel' 
            ORDER BY created_at DESC 
            LIMIT 5
        """)
        recent_hotels = cursor.fetchall()

        # This month revenue
        cursor.execute("""
            SELECT SUM(total_amount) as this_month_revenue 
            FROM orders 
            WHERE MONTH(order_date) = MONTH(CURRENT_DATE()) 
            AND YEAR(order_date) = YEAR(CURRENT_DATE())
            AND status != 'cancelled'
        """)
        this_month_revenue = cursor.fetchone()

        stats = {
            'total_hotels': total_hotels,
            'total_orders': total_orders,
            'total_revenue': float(total_revenue),
            'pending_orders': pending_orders,
            'total_products': total_products,
            'this_month_revenue': float(this_month_revenue['this_month_revenue'] or 0),
            'recent_orders': recent_orders,
            'recent_hotels': recent_hotels
        }

        return jsonify(stats)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@app.route('/api/admin/orders', methods=['GET'])
@token_required
@admin_required
def get_all_orders(current_user):
    """Get all orders for admin, optionally filtered by user_id"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        user_id_filter = request.args.get('user_id')
        base_query = """
            SELECT o.*, u.hotel_name, u.phone, u.email
            FROM orders o
            JOIN users u ON o.user_id = u.id
        """
        params = []
        if user_id_filter:
            base_query += " WHERE o.user_id = %s"
            params.append(int(user_id_filter))
        base_query += " ORDER BY o.order_date DESC"
        cursor.execute(base_query, params)
        orders = cursor.fetchall()
        # Get items for each order
        for order in orders:
            cursor.execute("""
                SELECT oi.*, p.name as product_name, p.unit_type
                FROM order_items oi
                JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id = %s
            """, (order['id'],))
            order['items'] = cursor.fetchall()
        return jsonify(orders)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# @app.route('/api/admin/orders', methods=['GET'])
# @token_required
# @admin_required
# def get_all_orders(current_user):
#     """Get all orders for admin"""
#     conn = get_db_connection()
#     cursor = conn.cursor(dictionary=True)

#     try:
#         cursor.execute("""
#             SELECT o.*, u.hotel_name, u.phone, u.email 
#             FROM orders o 
#             JOIN users u ON o.user_id = u.id 
#             ORDER BY o.order_date DESC
#         """)

#         orders = cursor.fetchall()

#         # Get items for each order
#         for order in orders:
#             cursor.execute("""
#                 SELECT oi.*, p.name as product_name, p.unit_type 
#                 FROM order_items oi 
#                 JOIN products p ON oi.product_id = p.id 
#                 WHERE oi.order_id = %s
#             """, (order['id'],))
#             order['items'] = cursor.fetchall()

#         return jsonify(orders)
#     except Exception as e:
#         return jsonify({'error': str(e)}), 500
#     finally:
#         cursor.close()
#         conn.close()


@app.route('/api/admin/orders/pending', methods=['GET'])
@token_required
@admin_required
def get_pending_orders(current_user):
    """Get all pending orders for admin"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT o.*, u.hotel_name, u.phone, u.email 
            FROM orders o 
            JOIN users u ON o.user_id = u.id 
            WHERE o.status = 'pending'
            ORDER BY o.order_date DESC
        """)

        orders = cursor.fetchall()
        return jsonify(orders)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/admin/products/<int:product_id>', methods=['DELETE'])
@token_required
@admin_required
def delete_product(current_user, product_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM products WHERE id = %s", (product_id,))
        conn.commit()
        if cursor.rowcount == 0:
            return jsonify({'error': 'Product not found'}), 404
        return jsonify({'message': 'Product deleted successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@app.route('/api/admin/orders/<int:order_id>/status', methods=['PUT'])
@token_required
@admin_required
def update_order_status(current_user, order_id):
    """Update order status"""
    data = request.get_json()
    new_status = data.get('status')

    valid_statuses = ['pending', 'confirmed', 'preparing', 'dispatched', 'delivered', 'cancelled']
    if not new_status or new_status not in valid_statuses:
        return jsonify({'error': 'Valid status required'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            UPDATE orders 
            SET status = %s, updated_at = %s 
            WHERE id = %s
        """, (new_status, datetime.now(), order_id))

        conn.commit()

        if cursor.rowcount == 0:
            return jsonify({'error': 'Order not found'}), 404

        return jsonify({'message': f'Order status updated to {new_status}'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


# @app.route('/api/admin/bills', methods=['GET'])
# @token_required
# @admin_required
# def get_all_bills(current_user):
#     """Get all bills for admin"""
#     conn = get_db_connection()
#     cursor = conn.cursor(dictionary=True)

#     try:
#         cursor.execute("""
#             SELECT b.*, o.order_date, u.hotel_name, u.email , b.comments
#             FROM bills b 
#             JOIN orders o ON b.order_id = o.id 
#             JOIN users u ON o.user_id = u.id 
#             ORDER BY b.bill_date DESC
#         """)

#         bills = cursor.fetchall()
#         return jsonify(bills)
#     except Exception as e:
#         return jsonify({'error': str(e)}), 500
#     finally:
#         cursor.close()
#         conn.close()


@app.route('/api/admin/bills/<int:bill_id>', methods=['PUT'])
@token_required
@admin_required
def update_bill(current_user, bill_id):
    """Update bill payment status"""
    data = request.get_json()
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        update_fields = []
        values = []
        allowed_fields = ['paid', 'payment_method', 'paid_date', 'comments']
        for field in allowed_fields:
            if field in data:
                val = data[field]
                # Special handling for paid_date: convert empty string to None (NULL for DATE)
                if field == 'paid_date' and val == '':
                    val = None
                update_fields.append(f"{field} = %s")
                values.append(val)
        if not update_fields:
            return jsonify({'error': 'No valid fields to update'}), 400
        values.append(bill_id)
        query = f"UPDATE bills SET {', '.join(update_fields)} WHERE id = %s"
        cursor.execute(query, values)
        conn.commit()
        if cursor.rowcount == 0:
            return jsonify({'error': 'Bill not found'}), 404
        return jsonify({'message': 'Bill updated successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/admin/users', methods=['GET'])
@token_required
@admin_required
def get_users(current_user):
    """Get all hotel users with hotel_image"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT id, username, role, hotel_name, hotel_image, email, phone, address, 
                   created_at, last_login 
            FROM users 
            WHERE role = 'hotel'
            ORDER BY created_at DESC
        """)
        users = cursor.fetchall()
        return jsonify(users)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


# @app.route('/api/admin/users', methods=['POST'])
# @token_required
# @admin_required
# def create_user(current_user):
#     """Create new hotel user with hotel_image support"""
#     data = request.get_json()

#     required_fields = ['username', 'password', 'hotel_name', 'email']
#     for field in required_fields:
#         if not data.get(field):
#             return jsonify({'error': f'{field} is required'}), 400

#     conn = get_db_connection()
#     cursor = conn.cursor(dictionary=True)

#     try:
#         cursor.execute("""
#             INSERT INTO users (username, password_hash, role, hotel_name, hotel_image, email, phone, address)
#             VALUES (%s, %s, 'hotel', %s, %s, %s, %s, %s)
#         """, (
#             data['username'],
#             data['password'],
#             data['hotel_name'],
#             data.get('hotel_image'),  # New field
#             data['email'],
#             data.get('phone'),
#             data.get('address')
#         ))
#         conn.commit()
        
#         # Return the created user
#         user_id = cursor.lastrowid
#         cursor.execute("""
#             SELECT id, username, role, hotel_name, hotel_image, email, phone, address, created_at
#             FROM users WHERE id = %s
#         """, (user_id,))
        
#         new_user = cursor.fetchone()
        
#         return jsonify({
#             'message': 'User created successfully',
#             'user': new_user
#         }), 201
        
#     except mysql.connector.IntegrityError:
#         return jsonify({'error': 'Username already exists'}), 400
#     except Exception as e:
#         return jsonify({'error': str(e)}), 500
#     finally:
#         cursor.close()
#         conn.close()
@app.route('/api/admin/users', methods=['POST'])
@token_required
@admin_required
def create_user(current_user):
    """Create new hotel user with hotel_image support"""
    data = request.get_json()
    required_fields = ['username', 'password', 'hotel_name']  # Removed 'email'—now optional
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            INSERT INTO users (username, password_hash, role, hotel_name, hotel_image, email, phone, address)
            VALUES (%s, %s, 'hotel', %s, %s, %s, %s, %s)
        """, (
            data['username'],
            data['password'],
            data['hotel_name'],
            data.get('hotel_image'), 
            data.get('email', ''),  # Default to empty string if missing/empty
            data.get('phone', ''),
            data.get('address', '')
        ))
        conn.commit()
       
        # Return the created user
        user_id = cursor.lastrowid
        cursor.execute("""
            SELECT id, username, role, hotel_name, hotel_image, email, phone, address, created_at
            FROM users WHERE id = %s
        """, (user_id,))
       
        new_user = cursor.fetchone()
       
        return jsonify({
            'message': 'User created successfully',
            'user': new_user
        }), 201
       
    except mysql.connector.IntegrityError:
        return jsonify({'error': 'Username already exists'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/admin/products', methods=['POST'])
@token_required
@admin_required
def create_product(current_user):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No JSON data provided'}), 400
    
    required_fields = ['name', 'price_per_unit', 'stock_quantity']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Enhanced validation
        try:
            price = float(data['price_per_unit'])
            if price < 0:
                return jsonify({'error': 'Price must be positive'}), 400
        except ValueError:
            return jsonify({'error': 'Invalid price format (must be a number)'}), 400
        
        try:
            stock = int(data['stock_quantity'])
            if stock < 0:
                return jsonify({'error': 'Stock must be non-negative'}), 400
        except ValueError:
            return jsonify({'error': 'Invalid stock format (must be an integer)'}), 400
        
        if len(data['name']) > 100:
            return jsonify({'error': 'Name too long (max 100 chars)'}), 400
        
        description = data.get('description', '')[:65535]  # text limit
        image_url = data.get('image_url', '')[:255]
        category = data.get('category', '')[:50]
        unit_type = data.get('unit_type', 'kg')[:20]
        is_available_str = data.get('is_available', 'true')
        is_available = 1 if str(is_available_str).lower() == 'true' else 0

        cursor.execute("""
            INSERT INTO products (name, description, price_per_unit, stock_quantity,
                                image_url, category, unit_type, is_available)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (data['name'], description, price, stock, image_url, category, unit_type, is_available))
        conn.commit()
        
        if cursor.rowcount == 0:
            return jsonify({'error': 'Failed to create product (no changes)'}), 500
        
        new_id = cursor.lastrowid
        return jsonify({'message': 'Product created successfully', 'id': new_id}), 201
        
    except mysql.connector.Error as db_err:  # Assuming mysql-connector-python; adjust if using pymysql
        conn.rollback()
        return jsonify({'error': f'Database error: {str(db_err)}'}), 500
    except Exception as e:
        conn.rollback()
        app.logger.error(f"Create product error: {str(e)}")  # Log for debugging
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/admin/products/<int:product_id>', methods=['PUT'])
@token_required
@admin_required
def update_product(current_user, product_id):
    """Update product"""
    data = request.get_json()
    print(f"Received data for update {product_id}: {data}")  # NEW: Log incoming data
    if not data:
        return jsonify({'error': 'No JSON data provided'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Fetch current product to validate existence early (bonus: avoids partial updates on non-existent)
        cursor.execute("SELECT id FROM products WHERE id = %s", (product_id,))
        if not cursor.fetchone():
            return jsonify({'error': 'Product not found'}), 404
        
        update_fields = []
        values = []
        allowed_fields = ['name', 'description', 'price_per_unit', 'stock_quantity',
                          'image_url', 'category', 'unit_type', 'is_available']
        
        for field in allowed_fields:
            if field in data:
                val = data[field]
                # Enhanced type conversions with validation
                if field == 'price_per_unit':
                    try:
                        val = float(val)
                        if val < 0:
                            return jsonify({'error': 'Price must be positive'}), 400
                    except (ValueError, TypeError):
                        return jsonify({'error': f'Invalid {field} format (must be a number)'}), 400
                elif field == 'stock_quantity':
                    try:
                        val = int(val)
                        if val < 0:
                            return jsonify({'error': 'Stock must be non-negative'}), 400
                    except (ValueError, TypeError):
                        return jsonify({'error': f'Invalid {field} format (must be an integer)'}), 400
                elif field == 'is_available':
                    # Handle string, bool, or int
                    if isinstance(val, bool):
                        val = 1 if val else 0
                    elif isinstance(val, (int, float)):
                        val = 1 if int(val) else 0
                    else:
                        val_str = str(val).lower()
                        val = 1 if val_str == 'true' or val_str == '1' else 0
                # Length checks (prevent DB errors)
                elif field == 'name' and len(str(val)) > 100:
                    return jsonify({'error': 'Name too long (max 100 chars)'}), 400
                elif field == 'category' and len(str(val)) > 50:
                    return jsonify({'error': 'Category too long (max 50 chars)'}), 400
                elif field == 'unit_type' and len(str(val)) > 20:
                    return jsonify({'error': 'Unit type too long (max 20 chars)'}), 400
                elif field == 'image_url' and len(str(val)) > 500:
                    return jsonify({'error': 'Image URL too long (max 255 chars)'}), 400
                # description is text, no strict limit but truncate if huge
                elif field == 'description':
                    val = str(val)[:65535]
                
                update_fields.append(f"{field} = %s")
                values.append(val)
        
        if not update_fields:
            return jsonify({'error': 'No valid fields to update'}), 400
        
        values.append(product_id)
        query = f"UPDATE products SET {', '.join(update_fields)} WHERE id = %s"
        print(f"Executing update: {query} with values: {values}")  # Temp log for debugging
        
        cursor.execute(query, values)
        conn.commit()
        
        if cursor.rowcount == 0:
            print(f"No changes made for product {product_id} (skipped)")  # Log no-op
            return jsonify({'message': 'No changes detected (product unchanged)'}), 200  # FIXED: 200 instead of 404
        
        print(f"Updated product {product_id} successfully (rows affected: {cursor.rowcount})")  # Log success
        return jsonify({'message': 'Product updated successfully'})
        
    except mysql.connector.Error as db_err:  # Adjust if using pymysql
        conn.rollback()
        return jsonify({'error': f'Database error: {str(db_err)}'}), 500
    except Exception as e:
        conn.rollback()
        print(f"Update error traceback: {traceback.format_exc()}")  # Full log (import traceback at top)
        return jsonify({'error': f'Update failed: {str(e)}'}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/admin/sessions', methods=['GET'])
@token_required
@admin_required
def get_active_sessions(current_user):
    """Admin view of active sessions"""
    session_list = []
    for token, session in active_sessions.items():
        if not session['blacklisted']:
            session_list.append({
                'user_id': session['user_id'],
                'username': session['username'],
                'role': session['role'],
                'created_at': session['created_at'].isoformat(),
                'last_activity': session['last_activity'].isoformat(),
                'expires_at': session['expires_at'].isoformat(),
                'token_prefix': token[:20] + '...'
            })

    return jsonify({
        'total_sessions': len(session_list),
        'sessions': session_list
    })


@app.route('/api/admin/sessions/<int:user_id>', methods=['DELETE'])
@token_required
@admin_required
def revoke_user_sessions(current_user, user_id):
    """Admin force logout for a specific user"""
    tokens_to_remove = []
    for token, session in active_sessions.items():
        if session['user_id'] == user_id:
            tokens_to_remove.append(token)

    for token in tokens_to_remove:
        del active_sessions[token]

    return jsonify({
        'message': f'Revoked {len(tokens_to_remove)} sessions for user {user_id}',
        'revoked_sessions': len(tokens_to_remove)
    })

# Add this route under ADMIN ROUTES in app.py (after other admin routes)

@app.route('/api/admin/suppliers', methods=['GET'])
@token_required
@admin_required
def get_all_suppliers(current_user):
    """Get all suppliers for admin"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT id, name, email, phone, address, status, created_at 
            FROM suppliers 
            ORDER BY created_at DESC
        """)
        suppliers = cursor.fetchall()
        return jsonify(suppliers)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


# GET one supplier
@app.route('/api/admin/suppliers/<int:supplier_id>', methods=['GET'])
@token_required
@admin_required
def get_supplier(current_user, supplier_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM suppliers WHERE id = %s", (supplier_id,))
        supplier = cursor.fetchone()
        if not supplier:
            return jsonify({'error': 'Supplier not found'}), 404
        return jsonify(supplier), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


# PUT update supplier (partial update allowed)
@app.route('/api/admin/suppliers/<int:supplier_id>', methods=['PUT'])
@token_required
@admin_required
def update_supplier(current_user, supplier_id):
    # Parse JSON body; return 400 if missing/invalid
    data = request.get_json(silent=True)
    if data is None:
        return jsonify({'error': 'Invalid or missing JSON body'}), 400

    # Only allow these fields to be updated
    allowed_fields = {'name', 'email', 'phone', 'address'}
    set_clauses = []
    params = []

    for field in allowed_fields:
        if field in data:
            set_clauses.append(f"{field} = %s")
            params.append(data[field])

    if not set_clauses:
        return jsonify({'error': 'No valid fields provided to update'}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # Ensure supplier exists first to differentiate 404 from a no-op
        cursor.execute("SELECT id FROM suppliers WHERE id = %s", (supplier_id,))
        exists = cursor.fetchone()
        if not exists:
            return jsonify({'error': 'Supplier not found'}), 404

        sql = f"UPDATE suppliers SET {', '.join(set_clauses)} WHERE id = %s"
        params.append(supplier_id)
        cursor.execute(sql, tuple(params))
        conn.commit()

        # Optionally return the updated record
        cursor.execute("SELECT * FROM suppliers WHERE id = %s", (supplier_id,))
        updated = cursor.fetchone()
        return jsonify({'message': 'Supplier updated', 'supplier': updated}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


# DELETE supplier
@app.route('/api/admin/suppliers/<int:supplier_id>', methods=['DELETE'])
@token_required
@admin_required
def delete_supplier(current_user, supplier_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM suppliers WHERE id = %s", (supplier_id,))
        if cursor.rowcount == 0:
            # Nothing deleted -> not found
            return jsonify({'error': 'Supplier not found'}), 404
        conn.commit()
        return jsonify({'message': 'Supplier deleted'}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/admin/products/<int:product_id>/stock', methods=['PATCH'])
@token_required
@admin_required
def update_product_stock(current_user, product_id):
    data = request.get_json()
    stock_quantity = data.get('stock_quantity')
    
    if stock_quantity is None:
        return jsonify({'error': 'stock_quantity required'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE products SET stock_quantity = %s WHERE id = %s", (stock_quantity, product_id))
        conn.commit()
        if cursor.rowcount == 0:
            return jsonify({'error': 'Product not found'}), 404
        return jsonify({'message': 'Stock updated successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# Add this new route under ADMIN ROUTES in app.py (after get_all_orders or similar)
# @app.route('/api/admin/orders', methods=['POST'])
# @token_required
# @admin_required
# def admin_create_order(current_user):
#     """Admin creates order for any client (for direct billing)"""
#     data = request.get_json()
#     user_id = data.get('user_id')
#     if not user_id:
#         return jsonify({'error': 'user_id required'}), 400
#     required_fields = ['delivery_date', 'items']
#     for field in required_fields:
#         if not data.get(field):
#             return jsonify({'error': f'{field} is required'}), 400
#     if not isinstance(data['items'], list) or len(data['items']) == 0:
#         return jsonify({'error': 'Order must have at least one item'}), 400
#     conn = get_db_connection()
#     cursor = conn.cursor(dictionary=True)
#     try:
#         # Fetch user details for logging
#         cursor.execute("SELECT hotel_name, phone FROM users WHERE id = %s", (user_id,))
#         user = cursor.fetchone()
#         if not user:
#             return jsonify({'error': 'Client not found'}), 404
#         print(f"[{datetime.now()}] Admin creating order for {user['hotel_name']} (ID: {user_id})")
#         # Calculate total and validate items
#         total_amount = 0.0
#         order_items_details = []
#         for item in data['items']:
#             cursor.execute("""
#                 SELECT price_per_unit, is_available, name, unit_type
#                 FROM products
#                 WHERE id = %s
#             """, (item['product_id'],))
#             product = cursor.fetchone()
#             if not product:
#                 return jsonify({'error': f"Product with ID {item['product_id']} not found"}), 400
#             if not product['is_available']:
#                 return jsonify({'error': f"Product with ID {item['product_id']} is not available"}), 400
#             price = float(product['price_per_unit'])
#             quantity = float(item['quantity'])
#             item_total = price * quantity
#             total_amount += item_total
#             item_str = f"{product['name']} :{quantity}{product['unit_type']} | ₹{item_total:.0f}"
#             order_items_details.append(item_str)
#         print(f"[{datetime.now()}] Total calculated: ₹{total_amount}")
#         order_date = datetime.now().strftime('%Y-%m-%d')
#         delivery_date = data['delivery_date']
#         # Create order (status 'delivered' for billing)
#         cursor.execute("""
#             INSERT INTO orders (user_id, order_date, delivery_date, total_amount,
#                               status, special_instructions)
#             VALUES (%s, %s, %s, %s, 'delivered', %s)
#         """, (
#             user_id,
#             order_date,
#             delivery_date,
#             total_amount,
#             data.get('special_instructions', '')
#         ))
#         order_id = cursor.lastrowid
#         print(f"[{datetime.now()}] Order created: ID #{order_id}")
#         # Create order items
#         cursor = conn.cursor()
#         for item in data['items']:
#             cursor.execute("SELECT price_per_unit FROM products WHERE id = %s", (item['product_id'],))
#             price_at_order_result = cursor.fetchone()
#             price_at_order = float(price_at_order_result[0])
#             cursor.execute("""
#                 INSERT INTO order_items (order_id, product_id, quantity, price_at_order)
#                 VALUES (%s, %s, %s, %s)
#             """, (order_id, item['product_id'], item['quantity'], price_at_order))
#         print(f"[{datetime.now()}] Items added successfully")
#         conn.commit()
#         print(f"[{datetime.now()}] Admin order #{order_id} fully processed.")
#         return jsonify({
#             'order_id': order_id,
#             'total_amount': total_amount
#         }), 201
#     except Exception as e:
#         conn.rollback()
#         error_str = str(e)
#         print(f"[{datetime.now()}] CRITICAL: Admin order creation FAILED: {error_str}")
#         return jsonify({'error': error_str}), 500
#     finally:
#         cursor.close()
#         conn.close()
@app.route('/api/admin/orders', methods=['POST'])
@token_required
@admin_required
def admin_create_order(current_user):
    """Admin creates order for any client (for direct billing)"""
    data = request.get_json()
    user_id = data.get('user_id')
    if not user_id:
        return jsonify({'error': 'user_id required'}), 400
    required_fields = ['delivery_date', 'items']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400
    if not isinstance(data['items'], list) or len(data['items']) == 0:
        return jsonify({'error': 'Order must have at least one item'}), 400
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # Fetch user details for logging
        cursor.execute("SELECT hotel_name, phone FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()
        if not user:
            return jsonify({'error': 'Client not found'}), 404
        print(f"[{datetime.now()}] Admin creating order for {user['hotel_name']} (ID: {user_id})")
        # Calculate total and validate items
        total_amount = 0.0
        order_items_details = []
        for item in data['items']:
            cursor.execute("""
                SELECT price_per_unit, is_available, name, unit_type
                FROM products
                WHERE id = %s
            """, (item['product_id'],))
            product = cursor.fetchone()
            if not product:
                return jsonify({'error': f"Product with ID {item['product_id']} not found"}), 400
            if not product['is_available']:
                return jsonify({'error': f"Product with ID {item['product_id']} is not available"}), 400
            price = float(product['price_per_unit'])
            quantity = float(item['quantity'])
            item_total = price * quantity
            total_amount += item_total
            item_str = f"{product['name']} :{quantity}{product['unit_type']} | ₹{item_total:.0f}"
            order_items_details.append(item_str)
        print(f"[{datetime.now()}] Total calculated: ₹{total_amount}")
        order_date = datetime.now().strftime('%Y-%m-%d')
        delivery_date = data['delivery_date']
        # Create order (status 'delivered' for billing)
        cursor.execute("""
            INSERT INTO orders (user_id, order_date, delivery_date, total_amount,
                              status, special_instructions)
            VALUES (%s, %s, %s, %s, 'delivered', %s)
        """, (
            user_id,
            order_date,
            delivery_date,
            total_amount,
            data.get('special_instructions', '')
        ))
        order_id = cursor.lastrowid
        print(f"[{datetime.now()}] Order created: ID #{order_id}")
        # Create order items
        cursor = conn.cursor()
        for item in data['items']:
            cursor.execute("SELECT price_per_unit FROM products WHERE id = %s", (item['product_id'],))
            price_at_order_result = cursor.fetchone()
            price_at_order = float(price_at_order_result[0])
            cursor.execute("""
                INSERT INTO order_items (order_id, product_id, quantity, price_at_order)
                VALUES (%s, %s, %s, %s)
            """, (order_id, item['product_id'], item['quantity'], price_at_order))
        print(f"[{datetime.now()}] Items added successfully")
        # Create bill automatically
        due_date = (datetime.now() + timedelta(days=10)).strftime('%Y-%m-%d')
        bill_date = datetime.now().strftime('%Y-%m-%d')
        cursor.execute("""
            INSERT INTO bills (order_id, bill_date, total_amount, paid, payment_method, due_date, comments)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (
            order_id,
            bill_date,
            total_amount,
            False,
            '',
            due_date,
            'Admin direct bill'
        ))
        bill_id = cursor.lastrowid
        conn.commit()
        print(f"[{datetime.now()}] Bill created: ID #{bill_id} for order #{order_id}. Admin order fully processed.")
        return jsonify({
            'order_id': order_id,
            'bill_id': bill_id,
            'total_amount': total_amount
        }), 201
    except Exception as e:
        conn.rollback()
        error_str = str(e)
        print(f"[{datetime.now()}] CRITICAL: Admin order creation FAILED: {error_str}")
        return jsonify({'error': error_str}), 500
    finally:
        cursor.close()
        conn.close()


@app.route('/api/admin/users/<int:user_id>', methods=['GET'])
@token_required
@admin_required
def get_single_user(current_user, user_id):
    """Get single hotel user details"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT id, username, role, hotel_name, hotel_image, email, phone, address,
                   created_at, last_login
            FROM users
            WHERE id = %s AND role = 'hotel'
        """, (user_id,))
        user = cursor.fetchone()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        return jsonify(user)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# Backend update: Add user_id filter to get_all_bills similar to get_all_orders

@app.route('/api/admin/bills', methods=['GET'])
@token_required
@admin_required
def get_all_bills(current_user):
    """Get all bills for admin, optionally filtered by user_id"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        user_id_filter = request.args.get('user_id')
        base_query = """
            SELECT b.*, o.order_date, u.hotel_name, u.email, b.comments
            FROM bills b
            JOIN orders o ON b.order_id = o.id
            JOIN users u ON o.user_id = u.id
        """
        params = []
        if user_id_filter:
            base_query += " WHERE o.user_id = %s"
            params.append(int(user_id_filter))
        base_query += " ORDER BY b.bill_date DESC"
        cursor.execute(base_query, params)
        bills = cursor.fetchall()
        return jsonify(bills)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# Update the existing create_bill route (replace the old one)
@app.route('/api/admin/bills', methods=['POST'])
@token_required
@admin_required
def create_bill(current_user):
    """Create new bill for an order"""
    data = request.get_json()
    required_fields = ['order_id', 'amount']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} required'}), 400
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Calculate total_amount if not provided
        if 'total_amount' not in data:
            subtotal = float(data['amount'])
            tax_rate = float(data.get('tax_rate', 5)) / 100
            discount = float(data.get('discount', 0))
            discounted_subtotal = subtotal - discount
            tax = discounted_subtotal * tax_rate
            data['total_amount'] = round(discounted_subtotal + tax, 2)
        # Get hotel_id from order if not provided (and column exists)
        hotel_id = data.get('hotel_id')
        if not hotel_id:
            cursor.execute("SELECT user_id FROM orders WHERE id = %s", (data['order_id'],))
            res = cursor.fetchone()
            if res:
                hotel_id = res[0]
                data['hotel_id'] = hotel_id
            else:
                return jsonify({'error': 'Order not found'}), 404
        # Prepare dates
        due_date = data.get('due_date', (datetime.now() + timedelta(days=10)).strftime('%Y-%m-%d'))
        bill_date = data.get('bill_date', datetime.now().strftime('%Y-%m-%d'))
        # Dynamic INSERT: Include hotel_id only if provided (avoids column error if missing)
        columns = ['order_id', 'bill_date', 'amount', 'tax_rate', 'discount', 'total_amount', 'paid', 'payment_method', 'due_date', 'comments']
        values = [
            data['order_id'],
            bill_date,
            data['amount'],
            data.get('tax_rate', 5),
            data.get('discount', 0),
            data['total_amount'],
            data.get('paid', False),
            data.get('payment_method', ''),
            due_date,
            data.get('comments', '')
        ]
        if 'hotel_id' in data:  # Only add if schema supports
            columns.insert(1, 'hotel_id')  # After order_id
            values.insert(1, hotel_id)
        placeholders = ', '.join(['%s'] * len(columns))
        query = f"INSERT INTO bills ({', '.join(columns)}) VALUES ({placeholders})"
        cursor.execute(query, values)
        conn.commit()
        bill_id = cursor.lastrowid
        return jsonify({'message': 'Bill created', 'bill_id': bill_id}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()
@app.route('/api/admin/analytics/trends', methods=['GET'])
@token_required
@admin_required
def get_analytics_trends(current_user):
    # Daily/weekly/monthly revenue from orders
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT 
                DATE(order_date) as date,
                SUM(total_amount) as revenue
            FROM orders 
            WHERE status != 'cancelled'
            GROUP BY DATE(order_date)
            ORDER BY date DESC LIMIT 30
        """)
        trends = cursor.fetchall()
        return jsonify({'trends': trends})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@app.route('/api/admin/users/<int:user_id>', methods=['PUT'])
@token_required
@admin_required
def update_user(current_user, user_id):
    """Update hotel user with all fields including hotel_image"""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # First check if user exists
        cursor.execute("SELECT id FROM users WHERE id = %s AND role = 'hotel'", (user_id,))
        user_exists = cursor.fetchone()
        
        if not user_exists:
            return jsonify({'error': 'User not found'}), 404

        # Build dynamic update query
        update_fields = []
        values = []
        
        # Allowed fields for update (including hotel_image)
        allowed_fields = ['hotel_name', 'email', 'phone', 'address', 'hotel_image']
        
        for field in allowed_fields:
            if field in data:
                update_fields.append(f"{field} = %s")
                values.append(data[field])

        if not update_fields:
            return jsonify({'error': 'No valid fields to update'}), 400

        values.append(user_id)
        query = f"UPDATE users SET {', '.join(update_fields)} WHERE id = %s"
        
        cursor.execute(query, values)
        conn.commit()

        # Return updated user data
        cursor.execute("""
            SELECT id, username, role, hotel_name, hotel_image, email, phone, address, 
                   created_at, last_login 
            FROM users 
            WHERE id = %s
        """, (user_id,))
        
        updated_user = cursor.fetchone()
        
        return jsonify({
            'message': 'User updated successfully',
            'user': updated_user
        })
        
    except mysql.connector.Error as db_err:
        conn.rollback()
        return jsonify({'error': f'Database error: {str(db_err)}'}), 500
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/admin/users/<int:user_id>', methods=['DELETE'])
@token_required
@admin_required
def delete_user(current_user, user_id):
    """Delete hotel user and cascade related records (orders, bills, etc.)"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)  # Use dict for safer queries
    try:
        # Verify user exists and is hotel (prevents admin delete)
        cursor.execute("SELECT id FROM users WHERE id = %s AND role = 'hotel'", (user_id,))
        user = cursor.fetchone()
        if not user:
            return jsonify({'error': 'User not found or not a hotel user'}), 404

        print(f"[{datetime.now()}] Starting cascade delete for user {user_id}")

        # 1. Delete support replies → tickets
        cursor.execute("""
            DELETE sr FROM supportreplies sr
            JOIN support_tickets st ON sr.ticketid = st.id
            WHERE st.userid = %s
        """, (user_id,))
        cursor.execute("DELETE FROM support_tickets WHERE userid = %s", (user_id,))
        print(f"[{datetime.now()}] Deleted support tickets/replies for user {user_id}")

        # 2. Delete carts
        cursor.execute("DELETE FROM carts WHERE user_id = %s", (user_id,))
        print(f"[{datetime.now()}] Deleted carts for user {user_id}")

        # 3. Delete order_items (after orders, but safe)
        cursor.execute("""
            DELETE oi FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            WHERE o.user_id = %s
        """, (user_id,))
        print(f"[{datetime.now()}] Deleted order items for user {user_id}")

        # 4. Delete bills (after orders)
        cursor.execute("""
            DELETE b FROM bills b
            JOIN orders o ON b.order_id = o.id
            WHERE o.user_id = %s
        """, (user_id,))
        print(f"[{datetime.now()}] Deleted bills for user {user_id}")

        # 5. Delete orders
        cursor.execute("DELETE FROM orders WHERE user_id = %s", (user_id,))
        print(f"[{datetime.now()}] Deleted orders for user {user_id}")

        # 6. Finally, delete user
        cursor.execute("DELETE FROM users WHERE id = %s AND role = 'hotel'", (user_id,))
        conn.commit()  # Commit all at once

        if cursor.rowcount == 0:
            conn.rollback()  # Rare, but safety
            return jsonify({'error': 'User not found'}), 404

        print(f"[{datetime.now()}] Successfully cascade-deleted user {user_id}")
        return jsonify({
            'message': 'User and related data deleted successfully',
            'deleted_user_id': user_id
        })

    except mysql.connector.Error as db_err:
        conn.rollback()
        error_msg = str(db_err)
        print(f"[{datetime.now()}] DB Error in user delete {user_id}: {error_msg}")
        return jsonify({'error': f'Database error: {error_msg}'}), 500
    except Exception as e:
        conn.rollback()
        error_msg = str(e)
        print(f"[{datetime.now()}] Unexpected error in user delete {user_id}: {error_msg} | Traceback: {traceback.format_exc()}")
        return jsonify({'error': f'Unexpected error: {error_msg}'}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/admin/profile', methods=['GET'])
@token_required
@admin_required
def get_admin_profile(current_user):
    """Get current admin profile"""
    return jsonify({
        'id': current_user['id'],
        'username': current_user['username'],
        'email': current_user['email'],
        'phone': current_user['phone'],
        'role': current_user['role'],
        'last_login': current_user.get('last_login')
    })

@app.route('/api/admin/profile', methods=['PUT'])
@token_required
@admin_required
def update_admin_profile(current_user):
    """Update admin profile (email, phone)"""
    data = request.get_json()
    allowed_fields = ['email', 'phone']
    update_fields = []
    values = []
    for field in allowed_fields:
        if field in data:
            update_fields.append(f"{field} = %s")
            values.append(data[field])
    if not update_fields:
        return jsonify({'error': 'No valid fields to update'}), 400

    values.append(current_user['id'])
    query = f"UPDATE users SET {', '.join(update_fields)} WHERE id = %s"
    
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(query, values)
        conn.commit()
        if cursor.rowcount == 0:
            return jsonify({'error': 'Update failed'}), 400
        return jsonify({'message': 'Profile updated successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# For system settings (company info, tax rate, etc.)
@app.route('/api/admin/settings', methods=['GET'])
@token_required
@admin_required
def get_system_settings(current_user):
    """Get system settings (company info, tax, etc.)"""
    return jsonify({
        'company_name': 'Bhairavnath Vegetables Supplier',
        'tax_rate': 5.0,
        'session_timeout': 28800,  # 8 hours in seconds
        'currency': 'INR',
        # Add more from a settings table if exists
    })

@app.route('/api/admin/settings', methods=['PUT'])
@token_required
@admin_required
def update_system_settings(current_user):
    """Update system settings"""
    data = request.get_json()
    # Save to DB or file - placeholder
    return jsonify({'message': 'Settings updated successfully'})

# ======================
# HOTEL USER ROUTES (CONTINUED)
# ======================

# NEW: GET route for hotel profile (fetch fresh data) – ADD THIS
@app.route('/api/hotel/profile', methods=['GET'])
@token_required
def get_hotel_profile(current_user):
    """Get current hotel profile with hotel_image"""
    if current_user['role'] != 'hotel':
        return jsonify({'error': 'Access denied'}), 403

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT id, username, role, hotel_name, hotel_image, email, phone, address, 
                   created_at, last_login 
            FROM users 
            WHERE id = %s AND role = 'hotel'
        """, (current_user['id'],))

        profile = cursor.fetchone()
        if not profile:
            return jsonify({'error': 'Profile not found'}), 404

        return jsonify(profile)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# Existing: PUT route for updating profile (KEEP THIS UNCHANGED)
@app.route('/api/hotel/profile', methods=['PUT'])
@token_required
def update_hotel_profile(current_user):
    """Update hotel user profile (self-service)"""
    if current_user['role'] != 'hotel':
        return jsonify({'error': 'Access denied'}), 403

    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        update_fields = []
        values = []
        allowed_fields = ['hotel_name', 'email', 'phone', 'address']

        for field in allowed_fields:
            if field in data and data[field].strip():  # Skip empty values
                update_fields.append(f"{field} = %s")
                values.append(data[field].strip())

        if not update_fields:
            return jsonify({'error': 'No valid fields to update'}), 400

        values.append(current_user['id'])
        query = f"UPDATE users SET {', '.join(update_fields)} WHERE id = %s"

        print(f"Attempting update for user ID from token: {current_user['id']} (type: {type(current_user['id'])})")

        cursor.execute("SELECT COUNT(*) as count FROM users WHERE id = %s", (current_user['id'],))
        result = cursor.fetchone()
        count = result['count'] if result else 0
        print(f"User ID exists in DB: {count} rows")

        cursor.execute(query, values)
        conn.commit()

        # Refetch and return updated user for frontend sync (ignore rowcount=0 for no-change cases)
        cursor.execute("SELECT hotel_name, email, phone, address FROM users WHERE id = %s", (current_user['id'],))
        updated_user = cursor.fetchone()
        if not updated_user:
            return jsonify({'error': 'Update failed - user not found'}), 404

        return jsonify({
            'message': 'Profile updated successfully',
            'updated': {
                'hotel_name': updated_user['hotel_name'],
                'email': updated_user['email'],
                'phone': updated_user['phone'],
                'address': updated_user['address']
            }
        }), 200
    except mysql.connector.Error as db_err:
        conn.rollback()
        return jsonify({'error': f'Database error: {str(db_err)}'}), 500
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# ... (rest of your app.py unchanged)
# ---------- SUPPORT ROUTES ----------
# ---------- SUPPORT ROUTES ----------
@app.route('/api/admin/support/tickets', methods=['GET'])
@token_required
@admin_required
def get_support_tickets(current_user):
    conn = get_db_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute("""
        SELECT t.*, u.hotel_name, u.email 
        FROM support_tickets t 
        LEFT JOIN users u ON t.userid = u.id  -- Fixed: userid
        ORDER BY t.created_at DESC
    """)
    tickets = cur.fetchall()
    cur.close(); conn.close()
    return jsonify(tickets)

@app.route('/api/admin/support/tickets/<int:ticket_id>', methods=['GET'])
@token_required
@admin_required
def get_support_ticket(current_user, ticket_id):
    conn = get_db_connection()
    cur = conn.cursor(dictionary=True)

    cur.execute("SELECT * FROM support_tickets WHERE id=%s", (ticket_id,))
    ticket = cur.fetchone()
    if not ticket:
        cur.close(); conn.close()
        return jsonify({'error': 'Ticket not found'}), 404

    cur.execute("""
        SELECT sr.message, sr.isadmin as is_admin, sr.createdat as created_at 
        FROM supportreplies sr  
        WHERE sr.ticketid = %s 
        ORDER BY sr.createdat ASC
    """, (ticket_id,))
    ticket['replies'] = cur.fetchall()

    cur.close(); conn.close()
    return jsonify(ticket)

@app.route('/api/admin/support/tickets', methods=['POST'])
@token_required
@admin_required
def create_support_ticket(current_user):
    data = request.get_json()
    if not data or 'subject' not in data or 'message' not in data:
        return jsonify({'error': 'subject & message required'}), 400

    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO support_tickets (subject, message, status, created_at, updated_at) VALUES (%s, %s, 'open', NOW(), NOW())",  
        (data['subject'], data['message'])
    )
    ticket_id = cur.lastrowid
    conn.commit(); cur.close(); conn.close()
    return jsonify({'id': ticket_id}), 201

@app.route('/api/admin/support/tickets/<int:ticket_id>/reply', methods=['POST'])
@token_required
@admin_required
def add_reply(current_user, ticket_id):
    data = request.get_json()
    if not data or 'message' not in data:
        return jsonify({'error': 'message required'}), 400

    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO supportreplies (ticketid, message, isadmin) VALUES (%s, %s, 1)", 
        (ticket_id, data['message'])
    )
    # Update ticket timestamp
    cur.execute("UPDATE support_tickets SET updated_at = NOW() WHERE id = %s", (ticket_id,))
    conn.commit(); cur.close(); conn.close()
    return jsonify({'message': 'reply added'})

@app.route('/api/admin/support/tickets/<int:ticket_id>/close', methods=['PATCH'])
@token_required
@admin_required
def close_ticket(current_user, ticket_id):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("UPDATE support_tickets SET status='closed', updated_at=NOW() WHERE id=%s", (ticket_id,))
    if cur.rowcount == 0:
        cur.close(); conn.close()
        return jsonify({'error': 'Ticket not found'}), 404
    conn.commit(); cur.close(); conn.close()
    return jsonify({'message': 'ticket closed'})

# Hotel adds reply to their ticket
# GET hotel tickets with replies
@app.route('/api/hotel/support-tickets', methods=['GET'])
@token_required
def get_hotel_support_tickets(current_user):
    if current_user['role'] != 'hotel':
        return jsonify({'error': 'Access denied'}), 403

    conn = get_db_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute("""
        SELECT t.*, u.hotel_name, u.email 
        FROM support_tickets t 
        LEFT JOIN users u ON t.userid = u.id
        WHERE t.userid = %s
        ORDER BY t.created_at DESC
    """, (current_user['id'],))
    tickets = cur.fetchall()

    # Fetch replies for each ticket and prepend original message
    for ticket in tickets:
        cur.execute("""
            SELECT sr.message, sr.isadmin as is_admin, sr.createdat as created_at
            FROM supportreplies sr
            WHERE sr.ticketid = %s
            ORDER BY sr.createdat ASC
        """, (ticket['id'],))
        replies = cur.fetchall()
        # Prepend original ticket message (user's first message, is_admin=0)
        messages = [{
            'message': ticket['message'],
            'is_admin': 0,
            'created_at': ticket['created_at']
        }] + replies
        ticket['messages'] = messages
        # Clean up (remove raw message from ticket for cleanliness)
        del ticket['message']

    cur.close()
    conn.close()
    return jsonify(tickets)

# POST new hotel ticket
@app.route('/api/hotel/support-tickets', methods=['POST'])
@token_required
def create_hotel_support_ticket(current_user):
    if current_user['role'] != 'hotel':
        return jsonify({'error': 'Access denied'}), 403

    data = request.get_json()  # Expect JSON; attachments can be added later
    if not data or not data.get('subject') or not data.get('message'):
        return jsonify({'error': 'subject and message required'}), 400

    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            INSERT INTO support_tickets (userid, subject, message, category, status, created_at, updated_at)
            VALUES (%s, %s, %s, %s, 'open', NOW(), NOW())
        """, (current_user['id'], data['subject'], data['message'], data.get('category', 'General')))
        conn.commit()
        ticket_id = cur.lastrowid
        return jsonify({'id': ticket_id, 'message': 'Ticket created successfully'}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()
        conn.close()
# ======================
# SESSION CLEANUP
# ======================
@app.before_request
def before_request():
    """Clean up expired sessions occasionally"""
    if random.random() < 0.01:  # 1% chance per request
        cleanup_expired_sessions()

@app.route('/api/admin/analytics', methods=['GET'])
@token_required
@admin_required
def get_analytics(current_user):
    """Get comprehensive analytics for admin dashboard"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # 1. REVENUE DATA
        # Yesterday's revenue
        cursor.execute("""
            SELECT COALESCE(SUM(total_amount), 0) as yesterday 
            FROM orders 
            WHERE DATE(order_date) = DATE(DATE_SUB(NOW(), INTERVAL 1 DAY))
        """)
        yesterday_rev = cursor.fetchone()['yesterday'] or 0
        
        # This month's revenue
        cursor.execute("""
            SELECT COALESCE(SUM(total_amount), 0) as month 
            FROM orders 
            WHERE MONTH(order_date) = MONTH(NOW()) AND YEAR(order_date) = YEAR(NOW())
        """)
        month_rev = cursor.fetchone()['month'] or 0
        
        # This year's revenue
        cursor.execute("""
            SELECT COALESCE(SUM(total_amount), 0) as year 
            FROM orders 
            WHERE YEAR(order_date) = YEAR(NOW())
        """)
        year_rev = cursor.fetchone()['year'] or 0
        
        # 2. HOTEL STATS
        cursor.execute("SELECT COUNT(*) as total_hotels FROM users WHERE role = 'hotel'")
        total_hotels = cursor.fetchone()['total_hotels'] or 0
        
        # Hotels with unpaid bills
        cursor.execute("""
            SELECT COUNT(DISTINCT u.id) as unpaid_hotels_count
            FROM users u
            JOIN orders o ON u.id = o.user_id
            JOIN bills b ON o.id = b.order_id
            WHERE u.role = 'hotel' AND b.paid = 0
        """)
        unpaid_hotels_count = cursor.fetchone()['unpaid_hotels_count'] or 0
        
        # Get unpaid hotels details
        cursor.execute("""
            SELECT 
                u.id,
                u.hotel_name,
                u.email,
                u.phone,
                COUNT(DISTINCT b.id) as unpaid_bills_count,
                COALESCE(SUM(b.total_amount), 0) as unpaid_total
            FROM users u
            JOIN orders o ON u.id = o.user_id
            JOIN bills b ON o.id = b.order_id
            WHERE u.role = 'hotel' AND b.paid = 0
            GROUP BY u.id, u.hotel_name, u.email, u.phone
            ORDER BY unpaid_total DESC
        """)
        unpaid_hotels = cursor.fetchall()
        
        # 3. REVENUE BY HOTEL (Top 10)
        cursor.execute("""
            SELECT 
                u.hotel_name,
                COUNT(DISTINCT o.id) as total_orders,
                COALESCE(SUM(o.total_amount), 0) as total_revenue,
                COALESCE(SUM(CASE WHEN b.paid = 1 THEN b.total_amount ELSE 0 END), 0) as paid_amount,
                COALESCE(SUM(CASE WHEN b.paid = 0 THEN b.total_amount ELSE 0 END), 0) as unpaid_amount
            FROM users u
            LEFT JOIN orders o ON u.id = o.user_id
            LEFT JOIN bills b ON o.id = b.order_id
            WHERE u.role = 'hotel'
            GROUP BY u.id, u.hotel_name
            ORDER BY total_revenue DESC
            LIMIT 10
        """)
        revenue_by_hotel = cursor.fetchall()
        
        # 4. TRENDS - Daily revenue (last 30 days)
        cursor.execute("""
            SELECT 
                DATE(order_date) as date,
                COALESCE(SUM(total_amount), 0) as revenue
            FROM orders 
            WHERE order_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY DATE(order_date)
            ORDER BY date ASC
        """)
        daily_trends = cursor.fetchall()
        
        # Format daily trends with proper date
        daily_data = []
        for row in daily_trends:
            daily_data.append({
                'date': row['date'].strftime('%Y-%m-%d') if row['date'] else '',
                'revenue': float(row['revenue'] or 0)
            })
        
        # 5. TRENDS - Monthly revenue (last 12 months)
        cursor.execute("""
            SELECT 
                DATE_TRUNC(DATE(order_date), MONTH) as month_start,
                MONTH(order_date) as month,
                YEAR(order_date) as year,
                COALESCE(SUM(total_amount), 0) as revenue
            FROM orders 
            WHERE order_date >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
            GROUP BY MONTH(order_date), YEAR(order_date)
            ORDER BY year ASC, month ASC
        """)
        monthly_trends_raw = cursor.fetchall()
        
        # Format monthly trends
        monthly_data = []
        month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        for row in monthly_trends_raw:
            month_idx = (row.get('month') or 1) - 1
            month_name = month_names[month_idx] if 0 <= month_idx < 12 else 'N/A'
            monthly_data.append({
                'month': month_name,
                'revenue': float(row.get('revenue') or 0)
            })
        
        # 6. TOP PRODUCTS
        cursor.execute("""
            SELECT 
                p.id,
                p.name as product_name,
                p.category,
                COALESCE(SUM(oi.quantity), 0) as total_quantity,
                COALESCE(SUM(oi.quantity * oi.price_per_unit), 0) as total_revenue
            FROM products p
            LEFT JOIN order_items oi ON p.id = oi.product_id
            GROUP BY p.id, p.name, p.category
            ORDER BY total_revenue DESC
            LIMIT 10
        """)
        top_products = cursor.fetchall()
        
        # Build response
        response = {
            'revenue': {
                'yesterday': float(yesterday_rev or 0),
                'month': float(month_rev or 0),
                'year': float(year_rev or 0)
            },
            'hotels': {
                'total_hotels': total_hotels,
                'unpaid_hotels_count': unpaid_hotels_count,
                'unpaid_hotels': unpaid_hotels,
                'revenue_by_hotel': revenue_by_hotel
            },
            'trends': {
                'daily': daily_data,
                'monthly': monthly_data
            },
            'top_products': top_products
        }
        
        return jsonify(response)
        
    except Exception as e:
        print(f"Analytics error: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@app.route('/api/admin/dashboard')
@token_required
@admin_required
def admin_dashboard(current_user):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM orders"); total_orders = cur.fetchone()[0]
    cur.execute("SELECT COALESCE(SUM(total_amount),0) FROM orders WHERE MONTH(created_at)=MONTH(NOW())"); month_revenue = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM orders WHERE status='pending'"); pending = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM products WHERE stock_quantity < 10"); out_of_stock = cur.fetchone()[0]
    cur.close(); conn.close()
    return jsonify({
        'total_orders': total_orders,
        'month_revenue': float(month_revenue),
        'pending_payments': pending,
        'out_of_stock': out_of_stock,
    })


# ======================
# ERROR HANDLERS
# ======================
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500


# ======================
# APPLICATION START
# ======================
if __name__ == '__main__':
    print("🚀 BVS Vegetable Suppliers API Starting...")
    print("📊 Features: Vegetables, Orders, Bills, Sessions, Admin Panel")
    print("🌐 Public Routes: Home, Vegetables, History")
    print("🔐 Authentication: Login, Logout, Session Management")
    print("🏨 Hotel Features: Dashboard, Cart, Order History, Bills")
    print("👑 Admin Features: Full System Control")
    app.run(debug=True, port=5000)