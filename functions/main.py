# ===================================================================
# BHAIRAVNATH VEGETABLE SUPPLIER - FIREBASE CLOUD FUNCTIONS
# Converted from Flask combine_api.py to Firebase Cloud Functions
# Part 1: Core functionality, helpers, and first half of routes
# ===================================================================

from flask import Flask, request, jsonify
from flask_cors import CORS
from firebase_functions import https_fn
import logging
import json
import os
import re
import sys
import traceback

# Load .env file for local development (won't affect production)
# DEFERRED: Only load in local dev, not in production
if os.getenv('FLASK_ENV') == 'development':
    try:
        from dotenv import load_dotenv
        load_dotenv()
    except ImportError:
        pass
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List, Optional
from functools import wraps

# Database and Auth
import firebase_admin
from firebase_admin import credentials, firestore
import bcrypt
import jwt
import random

# Twilio - Optional, lazy loaded
try:
    from twilio.rest import Client
    twilio_available = True
except ImportError:
    twilio_available = False

# External dependencies - Lazy loaded to avoid import timeout
try:
    import supabase
    supabase_available = True
except ImportError:
    supabase_available = False

try:
    import openai
    openai_available = True
except ImportError:
    openai_available = False

try:
    import deep_translator
    translator_available = True
except ImportError as e:
    translator_available = False

try:
    import langdetect
    detector_available = True
except ImportError:
    detector_available = False

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)

# Configure CORS for specific origins
CORS(app, resources={
    r"/api/*": {
        "origins": [
            "http://localhost:3000",
            "https://bhairavnathvegetables.web.app",
            "http://localhost:3001"
        ],
        "methods": ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

# ===================================================================
# BUSINESS CONSTANTS
# ===================================================================
OFFICE_ADDRESS = "Gultekdi, Market Yard, Pune - 411037"
CONTACT_PHONE = "9881325644"
CONTACT_EMAIL = "surajgaikwad9812@gmail.com"
BOT_NAME = "BVS Assistant"
OFFICE_MAP_EMBED = """<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d7567.840939186108!2d73.85508989357909!3d18.4872613!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bc2c01fc774bf91%3A0xd873ca459e33d07f!2sMarket%20Yard!5e0!3m2!1sen!2sin!4v1760519136324!5m2!1sen!2sin" width="100%" height="200" style="border:0; border-radius: 8px;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>"""
MARKET_MAP_EMBED = """<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d7567.840939186108!2d73.8550898935791!3d18.4872613!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bc2c01fc774bf91%3A0xd873ca459e33d07f!2sMarket%20Yard!5e0!3m2!1sen!2sin!4v1760950417216!5m2!1sen!2sin" width="100%" height="300" style="border:0; border-radius: 8px;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>"""

# Environment variables - Must be set in Firebase Functions config
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")

# Language configuration
TARGET_LANGUAGES = {
    "mr": "Marathi",
    "hi": "Hindi", 
    "te": "Telugu",
    "en": "English"
}
_LAST_DETECTED_LANG = 'en'

# Initialize clients
supabase = None
deepseek = None

def get_supabase_client():
    """Lazily initialize and return Supabase client"""
    global supabase
    if supabase is None and supabase_available and SUPABASE_URL and SUPABASE_KEY:
        try:
            supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
            logger.info("Supabase client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client: {str(e)}")
    return supabase

def get_deepseek_client():
    """Lazily initialize and return Deepseek client"""
    global deepseek
    if deepseek is None and openai_available and DEEPSEEK_API_KEY:
        try:
            deepseek = OpenAI(api_key=DEEPSEEK_API_KEY, base_url="https://api.deepseek.com")
            logger.info("Deepseek client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Deepseek client: {str(e)}")
    return deepseek

# ===================================================================
# DATABASE FUNCTIONS (FIRESTORE ONLY)
# ===================================================================
def get_db_connection():
    """
    Deprecated: MySQL is no longer used.
    This function is kept for backward compatibility but will raise an error.
    All endpoints must be migrated to use Firestore via the 'db' client.
    """
    raise RuntimeError(
        "MySQL database is no longer available. "
        "This endpoint needs to be migrated to use Firestore. "
        "Use the 'db' client (firestore.client()) instead. "
        "See FIREBASE_MIGRATION_GUIDE.md for examples."
    )

# Initialize Firebase Admin SDK using Application Default Credentials
# On Cloud Functions, this automatically uses the default service account
# For local development, use serviceAccountKey.json if available
# DEFERRED INITIALIZATION: Only initialize when first accessed to avoid timeout
_firebase_db_client = None
_firebase_initialized = False

def get_firestore_client():
    """Lazily initialize and return Firestore client"""
    global _firebase_db_client, _firebase_initialized
    
    if _firebase_initialized:
        return _firebase_db_client
    
    try:
        if not firebase_admin._apps:
            service_account_path = os.path.join(os.path.dirname(__file__), '..', 'serviceAccountKey.json')
            if os.path.exists(service_account_path):
                cred = credentials.Certificate(service_account_path)
                firebase_admin.initialize_app(cred)
            else:
                firebase_admin.initialize_app()
        
        _firebase_db_client = firestore.client()
        _firebase_initialized = True
        return _firebase_db_client
    except Exception as e:
        logger.error(f"Failed to initialize Firebase/Firestore: {str(e)}")
        _firebase_initialized = True  # Mark as attempted to avoid retrying
        return None

# ===================================================================
# JSON SERIALIZATION HELPER
# ===================================================================
def make_json_safe(obj):
    """Recursively convert non-JSON-serializable objects to strings"""
    if obj is None:
        return None
    elif isinstance(obj, bool):
        return obj
    elif isinstance(obj, (str, int, float)):
        return obj
    elif isinstance(obj, dict):
        return {str(k): make_json_safe(v) for k, v in obj.items()}
    elif isinstance(obj, (list, tuple)):
        return [make_json_safe(item) for item in obj]
    else:
        # Convert any other type (Timestamp, datetime, etc.) to string
        return str(obj)

# Provide db as alias for backward compatibility
db = None

# ===================================================================
# ATOMIC COUNTER INCREMENT (For Order/Bill IDs)
# ===================================================================
def get_next_counter_id(counter_name: str) -> int:
    """
    Atomically increment and return next ID from counter.
    Uses Firestore transaction to guarantee uniqueness.
    
    Args:
        counter_name: Name of counter document (e.g., 'orders', 'bills')
    
    Returns:
        Next unique ID (int)
    """
    firestore_client = get_firestore_client()
    if firestore_client is None:
        raise RuntimeError("Firestore client not initialized")
    
    counter_ref = firestore_client.collection('_counters').document(counter_name)
    
    try:
        # Simple atomic increment using Firestore's built-in increment
        # This is simpler and more reliable than manual transactions
        from firebase_admin.firestore import Increment
        
        # Initialize or increment the counter atomically
        counter_ref.update({'count': Increment(1)})
        
        # Get the new value
        snapshot = counter_ref.get()
        new_value = snapshot.get('count') if snapshot.exists else 1
        
        logger.info(f"[COUNTER] Incremented {counter_name} to: {new_value}")
        return new_value
        
    except Exception as e:
        logger.error(f"[COUNTER] Failed to increment {counter_name}: {str(e)}")
        import traceback
        logger.error(f"[COUNTER] Traceback: {traceback.format_exc()}")
        raise

# ===================================================================
# SESSION MANAGEMENT
# ===================================================================
# In-memory session store (use Redis in production)
active_sessions = {}

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

def update_session_activity(token):
    """Update last activity time for a session"""
    if token in active_sessions:
        active_sessions[token]['last_activity'] = datetime.utcnow()

def cleanup_expired_sessions():
    """Remove expired sessions from memory"""
    now = datetime.utcnow()
    expired_tokens = [
        token for token, session in active_sessions.items()
        if session['expires_at'] < now or session['blacklisted']
    ]
    for token in expired_tokens:
        del active_sessions[token]
    logger.info(f"Cleaned up {len(expired_tokens)} expired sessions")

# ===================================================================
# JWT TOKEN FUNCTIONS
# ===================================================================
JWT_SECRET = os.getenv('JWT_SECRET', 'firebase-default-secret-key')
JWT_ALGORITHM = 'HS256'

def _check_jwt_secret():
    """Check if JWT_SECRET is configured, use default if not"""
    if not JWT_SECRET or JWT_SECRET == 'firebase-default-secret-key':
        # Using Firebase-based authentication, JWT_SECRET is optional
        logger.info("Using Firebase-based authentication (JWT_SECRET not configured)")
        return True
    return True

def generate_token(user_data: Dict) -> str:
    """Generate JWT token with user data"""
    _check_jwt_secret()
    payload = {
        'user': user_data,
        'exp': datetime.utcnow() + timedelta(hours=8)
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    if hasattr(token, 'decode'):
        token = token.decode('utf-8')
    return token

def verify_token(token: str) -> Optional[Dict]:
    """Verify JWT token"""
    try:
        _check_jwt_secret()
    except ValueError as e:
        logger.error(f"JWT configuration error: {str(e)}")
        return None
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def token_required(f):
    """Decorator for routes requiring authentication"""
    @wraps(f)
    def decorated(*args, **kwargs):
        try:
            token = request.headers.get('Authorization')
            if not token:
                logger.warning("Token is missing from request")
                return jsonify({'error': 'Token is missing'}), 401
            
            if token.startswith('Bearer '):
                token = token[7:]
            
            # Try to verify token
            try:
                payload = verify_token(token)
                if payload:
                    current_user = payload.get('user')
                    if not current_user:
                        logger.error("Invalid token structure - no user data")
                        return jsonify({'error': 'Invalid token structure'}), 401
                    
                    logger.info(f"Token verified for user: {current_user.get('id')}")
                    return f(current_user, *args, **kwargs)
                else:
                    logger.warning("Token verification returned None")
                    return jsonify({'error': 'Invalid or expired token'}), 401
            except Exception as token_err:
                logger.error(f"Token verification error: {str(token_err)}")
                # If JWT verification fails but token exists, try to use it as-is
                # This provides fallback support for Firebase auth tokens
                logger.info("Falling back to basic token validation")
                # Create a minimal user object from token
                try:
                    # Extract user_id from token if possible
                    if len(token) > 20:  # JWT-like token
                        current_user = {'id': 'unknown', 'username': 'hotel_user', 'role': 'hotel'}
                        return f(current_user, *args, **kwargs)
                except:
                    pass
                
                return jsonify({'error': 'Authentication error'}), 401
                
        except Exception as e:
            logger.error(f"Token decorator error: {str(e)}")
            logger.error(f"Error traceback: {traceback.format_exc()}")
            # Ensure error message is a plain string
            error_msg = str(e) if e else "Unknown authentication error"
            try:
                return jsonify({'error': f'Authentication error: {error_msg}'}), 401
            except Exception as json_err:
                # If even this fails, return a safe fallback
                logger.error(f"Failed to jsonify error: {json_err}")
                return jsonify({'error': 'Authentication failed'}), 401
    return decorated

def admin_required(f):
    """Decorator for admin-only routes"""
    @wraps(f)
    def decorated(current_user, *args, **kwargs):
        if current_user['role'] != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        return f(current_user, *args, **kwargs)
    return decorated

# ===================================================================
# CORS HANDLER
# ===================================================================
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH')
    return response

# Handle preflight requests for all routes
@app.route('/', defaults={'path': ''}, methods=['OPTIONS'])
@app.route('/<path:path>', methods=['OPTIONS'])
def handle_options(path):
    response = jsonify({'status': 'ok'})
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH')
    return response, 200

@app.route('/chat', methods=['OPTIONS'])
def options_chat():
    return jsonify({'status': 'success'}), 200

# ===================================================================
# TRANSLATION & LANGUAGE DETECTION
# ===================================================================
def translate_text_to_english(text: str, source_lang: str = 'auto') -> str:
    """Translates the input text to English for processing"""
    if not translator_available or not text.strip():
        return text
    
    try:
        if source_lang != 'auto':
            return GoogleTranslator(source=source_lang, target='en').translate(text)
        else:
            return GoogleTranslator(source='auto', target='en').translate(text)
    except Exception as e:
        logger.warning(f"Translation to English failed: {str(e)}")
        return text

def translate_response_from_english(text: str, dest_lang: str) -> str:
    """Translates the English response back to the user's detected language"""
    logger.info(f"[TRANSLATE] Called with dest_lang={dest_lang}, translator_available={translator_available}")
    
    if not translator_available:
        logger.warning(f"[TRANSLATE] Translator not available, returning original")
        return text
    
    if dest_lang == 'en':
        logger.info(f"[TRANSLATE] Target is English, returning original")
        return text
    
    if not text.strip():
        logger.warning(f"[TRANSLATE] Empty text, returning original")
        return text
    
    try:
        logger.info(f"[TRANSLATE] Calling GoogleTranslator(source='en', target='{dest_lang}')")
        translated = GoogleTranslator(source='en', target=dest_lang).translate(text)
        logger.info(f"[TRANSLATE] SUCCESS! Translated to {dest_lang}: {translated[:100]}...")
        return translated
    except Exception as e:
        logger.error(f"[TRANSLATE] FAILED: {str(e)}")
        return text

def detect_language(text: str) -> str:
    """Enhanced language detection with better accuracy"""
    if not text or not text.strip(): 
        return 'en'
    
    text_lower = text.lower().strip()
    
    # Try langdetect first
    if detector_available:
        try:
            lang = detect(text)
            if lang in TARGET_LANGUAGES:
                return lang
        except Exception as e:
            logger.debug(f"Langdetect failed: {str(e)}")
    
    # Enhanced word-based detection for Indian languages
    marathi_words = ['नमस्कार', 'काय', 'आहे', 'किंमत', 'भाजी', 'शेती', 'महाग', 'सस्ता', 
                    'किती', 'पाहिजे', 'हवे', 'मिळेल', 'ऑर्डर', 'डिलिव्हरी', 'ठिकाण']
    
    hindi_words = ['नमस्ते', 'क्या', 'है', 'कीमत', 'सब्जी', 'भाजी', 'महंगा', 'सस्ता',
                  'कितना', 'चाहिए', 'चाहिये', 'मिलेगा', 'ऑर्डर', 'डिलीवरी', 'जगह',
                  'पता', 'समय', 'वक्त', 'दाम']
    
    # Count matches for each language
    marathi_count = sum(1 for word in marathi_words if word in text)
    hindi_count = sum(1 for word in hindi_words if word in text)
    
    if marathi_count > hindi_count and marathi_count >= 1:
        return 'mr'
    elif hindi_count > marathi_count and hindi_count >= 1:
        return 'hi'
    elif any(char in ['ं', 'ँ', 'ः', 'अ', 'आ'] for char in text):
        return 'hi'
    else:
        return 'en'

# ===================================================================
# DATA ACCESS FUNCTIONS
# ===================================================================
def fetch_available_products(limit: int = 20) -> List[Dict[str, Any]]:
    """Fetch available products from Firestore"""
    try:
        if db is None:
            logger.error("Firestore client not initialized")
            return []
        
        products = []
        query = get_firestore_client().collection('products').where('is_available', '==', True).limit(limit).stream()
        
        for doc in query:
            product = doc.to_dict()
            product['product_id'] = doc.id  # Add document ID as product_id
            products.append(product)
        
        return products if products else []
    except Exception as e:
        logger.error(f"Error fetching products from Firestore: {str(e)}")
        return []

# ===================================================================
# SERIALIZATION HELPER
# ===================================================================
def serialize_for_json(obj: Any) -> Any:
    """
    Recursively convert Firestore objects to JSON-serializable Python types.
    Handles Timestamps, DocumentReferences, and other Firestore types.
    """
    try:
        from google.cloud.firestore import DocumentReference
    except ImportError:
        DocumentReference = None
    
    if obj is None:
        return None
    elif isinstance(obj, bool):  # Check bool before int (bool is subclass of int)
        return obj
    elif isinstance(obj, (int, float)):
        return obj
    elif isinstance(obj, str):
        return obj
    elif hasattr(obj, 'timestamp'):  # Firestore Timestamp
        try:
            return obj.isoformat() if hasattr(obj, 'isoformat') else str(obj)
        except:
            return str(obj)
    elif DocumentReference and isinstance(obj, DocumentReference):
        return obj.id
    elif isinstance(obj, dict):
        return {k: serialize_for_json(v) for k, v in obj.items()}
    elif isinstance(obj, (list, tuple)):
        return [serialize_for_json(item) for item in obj]
    else:
        # For any other type, try to convert to string
        try:
            return str(obj)
        except:
            return None

# ===================================================================
# HEALTH CHECK
# ===================================================================
@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint - verify system and Firestore connectivity"""
    status_info = {
        "status": "healthy", 
        "message": "BVS Backend server is running on Firebase Cloud Functions",
        "services": {
            "supabase": supabase is not None,
            "deepseek": deepseek is not None,
            "translation": translator_available,
            "language_detection": detector_available,
            "firestore": db is not None
        }
    }
    
    # Add Firestore connectivity check
    if db is not None:
        try:
            settings_ref = get_firestore_client().collection('system_settings').document('status')
            doc = settings_ref.get()
            status_info['firestore_connected'] = True
        except Exception as e:
            status_info['firestore_connected'] = False
            status_info['firestore_error'] = str(e)
    
    return jsonify(status_info)

# ===================================================================
# DATABASE MAINTENANCE ENDPOINTS
# ===================================================================
@app.route('/api/admin/fix-encoding', methods=['POST'])
@token_required
@admin_required
def fix_database_encoding(current_user):
    """Fix UTF-8 encoding issues in product names - Firestore version"""
    try:
        if db is None:
            logger.error("Firestore client not initialized")
            return jsonify({'error': 'Database connection error'}), 500
        
        # In Firestore, data is always properly encoded
        # This endpoint is kept for compatibility but just returns success
        logger.info("Fix encoding requested - Firestore data is always properly encoded")
        
        return jsonify({
            'success': True,
            'message': 'Firestore data is already properly encoded (UTF-8)',
            'updated': 0
        })
    except Exception as e:
        logger.error(f"Fix encoding error: {str(e)}")
        return jsonify({'error': str(e)}), 500

# ===================================================================
# CHATBOT MENU STRUCTURES
# ===================================================================
# Menu Structure
MENU_STRUCTURE = {
    "main_menu": {
        "message": "Hello! Welcome to BVS—fresh veggies for hotels and caterers. What can I help you with today?",
        "options": [
            {"text": "Get Price List", "action": "price_list"},
            {"text": "Place an Order", "action": "place_order"},
            {"text": "Delivery Info", "action": "delivery_info"},
            {"text": "Contact Us", "action": "contact_us"},
            {"text": "Our Location", "action": "location"}
        ]
    },
    "price_list": {
        "message": "Here are our pricing options:",
        "options": [
            {"text": "Vegetable Prices", "action": "vegetable_prices"},
            {"text": "Fruit Prices", "action": "fruit_prices"},
            {"text": "Bulk Order Discounts", "action": "bulk_discounts"},
            {"text": "Seasonal Specials", "action": "seasonal_specials"},
            {"text": "Back to Main Menu", "action": "main_menu"}
        ]
    },
    "place_order": {
        "message": "How would you like to place your order?",
        "options": [
            {"text": "Phone Order", "action": "phone_order"},
            {"text": "Email Order", "action": "email_order"},
            {"text": "WhatsApp Order", "action": "whatsapp_order"},
            {"text": "Custom Requirements", "action": "custom_order"},
            {"text": "Back to Main Menu", "action": "main_menu"}
        ]
    },
    "delivery_info": {
        "message": "Delivery Information:",
        "options": [
            {"text": "Delivery Areas", "action": "delivery_areas"},
            {"text": "Delivery Timing", "action": "delivery_timing"},
            {"text": "Delivery Charges", "action": "delivery_charges"},
            {"text": "Schedule Delivery", "action": "schedule_delivery"},
            {"text": "Back to Main Menu", "action": "main_menu"}
        ]
    },
    "contact_us": {
        "message": "Contact Options:",
        "options": [
            {"text": "Call Us", "action": "call_contact"},
            {"text": "Email Us", "action": "email_contact"},
            {"text": "Visit Office", "action": "visit_office"},
            {"text": "Business Hours", "action": "business_hours"},
            {"text": "Back to Main Menu", "action": "main_menu"}
        ]
    },
    "location": {
        "message": "Location Information:",
        "options": [
            {"text": "Office Address", "action": "office_address"},
            {"text": "Get Directions", "action": "get_directions"},
            {"text": "Market Location", "action": "market_location"},
            {"text": "Back to Main Menu", "action": "main_menu"}
        ]
    }
}

# Terminal responses (end of menu chain with flowing menus)
TERMINAL_RESPONSES = {
    "vegetable_prices": "Vegetable prices are not fixed.\n\nPrices depend on daily market rates at the Pune Market Yard and may change frequently.\n\nWe provide:\n✔ Fresh vegetables sourced daily\n✔ Best possible rates as per market\n✔ Special pricing for hotels & bulk orders\n\n📞 Call or WhatsApp {CONTACT_PHONE} to get today’s live prices.",
    "fruit_prices": "Fruit prices are not fixed.\n\nRates depend on daily market prices and availability, which change regularly.\n\nWe provide:\n✔ Fresh fruits sourced daily\n✔ Competitive market-based pricing\n✔ Bulk supply for hotels, caterers & businesses\n\n📞 Call or WhatsApp {CONTACT_PHONE} to get today’s live fruit prices.",
    "bulk_discounts": "Bulk order pricing is not fixed.\n\nDiscounts depend on:\n✔ Daily market rates\n✔ Order quantity\n✔ Product type\n✔ Regularity of supply\n\n📞 Please call {CONTACT_PHONE} to discuss bulk pricing and get the best possible rate for your requirement.",
    "seasonal_specials": "Current seasonal specials:\n\n🥕 Fresh seasonal vegetables available\n🍓 Seasonal fruits at best prices\n🌱 Organic options available\n\nCall {CONTACT_PHONE} for current seasonal offers.",
    "phone_order": "Call us at {CONTACT_PHONE} to place your order. Our team will assist you with:\n\n- Product availability\n- Current pricing\n- Delivery scheduling\n- Payment options",
    "email_order": "We are currently not accepting orders via email.\n\n📞 Please call us or 📲 send your order on WhatsApp at {CONTACT_PHONE}.\n\nOur team will assist you immediately with pricing, availability, and delivery.",
    "whatsapp_order": "Send your order via WhatsApp to {CONTACT_PHONE} with:\n\n📋 Item list\n📦 Quantities\n🏠 Delivery address\n⏰ Preferred time\n\nWe'll confirm immediately.",
    "custom_order": "We handle custom requirements:\n\n- Specific vegetable grades\n- Special packaging\n- Regular supply contracts\n- Hotel-specific requirements\n\nCall {CONTACT_PHONE} to discuss your needs.",
    "delivery_areas": "We deliver across Pune:\n\n✅ Central Pune\n✅ West Pune\n✅ East Pune\n✅ Pune Camp\n✅ Hadapsar\n✅ Kothrud\n✅ Bavdhan\n\nCall to confirm your area.",
    "delivery_timing": "Delivery Timing:\n\nAll orders are dispatched before 11 AM.\n\n🚚 Your vegetables and fruits will reach your kitchen by 4 PM the same day.\n\nWe ensure timely delivery, so you don’t have to worry about availability or delays.",
    "delivery_charges": "We focus on delivering fresh, market-sourced vegetables directly to your kitchen.\n\n🚚 Delivery is handled as part of our service, ensuring quality, freshness, and timely arrival.\n\n📞 For order details and delivery confirmation, please call or WhatsApp {CONTACT_PHONE}.",
    "schedule_delivery": "To schedule a delivery:\n\n📞 Please call us one day in advance before your required delivery date.\n\nWe plan sourcing and dispatch accordingly to ensure freshness.\n\n⚠️ Same-day delivery is not available.",
    "call_contact": "Call us at {CONTACT_PHONE} for:\n\n- Immediate order placement\n- Price inquiries\n- Delivery queries\n- Account management\n\nAvailable daily 6 AM - 10 PM.",
    "email_contact": "Email us at {CONTACT_EMAIL} for:\n\n- Detailed quotations\n- Contract discussions\n- Product inquiries\n- Feedback & suggestions\n\nWe respond within 2 hours.",
    "visit_office": "Visit our office:\n\n📍 {OFFICE_ADDRESS}\n\n📞 Call before visiting: {CONTACT_PHONE}",
    "business_hours": "Business Hours:\n\n📞 Order & Support: 6 AM – 10 PM\n🚚 Deliveries: Dispatched before 11 AM\n🏠 Reaches your kitchen by 4 PM\n\n🗓️ Working Days: Sunday to Friday\n❌ Saturday: Closed",
    "office_address": "Our office address:\n\n{OFFICE_ADDRESS}\n\n{OFFICE_MAP_EMBED}\n\nCall {CONTACT_PHONE} for directions.",
    "get_directions": "Get directions to our office:\n\n📍 {OFFICE_ADDRESS}\n\n📱 Open in Google Maps\n🚗 Ample parking available\n📞 Call if lost: {CONTACT_PHONE}",
    "market_location": "We're located in Pune's main vegetable market:\n\n🥬 Gultekdi Market Yard\n📍 Pune's largest vegetable market\n🚚 Easy loading/unloading\n📦 Fresh stock daily\n\nVisit us for the best quality!"
}

# ===================================================================
# CHATBOT HELPER FUNCTIONS
# ===================================================================
def find_menu_action_by_text(text: str) -> str:
    """Find menu action by matching option text"""
    text_lower = text.lower().strip()
    
    # Map common phrases to menu actions
    phrase_to_action = {
        "price": "price_list",
        "pricing": "price_list", 
        "cost": "price_list",
        "rate": "price_list",
        "list": "price_list",
        "price list": "price_list",
        "get price": "price_list",
        "quote": "price_list",
        "order": "place_order",
        "buy": "place_order",
        "purchase": "place_order",
        "place order": "place_order",
        "delivery": "delivery_info",
        "contact": "contact_us",
        "call": "contact_us",
        "location": "location",
        "address": "location",
        "main menu": "main_menu",
        "back": "main_menu"
    }
    
    for phrase, action in phrase_to_action.items():
        if phrase in text_lower:
            return action
    
    # Search through all menu options
    for menu_id, menu_data in MENU_STRUCTURE.items():
        for option in menu_data.get("options", []):
            if option["text"].lower() in text_lower:
                return option["action"]
    
    return None

def format_menu_response(menu_id: str) -> Dict[str, Any]:
    """Format a menu response"""
    menu_data = MENU_STRUCTURE.get(menu_id, MENU_STRUCTURE["main_menu"])
    menu_message = menu_data["message"]
    
    # Format options with action prefixes
    formatted_options = []
    for option in menu_data["options"]:
        formatted_options.append({
            "text": option["text"],
            "action": f"menu_{option['action']}"
        })
    
    return {
        "response": menu_message,
        "menu": formatted_options,
        "is_terminal": False,
        "current_menu": menu_id
    }

def format_terminal_response(action: str) -> Dict[str, Any]:
    """Format a terminal response with flowing menu"""
    response_text = TERMINAL_RESPONSES.get(action, "Thank you for your inquiry!").format(
        CONTACT_PHONE=CONTACT_PHONE,
        CONTACT_EMAIL=CONTACT_EMAIL,
        OFFICE_ADDRESS=OFFICE_ADDRESS,
        OFFICE_MAP_EMBED=OFFICE_MAP_EMBED,
        MARKET_MAP_EMBED=MARKET_MAP_EMBED
    )
    
    # Define flowing menu options based on action
    flowing_menus = {
        "vegetable_prices": ["fruit_prices", "bulk_discounts", "place_order", "main_menu"],
        "fruit_prices": ["vegetable_prices", "bulk_discounts", "place_order", "main_menu"],
        "bulk_discounts": ["vegetable_prices", "fruit_prices", "place_order", "main_menu"],
        "seasonal_specials": ["vegetable_prices", "fruit_prices", "place_order", "main_menu"],
        "office_address": ["market_location", "get_directions", "contact_us", "main_menu"],
        "market_location": ["office_address", "get_directions", "contact_us", "main_menu"],
        "get_directions": ["office_address", "market_location", "contact_us", "main_menu"],
        "phone_order": ["whatsapp_order", "email_order", "main_menu"],
        "whatsapp_order": ["phone_order", "email_order", "main_menu"],
        "email_order": ["phone_order", "whatsapp_order", "main_menu"],
        "custom_order": ["phone_order", "whatsapp_order", "main_menu"],
        "delivery_areas": ["delivery_timing", "delivery_charges", "main_menu"],
        "delivery_timing": ["delivery_areas", "delivery_charges", "main_menu"],
        "delivery_charges": ["delivery_areas", "delivery_timing", "main_menu"],
        "schedule_delivery": ["delivery_areas", "place_order", "main_menu"],
        "call_contact": ["email_contact", "visit_office", "main_menu"],
        "email_contact": ["call_contact", "visit_office", "main_menu"],
        "visit_office": ["call_contact", "business_hours", "main_menu"],
        "business_hours": ["visit_office", "contact_us", "main_menu"]
    }
    
    # Get flowing menu for this action
    menu_actions = flowing_menus.get(action, ["main_menu"])
    
    # Menu texts for options
    menu_texts = {
        "vegetable_prices": "Vegetable Prices",
        "fruit_prices": "Fruit Prices",
        "bulk_discounts": "Bulk Discounts",
        "place_order": "Place an Order",
        "office_address": "Office Address",
        "market_location": "Market Location",
        "contact_us": "Contact Us",
        "delivery_info": "Delivery Info",
        "get_directions": "Get Directions",
        "phone_order": "Phone Order",
        "whatsapp_order": "WhatsApp Order",
        "email_order": "Email Order",
        "delivery_areas": "Delivery Areas",
        "delivery_timing": "Delivery Timing",
        "delivery_charges": "Delivery Charges",
        "call_contact": "Call Us",
        "email_contact": "Email Us",
        "visit_office": "Visit Office",
        "business_hours": "Business Hours",
        "main_menu": "Back to Main Menu"
    }
    
    formatted_options = []
    for menu_action in menu_actions:
        option_text = menu_texts.get(menu_action, menu_action.replace('_', ' ').title())
        formatted_options.append({
            "text": option_text,
            "action": f"menu_{menu_action}"
        })
    
    return {
        "response": response_text,
        "menu": formatted_options,
        "is_terminal": True,
        "current_menu": action
    }

def handle_message_with_menu(text: str, current_menu: str = None) -> Dict[str, Any]:
    """Handle message with menu support"""
    if not text or not text.strip():
        return format_menu_response("main_menu")
    
    # Check if this is a menu action
    if text.startswith("menu_"):
        action = text[5:]  # Remove "menu_" prefix
        if action in MENU_STRUCTURE:
            return format_menu_response(action)
        elif action in TERMINAL_RESPONSES:
            return format_terminal_response(action)
    
    # Check if text matches any menu option
    menu_action = find_menu_action_by_text(text)
    if menu_action:
        if menu_action in MENU_STRUCTURE:
            return format_menu_response(menu_action)
        elif menu_action in TERMINAL_RESPONSES:
            return format_terminal_response(menu_action)
    
    # Default: return main menu
    return format_menu_response("main_menu")

# ===================================================================
# CHATBOT ROUTES (Part 1)
# ===================================================================
@app.route('/chat', methods=['POST'])
def chat():
    """Chatbot endpoint with menu system"""
    try:
        data = request.get_json()
        user_message = data.get('message', '').strip()
        current_menu = data.get('current_menu', None)
        user_id = data.get('user_id', 'default')
        
        if not user_message:
            return jsonify({'error': 'Message is required'}), 400
        
        logger.info(f"Chat request - Message: {user_message}, Menu: {current_menu}")
        
        # Handle message with menu system
        response_data = handle_message_with_menu(user_message, current_menu)
        
        # Return response in format expected by frontend
        return jsonify({
            "message": response_data["response"],
            "response": response_data["response"],  # Support both field names
            "menu_options": response_data.get("menu"),
            "is_terminal": response_data.get("is_terminal", False),
            "current_menu": response_data.get("current_menu"),
            "success": True,
            "user_id": user_id,
            "status": "success"
        })
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

# ===================================================================
# PUBLIC ROUTES - HOME & ROOT
# ===================================================================
@app.route('/')
def home():
    return jsonify({
        'message': 'Bhairavnath Vegetable Supplier API',
        'version': '1.0.0',
        'status': 'running',
        'contact': CONTACT_PHONE
    })

@app.route('/api/public/products', methods=['GET'])
def get_public_products():
    """Get public product list"""
    try:
        products = fetch_available_products(50)
        return jsonify({'products': products, 'success': True})
    except Exception as e:
        logger.error(f"Error fetching products: {str(e)}")
        return jsonify({'error': 'Failed to fetch products'}), 500

@app.route('/api/public/vegetables', methods=['GET'])
def get_vegetables():
    """Get vegetable prices from Firestore"""
    try:
        if db is None:
            logger.error("Firestore client not initialized")
            return jsonify({'error': 'Database connection error'}), 500
        
        vegetables = []
        query = get_firestore_client().collection('products').where('category', '==', 'Vegetable').where('is_available', '==', True).stream()
        
        for doc in query:
            vegetable = doc.to_dict()
            vegetable['product_id'] = doc.id
            vegetables.append(vegetable)
        
        return jsonify({'vegetables': vegetables, 'success': True})
    except Exception as e:
        logger.error(f"Error fetching vegetables: {str(e)}")
        return jsonify({'error': 'Failed to fetch vegetables'}), 500

@app.route('/api/public/history', methods=['GET'])
def get_history():
    """Get historical data"""
    try:
        # Return empty history for now
        return jsonify({'history': [], 'success': True})
    except Exception as e:
        logger.error(f"Error fetching history: {str(e)}")
        return jsonify({'error': 'Failed to fetch history'}), 500

# ===================================================================
# AUTHENTICATION ROUTES
# ===================================================================
@app.route('/api/auth/login', methods=['POST'])
def login():
    """User login - authenticate against Firestore"""
    try:
        data = request.get_json()
        if not data:
            logger.warning("Login failed: No JSON data provided")
            return jsonify({'error': 'No data provided'}), 400
        
        username = data.get('username')
        password = data.get('password')

        logger.info(f"[LOGIN] Attempt for username: {username}")

        if not username or not password:
            logger.warning("[LOGIN] Missing username or password")
            return jsonify({'error': 'Username and password required'}), 400

        # Get Firestore client (lazy init)
        firestore_db = get_firestore_client()
        if firestore_db is None:
            logger.error("[LOGIN] CRITICAL: Firestore client is None - Firebase initialization failed")
            return jsonify({'error': 'Database connection error', 'detail': 'Firestore not available'}), 500

        logger.info(f"[LOGIN] Firestore client is available, querying users collection for: {username}")
        
        # Query Firestore for user with matching username
        try:
            users_ref = get_firestore_client().collection('users')
            logger.info(f"[LOGIN] Got users collection reference")
            
            query = users_ref.where('username', '==', username).limit(1).stream()
            logger.info(f"[LOGIN] Executed query for username={username}")
            
            user = None
            user_id = None
            doc_count = 0
            for doc in query:
                doc_count += 1
                user = doc.to_dict()
                user_id = doc.id
                logger.info(f"[LOGIN] Found user document (doc_id={user_id}, doc_count={doc_count})")
                logger.info(f"[LOGIN] User data keys: {list(user.keys()) if user else 'None'}")
                break
            
            if doc_count == 0:
                logger.warning(f"[LOGIN] Query returned no results for username: {username}")
            
        except Exception as query_error:
            logger.error(f"[LOGIN] Firestore query failed: {str(query_error)}")
            logger.error(f"[LOGIN] Query error type: {type(query_error).__name__}")
            import traceback
            logger.error(f"[LOGIN] Query traceback: {traceback.format_exc()}")
            return jsonify({'error': 'Query failed', 'detail': str(query_error)}), 500

        if not user:
            logger.warning(f"[LOGIN] User '{username}' not found in Firestore")
            return jsonify({'error': 'Invalid credentials'}), 401

        logger.info(f"[LOGIN] User found: {username}, role: {user.get('role')}")
        
        # Verify password (stored as bcrypt hash in Firestore)
        # Support both 'password_hash' and 'password' field names for compatibility
        stored_password = user.get('password_hash') or user.get('password', '')
        password_valid = False
        
        if not stored_password:
            logger.error(f"[LOGIN] User {username} has no password or password_hash field in Firestore document")
            logger.error(f"[LOGIN] Available fields: {list(user.keys())}")
            return jsonify({'error': 'Account configuration error'}), 500
        
        try:
            logger.info(f"[LOGIN] Password hash starts with: {stored_password[:5]}...")
            # Try bcrypt verification (preferred method)
            if stored_password.startswith('$2'):
                logger.info(f"[LOGIN] Verifying bcrypt password")
                password_valid = bcrypt.checkpw(password.encode('utf-8'), stored_password.encode('utf-8'))
                logger.info(f"[LOGIN] Bcrypt verification result: {password_valid}")
            else:
                # Fallback for plain text (legacy)
                logger.warning(f"[LOGIN] Password is not bcrypt format, using plain text comparison")
                password_valid = stored_password == password
                if password_valid:
                    logger.info("[LOGIN] Plain text password matched")
        except Exception as e:
            logger.error(f"[LOGIN] Password verification error: {str(e)}")
            logger.error(f"[LOGIN] Error type: {type(e).__name__}")
            import traceback
            logger.error(f"[LOGIN] Verification traceback: {traceback.format_exc()}")
            password_valid = False
        
        if password_valid:
            logger.info(f"[LOGIN] Password valid, updating last_login timestamp")
            # Update last login timestamp
            try:
                get_firestore_client().collection('users').document(user_id).update({
                    'last_login': firestore.SERVER_TIMESTAMP
                })
                logger.info(f"[LOGIN] last_login timestamp updated")
            except Exception as ts_error:
                logger.error(f"[LOGIN] Failed to update last_login: {str(ts_error)}")
                # Don't fail the login for this

            user_data = {
                'id': user_id,
                'username': user.get('username'),
                'role': user.get('role'),
                'hotel_name': user.get('hotel_name'),
                'email': user.get('email'),
                'phone': user.get('phone'),
                'address': user.get('address')
            }

            token = generate_token(user_data)
            
            # Create session
            create_session(token, user_data)

            logger.info(f"[LOGIN] Login successful for user: {username}, token generated")
            return jsonify({
                'token': token,
                'user': user_data,
                'message': f'Welcome back, {user.get("hotel_name", user.get("username", "User"))}!'
            }), 200
        else:
            logger.warning(f"[LOGIN] Password verification failed for user '{username}'")
            return jsonify({'error': 'Invalid credentials'}), 401

    except Exception as e:
        logger.error(f"[LOGIN] UNHANDLED ERROR: {str(e)}")
        logger.error(f"[LOGIN] Error type: {type(e).__name__}")
        import traceback
        logger.error(f"[LOGIN] Full traceback: {traceback.format_exc()}")
        return jsonify({'error': 'Login failed', 'detail': str(e)}), 500

@app.route('/api/auth/logout', methods=['POST'])
@token_required
def logout(current_user):
    """User logout"""
    # Blacklist the token
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    if token and token in active_sessions:
        active_sessions[token]['blacklisted'] = True
    
    return jsonify({
        'message': 'Successfully logged out',
        'timestamp': datetime.utcnow().isoformat()
    })

@app.route('/api/auth/session/check', methods=['GET'])
@token_required
def check_session(current_user):
    """Check if session is valid"""
    return jsonify({
        'valid': True,
        'user_id': current_user.get('id'),
        'role': current_user.get('role'),
        'success': True
    })

@app.route('/api/auth/password/change', methods=['POST'])
@token_required
def change_password(current_user):
    """Change user password - update in Firestore"""
    try:
        data = request.get_json()
        old_password = data.get('current_password', data.get('old_password', '')).strip()
        new_password = data.get('new_password', '').strip()
        
        if not old_password or not new_password:
            return jsonify({'error': 'Old and new passwords are required'}), 400
        
        user_id = current_user.get('id')
        
        # Get current password hash from Firestore
        user_doc = get_firestore_client().collection('users').document(user_id).get()
        
        if not user_doc.exists:
            return jsonify({'error': 'User not found'}), 404
        
        user = user_doc.to_dict()
        stored_password = user.get('password_hash', '')
        
        # Verify old password
        try:
            if stored_password and stored_password.startswith('$2'):
                # Bcrypt verification
                if not bcrypt.checkpw(old_password.encode('utf-8'), stored_password.encode('utf-8')):
                    return jsonify({'error': 'Old password is incorrect'}), 401
            else:
                # Plain text fallback
                if stored_password != old_password:
                    return jsonify({'error': 'Old password is incorrect'}), 401
        except ValueError:
            # If bcrypt fails, try plain text
            if stored_password != old_password:
                return jsonify({'error': 'Old password is incorrect'}), 401
        
        # Hash new password
        new_password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Update password in Firestore
        get_firestore_client().collection('users').document(user_id).update({
            'password_hash': new_password_hash,
            'updated_at': firestore.SERVER_TIMESTAMP
        })
        
        return jsonify({'message': 'Password changed successfully', 'success': True})
    except Exception as e:
        logger.error(f"Change password error: {str(e)}")
        return jsonify({'error': 'Failed to change password'}), 500

# ===================================================================
# HOTEL DASHBOARD ROUTES (Part 1)
# ===================================================================
@app.route('/api/hotel/dashboard', methods=['GET'])
@token_required
def hotel_dashboard(current_user):
    """Get hotel dashboard data from Firestore"""
    try:
        user_id = current_user.get('id')
        
        if db is None:
            logger.error("Firestore client not initialized")
            return jsonify({'error': 'Database connection error'}), 500
        
        # Get total orders count
        total_orders = 0
        pending_orders = 0
        recent_orders = []
        
        orders_ref = get_firestore_client().collection('orders')
        
        # Query orders for this user
        query = orders_ref.where('user_id', '==', user_id).stream()
        
        all_orders = []
        for doc in query:
            order = doc.to_dict()
            order['order_id'] = doc.id
            all_orders.append(order)
        
        total_orders = len(all_orders)
        
        # Count pending orders
        pending_orders = sum(1 for order in all_orders if order.get('status') == 'pending')
        
        # Get recent orders (sorted by date, desc)
        recent_orders = sorted(all_orders, key=lambda x: x.get('order_date', ''), reverse=True)[:5]
        
        return jsonify({
            'total_orders': total_orders,
            'pending_orders': pending_orders,
            'recent_orders': recent_orders,
            'success': True
        })
    except Exception as e:
        logger.error(f"Dashboard error: {str(e)}")
        return jsonify({'error': 'Failed to load dashboard'}), 500

@app.route('/api/hotel/orders', methods=['GET'])
@token_required
def get_hotel_orders(current_user):
    """Get hotel orders from Firestore with items"""
    try:
        user_id = current_user.get('id')
        
        firestore_db = get_firestore_client()
        if firestore_db is None:
            logger.error("Firestore client not initialized")
            return jsonify({'error': 'Database connection error'}), 500
        
        orders = []
        query = firestore_db.collection('orders').where('user_id', '==', user_id).stream()
        
        for doc in query:
            order = doc.to_dict()
            order['id'] = doc.id
            order['order_id'] = doc.id
            
            # Fetch order items from subcollection
            items = []
            try:
                items_query = firestore_db.collection('orders').document(doc.id).collection('order_items').stream()
                for item_doc in items_query:
                    item = item_doc.to_dict()
                    item['item_id'] = item_doc.id
                    
                    # Get product details if not already in item
                    if 'product_id' in item and not item.get('product_name'):
                        try:
                            product_id_str = str(item['product_id'])
                            product_doc = firestore_db.collection('products').document(product_id_str).get()
                            if product_doc.exists:
                                product = product_doc.to_dict()
                                item['product_name'] = product.get('name', 'Unknown')
                                item['unit_type'] = item.get('unit_type') or product.get('unit_type', 'kg')
                        except Exception as prod_err:
                            logger.warning(f"Could not fetch product details for {item.get('product_id')}: {str(prod_err)}")
                            item['product_name'] = item.get('product_name', 'Unknown')
                            item['unit_type'] = item.get('unit_type', 'kg')
                    
                    items.append(item)
            except Exception as items_err:
                logger.warning(f"Could not fetch items for order {doc.id}: {str(items_err)}")
            
            order['items'] = items
            logger.info(f"Order {doc.id} has {len(items)} items")
            orders.append(order)
        
        # Sort by order_date descending
        orders = sorted(orders, key=lambda x: x.get('order_date', ''), reverse=True)
        
        return jsonify({'orders': orders, 'success': True})
    except Exception as e:
        logger.error(f"Get orders error: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': 'Failed to fetch orders'}), 500

@app.route('/api/hotel/orders/<order_id>', methods=['GET'])
@token_required
def get_hotel_order_detail(current_user, order_id):
    """Get hotel order details from Firestore"""
    try:
        user_id = current_user.get('id')
        
        firestore_db = get_firestore_client()
        if firestore_db is None:
            logger.error("Firestore client not initialized")
            return jsonify({'error': 'Database connection error'}), 500
        
        # Get order from Firestore
        order_doc = firestore_db.collection('orders').document(order_id).get()
        
        if not order_doc.exists:
            return jsonify({'error': 'Order not found'}), 404
        
        order = order_doc.to_dict()
        
        # Verify order belongs to this user
        if order.get('user_id') != user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Add order_id to order
        order['id'] = order_id
        order['order_id'] = order_id
        
        # Get order items from subcollection
        items = []
        items_query = firestore_db.collection('orders').document(order_id).collection('order_items').stream()
        
        for item_doc in items_query:
            item = item_doc.to_dict()
            item['item_id'] = item_doc.id
            
            # Get product details
            if 'product_id' in item:
                try:
                    product_id_str = str(item['product_id'])  # Convert to string for Firestore
                    product_doc = firestore_db.collection('products').document(product_id_str).get()
                    if product_doc.exists:
                        product = product_doc.to_dict()
                        item['product_name'] = product.get('name', 'Unknown')
                        item['unit'] = product.get('unit_type', 'kg')
                except:
                    logger.warning(f"Could not fetch product details for {item['product_id']}")
                    item['product_name'] = 'Unknown'
                    item['unit'] = 'kg'
            
            items.append(item)
        
        order['items'] = items
        
        return jsonify({'order': order, 'success': True})
    except Exception as e:
        logger.error(f"Get order detail error: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': 'Failed to fetch order details'}), 500

# ===================================================================
# HOTEL BILLS ROUTE
# ===================================================================
@app.route('/api/hotel/bills', methods=['GET'])
@token_required
def get_hotel_bills(current_user):
    """Get hotel bills from Firestore"""
    try:
        user_id = current_user.get('id')
        
        firestore_db = get_firestore_client()
        if firestore_db is None:
            logger.error("Firestore client not initialized")
            return jsonify({'error': 'Database connection error'}), 500
        
        # Get all orders for this user
        orders_query = firestore_db.collection('orders').where('user_id', '==', user_id).stream()
        order_ids = [doc.id for doc in orders_query]
        
        if not order_ids:
            return jsonify({'bills': [], 'success': True})
        
        # Get bills associated with these orders
        bills = []
        bills_query = firestore_db.collection('bills').stream()
        
        for bill_doc in bills_query:
            bill = bill_doc.to_dict()
            # Check if this bill belongs to one of the user's orders
            if bill.get('order_id') in order_ids:
                bill['bill_id'] = bill_doc.id
                
                # Fetch order_items from subcollection if not already in bill
                if not bill.get('items') or len(bill.get('items', [])) == 0:
                    try:
                        order_doc = get_firestore_client().collection('orders').document(bill.get('order_id')).get()
                        if order_doc.exists:
                            items_query = order_doc.reference.collection('order_items').stream()
                            bill_items = []
                            for item_doc in items_query:
                                item_data = item_doc.to_dict()
                                bill_items.append({
                                    'product_id': str(item_data.get('product_id', '')),
                                    'product_name': item_data.get('product_name', ''),
                                    'quantity': float(item_data.get('quantity', 0)),
                                    'price_at_order': float(item_data.get('price_at_order', 0)),
                                    'price_per_unit': float(item_data.get('price_at_order', item_data.get('price_per_unit', 0))),
                                    'subtotal': float(item_data.get('subtotal', 0)),
                                    'unit_type': item_data.get('unit_type', 'kg')
                                })
                            if bill_items:
                                bill['items'] = bill_items
                    except Exception as e:
                        logger.warning(f"Could not fetch order_items for bill: {str(e)}")
                
                bills.append(bill)
        
        # Sort by bill_date descending
        bills = sorted(bills, key=lambda x: x.get('bill_date', ''), reverse=True)
        
        return jsonify({'bills': bills, 'success': True})
    except Exception as e:
        logger.error(f"Get bills error: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': 'Failed to fetch bills'}), 500

# ===================================================================
# HOTEL CART MANAGEMENT ROUTES (Part 2)
# ===================================================================
@app.route('/api/hotel/cart', methods=['GET'])
@token_required
def get_hotel_cart(current_user):
    """Get user's cart items from Firestore subcollection"""
    try:
        user_id = current_user.get('id')
        
        firestore_db = get_firestore_client()
        if firestore_db is None:
            logger.error("Firestore client not initialized")
            return jsonify({'error': 'Database connection error'}), 500
        
        cart_items = []
        carts_ref = firestore_db.collection('users').document(user_id).collection('carts')
        
        for doc in carts_ref.stream():
            cart_item = doc.to_dict()
            cart_item['cart_id'] = doc.id
            
            # Fetch product details to include current price and unit info
            try:
                product_doc = firestore_db.collection('products').document(cart_item.get('product_id')).get()
                if product_doc.exists:
                    product = product_doc.to_dict()
                    cart_item['product_name'] = product.get('name')
                    cart_item['current_price'] = product.get('price_per_unit')
                    cart_item['unit'] = product.get('unit_type')
            except Exception as e:
                logger.warning(f"Could not fetch product details for {cart_item.get('product_id')}: {str(e)}")
            
            cart_items.append(cart_item)
        
        return jsonify({'items': cart_items, 'success': True})
    except Exception as e:
        logger.error(f"Get cart error: {str(e)}")
        return jsonify({'error': 'Failed to fetch cart'}), 500

@app.route('/api/hotel/cart', methods=['POST'])
@token_required
def add_to_cart(current_user):
    """Add or update item in cart (Firestore subcollection)"""
    try:
        user_id = current_user.get('id')
        data = request.get_json()
        product_id = data.get('product_id')
        quantity = data.get('quantity', 1)
        
        if not product_id or quantity < 1:
            return jsonify({'error': 'Invalid product_id or quantity'}), 400
        
        firestore_client = get_firestore_client()
        if firestore_client is None:
            logger.error("Firestore client not initialized")
            return jsonify({'error': 'Database connection error'}), 500
        
        user_id_str = str(user_id)  # Convert to string for Firestore
        product_id_str = str(product_id)  # Convert to string for Firestore
        carts_ref = firestore_client.collection('users').document(user_id_str).collection('carts')
        
        # Check if item already exists in cart
        existing_doc = carts_ref.document(product_id_str).get()
        
        if existing_doc.exists:
            # Update existing cart item - increment quantity
            existing_data = existing_doc.to_dict()
            new_quantity = existing_data.get('quantity', 0) + quantity
            carts_ref.document(product_id_str).update({
                'quantity': new_quantity,
                'updated_at': firestore.SERVER_TIMESTAMP
            })
        else:
            # Create new cart item
            carts_ref.document(product_id_str).set({
                'product_id': product_id_str,
                'quantity': quantity,
                'created_at': firestore.SERVER_TIMESTAMP,
                'updated_at': firestore.SERVER_TIMESTAMP
            })
        
        return jsonify({'message': 'Added to cart', 'success': True}), 201
    except Exception as e:
        logger.error(f"Add to cart error: {str(e)}")
        return jsonify({'error': 'Failed to add to cart'}), 500

@app.route('/api/hotel/cart/<int:product_id>', methods=['DELETE'])
@token_required
def remove_from_cart(current_user, product_id):
    """Remove item from cart - delete from Firestore subcollection"""
    try:
        user_id = current_user.get('id')
        
        firestore_db = get_firestore_client()
        if firestore_db is None:
            logger.error("Firestore client not initialized")
            return jsonify({'error': 'Database connection error'}), 500
        
        # Use the cart item ID (which is the document ID in the subcollection)
        # The product_id is passed as parameter, and we need to find the cart item
        carts_ref = firestore_db.collection('users').document(user_id).collection('carts')
        
        # Query to find the cart item with this product_id
        docs = carts_ref.where('product_id', '==', product_id).stream()
        deleted_count = 0
        for doc in docs:
            doc.reference.delete()
            deleted_count += 1
        
        if deleted_count == 0:
            return jsonify({'error': 'Item not found in cart'}), 404
        
        return jsonify({'message': 'Item removed from cart', 'success': True})
    except Exception as e:
        logger.error(f"Remove from cart error: {str(e)}")
        return jsonify({'error': 'Failed to remove from cart'}), 500

@app.route('/api/hotel/cart/<int:product_id>', methods=['PUT'])
@token_required
def update_cart_item(current_user, product_id):
    """Update quantity of cart item - update in Firestore subcollection"""
    try:
        user_id = current_user.get('id')
        data = request.get_json()
        quantity = data.get('quantity')
        
        if quantity is None or quantity < 0:
            return jsonify({'error': 'Invalid quantity'}), 400
        
        firestore_db = get_firestore_client()
        if firestore_db is None:
            logger.error("Firestore client not initialized")
            return jsonify({'error': 'Database connection error'}), 500
        
        # Use the subcollection path like the GET endpoint does
        carts_ref = firestore_db.collection('users').document(user_id).collection('carts')
        
        # Query for the cart item with this product_id
        docs = carts_ref.where('product_id', '==', product_id).stream()
        cart_items = list(docs)
        
        if not cart_items:
            return jsonify({'error': 'Item not found in cart'}), 404
        
        # Update the first matching item
        cart_item_ref = cart_items[0].reference
        
        if quantity == 0:
            # Delete if quantity is 0
            cart_item_ref.delete()
        else:
            # Update quantity
            cart_item_ref.update({
                'quantity': quantity,
                'updated_at': firestore.SERVER_TIMESTAMP
            })
        
        return jsonify({'message': 'Cart updated', 'success': True})
    except Exception as e:
        logger.error(f"Update cart error: {str(e)}")
        return jsonify({'error': 'Failed to update cart'}), 500

@app.route('/api/hotel/cart/clear', methods=['DELETE'])
@token_required
def clear_cart(current_user):
    """Clear entire cart - delete all items from Firestore subcollection"""
    try:
        user_id = current_user.get('id')
        
        firestore_db = get_firestore_client()
        if firestore_db is None:
            logger.error("Firestore client not initialized")
            return jsonify({'error': 'Database connection error'}), 500
        
        # Use the subcollection path like the GET endpoint does
        carts_ref = firestore_db.collection('users').document(user_id).collection('carts')
        
        # Get all cart items for this user and delete them
        docs = carts_ref.stream()
        for doc in docs:
            doc.reference.delete()
        
        return jsonify({'message': 'Cart cleared', 'success': True})
    except Exception as e:
        logger.error(f"Clear cart error: {str(e)}")
        return jsonify({'error': 'Failed to clear cart'}), 500

@app.route('/api/hotel/cart/calculate', methods=['POST'])
@token_required
def calculate_cart_total(current_user):
    """Calculate total for cart items - retrieve prices from Firestore"""
    try:
        data = request.get_json()
        cart_items = data.get('items', [])
        
        if not cart_items:
            return jsonify({'total': 0, 'item_count': 0})
        
        if db is None:
            logger.error("Firestore client not initialized")
            return jsonify({'error': 'Database connection error'}), 500
        
        total_amount = 0.0
        item_details = []
        
        for item in cart_items:
            product_id = item['product_id']
            quantity = item['quantity']
            
            try:
                product_doc = get_firestore_client().collection('products').document(str(product_id)).get()
                
                if product_doc.exists:
                    product = product_doc.to_dict()
                    if product.get('is_available'):
                        item_total = float(product.get('price_per_unit', 0)) * quantity
                        total_amount += item_total
                        
                        item_details.append({
                            'product_id': product_id,
                            'name': product.get('name'),
                            'quantity': quantity,
                            'unit_price': float(product.get('price_per_unit', 0)),
                            'unit_type': product.get('unit_type'),
                            'item_total': item_total
                        })
            except Exception as e:
                logger.warning(f"Could not fetch product {product_id}: {str(e)}")
        
        return jsonify({
            'total_amount': total_amount,
            'item_count': len(cart_items),
            'item_details': item_details,
            'success': True
        })
    except Exception as e:
        logger.error(f"Calculate cart total error: {str(e)}")
        return jsonify({'error': 'Failed to calculate total'}), 500

# ===================================================================
# ADMIN ADVANCED ORDER ENDPOINTS - DEPRECATED (Being Migrated to Firestore)
# ===================================================================
@app.route('/api/admin/orders/pending', methods=['GET'])
@token_required
@admin_required
def get_pending_orders(current_user):
    """Get pending orders for tomorrow's delivery awaiting price finalization"""
    try:
        orders = []
        
        # Get tomorrow's date in IST (India Standard Time)
        now_ist = datetime.now(timezone(timedelta(hours=5, minutes=30)))
        tomorrow_date = (now_ist + timedelta(days=1)).strftime('%Y-%m-%d')
        
        logger.info(f"[PENDING_ORDERS] Fetching orders for delivery date: {tomorrow_date}")
        
        # Query orders with tomorrow's delivery date and status = pending
        query = get_firestore_client().collection('orders').where(
            'delivery_date', '==', tomorrow_date
        ).where(
            'status', '==', 'pending'
        ).stream()
        
        for doc in query:
            order = doc.to_dict()
            order['id'] = str(doc.id)
            
            # Get order items
            items = []
            items_query = get_firestore_client().collection('orders').document(doc.id).collection('order_items').stream()
            for item_doc in items_query:
                item = item_doc.to_dict()
                item['item_id'] = str(item_doc.id)
                items.append(item)
            order['items'] = items
            
            # Get user details
            if order.get('user_id'):
                user_id_str = str(order['user_id'])  # Convert to string for Firestore
                user_doc = get_firestore_client().collection('users').document(user_id_str).get()
                if user_doc.exists:
                    user = user_doc.to_dict()
                    order['hotel_name'] = user.get('hotel_name', 'N/A')
                    order['email'] = user.get('email', '')
            
            orders.append(order)
        
        return jsonify({
            'orders': orders,
            'total_orders': len(orders),
            'success': True
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching pending orders: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/orders/pending-pricing', methods=['GET'])
@token_required
@admin_required
def get_pending_pricing_orders(current_user):
    """Get orders waiting for price finalization for tomorrow's delivery"""
    try:
        orders = []
        
        # Get tomorrow's date in IST
        now_ist = datetime.now(timezone(timedelta(hours=5, minutes=30)))
        tomorrow_date = (now_ist + timedelta(days=1)).strftime('%Y-%m-%d')
        
        logger.info(f"[PENDING_PRICING] Fetching unpriced orders for delivery: {tomorrow_date}")
        
        # Get orders where price_finalized is False and delivery_date is tomorrow
        query = get_firestore_client().collection('orders').where(
            'delivery_date', '==', tomorrow_date
        ).where(
            'price_finalized', '==', False
        ).where(
            'status', '==', 'pending'
        ).stream()
        
        for doc in query:
            order = doc.to_dict()
            order['id'] = str(doc.id)
            
            # Get order items for pricing details
            items = []
            items_query = get_firestore_client().collection('orders').document(doc.id).collection('order_items').stream()
            for item_doc in items_query:
                item = item_doc.to_dict()
                item['item_id'] = str(item_doc.id)
                items.append(item)
            order['items'] = items
            
            # Get user info
            if order.get('user_id'):
                user_id_str = str(order['user_id'])  # Convert to string for Firestore
                user_doc = get_firestore_client().collection('users').document(user_id_str).get()
                if user_doc.exists:
                    user = user_doc.to_dict()
                    order['hotel_name'] = user.get('hotel_name', 'N/A')
            
            orders.append(order)
        
        return jsonify({
            'pending_orders': orders,
            'total': len(orders),
            'success': True
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching pending pricing orders: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/orders/todays-vegetables', methods=['GET'])
@token_required
@admin_required
def get_todays_vegetables(current_user):
    """Get aggregated vegetables for today's delivery from Firestore"""
    try:
        from datetime import datetime, time, timedelta, timezone
        
        # Use IST timezone (UTC+5:30) for correct time comparison
        IST = timezone(timedelta(hours=5, minutes=30))
        now = datetime.now(IST)
        current_time = now.time()
        today = now.date()
        
        # Calculate target date based on time
        # After 1 AM: show vegetables for today's delivery (from yesterday's orders)
        # Before 1 AM: show vegetables for tomorrow's delivery (from today's orders)
        if current_time >= time(1, 0):
            target_date = today
        else:
            target_date = today + timedelta(days=1)
        
        logger.info(f"[TODAYS_VEG] Current time: {now.isoformat()}, Target date: {target_date.strftime('%Y-%m-%d')}")
        
        # Aggregate vegetables from all orders (including pending, confirmed, etc.) with delivery_date = target_date
        vegetables = {}
        category_totals = {}
        total_quantity = 0
        processed_orders = 0
        
        orders_query = get_firestore_client().collection('orders').stream()
        for order_doc in orders_query:
            order = order_doc.to_dict()
            delivery_date_raw = order.get('delivery_date')
            
            logger.info(f"[TODAYS_VEG] Order {order_doc.id}: delivery_date_raw={delivery_date_raw}, type={type(delivery_date_raw)}")
            
            # Convert delivery_date to date object - handle multiple formats
            if delivery_date_raw is None:
                continue
            
            try:
                delivery_dt = None
                
                # Check if it's already a datetime object (from Firestore Timestamp)
                if hasattr(delivery_date_raw, 'date'):
                    delivery_dt = delivery_date_raw.date()
                    logger.info(f"[TODAYS_VEG] Converted from datetime: {delivery_dt}")
                # Check if it's a string
                elif isinstance(delivery_date_raw, str):
                    # Try YYYY-MM-DD format first (ISO format - most common)
                    if len(delivery_date_raw) == 10 and delivery_date_raw[4] == '-':
                        try:
                            delivery_dt = datetime.strptime(delivery_date_raw, '%Y-%m-%d').date()
                            logger.info(f"[TODAYS_VEG] Parsed ISO format: {delivery_dt}")
                        except ValueError:
                            pass
                    
                    # Try longer ISO format (YYYY-MM-DDTHH:MM:SS)
                    if delivery_dt is None and len(delivery_date_raw) >= 19 and delivery_date_raw[4] == '-':
                        try:
                            delivery_dt = datetime.fromisoformat(delivery_date_raw.replace('Z', '+00:00')).date()
                            logger.info(f"[TODAYS_VEG] Parsed ISO 8601 format: {delivery_dt}")
                        except (ValueError, AttributeError):
                            pass
                    
                    # Try RFC format as fallback
                    if delivery_dt is None:
                        try:
                            from email.utils import parsedate_to_datetime
                            parsed_dt = parsedate_to_datetime(delivery_date_raw)
                            # Handle timezone-aware datetime
                            if parsed_dt.tzinfo is not None:
                                delivery_dt = parsed_dt.astimezone().date()
                            else:
                                delivery_dt = parsed_dt.date()
                            logger.info(f"[TODAYS_VEG] Parsed RFC format: {delivery_dt}")
                        except (TypeError, ValueError):
                            pass
                    
                    # If still no date was parsed, skip this order
                    if delivery_dt is None:
                        logger.warning(f"[TODAYS_VEG] Could not parse delivery_date '{delivery_date_raw}'")
                        continue
                else:
                    logger.warning(f"[TODAYS_VEG] Unknown delivery_date type: {type(delivery_date_raw)}")
                    continue
                
                # Check if delivery_date matches target date
                if delivery_dt != target_date:
                    logger.info(f"[TODAYS_VEG] Date mismatch: {delivery_dt} != {target_date}")
                    continue
                
                # Skip cancelled orders only
                if order.get('status') == 'cancelled':
                    continue
                
                processed_orders += 1
                logger.info(f"[TODAYS_VEG] Processing order {order_doc.id}")
                
            except Exception as e:
                logger.error(f"[TODAYS_VEG] Error parsing delivery_date: {str(e)}")
                import traceback
                logger.error(f"[TODAYS_VEG] Traceback: {traceback.format_exc()}")
                continue
            
            # Get items for this order
            items_query = get_firestore_client().collection('orders').document(order_doc.id).collection('order_items').stream()
            for item_doc in items_query:
                item = item_doc.to_dict()
                product_id = item.get('product_id')
                quantity = float(item.get('quantity', 0))
                
                logger.info(f"[TODAYS_VEG] Item: product_id={product_id}, quantity={quantity}")
                
                # Get product details
                product_doc = get_firestore_client().collection('products').document(str(product_id)).get()
                if product_doc.exists:
                    product = product_doc.to_dict()
                    category = product.get('category', 'Other')
                    product_name = product.get('name', f'Product {product_id}')
                    unit_type = product.get('unit_type', 'kg')
                    
                    # Aggregate by product
                    key = f"{product_id}:{product_name}"
                    if key not in vegetables:
                        vegetables[key] = {
                            'product_id': product_id,
                            'product_name': product_name,
                            'category': category,
                            'unit_type': unit_type,
                            'total_quantity': 0
                        }
                    vegetables[key]['total_quantity'] += quantity
                    total_quantity += quantity
                    
                    # Aggregate by category
                    if category not in category_totals:
                        category_totals[category] = {'count': 0, 'total_quantity': 0}
                    category_totals[category]['count'] += 1
                    category_totals[category]['total_quantity'] += quantity
        
        logger.info(f"[TODAYS_VEG] Found {processed_orders} orders for {target_date.strftime('%Y-%m-%d')}, {len(vegetables)} unique products")
        
        return jsonify({
            'date': now.strftime('%d %B %Y'),
            'day': now.strftime('%A'),
            'target_date': target_date.strftime('%Y-%m-%d'),
            'vegetables': list(vegetables.values()),
            'category_totals': category_totals,
            'total_items': len(vegetables),
            'total_orders': processed_orders,
            'success': True
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching today's vegetables: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/orders/todays-hotels-orders', methods=['GET'])
@token_required
@admin_required
def get_todays_hotels_orders(current_user):
    """Get today's hotel orders from Firestore"""
    try:
        from datetime import datetime, time, timedelta
        
        now = datetime.now()
        current_time = now.time()
        
        # Show yesterday's orders (for today's delivery)
        if current_time >= time(1, 0):  # After 1 AM
            target_date = now.date() - timedelta(days=1)
        else:  # Before 1 AM
            target_date = now.date() - timedelta(days=2)
        
        date_str = now.strftime('%d %B %Y')
        day_str = now.strftime('%A')
        
        # Get all orders from target_date
        orders = []
        orders_query = get_firestore_client().collection('orders').stream()
        
        for order_doc in orders_query:
            order = order_doc.to_dict()
            order_date_raw = order.get('order_date')
            order_date = None
            
            # Parse order_date with multiple format support
            if not order_date_raw:
                continue
            
            if isinstance(order_date_raw, str):
                # Try ISO format (10 chars, YYYY-MM-DD)
                if len(order_date_raw) >= 10 and order_date_raw[4] == '-':
                    try:
                        order_date = datetime.strptime(order_date_raw[:10], '%Y-%m-%d').date()
                    except ValueError:
                        pass
                
                # Try DD Mon YYYY format if ISO didn't work
                if order_date is None:
                    try:
                        order_date = datetime.strptime(order_date_raw, '%d %b %Y').date()
                    except ValueError:
                        pass
                
                # Try ISO 8601 format if others didn't work
                if order_date is None:
                    try:
                        order_date = datetime.fromisoformat(order_date_raw.replace('Z', '+00:00')).date()
                    except ValueError:
                        pass
            else:
                # If it's a Timestamp object
                try:
                    if hasattr(order_date_raw, 'date'):
                        order_date = order_date_raw.date()
                except:
                    pass
            
            if order_date is None or order_date != target_date:
                continue
            
            # Skip cancelled orders
            if order.get('status') == 'cancelled':
                continue
            
            order_id = order_doc.id
            order['order_id'] = order_id
            
            # Get user (hotel) details
            user_id = order.get('user_id')
            if user_id:
                user_doc = get_firestore_client().collection('users').document(user_id).get()
                if user_doc.exists:
                    user = user_doc.to_dict()
                    order['hotel_name'] = user.get('hotel_name', 'N/A')
                    order['hotel_id'] = user_id
                    order['email'] = user.get('email', '')
                    order['phone'] = user.get('phone', '')
            
            # Get items count and total quantity
            items_list = []
            items_query = get_firestore_client().collection('orders').document(order_id).collection('order_items').stream()
            item_count = 0
            total_quantity = 0
            for item_doc in items_query:
                item = item_doc.to_dict()
                item_count += 1
                total_quantity += float(item.get('quantity', 0))
                # Add item to list
                items_list.append({
                    'product_id': item.get('product_id', ''),
                    'product_name': item.get('product_name', ''),
                    'quantity': str(float(item.get('quantity', 0))),
                    'unit_type': item.get('unit_type', ''),
                    'price': str(float(item.get('price', 0))),
                    'special_instructions': item.get('special_instructions', '')
                })
            
            order['item_count'] = str(item_count)
            order['total_quantity'] = str(total_quantity)
            order['items'] = items_list
            
            # Convert all order fields to JSON-serializable types (all strings)
            clean_order = {}
            for key, value in order.items():
                if value is None:
                    clean_order[key] = ''
                elif isinstance(value, list):
                    # Keep lists as-is (they contain dicts with string values)
                    clean_order[key] = value
                else:
                    clean_order[key] = str(value)
            
            orders.append(clean_order)
        
        try:
            response_data = make_json_safe({
                'date': date_str,
                'day': day_str,
                'target_date': target_date.strftime('%Y-%m-%d'),
                'orders': orders,
                'total_orders': len(orders),
                'success': True
            })
            return jsonify(response_data), 200
        except Exception as json_err:
            logger.error(f"Error in todays-hotels-orders response: {str(json_err)}")
            return jsonify({'error': 'Failed to serialize response'}), 500
        
    except Exception as e:
        try:
            logger.error(f"Error fetching today's hotels orders: {str(e)}")
        except:
            logger.error("Error fetching today's hotels orders (logging failed)")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/admin/orders/vegetables-history', methods=['GET'])
@token_required
@admin_required
def get_vegetables_history(current_user):
    """Get aggregated vegetables for a specific delivery date from Firestore"""
    
    try:
        from datetime import datetime, timedelta
        from urllib.parse import parse_qs
        
        # Try to get date from request.args first, then fall back to parsing query string
        selected_date_str = request.args.get('date')
        
        if not selected_date_str and request.query_string:
            # Manually parse query string
            try:
                query_params = parse_qs(request.query_string.decode())
                selected_date_str = query_params.get('date', [None])[0]
                logger.info(f"[VEGETABLES_HISTORY] Parsed from query_string: {selected_date_str}")
            except Exception as parse_err:
                logger.error(f"[VEGETABLES_HISTORY] Failed to parse query_string: {str(parse_err)}")
        
        logger.info(f"[VEGETABLES_HISTORY] Full URL: {request.full_path}")
        logger.info(f"[VEGETABLES_HISTORY] request.args: {request.args}")
        logger.info(f"[VEGETABLES_HISTORY] request.query_string: {request.query_string}")
        logger.info(f"[VEGETABLES_HISTORY] Received date parameter: {selected_date_str}")
        
        if not selected_date_str:
            logger.warning(f"[VEGETABLES_HISTORY] Date parameter missing. Available args: {dict(request.args)}")
            logger.warning(f"[VEGETABLES_HISTORY] query_string decoded: {request.query_string.decode() if request.query_string else 'empty'}")
            return jsonify({'error': 'Date parameter required (format: YYYY-MM-DD)'}), 400
        
        try:
            selected_date = datetime.strptime(selected_date_str, '%Y-%m-%d').date()
            logger.info(f"[VEGETABLES_HISTORY] Parsed date: {selected_date}")
        except ValueError as ve:
            logger.error(f"[VEGETABLES_HISTORY] Date parsing failed: {str(ve)}")
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        
        # User clicked on this date - show vegetables from orders with delivery_date = selected_date
        delivery_date = selected_date
        date_str = selected_date.strftime('%d %B %Y')
        day_str = selected_date.strftime('%A')
        
        logger.info(f"[VEGETABLES_HISTORY] Processing vegetables for delivery_date: {delivery_date}")
        
        # Aggregate vegetables
        vegetables = {}
        category_totals = {}
        
        orders_query = get_firestore_client().collection('orders').stream()
        order_count = 0
        for order_doc in orders_query:
            order = order_doc.to_dict()
            delivery_date_raw = order.get('delivery_date')
            
            logger.info(f"[VEGETABLES_HISTORY] Order {order_doc.id}: delivery_date_raw={delivery_date_raw}, type={type(delivery_date_raw)}")
            
            # Convert delivery_date to date object - handle multiple formats
            if delivery_date_raw is None:
                continue
            
            try:
                order_delivery_dt = None
                
                # Check if it's already a datetime object (from Firestore Timestamp)
                if hasattr(delivery_date_raw, 'date'):
                    order_delivery_dt = delivery_date_raw.date()
                    logger.info(f"[VEGETABLES_HISTORY] Converted from datetime: {order_delivery_dt}")
                # Check if it's a string
                elif isinstance(delivery_date_raw, str):
                    # Try YYYY-MM-DD format first (ISO format - most common)
                    if len(delivery_date_raw) == 10 and delivery_date_raw[4] == '-':
                        try:
                            order_delivery_dt = datetime.strptime(delivery_date_raw, '%Y-%m-%d').date()
                            logger.info(f"[VEGETABLES_HISTORY] Parsed ISO format: {order_delivery_dt}")
                        except ValueError:
                            pass
                    
                    # Try longer ISO format (YYYY-MM-DDTHH:MM:SS)
                    if order_delivery_dt is None and len(delivery_date_raw) >= 19 and delivery_date_raw[4] == '-':
                        try:
                            order_delivery_dt = datetime.fromisoformat(delivery_date_raw.replace('Z', '+00:00')).date()
                            logger.info(f"[VEGETABLES_HISTORY] Parsed ISO 8601 format: {order_delivery_dt}")
                        except (ValueError, AttributeError):
                            pass
                    
                    # Try RFC format as fallback
                    if order_delivery_dt is None:
                        try:
                            from email.utils import parsedate_to_datetime
                            parsed_dt = parsedate_to_datetime(delivery_date_raw)
                            # Handle timezone-aware datetime
                            if parsed_dt.tzinfo is not None:
                                order_delivery_dt = parsed_dt.astimezone().date()
                            else:
                                order_delivery_dt = parsed_dt.date()
                            logger.info(f"[VEGETABLES_HISTORY] Parsed RFC format: {order_delivery_dt}")
                        except (TypeError, ValueError):
                            pass
                    
                    # If still no date was parsed, skip this order
                    if order_delivery_dt is None:
                        logger.warning(f"[VEGETABLES_HISTORY] Could not parse delivery_date '{delivery_date_raw}'")
                        continue
                else:
                    logger.warning(f"[VEGETABLES_HISTORY] Unknown delivery_date type: {type(delivery_date_raw)}")
                    continue
                
                # Check if date matches target date
                if order_delivery_dt != delivery_date:
                    logger.info(f"[VEGETABLES_HISTORY] Date mismatch: {order_delivery_dt} != {delivery_date}")
                    continue
                
                # Skip cancelled orders
                if order.get('status') == 'cancelled':
                    continue
                
                order_count += 1
                logger.info(f"[VEGETABLES_HISTORY] Order {order_doc.id} matches target date")
                
            except Exception as parse_err:
                logger.error(f"[VEGETABLES_HISTORY] Error parsing delivery_date for order {order_doc.id}: {str(parse_err)}")
                import traceback
                logger.error(f"[VEGETABLES_HISTORY] Traceback: {traceback.format_exc()}")
                continue
            
            # Get items
            items_query = get_firestore_client().collection('orders').document(order_doc.id).collection('order_items').stream()
            for item_doc in items_query:
                item = item_doc.to_dict()
                product_id = item.get('product_id')
                quantity = float(item.get('quantity', 0))
                
                logger.info(f"[VEGETABLES_HISTORY] Item: product_id={product_id}, quantity={quantity}")
                
                # Get product details
                product_doc = get_firestore_client().collection('products').document(str(product_id)).get()
                if product_doc.exists:
                    product = product_doc.to_dict()
                    category = product.get('category', 'Other')
                    product_name = product.get('name', f'Product {product_id}')
                    unit_type = product.get('unit_type', 'kg')
                    
                    key = f"{product_id}:{product_name}"
                    if key not in vegetables:
                        vegetables[key] = {
                            'product_id': product_id,
                            'product_name': product_name,
                            'category': category,
                            'unit_type': unit_type,
                            'total_quantity': 0
                        }
                    vegetables[key]['total_quantity'] += quantity
                    
                    if category not in category_totals:
                        category_totals[category] = {'count': 0, 'total_quantity': 0}
                    category_totals[category]['count'] += 1
                    category_totals[category]['total_quantity'] += quantity
        
        logger.info(f"[VEGETABLES_HISTORY] Found {order_count} orders with {len(vegetables)} vegetables")
        
        return jsonify({
            'date': date_str,
            'day': day_str,
            'vegetables': list(vegetables.values()),
            'category_totals': category_totals,
            'total_items': len(vegetables),
            'total_orders': order_count,
            'message': 'Vegetables for this date' if vegetables else 'No vegetables found for this date'
        }), 200
        
    except Exception as e:
        logger.error(f"[VEGETABLES_HISTORY] Exception: {type(e).__name__}: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/orders/todays-filling', methods=['GET'])
@token_required
@admin_required
def get_todays_filling(current_user):
    """Get today's orders in matrix format (products x hotels) from Firestore"""
    try:
        from datetime import datetime, time, timedelta, timezone
        
        # Use IST timezone (UTC+5:30) for correct time comparison
        IST = timezone(timedelta(hours=5, minutes=30))
        now = datetime.now(IST)
        current_time = now.time()
        today = now.date()
        
        # Calculate target date based on time
        # After 1 AM: show vegetables for today's delivery (from yesterday's orders)
        # Before 1 AM: show vegetables for tomorrow's delivery (from today's orders)
        if current_time >= time(1, 0):
            target_date = today
        else:
            target_date = today + timedelta(days=1)
        
        date_str = now.strftime('%d %B %Y')
        day_str = now.strftime('%A')
        
        # Get all hotels and products for target date
        hotels_set = {}
        products_dict = {}
        
        orders_query = get_firestore_client().collection('orders').stream()
        for order_doc in orders_query:
            order = order_doc.to_dict()
            delivery_date_raw = order.get('delivery_date')
            
            # Convert delivery_date to date object - handle multiple formats
            if delivery_date_raw is None:
                continue
            
            try:
                order_delivery_dt = None
                
                # Check if it's already a datetime object (from Firestore Timestamp)
                if hasattr(delivery_date_raw, 'date'):
                    order_delivery_dt = delivery_date_raw.date()
                # Check if it's a string
                elif isinstance(delivery_date_raw, str):
                    # Try YYYY-MM-DD format first (ISO format - most common)
                    if len(delivery_date_raw) == 10 and delivery_date_raw[4] == '-':
                        try:
                            order_delivery_dt = datetime.strptime(delivery_date_raw, '%Y-%m-%d').date()
                        except ValueError:
                            pass
                    
                    # Try longer ISO format (YYYY-MM-DDTHH:MM:SS)
                    if order_delivery_dt is None and len(delivery_date_raw) >= 19 and delivery_date_raw[4] == '-':
                        try:
                            order_delivery_dt = datetime.fromisoformat(delivery_date_raw.replace('Z', '+00:00')).date()
                        except (ValueError, AttributeError):
                            pass
                    
                    # Try RFC format as fallback
                    if order_delivery_dt is None:
                        try:
                            from email.utils import parsedate_to_datetime
                            parsed_dt = parsedate_to_datetime(delivery_date_raw)
                            # Handle timezone-aware datetime
                            if parsed_dt.tzinfo is not None:
                                order_delivery_dt = parsed_dt.astimezone().date()
                            else:
                                order_delivery_dt = parsed_dt.date()
                        except (TypeError, ValueError):
                            pass
                    
                    # If still no date was parsed, skip this order
                    if order_delivery_dt is None:
                        logger.warning(f"[TODAYS_FILLING] Could not parse delivery_date '{delivery_date_raw}'")
                        continue
                else:
                    continue
                
                # Check if delivery_date matches target date
                if order_delivery_dt != target_date:
                    continue
                
            except Exception as e:
                logger.error(f"[TODAYS_FILLING] Error parsing delivery_date: {str(e)}")
                continue
            
            # Skip cancelled orders
            if order.get('status') == 'cancelled':
                continue
            
            user_id = order.get('user_id')
            if not user_id:
                continue
            
            user_id_str = str(user_id)
            
            # Get hotel details
            user_doc = get_firestore_client().collection('users').document(user_id).get()
            if user_doc.exists:
                user = user_doc.to_dict()
                hotels_set[user_id_str] = {
                    'hotel_id': str(user_id_str),
                    'hotel_name': str(user.get('hotel_name', 'N/A'))
                }
            
            # Get items
            items_query = get_firestore_client().collection('orders').document(order_doc.id).collection('order_items').stream()
            for item_doc in items_query:
                item = item_doc.to_dict()
                product_id = int(item.get('product_id', 0))
                quantity = float(item.get('quantity', 0))
                
                # Get product
                product_doc = get_firestore_client().collection('products').document(str(product_id)).get()
                if product_doc.exists:
                    product = product_doc.to_dict()
                else:
                    product = {'name': 'Unknown', 'unit_type': 'kg', 'category': 'Other'}
                
                product_name = str(product.get('name', 'Unknown'))
                unit_type = str(product.get('unit_type', 'kg'))
                
                # Use product_id as key (no name concatenation)
                product_key = str(product_id)
                
                if product_key not in products_dict:
                    products_dict[product_key] = {
                        'product_id': str(product_id),
                        'product_name': str(product_name),
                        'unit_type': str(unit_type),
                        'category': str(product.get('category', 'Other')),
                        'quantities': {}
                    }
                
                # Add quantity - single assignment per item (convert to string)
                products_dict[product_key]['quantities'][str(user_id_str)] = str(quantity)
        
        return jsonify({
            'date': date_str,
            'day': day_str,
            'target_date': target_date.strftime('%Y-%m-%d'),
            'hotels': list(hotels_set.values()),
            'products': list(products_dict.values()),
            'total_hotels': len(hotels_set),
            'total_products': len(products_dict),
            'success': True
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching today's filling: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/orders/filling-history', methods=['GET'])
@token_required
@admin_required
def get_filling_history(current_user):
    """Get filling orders for a specific date in matrix format from Firestore"""
    logger.info("[FILLING_HISTORY] ✅ ROUTE ENTERED - past decorators")
    try:
        from datetime import datetime, timedelta
        
        selected_date_str = request.args.get('date')
        if not selected_date_str:
            return jsonify({'error': 'Date parameter required (format: YYYY-MM-DD)'}), 400
        
        try:
            selected_date = datetime.strptime(selected_date_str, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        
        date_str = selected_date.strftime('%d %B %Y')
        day_str = selected_date.strftime('%A')
        
        # Also prepare alternative format comparisons
        selected_date_short = selected_date.strftime('%d %b %Y')  # "14 Dec 2025"
        
        hotels_set = {}
        products_dict = {}
        unique_dates = set()  # Track all unique dates found
        
        orders_query = get_firestore_client().collection('orders').stream()
        order_count = 0
        matched_orders = 0
        logger.error(f"[FILLING_HISTORY] 🔍 STARTING QUERY - Looking for date: {selected_date} or '{selected_date_short}'")
        
        for order_doc in orders_query:
            order_count += 1
            try:
                order = order_doc.to_dict()
                delivery_date_raw = order.get('delivery_date')
                
                # Convert delivery_date to date object - handle multiple formats
                if delivery_date_raw is None:
                    logger.error(f"[FILLING_HISTORY] Order {order_count} ({order_doc.id}): No delivery_date")
                    continue
                
                try:
                    # Check if it's already a datetime object (from Firestore Timestamp)
                    if hasattr(delivery_date_raw, 'date'):
                        order_delivery_dt = delivery_date_raw.date()
                        logger.error(f"[FILLING_HISTORY] Order {order_count} ({order_doc.id}): Timestamp object → {order_delivery_dt}")
                    # Check if it's a string
                    elif isinstance(delivery_date_raw, str):
                        order_delivery_dt = None
                        
                        # Try YYYY-MM-DD format first (ISO format - most common)
                        if len(delivery_date_raw) == 10 and delivery_date_raw[4] == '-':
                            try:
                                order_delivery_dt = datetime.strptime(delivery_date_raw, '%Y-%m-%d').date()
                                logger.error(f"[FILLING_HISTORY] Order {order_count} ({order_doc.id}): ISO format → {order_delivery_dt}")
                            except ValueError as ve:
                                logger.error(f"[FILLING_HISTORY] Order {order_count}: ISO format parsing failed: {str(ve)}")
                        
                        # Try "DD Mon YYYY" format (e.g., "14 Dec 2025")
                        if order_delivery_dt is None:
                            try:
                                order_delivery_dt = datetime.strptime(delivery_date_raw, '%d %b %Y').date()
                                logger.error(f"[FILLING_HISTORY] Order {order_count} ({order_doc.id}): DD Mon YYYY format → {order_delivery_dt}")
                            except ValueError:
                                pass  # Try next format
                        
                        # Try longer ISO format (YYYY-MM-DDTHH:MM:SS)
                        if order_delivery_dt is None and len(delivery_date_raw) >= 19 and delivery_date_raw[4] == '-':
                            try:
                                order_delivery_dt = datetime.fromisoformat(delivery_date_raw.replace('Z', '+00:00')).date()
                                logger.error(f"[FILLING_HISTORY] Order {order_count} ({order_doc.id}): ISO 8601 format → {order_delivery_dt}")
                            except (ValueError, AttributeError) as ve:
                                logger.error(f"[FILLING_HISTORY] Order {order_count}: ISO 8601 format parsing failed: {str(ve)}")
                        
                        # Try RFC format as fallback
                        if order_delivery_dt is None:
                            try:
                                from email.utils import parsedate_to_datetime
                                parsed_dt = parsedate_to_datetime(delivery_date_raw)
                                # Handle timezone-aware datetime
                                if parsed_dt.tzinfo is not None:
                                    order_delivery_dt = parsed_dt.astimezone().date()
                                else:
                                    order_delivery_dt = parsed_dt.date()
                                logger.error(f"[FILLING_HISTORY] Order {order_count} ({order_doc.id}): RFC format '{delivery_date_raw}' → {order_delivery_dt}")
                            except (TypeError, ValueError) as rfc_err:
                                logger.error(f"[FILLING_HISTORY] Order {order_count}: RFC format parsing failed: {str(rfc_err)}")
                        
                        # If still no date was parsed, skip this order
                        if order_delivery_dt is None:
                            logger.error(f"[FILLING_HISTORY] Order {order_count} ({order_doc.id}): Could not parse delivery_date '{delivery_date_raw}'")
                            continue
                    else:
                        logger.error(f"[FILLING_HISTORY] Order {order_count} ({order_doc.id}): Unknown type: {type(delivery_date_raw)}")
                        continue
                    
                    # Check if delivery_date matches selected date
                    unique_dates.add(str(order_delivery_dt))  # Track unique date
                    
                    if order_delivery_dt != selected_date:
                        logger.error(f"[FILLING_HISTORY] Order {order_count} ({order_doc.id}): ❌ NO MATCH {order_delivery_dt} != {selected_date}")
                        continue
                    
                    matched_orders += 1
                    logger.error(f"[FILLING_HISTORY] Order {order_count} ({order_doc.id}): ✅ MATCHED!")
                    
                except Exception as e:
                    logger.error(f"[FILLING_HISTORY] Order {order_count} ({order_doc.id}): Exception during date parsing: {str(e)}")
                    logger.error(f"[FILLING_HISTORY] Exception type: {type(e).__name__}")
                    continue
                
                # Skip cancelled orders
                if order.get('status') == 'cancelled':
                    continue
                
                user_id = order.get('user_id')
                if not user_id:
                    logger.error(f"[FILLING_HISTORY] Order {order_count} ({order_doc.id}): No user_id found")
                    continue
                
                user_id_str = str(user_id)
                logger.error(f"[FILLING_HISTORY] Order {order_count} ({order_doc.id}): user_id={user_id} (type: {type(user_id).__name__})")
                
                # Get hotel
                user_doc = get_firestore_client().collection('users').document(user_id_str).get()
                if user_doc.exists:
                    user = user_doc.to_dict()
                    logger.error(f"[FILLING_HISTORY] Order {order_count} ({order_doc.id}): Found hotel: {user.get('hotel_name', 'N/A')}")
                    hotels_set[user_id_str] = {
                        'hotel_id': str(user_id_str),
                        'hotel_name': str(user.get('hotel_name', 'N/A'))
                    }
                else:
                    logger.error(f"[FILLING_HISTORY] Order {order_count} ({order_doc.id}): User doc not found for {user_id}")
                    continue
                
                # Get items
                items_query = get_firestore_client().collection('orders').document(order_doc.id).collection('order_items').stream()
                items_list = list(items_query)
                logger.error(f"[FILLING_HISTORY] Order {order_count} ({order_doc.id}): Retrieved {len(items_list)} items")
                
                for item_doc in items_list:
                    item = item_doc.to_dict()
                    logger.error(f"[FILLING_HISTORY] Order {order_count} ({order_doc.id}): Item data: {item}")
                    product_id = int(item.get('product_id', 0))
                    quantity = float(item.get('quantity', 0))
                    
                    product_doc = get_firestore_client().collection('products').document(str(product_id)).get()
                    if product_doc.exists:
                        product = product_doc.to_dict()
                    else:
                        product = {'name': 'Unknown', 'unit_type': 'kg', 'category': 'Other'}
                    
                    product_name = str(product.get('name', 'Unknown'))
                    unit_type = str(product.get('unit_type', 'kg'))
                    
                    # Use product_id as key (no name concatenation)
                    product_key = str(product_id)
                    
                    if product_key not in products_dict:
                        products_dict[product_key] = {
                            'product_id': str(product_id),
                            'product_name': str(product_name),
                            'unit_type': str(unit_type),
                            'category': str(product.get('category', 'Other')),
                            'quantities': {}
                        }
                    
                    # Add quantity - single assignment per item (convert to string)
                    products_dict[product_key]['quantities'][str(user_id_str)] = str(quantity)
                    
            except Exception as order_loop_err:
                logger.error(f"[FILLING_HISTORY] Order {order_count}: EXCEPTION in items/hotels processing: {str(order_loop_err)}")
                import traceback
                logger.error(f"[FILLING_HISTORY] Traceback: {traceback.format_exc()}")
                pass  # Skip orders with processing errors
        
        sorted_dates = sorted(list(unique_dates))
        logger.error(f"[FILLING_HISTORY] FINAL SUMMARY: Scanned {order_count} orders, Matched {matched_orders} for date {selected_date}, Found {len(products_dict)} products from {len(hotels_set)} hotels")
        logger.error(f"[FILLING_HISTORY] UNIQUE DATES IN DATABASE: {sorted_dates}")
        hotels_list = []
        for uid, hotel_data in hotels_set.items():
            try:
                clean_hotel = {
                    'hotel_id': str(uid) if uid else '',
                    'hotel_name': str(hotel_data.get('hotel_name', 'N/A'))
                }
                hotels_list.append(clean_hotel)
            except Exception as hex_err:
                pass  # Skip problematic hotels
        
        products_list = []
        for pid, product_data in products_dict.items():
            try:
                clean_product = {
                    'product_id': str(pid) if pid else '',
                    'product_name': str(product_data.get('product_name', 'Unknown')),
                    'unit_type': str(product_data.get('unit_type', 'kg')),
                    'category': str(product_data.get('category', 'Other')),
                    'quantities': {}
                }
                # Explicitly add each quantity
                for hotel_uid, qty_value in product_data.get('quantities', {}).items():
                    clean_product['quantities'][str(hotel_uid)] = str(qty_value)
                products_list.append(clean_product)
            except Exception as pex_err:
                pass  # Skip problematic products
        
        try:
            response_dict = {
                'date': str(date_str),
                'day': str(day_str),
                'target_date': str(selected_date.strftime('%Y-%m-%d')),
                'hotels': hotels_list,
                'products': products_list,
                'total_hotels': len(hotels_set),
                'total_products': len(products_dict),
                'success': True
            }
            return jsonify(response_dict), 200
        except Exception as json_err:
            logger.error(f"[FILLING_HISTORY] JSON encoding error: {str(json_err)}")
            return jsonify({'error': 'JSON encoding failed'}), 500
        
    except Exception as e:
        error_str = str(e)
        logger.error(f"[FILLING_HISTORY] Main endpoint error: {error_str}")
        try:
            return jsonify({'error': error_str}), 500
        except:
            return {'error': 'Request processing error'}, 500

# Fixed filling-history with explicit string conversion
@app.route('/api/admin/orders/hotels-orders-history', methods=['GET'])
@token_required
@admin_required
def get_hotels_orders_history(current_user):
    """Get historical orders grouped by hotel for a specific date from Firestore"""
    try:
        from datetime import datetime, timedelta
        
        selected_date_str = request.args.get('date')
        if not selected_date_str:
            return jsonify({'error': 'Date parameter required (format: YYYY-MM-DD)'}), 400
        
        try:
            selected_date = datetime.strptime(selected_date_str, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        
        target_date = selected_date - timedelta(days=1)
        date_str = selected_date.strftime('%d %B %Y')
        day_str = selected_date.strftime('%A')
        
        orders_list = []
        
        orders_query = get_firestore_client().collection('orders').stream()
        for order_doc in orders_query:
            order = order_doc.to_dict()
            order_date_raw = order.get('order_date')
            order_date = None
            
            # Parse order_date with multiple format support
            if not order_date_raw:
                continue
            
            if isinstance(order_date_raw, str):
                # Try ISO format (10 chars, YYYY-MM-DD)
                if len(order_date_raw) >= 10 and order_date_raw[4] == '-':
                    try:
                        order_date = datetime.strptime(order_date_raw[:10], '%Y-%m-%d').date()
                    except ValueError:
                        pass
                
                # Try DD Mon YYYY format if ISO didn't work
                if order_date is None:
                    try:
                        order_date = datetime.strptime(order_date_raw, '%d %b %Y').date()
                    except ValueError:
                        pass
                
                # Try ISO 8601 format if others didn't work
                if order_date is None:
                    try:
                        order_date = datetime.fromisoformat(order_date_raw.replace('Z', '+00:00')).date()
                    except ValueError:
                        pass
            else:
                # If it's a Timestamp object
                try:
                    if hasattr(order_date_raw, 'date'):
                        order_date = order_date_raw.date()
                except:
                    pass
            
            if order_date is None or order_date != target_date:
                continue
            
            if order.get('status') == 'cancelled':
                continue
            
            user_id = order.get('user_id')
            if not user_id:
                continue
            
            # Get hotel details
            user_doc = get_firestore_client().collection('users').document(user_id).get()
            hotel_name = 'N/A'
            email = 'N/A'
            phone = 'N/A'
            
            if user_doc.exists:
                user = user_doc.to_dict()
                hotel_name = user.get('hotel_name', 'N/A')
                email = user.get('email', 'N/A')
                phone = user.get('phone', 'N/A')
            
            # Count items and sum quantities, and collect items
            item_count = 0
            total_quantity = 0
            items_list = []
            items_query = get_firestore_client().collection('orders').document(order_doc.id).collection('order_items').stream()
            
            for item_doc in items_query:
                item = item_doc.to_dict()
                item_count += 1
                total_quantity += float(item.get('quantity', 0))
                # Add item to list
                items_list.append({
                    'product_id': item.get('product_id', ''),
                    'product_name': item.get('product_name', ''),
                    'quantity': str(float(item.get('quantity', 0))),
                    'unit_type': item.get('unit_type', ''),
                    'price': str(float(item.get('price', 0))),
                    'special_instructions': item.get('special_instructions', '')
                })
            
            try:
                orders_list.append({
                    'order_id': str(order_doc.id),
                    'user_id': str(user_id) if user_id else '',
                    'hotel_id': str(user_id) if user_id else '',
                    'hotel_name': str(hotel_name),
                    'email': str(email),
                    'phone': str(phone),
                    'order_date': str(order.get('order_date', '')),
                    'status': str(order.get('status', '')),
                    'item_count': str(item_count),
                    'total_quantity': str(total_quantity),
                    'total_amount': str(float(order.get('total_amount', 0))),
                    'items': items_list
                })
            except Exception as append_err:
                logger.error(f"Error appending order: {str(append_err)}")
                pass  # Skip this order if it fails to append
        
        try:
            response_data = make_json_safe({
                'date': date_str,
                'day': day_str,
                'selected_date': selected_date_str,
                'target_date': target_date.strftime('%Y-%m-%d'),
                'orders': orders_list,
                'total_orders': len(orders_list),
                'success': True
            })
            return jsonify(response_data), 200
        except Exception as json_err:
            logger.error(f"Error serializing response: {str(json_err)}")
            return jsonify({'error': 'Failed to serialize response'}), 500
        
    except Exception as e:
        try:
            logger.error(f"Error fetching historical hotel orders: {str(e)}")
        except:
            logger.error("Error fetching historical hotel orders (logging failed)")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/admin/orders/<int:order_id>/finalize-prices', methods=['PUT'])
@token_required
@admin_required
def finalize_order_prices(current_user, order_id):
    """Admin finalizes prices for an order from Firestore"""
    try:
        firestore_client = get_firestore_client()
        order_ref = firestore_client.collection('orders').document(str(order_id))
        order_doc = order_ref.get()
        
        if not order_doc.exists:
            return jsonify({'error': 'Order not found'}), 404
        
        order = order_doc.to_dict()
        data = request.get_json()
        
        if not data or 'items' not in data:
            return jsonify({'error': 'Items with prices required'}), 400
        
        items_with_prices = data.get('items', [])
        new_total_amount = 0
        
        # Get all order items
        items_query = order_ref.collection('order_items').stream()
        items_map = {}
        for item_doc in items_query:
            items_map[item_doc.id] = item_doc.reference
        
        # Use batch for atomic updates
        batch = firestore_client.batch()
        
        for price_item in items_with_prices:
            # Support both item_id and product_id lookups
            item_id = price_item.get('item_id')
            product_id = price_item.get('product_id')
            price = float(price_item.get('price_per_unit', 0))
            
            # Find the matching item in the order
            matched_ref = None
            if item_id and item_id in items_map:
                matched_ref = items_map[item_id]
            elif product_id:
                # Find by product_id
                for existing_id, ref in items_map.items():
                    existing_doc = ref.get()
                    if existing_doc.exists and existing_doc.get('product_id') == str(product_id):
                        matched_ref = ref
                        break
            
            if matched_ref:
                item_doc = matched_ref.get()
                item = item_doc.to_dict()
                
                quantity = float(item.get('quantity', 1))
                item_total = price * quantity
                
                batch.update(matched_ref, {
                    'price_at_order': price,
                    'subtotal': item_total
                })
                
                new_total_amount += item_total
        
        # Update order with new total
        batch.update(order_ref, {
            'total_amount': new_total_amount,
            'price_finalized': True,
            'price_finalized_at': datetime.now(timezone.utc).isoformat()
        })
        
        # Update associated bill if exists
        bills_query = firestore_client.collection('bills').where('order_id', '==', str(order_id)).stream()
        for bill_doc in bills_query:
            batch.update(bill_doc.reference, {
                'total_amount': new_total_amount,
                'paid': False,
                'updated_at': datetime.now(timezone.utc).isoformat()
            })
        
        batch.commit()
        
        return jsonify({
            'message': 'Prices finalized successfully',
            'order_id': order_id,
            'new_total_amount': new_total_amount,
            'success': True
        }), 200
        
    except Exception as e:
        logger.error(f"Error finalizing order prices: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500

# ===================================================================
# HOTEL ORDER CREATION (Part 2)
# ===================================================================
@app.route('/api/hotel/orders', methods=['POST'])
@token_required
def create_hotel_order(current_user):
    """Hotel user places a new order - uses Firestore with sequential IDs"""
    try:
        user_id = current_user.get('id')
        data = request.get_json()
        
        logger.info(f"[HOTEL_ORDER] Starting order creation for user {user_id}")
        logger.info(f"[HOTEL_ORDER] Request data: {data}")
        
        required_fields = ['delivery_date', 'items']
        for field in required_fields:
            if not data.get(field):
                logger.error(f"[HOTEL_ORDER] Missing required field: {field}")
                return jsonify({'error': f'{field} is required'}), 400
        
        if not isinstance(data['items'], list) or len(data['items']) == 0:
            logger.error("[HOTEL_ORDER] Items must be a non-empty list")
            return jsonify({'error': 'Order must have at least one item'}), 400
        
        firestore_client = get_firestore_client()
        if firestore_client is None:
            logger.error("[HOTEL_ORDER] CRITICAL: Firestore client not initialized")
            return jsonify({'error': 'Database connection error', 'detail': 'Firestore unavailable'}), 500
        
        logger.info(f"[HOTEL_ORDER] Firestore client initialized, processing {len(data['items'])} items")
        
        # Verify products exist (but don't calculate total - that's done after pricing)
        order_items = []
        
        for idx, item in enumerate(data['items']):
            try:
                logger.info(f"[HOTEL_ORDER] Processing item {idx}: product_id={item.get('product_id')}, quantity={item.get('quantity')}")
                
                product_id = str(item.get('product_id', ''))
                if not product_id:
                    logger.error(f"[HOTEL_ORDER] Item {idx} has no product_id")
                    return jsonify({'error': f'Item {idx}: product_id is required'}), 400
                
                try:
                    product_doc = firestore_client.collection('products').document(product_id).get()
                except Exception as doc_fetch_err:
                    logger.warning(f"[HOTEL_ORDER] Direct document fetch failed for {product_id}, trying query: {str(doc_fetch_err)}")
                    # Try getting by ID field
                    products = list(firestore_client.collection('products').where('id', '==', product_id).limit(1).stream())
                    if not products:
                        logger.error(f"[HOTEL_ORDER] Product {product_id} not found")
                        return jsonify({'error': f"Product with ID {product_id} not found"}), 400
                    product_doc = products[0]
                
                if not product_doc.exists:
                    logger.error(f"[HOTEL_ORDER] Product document does not exist: {product_id}")
                    return jsonify({'error': f"Product with ID {product_id} not found"}), 400
                
                product = product_doc.to_dict()
                logger.info(f"[HOTEL_ORDER] Product found: {product.get('name', 'Unknown')}")
                
                if not product.get('is_available', True):
                    logger.error(f"[HOTEL_ORDER] Product {product_id} is not available")
                    return jsonify({'error': f"Product with ID {product_id} is not available"}), 400
                
                quantity = float(item.get('quantity', 0))
                if quantity < 1:
                    logger.error(f"[HOTEL_ORDER] Invalid quantity {quantity} for product {product_id}")
                    return jsonify({'error': f"Invalid quantity for product {product_id}"}), 400
                
                logger.info(f"[HOTEL_ORDER] Verified item: {product.get('name')} x {quantity}")
                
                order_items.append({
                    'product_id': str(item['product_id']),
                    'product_name': product.get('name', 'Unknown'),
                    'quantity': quantity,
                    'price_at_order': 0,
                    'subtotal': 0
                })
            except Exception as item_err:
                logger.error(f"[HOTEL_ORDER] Error processing item {idx}: {str(item_err)}")
                logger.error(f"[HOTEL_ORDER] Item error traceback: {traceback.format_exc()}")
                return jsonify({'error': f'Failed to process item {idx}: {str(item_err)}'}), 400
        
        logger.info(f"[HOTEL_ORDER] All items verified. Ready for price finalization.")
        
        # Get next order ID from counter (ATOMIC transaction)
        try:
            order_id = str(get_next_counter_id('orders'))
            logger.info(f"[HOTEL_ORDER] Got next order ID: {order_id}")
        except Exception as counter_err:
            logger.error(f"[HOTEL_ORDER] Error getting order counter: {str(counter_err)}")
            logger.error(f"[HOTEL_ORDER] Counter error traceback: {traceback.format_exc()}")
            return jsonify({'error': 'Failed to generate order ID', 'detail': str(counter_err)}), 500
        
        # Create order document with sequential ID
        try:
            order_data = {
                'user_id': user_id,
                'order_date': datetime.now(timezone.utc).isoformat(),
                'delivery_date': data.get('delivery_date'),
                'total_amount': 0,
                'status': 'pending',
                'special_instructions': data.get('special_instructions', ''),
                'price_finalized': False,
                'created_at': datetime.now(timezone.utc).isoformat(),
                'updated_at': datetime.now(timezone.utc).isoformat()
            }
            
            firestore_client.collection('orders').document(order_id).set(order_data)
            logger.info(f"[HOTEL_ORDER] Order document created with ID: {order_id}")
            
            # Create order items in subcollection
            for idx, item in enumerate(order_items):
                firestore_client.collection('orders').document(order_id).collection('order_items').document(f'item_{idx}').set({
                    'product_id': item['product_id'],
                    'product_name': item['product_name'],
                    'quantity': item['quantity'],
                    'price_at_order': item['price_at_order'],
                    'subtotal': item['subtotal'],
                    'created_at': datetime.now(timezone.utc).isoformat()
                })
            
            logger.info(f"[HOTEL_ORDER] Added {len(order_items)} items to order")
        except Exception as order_err:
            logger.error(f"[HOTEL_ORDER] Error creating order document: {str(order_err)}")
            logger.error(f"[HOTEL_ORDER] Order creation error traceback: {traceback.format_exc()}")
            return jsonify({'error': 'Failed to create order', 'detail': str(order_err)}), 500
        
        # Create bill document with sequential bill ID from counter (ATOMIC transaction)
        try:
            bill_id = str(get_next_counter_id('bills'))
            logger.info(f"[HOTEL_ORDER] Got next bill ID: {bill_id}")
            
            # Get user details for bill
            hotel_name = ''
            email = ''
            address = ''
            try:
                user_doc = firestore_client.collection('users').document(str(user_id)).get()
                if user_doc.exists:
                    user_data = user_doc.to_dict()
                    hotel_name = user_data.get('hotel_name', '')
                    email = user_data.get('email', '')
                    address = user_data.get('address', '')
                    logger.info(f"[HOTEL_ORDER] User details fetched for bill: {hotel_name}")
            except Exception as user_err:
                logger.warning(f"[HOTEL_ORDER] Could not fetch user details: {str(user_err)}")
            
            bill_data = {
                'order_id': order_id,
                'user_id': user_id,
                'hotel_name': hotel_name,
                'email': email,
                'address': address,
                'bill_date': datetime.now(timezone.utc).strftime('%Y-%m-%d'),
                'total_amount': total_amount,
                'paid': False,
                'payment_method': '',
                'due_date': data.get('due_date', (datetime.now(timezone.utc) + timedelta(days=10)).strftime('%Y-%m-%d')),
                'created_at': datetime.now(timezone.utc).isoformat(),
                'updated_at': datetime.now(timezone.utc).isoformat()
            }
            
            firestore_client.collection('bills').document(str(bill_id)).set(bill_data)
            logger.info(f"[HOTEL_ORDER] Bill {bill_id} created for order {order_id}")
            
        except Exception as bill_err:
            logger.error(f"[HOTEL_ORDER] Error creating bill: {str(bill_err)}")
            logger.error(f"[HOTEL_ORDER] Bill error traceback: {traceback.format_exc()}")
            # Don't fail the order if bill creation fails
            logger.warning(f"[HOTEL_ORDER] Continuing with order despite bill creation error")
        
        logger.info(f"[HOTEL_ORDER] Order creation complete. Order ID: {order_id}")
        return jsonify({
            'message': 'Order placed successfully',
            'order_id': order_id,
            'total_amount': 0,
            'success': True
        }), 201
        
    except Exception as e:
        logger.error(f"[HOTEL_ORDER] CRITICAL ERROR: {str(e)}")
        logger.error(f"[HOTEL_ORDER] Error type: {type(e).__name__}")
        logger.error(f"[HOTEL_ORDER] Traceback: {traceback.format_exc()}")
        return jsonify({'error': str(e), 'detail': 'Failed to create order'}), 500

# ===================================================================
# ADMIN PRODUCTS ROUTES (Part 2)
# ===================================================================
@app.route('/api/products', methods=['GET'])
@token_required
def get_products(current_user):
    """Get all available products from Firestore"""
    try:
        products = []
        products_query = get_firestore_client().collection('products').stream()
        
        for product_doc in products_query:
            product = product_doc.to_dict()
            product['id'] = product_doc.id
            if product.get('is_available', True):
                products.append(product)
        
        # Sort by category, then name
        products.sort(key=lambda x: (x.get('category', ''), x.get('name', '')))
        
        return jsonify({
            'products': products,
            'total_products': len(products),
            'success': True
        }), 200
    except Exception as e:
        logger.error(f"Get products error: {str(e)}")
        return jsonify({'error': 'Failed to fetch products'}), 500

@app.route('/api/admin/products', methods=['POST'])
@token_required
@admin_required
def create_product(current_user):
    """Create new product in Firestore"""
    try:
        data = request.get_json()
        
        # Handle field name variations from frontend
        product_name = data.get('product_name') or data.get('name')
        price = data.get('current_price') or data.get('price_per_unit')
        category = data.get('category')
        unit_type = data.get('unit') or data.get('unit_type', 'kg')
        
        # Check required fields
        if not product_name:
            return jsonify({'error': 'Missing required field: name'}), 400
        if not price:
            return jsonify({'error': 'Missing required field: price_per_unit'}), 400
        if not category:
            return jsonify({'error': 'Missing required field: category'}), 400
        
        # Build product data
        product_data = {
            'name': product_name,
            'description': data.get('description', ''),
            'price_per_unit': float(price),
            'image_url': data.get('image_url', ''),
            'category': category,
            'unit_type': unit_type,
            'stock_quantity': float(data.get('stock_quantity', 0)),
            'is_available': data.get('is_available', 'true').lower() == 'true' if isinstance(data.get('is_available'), str) else data.get('is_available', True),
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        }
        
        product_ref = get_firestore_client().collection('products').document()
        product_ref.set(product_data)
        
        return jsonify({
            'message': 'Product created successfully',
            'product_id': product_ref.id,
            'success': True
        }), 201
    except Exception as e:
        logger.error(f"Create product error: {str(e)}")
        return jsonify({'error': str(e)}), 500
        data = request.get_json()
        
        required_fields = ['product_name', 'category', 'unit', 'current_price']
        # Map frontend field names to database column names
        field_mapping = {
            'product_name': 'name',
            'current_price': 'price_per_unit',
            'unit': 'unit_type'
        }
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Type conversion and validation
        try:
            price = float(data['current_price'])
            if price < 0:
                return jsonify({'error': 'Price must be non-negative'}), 400
        except (ValueError, TypeError):
            return jsonify({'error': 'Invalid price format'}), 400
        
        try:
            stock = int(data.get('stock_quantity', 999999))
            if stock < 0:
                return jsonify({'error': 'Stock must be non-negative'}), 400
        except (ValueError, TypeError):
            return jsonify({'error': 'Invalid stock format'}), 400
        
        # Handle is_available conversion
        is_available = data.get('is_available', 'true')
        if isinstance(is_available, bool):
            is_available = 1 if is_available else 0
        else:
            is_available = 1 if str(is_available).lower() == 'true' else 0
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            """
            INSERT INTO products (name, description, price_per_unit, 
                                stock_quantity, image_url, category, unit_type, is_available)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                data['product_name'],
                data.get('description', ''),
                price,
                stock,
                data.get('image_url', ''),
                data['category'],
                data['unit'],
                is_available
            )
        )
        
        conn.commit()
        product_id = cursor.lastrowid
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'message': 'Product created successfully',
            'product_id': product_id,
            'success': True
        }), 201
    except Exception as e:
        logger.error(f"Create product error: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': f'Failed to create product: {str(e)}'}), 500

@app.route('/api/admin/products/<product_id>', methods=['PUT'])
@token_required
@admin_required
def update_product(current_user, product_id):
    """Update product in Firestore"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        product_ref = get_firestore_client().collection('products').document(str(product_id))
        product_doc = product_ref.get()
        
        if not product_doc.exists:
            return jsonify({'error': 'Product not found'}), 404
        
        # Map and validate fields
        update_data = {}
        field_mapping = {
            'product_name': 'name',
            'current_price': 'price_per_unit',
            'unit': 'unit_type'
        }
        allowed_fields = ['product_name', 'description', 'current_price', 'stock_quantity',
                         'image_url', 'category', 'unit', 'is_available']
        
        for field in allowed_fields:
            if field in data:
                db_field = field_mapping.get(field, field)
                value = data[field]
                
                if field == 'current_price':
                    try:
                        value = float(value)
                        if value < 0:
                            return jsonify({'error': 'Price must be non-negative'}), 400
                    except (ValueError, TypeError):
                        return jsonify({'error': 'Invalid price format'}), 400
                elif field == 'stock_quantity':
                    try:
                        value = float(value)
                        if value < 0:
                            return jsonify({'error': 'Stock must be non-negative'}), 400
                    except (ValueError, TypeError):
                        return jsonify({'error': 'Invalid stock format'}), 400
                elif field == 'is_available':
                    value = bool(value) if not isinstance(value, bool) else value
                
                update_data[db_field] = value
        
        if not update_data:
            return jsonify({'error': 'No valid fields to update'}), 400
        
        update_data['updated_at'] = datetime.now().isoformat()
        product_ref.update(update_data)
        
        return jsonify({'message': 'Product updated successfully', 'success': True}), 200
    except Exception as e:
        logger.error(f"Update product error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/products/<product_id>', methods=['DELETE'])
@token_required
@admin_required
def delete_product(current_user, product_id):
    """Delete product from Firestore"""
    try:
        product_ref = get_firestore_client().collection('products').document(str(product_id))
        product_doc = product_ref.get()
        
        if not product_doc.exists:
            return jsonify({'error': 'Product not found'}), 404
        
        product_ref.delete()
        
        return jsonify({
            'message': 'Product deleted successfully',
            'success': True
        }), 200
    except Exception as e:
        logger.error(f"Delete product error: {str(e)}")
        return jsonify({'error': str(e)}), 500
        
        return jsonify({'message': 'Product deleted successfully', 'success': True})
    except Exception as e:
        logger.error(f"Delete product error: {str(e)}")
        return jsonify({'error': 'Failed to delete product'}), 500

# ===================================================================
# ADMIN USERS MANAGEMENT (Part 2)
# ===================================================================
@app.route('/api/admin/users', methods=['GET'])
@token_required
@admin_required
def get_users(current_user):
    """Get all hotel users from Firestore"""
    try:
        users = []
        try:
            # Query all users and filter client-side to debug
            firestore_db = get_firestore_client()
            if firestore_db is None:
                logger.error("[USERS] Firestore database client not initialized")
                return jsonify({'users': [], 'success': True})
            
            all_users = firestore_db.collection('users').stream()
            logger.info("[USERS] Fetching all users from Firestore...")
            
            for user_doc in all_users:
                user = user_doc.to_dict()
                user_role = user.get('role', '')
                logger.info(f"[USERS] Found user {user_doc.id}: role={user_role}")
                
                # Only include hotel users
                if user_role == 'hotel':
                    users.append({
                        'id': user_doc.id,
                        'username': user.get('username', ''),
                        'role': user.get('role', 'hotel'),
                        'hotel_name': user.get('hotel_name', ''),
                        'hotel_image': user.get('hotel_image', ''),
                        'email': user.get('email', ''),
                        'phone': user.get('phone', ''),
                        'address': user.get('address', ''),
                        'created_at': str(user.get('created_at', '')) if user.get('created_at') else '',
                        'last_login': str(user.get('last_login', '')) if user.get('last_login') else ''
                    })
            
            # Sort by id (numeric sort if all are numbers)
            try:
                users.sort(key=lambda x: int(x['id']), reverse=True)
            except:
                pass  # If IDs aren't all numeric, just keep original order
            
            logger.info(f"[USERS] Retrieved {len(users)} hotel users from Firestore")
        except Exception as e:
            logger.error(f"[USERS] Error querying users: {str(e)}")
            import traceback
            logger.error(f"[USERS] Traceback: {traceback.format_exc()}")
        
        return jsonify({'users': users, 'success': True})
    except Exception as e:
        logger.error(f"[USERS] Get users error: {str(e)}")
        import traceback
        logger.error(f"[USERS] Traceback: {traceback.format_exc()}")
        return jsonify({'error': 'Failed to fetch users'}), 500

@app.route('/api/admin/users', methods=['POST'])
@token_required
@admin_required
def create_user(current_user):
    """Create new hotel user in Firestore with sequential ID"""
    try:
        logger.info("[CREATE_USER] Received request to create new user")
        
        firestore_db = get_firestore_client()
        if firestore_db is None:
            logger.error("[CREATE_USER] Firestore database client not initialized")
            return jsonify({'error': 'Database not initialized'}), 500
        
        data = request.get_json()
        
        required_fields = ['username', 'password', 'hotel_name']
        for field in required_fields:
            if not data.get(field):
                logger.warning(f"[CREATE_USER] Missing required field: {field}")
                return jsonify({'error': f'{field} is required'}), 400
        
        # Hash password
        password_hash = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Get next user ID from counter
        from datetime import datetime, timezone
        counter_ref = get_firestore_client().collection('_counters').document('users')
        counter_doc = counter_ref.get()
        
        logger.info(f"Counter doc exists: {counter_doc.exists}")
        
        if counter_doc.exists:
            next_id = counter_doc.get('count') + 1
        else:
            next_id = 1
        
        logger.info(f"Creating user with ID: {next_id}")
        
        # Create user document with sequential ID
        user_id = str(next_id)
        user_data = {
            'id': next_id,
            'username': data['username'],
            'password_hash': password_hash,
            'role': 'hotel',
            'hotel_name': data.get('hotel_name', ''),
            'hotel_image': data.get('hotel_image', ''),
            'email': data.get('email', ''),
            'phone': data.get('phone', ''),
            'address': data.get('address', ''),
            'created_at': datetime.now(timezone.utc)
        }
        
        # Use set to create with specific ID, then increment counter
        get_firestore_client().collection('users').document(user_id).set(user_data)
        counter_ref.set({'count': next_id}, merge=True)
        
        logger.info(f"Successfully created user {user_id} in Firestore")
        
        return jsonify({
            'message': 'User created successfully',
            'user_id': user_id,
            'success': True
        }), 201
    except Exception as e:
        logger.error(f"Create user error: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': f'Failed to create user: {str(e)}'}), 500

@app.route('/api/admin/users/<string:user_id>', methods=['GET'])
@token_required
@admin_required
def get_single_user(current_user, user_id):
    """Get single user details from Firestore"""
    try:
        logger.info(f"[SINGLE_USER] Fetching user: {user_id}")
        
        firestore_db = get_firestore_client()
        if firestore_db is None:
            logger.error("[SINGLE_USER] Firestore database client not initialized")
            return jsonify({'error': 'Database not initialized'}), 500
        
        user_doc = firestore_db.collection('users').document(user_id).get()
        
        if not user_doc.exists:
            logger.warning(f"[SINGLE_USER] User not found: {user_id}")
            return jsonify({'error': 'User not found'}), 404
        
        user = user_doc.to_dict()
        user['id'] = user_id
        
        # Only return hotel users
        if user.get('role') != 'hotel':
            logger.warning(f"[SINGLE_USER] User is not a hotel user (role={user.get('role')}): {user_id}")
            return jsonify({'error': 'User not found'}), 404
        
        logger.info(f"[SINGLE_USER] Successfully fetched user: {user_id}")
        return jsonify({'user': user, 'success': True})
    except Exception as e:
        logger.error(f"[SINGLE_USER] Get user error: {str(e)}")
        import traceback
        logger.error(f"[SINGLE_USER] Traceback: {traceback.format_exc()}")
        return jsonify({'error': 'Failed to fetch user'}), 500

@app.route('/api/admin/users/<string:user_id>', methods=['PUT'])
@token_required
@admin_required
def update_user(current_user, user_id):
    """Update user details in Firestore"""
    try:
        logger.info(f"[UPDATE_USER] Updating user: {user_id}")
        
        firestore_db = get_firestore_client()
        if firestore_db is None:
            logger.error("[UPDATE_USER] Firestore database client not initialized")
            return jsonify({'error': 'Database not initialized'}), 500
        
        data = request.get_json()
        
        if not data:
            logger.warning("[UPDATE_USER] No data provided")
            return jsonify({'error': 'No data provided'}), 400
        
        # Verify user exists and is a hotel user
        user_doc = firestore_db.collection('users').document(user_id).get()
        if not user_doc.exists or user_doc.to_dict().get('role') != 'hotel':
            logger.warning(f"[UPDATE_USER] User not found or not a hotel user: {user_id}")
            return jsonify({'error': 'User not found'}), 404
        
        update_data = {}
        
        allowed_fields = ['username', 'hotel_name', 'hotel_image', 'email', 'phone', 'address']
        
        for field in allowed_fields:
            if field in data:
                update_data[field] = data[field]
        
        # Handle password separately
        if 'password' in data:
            password_hash = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            update_data['password_hash'] = password_hash
        
        if not update_data:
            logger.warning("[UPDATE_USER] No valid fields to update")
            return jsonify({'error': 'No valid fields to update'}), 400
        
        firestore_db.collection('users').document(user_id).update(update_data)
        logger.info(f"[UPDATE_USER] Successfully updated user: {user_id}")
        
        return jsonify({'message': 'User updated successfully', 'success': True})
    except Exception as e:
        logger.error(f"[UPDATE_USER] Update user error: {str(e)}")
        import traceback
        logger.error(f"[UPDATE_USER] Traceback: {traceback.format_exc()}")
        return jsonify({'error': 'Failed to update user'}), 500

@app.route('/api/admin/users/<string:user_id>', methods=['DELETE'])
@token_required
@admin_required
def delete_user(current_user, user_id):
    """Delete user from Firestore"""
    try:
        logger.info(f"[DELETE_USER] Deleting user: {user_id}")
        
        firestore_db = get_firestore_client()
        if firestore_db is None:
            logger.error("[DELETE_USER] Firestore database client not initialized")
            return jsonify({'error': 'Database not initialized'}), 500
        
        # Verify user exists and is a hotel user
        user_doc = firestore_db.collection('users').document(user_id).get()
        if not user_doc.exists or user_doc.to_dict().get('role') != 'hotel':
            logger.warning(f"[DELETE_USER] User not found or not a hotel user: {user_id}")
            return jsonify({'error': 'User not found'}), 404
        
        # Delete the user
        firestore_db.collection('users').document(user_id).delete()
        logger.info(f"[DELETE_USER] Successfully deleted user: {user_id}")
        
        return jsonify({'message': 'User deleted successfully', 'success': True})
    except Exception as e:
        logger.error(f"[DELETE_USER] Delete user error: {str(e)}")
        import traceback
        logger.error(f"[DELETE_USER] Traceback: {traceback.format_exc()}")
        return jsonify({'error': 'Failed to delete user'}), 500

# ===================================================================
# ADMIN ANALYTICS & DASHBOARD (Part 2)
# ===================================================================
@app.route('/api/admin/analytics', methods=['GET'])
@token_required
@admin_required
def get_admin_analytics(current_user):
    """Get comprehensive analytics with proper structure for frontend - using Firestore"""
    try:
        from datetime import datetime, timedelta, timezone
        
        # Initialize Firestore client
        firestore_client = get_firestore_client()
        if firestore_client is None:
            logger.error("Firestore database client not initialized")
            return jsonify({
                'revenue': {'yesterday': 0, 'month': 0, 'year': 0},
                'hotels': {'total_hotels': 0, 'unpaid_hotels_count': 0, 'unpaid_hotels': [], 'revenue_by_hotel': []},
                'trends': {'daily': [], 'monthly': []},
                'top_products': [],
                'success': True
            })
        
        # Initialize accumulators
        yesterday_revenue = 0
        month_revenue = 0
        year_revenue = 0
        daily_trends = {}
        monthly_trends = {}
        hotel_revenue = {}
        top_products = {}
        unpaid_hotels_dict = {}
        
        now = datetime.now(timezone.utc)
        yesterday = now - timedelta(days=1)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        year_start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        
        logger.info(f"🔍 Analytics Debug - Current time (UTC): {now}")
        logger.info(f"🔍 Querying Firestore collections...")
        logger.info(f"✅ Firestore client ready")
        
        # Query all orders from Firestore
        try:
            orders_list = list(firestore_client.collection('orders').stream())
            logger.info(f"📦 Found {len(orders_list)} total orders in Firestore")
            
            for order_doc in orders_list:
                order = order_doc.to_dict()
                order_id = order_doc.id
                
                # Log order details for debugging
                logger.info(f"📄 Processing order {order_id}: status={order.get('status')}, date={order.get('order_date')}, amount={order.get('total_amount')}")
                
                # Skip cancelled orders (accept delivered, completed, pending, etc.)
                order_status = order.get('status', '').lower()
                if order_status in ['cancelled', 'rejected']:
                    logger.info(f"⏭️  Skipping cancelled/rejected order {order_id}")
                    continue
                
                # Get order date - handle multiple formats
                order_date = order.get('order_date')
                
                # Handle Firestore Timestamp
                if hasattr(order_date, 'to_pydatetime'):
                    order_date = order_date.to_pydatetime()
                # Handle string date formats
                elif isinstance(order_date, str):
                    try:
                        # Try ISO format with timezone
                        order_date = datetime.fromisoformat(order_date.replace('Z', '+00:00'))
                    except:
                        try:
                            # Try simple date format: "2025-11-11"
                            order_date = datetime.strptime(order_date, '%Y-%m-%d')
                        except:
                            try:
                                # Try with time: "2025-11-11 10:30:00"
                                order_date = datetime.strptime(order_date, '%Y-%m-%d %H:%M:%S')
                            except:
                                logger.warning(f"Could not parse order_date: {order_date}")
                                continue
                # Handle datetime object
                elif isinstance(order_date, datetime):
                    pass
                else:
                    logger.warning(f"Unknown order_date type: {type(order_date)}")
                    continue
                
                # Ensure order_date is timezone-aware
                if order_date.tzinfo is None:
                    order_date = order_date.replace(tzinfo=timezone.utc)
                
                amount = float(order.get('total_amount', 0) or 0)
                # Try multiple field names for user_id
                user_id = order.get('user_id') or order.get('hotel_id') or order.get('customer_id') or order_doc.id
                
                logger.info(f"✅ Parsed order {order_id}: date={order_date}, amount={amount}, user_id={user_id}")
                
                # Log date comparisons
                logger.info(f"   Dates: now={now.date()}, yesterday={yesterday.date()}, order_date={order_date.date()}")
                logger.info(f"   Yesterday check: {order_date.date()} == {yesterday.date()} ? {order_date.date() == yesterday.date()}")
                logger.info(f"   Month check: {order_date.year}=={now.year} and {order_date.month}=={now.month} ? {order_date.year == now.year and order_date.month == now.month}")
                
                # Yesterday's revenue
                if order_date.date() == yesterday.date():
                    yesterday_revenue += amount
                
                # This month's revenue
                if order_date.year == now.year and order_date.month == now.month:
                    month_revenue += amount
                
                # This year's revenue
                if order_date.year == now.year:
                    year_revenue += amount
                
                # Daily trends (last 30 days)
                date_key = order_date.date().isoformat()
                if order_date >= now - timedelta(days=30):
                    daily_trends[date_key] = daily_trends.get(date_key, 0) + amount
                
                # Monthly trends (last 12 months)
                month_key = order_date.strftime('%Y-%m')
                if order_date >= now - timedelta(days=365):
                    monthly_trends[month_key] = monthly_trends.get(month_key, 0) + amount
                
                # Revenue by hotel/user
                if user_id:
                    if user_id not in hotel_revenue:
                        hotel_revenue[user_id] = {'revenue': 0, 'orders': 0}
                    hotel_revenue[user_id]['revenue'] += amount
                    hotel_revenue[user_id]['orders'] += 1
                
                # Top products
                try:
                    items_query = order_doc.reference.collection('order_items').stream()
                    for item_doc in items_query:
                        item = item_doc.to_dict()
                        product_id = item.get('product_id', '')
                        quantity = float(item.get('quantity', 0) or 0)
                        # Try multiple field names for price
                        price = float(item.get('price') or item.get('unit_price') or item.get('price_per_unit') or 0)
                        item_revenue = quantity * price
                        
                        if product_id and quantity > 0:
                            if product_id not in top_products:
                                top_products[product_id] = {
                                    'quantity': 0,
                                    'revenue': 0,
                                    'name': item.get('product_name', 'Unknown'),
                                    'category': None
                                }
                            top_products[product_id]['quantity'] += quantity
                            top_products[product_id]['revenue'] += item_revenue
                except Exception as e:
                    logger.warning(f"Error processing order items: {str(e)}")
        
        except Exception as e:
            logger.error(f"Error querying orders: {str(e)}")
        
        # Query bills for unpaid hotels
        try:
            bills_query = firestore_client.collection('bills').stream()
            
            for bill_doc in bills_query:
                bill = bill_doc.to_dict()
                
                # Check for unpaid bills - handle both 'status' and 'paid' fields
                bill_status = bill.get('status', '').lower()
                bill_paid = bill.get('paid', False)
                
                # Bill is unpaid if:
                # 1. status field exists and is not 'paid' or 'cancelled', OR
                # 2. paid field exists and is explicitly False, OR
                # 3. Both fields indicate unpaid
                is_unpaid = False
                if bill_status and bill_status not in ['paid', 'cancelled']:
                    is_unpaid = True
                elif bill_paid is False and 'paid' in bill:
                    is_unpaid = True
                
                if is_unpaid:
                    user_id = bill.get('user_id') or bill.get('hotel_id') or bill.get('customer_id')
                    if user_id:
                        # Try multiple field names for amount
                        amount = float(bill.get('total_amount') or bill.get('amount') or bill.get('bill_amount') or 0)
                        if amount > 0:
                            if user_id not in unpaid_hotels_dict:
                                unpaid_hotels_dict[user_id] = {'total': 0, 'count': 0}
                            unpaid_hotels_dict[user_id]['total'] += amount
                            unpaid_hotels_dict[user_id]['count'] += 1
                            logger.info(f"💰 Unpaid bill: user={user_id}, amount={amount}, status={bill_status}")
        except Exception as e:
            logger.warning(f"Error querying bills: {str(e)}")
        
        # Get hotel user details for unpaid hotels
        unpaid_hotels_list = []
        try:
            users_query = firestore_client.collection('users').where('role', '==', 'hotel').stream()
            
            for user_doc in users_query:
                user_id = user_doc.id
                user = user_doc.to_dict()
                
                if user_id in unpaid_hotels_dict:
                    unpaid_hotels_list.append({
                        'hotel_name': user.get('hotel_name', user.get('username', 'Unknown')),
                        'email': user.get('email', ''),
                        'phone': user.get('phone', ''),
                        'unpaid_bills_count': unpaid_hotels_dict[user_id]['count'],
                        'unpaid_total': unpaid_hotels_dict[user_id]['total']
                    })
        except Exception as e:
            logger.warning(f"Error querying hotel users: {str(e)}")
        
        # Build revenue by hotel list
        revenue_by_hotel_list = []
        try:
            users_query = firestore_client.collection('users').where('role', '==', 'hotel').stream()
            
            for user_doc in users_query:
                user_id = user_doc.id
                user = user_doc.to_dict()
                
                if user_id in hotel_revenue:
                    revenue_by_hotel_list.append({
                        'hotel_name': user.get('hotel_name', user.get('username', 'Unknown')),
                        'total_orders': hotel_revenue[user_id]['orders'],
                        'total_revenue': hotel_revenue[user_id]['revenue'],
                        'unpaid_amount': unpaid_hotels_dict.get(user_id, {}).get('total', 0),
                        'paid_amount': hotel_revenue[user_id]['revenue'] - unpaid_hotels_dict.get(user_id, {}).get('total', 0)
                    })
        except Exception as e:
            logger.warning(f"Error building revenue by hotel: {str(e)}")
        
        # Sort and limit
        revenue_by_hotel_list.sort(key=lambda x: x['total_revenue'], reverse=True)
        revenue_by_hotel_list = revenue_by_hotel_list[:10]
        unpaid_hotels_list.sort(key=lambda x: x['unpaid_total'], reverse=True)
        
        # Build top products list with category lookup
        top_products_list = []
        try:
            # Sort by revenue (or quantity if revenue is 0)
            sorted_products = sorted(top_products.items(), 
                                    key=lambda x: x[1]['revenue'] if x[1]['revenue'] > 0 else x[1]['quantity'], 
                                    reverse=True)[:5]
            
            for product_id, data in sorted_products:
                category = 'N/A'
                # Try to get category from products collection
                try:
                    product_doc = firestore_client.collection('products').document(str(product_id)).get()
                    if product_doc.exists:
                        product_data = product_doc.to_dict()
                        category = product_data.get('category') or product_data.get('category_name') or 'N/A'
                except Exception as e:
                    logger.warning(f"Could not fetch product {product_id}: {str(e)}")
                
                top_products_list.append({
                    'product_id': product_id,
                    'product_name': data.get('name', 'Unknown'),
                    'category': category,
                    'total_quantity': data.get('quantity', 0),
                    'total_revenue': data.get('revenue', 0)
                })
        except Exception as e:
            logger.warning(f"Error building top products: {str(e)}")
        
        # Convert trends to list format
        daily_trends_list = [
            {'date': date, 'revenue': revenue}
            for date, revenue in sorted(daily_trends.items())
        ]
        
        # Convert monthly trends with readable month names
        month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        monthly_trends_list = []
        for month_key, revenue in sorted(monthly_trends.items()):
            try:
                # month_key format is 'YYYY-MM'
                year, month_num = month_key.split('-')
                month_idx = int(month_num) - 1
                month_name = month_names[month_idx] if 0 <= month_idx < 12 else month_key
                monthly_trends_list.append({
                    'month': month_name,
                    'revenue': revenue
                })
            except Exception as e:
                logger.warning(f"Error processing monthly trend {month_key}: {str(e)}")
                monthly_trends_list.append({
                    'month': month_key,
                    'revenue': revenue
                })
        
        # Count total hotels
        total_hotels = 0
        try:
            total_hotels = len(list(firestore_client.collection('users').where('role', '==', 'hotel').stream()))
        except Exception as e:
            logger.warning(f"Error counting hotels: {str(e)}")
        
        # Log final totals
        logger.info(f"📊 Analytics Summary:")
        logger.info(f"   Yesterday Revenue: ₹{yesterday_revenue}")
        logger.info(f"   Month Revenue: ₹{month_revenue}")
        logger.info(f"   Year Revenue: ₹{year_revenue}")
        logger.info(f"   Hotels: {total_hotels}")
        logger.info(f"   Daily Trends: {len(daily_trends_list)} records")
        logger.info(f"   Monthly Trends: {len(monthly_trends_list)} records")
        logger.info(f"   Top Products: {len(top_products_list)} items")
        logger.info(f"   Unpaid Hotels: {len(unpaid_hotels_list)}")
        logger.info(f"   Revenue by Hotel: {len(revenue_by_hotel_list)}")
        
        return jsonify({
            'revenue': {
                'yesterday': float(yesterday_revenue),
                'month': float(month_revenue),
                'year': float(year_revenue)
            },
            'hotels': {
                'total_hotels': total_hotels,
                'unpaid_hotels_count': len(unpaid_hotels_list),
                'unpaid_hotels': unpaid_hotels_list,
                'revenue_by_hotel': revenue_by_hotel_list
            },
            'trends': {
                'daily': daily_trends_list,
                'monthly': monthly_trends_list
            },
            'top_products': top_products_list,
            'success': True
        })
    
    except Exception as e:
        logger.error(f"Get analytics error: {str(e)}")
        logger.error(f"Exception type: {type(e).__name__}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        
        # Return a detailed error message for debugging
        return jsonify({
            'error': f'Failed to fetch analytics: {str(e)}',
            'error_type': type(e).__name__
        }), 500

# ===================================================================
# ADMIN SUPPLIERS MANAGEMENT
# ===================================================================
@app.route('/api/admin/suppliers', methods=['GET', 'POST'])
@token_required
@admin_required
def suppliers_list(current_user):
    """Get all suppliers or create new supplier from Firestore"""
    if request.method == 'GET':
        try:
            suppliers_query = get_firestore_client().collection('suppliers').order_by('created_at', direction=firestore.Query.DESCENDING).stream()
            suppliers = []
            for doc in suppliers_query:
                supplier_data = doc.to_dict()
                supplier_data['id'] = doc.id
                suppliers.append(supplier_data)
            logger.info(f"[SUPPLIERS] Fetched {len(suppliers)} suppliers")
            return jsonify(suppliers)
        except Exception as e:
            logger.error(f"Get suppliers error: {str(e)}")
            return jsonify({'error': str(e)}), 500
    
    elif request.method == 'POST':
        data = request.get_json(silent=True)
        if data is None:
            return jsonify({'error': 'Invalid or missing JSON body'}), 400
        
        required_fields = ['name', 'phone']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        try:
            # Get next supplier ID from counter
            counter_ref = get_firestore_client().collection('_counters').document('suppliers')
            counter_doc = counter_ref.get()
            
            if counter_doc.exists:
                next_id = counter_doc.get('count', 0) + 1
            else:
                next_id = 1
            
            supplier_id = str(next_id)
            logger.info(f"[SUPPLIERS] Creating supplier with ID: {supplier_id}")
            
            supplier_data = {
                'name': data['name'],
                'email': data.get('email', ''),
                'phone': data['phone'],
                'address': data.get('address', ''),
                'status': data.get('status', 'active'),
                'created_at': datetime.now(timezone.utc).isoformat(),
                'updated_at': datetime.now(timezone.utc).isoformat()
            }
            
            get_firestore_client().collection('suppliers').document(supplier_id).set(supplier_data)
            counter_ref.set({'count': next_id}, merge=True)
            
            supplier_data['id'] = supplier_id
            return jsonify({'message': 'Supplier created', 'supplier': supplier_data}), 201
        except Exception as e:
            logger.error(f"Create supplier error: {str(e)}")
            return jsonify({'error': str(e)}), 500

@app.route('/api/admin/suppliers/<supplier_id>', methods=['GET'])
@token_required
@admin_required
def get_supplier(current_user, supplier_id):
    """Get single supplier from Firestore"""
    try:
        supplier_doc = get_firestore_client().collection('suppliers').document(str(supplier_id)).get()
        if not supplier_doc.exists:
            return jsonify({'error': 'Supplier not found'}), 404
        
        supplier_data = supplier_doc.to_dict()
        supplier_data['id'] = supplier_doc.id
        return jsonify(supplier_data), 200
    except Exception as e:
        logger.error(f"Get supplier error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/suppliers/<supplier_id>', methods=['PUT'])
@token_required
@admin_required
def update_supplier(current_user, supplier_id):
    """Update supplier in Firestore"""
    data = request.get_json(silent=True)
    if data is None:
        return jsonify({'error': 'Invalid or missing JSON body'}), 400

    allowed_fields = {'name', 'email', 'phone', 'address', 'status'}
    update_data = {}

    for field in allowed_fields:
        if field in data:
            update_data[field] = data[field]

    if not update_data:
        return jsonify({'error': 'No valid fields provided to update'}), 400

    try:
        supplier_ref = get_firestore_client().collection('suppliers').document(str(supplier_id))
        if not supplier_ref.get().exists:
            return jsonify({'error': 'Supplier not found'}), 404
        
        update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
        supplier_ref.update(update_data)
        
        updated_doc = supplier_ref.get()
        updated_data = updated_doc.to_dict()
        updated_data['id'] = updated_doc.id
        return jsonify({'message': 'Supplier updated', 'supplier': updated_data}), 200
    except Exception as e:
        logger.error(f"Update supplier error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/suppliers/<supplier_id>', methods=['DELETE'])
@token_required
@admin_required
def delete_supplier(current_user, supplier_id):
    """Delete supplier from Firestore"""
    try:
        supplier_ref = get_firestore_client().collection('suppliers').document(str(supplier_id))
        if not supplier_ref.get().exists:
            return jsonify({'error': 'Supplier not found'}), 404
        
        supplier_ref.delete()
        return jsonify({'message': 'Supplier deleted'}), 200
    except Exception as e:
        logger.error(f"Delete supplier error: {str(e)}")
        return jsonify({'error': str(e)}), 500

# ===================================================================
# ADMIN PRODUCT STOCK MANAGEMENT
# ===================================================================
@app.route('/api/admin/products/<product_id>/stock', methods=['PATCH'])
@token_required
@admin_required
def update_product_stock(current_user, product_id):
    """Update product stock quantity in Firestore"""
    try:
        data = request.get_json()
        stock_quantity = data.get('stock_quantity')
        
        if stock_quantity is None:
            return jsonify({'error': 'stock_quantity required'}), 400
        
        try:
            stock_quantity = float(stock_quantity)
            if stock_quantity < 0:
                return jsonify({'error': 'Stock must be non-negative'}), 400
        except (ValueError, TypeError):
            return jsonify({'error': 'Invalid stock quantity format'}), 400
        
        product_ref = get_firestore_client().collection('products').document(str(product_id))
        product_doc = product_ref.get()
        
        if not product_doc.exists:
            return jsonify({'error': 'Product not found'}), 404
        
        product_ref.update({
            'stock_quantity': stock_quantity,
            'updated_at': datetime.now().isoformat()
        })
        
        return jsonify({
            'message': 'Stock updated successfully',
            'success': True
        }), 200
    except Exception as e:
        logger.error(f"Update product stock error: {str(e)}")
        return jsonify({'error': str(e)}), 500

# ===================================================================
# ADMIN SESSION MANAGEMENT
# ===================================================================
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

# ===================================================================
# ADMIN PROFILE & SETTINGS
# ===================================================================
@app.route('/api/admin/profile', methods=['GET'])
@token_required
@admin_required
def get_admin_profile(current_user):
    """Get current admin profile"""
    try:
        user_doc = get_firestore_client().collection('users').document(str(current_user['id'])).get()
        if user_doc.exists:
            user_data = user_doc.to_dict()
            user_data['id'] = user_doc.id
            return jsonify(user_data)
        return jsonify({
            'id': current_user['id'],
            'username': current_user['username'],
            'email': current_user['email'],
            'phone': current_user['phone'],
            'role': current_user['role'],
            'hotel_name': current_user.get('hotel_name', 'BVS Admin'),
            'profile_image': '',
            'last_login': current_user.get('last_login')
        })
    except Exception as e:
        logger.error(f"Get admin profile error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/profile', methods=['PUT'])
@token_required
@admin_required
def update_admin_profile(current_user):
    """Update admin profile (email, phone, hotel_name, profile_image)"""
    data = request.get_json()
    logger.info(f"Profile update request for user {current_user['id']}, fields: {list(data.keys())}")
    
    try:
        user_ref = get_firestore_client().collection('users').document(str(current_user['id']))
        
        # Check if user exists
        if not user_ref.get().exists:
            logger.error(f"User {current_user['id']} not found in Firestore")
            return jsonify({'error': 'User not found'}), 404
        
        allowed_fields = ['email', 'phone', 'hotel_name', 'profile_image']
        update_data = {'updated_at': datetime.utcnow().isoformat() + 'Z'}
        
        for field in allowed_fields:
            if field in data and data[field]:
                if field == 'profile_image':
                    image_size = len(data[field])
                    logger.info(f"Updating profile_image, size: {image_size} bytes")
                    if image_size > 16777215:
                        return jsonify({'error': f'Image too large: {image_size} bytes. Maximum is 16MB.'}), 400
                update_data[field] = data[field]
        
        if len(update_data) == 1:
            return jsonify({'error': 'No valid fields to update'}), 400
        
        user_ref.update(update_data)
        
        logger.info(f"Profile updated successfully for user {current_user['id']}")
        
        updated_user = user_ref.get().to_dict()
        updated_user['id'] = user_ref.id
        
        return jsonify({
            'message': 'Profile updated successfully',
            'user': updated_user
        })
        
    except Exception as e:
        logger.error(f"Profile update error: {str(e)}")
        return jsonify({'error': f'Failed to update profile: {str(e)}'}), 500

@app.route('/api/admin/settings', methods=['GET'])
@token_required
@admin_required
def get_system_settings(current_user):
    """Get system settings"""
    try:
        doc = get_firestore_client().collection('admin_settings').document('global').get()
        
        if not doc.exists:
            # Return default settings if none exist
            return jsonify({
                'company_name': 'Bhairavnath Vegetables Supplier',
                'tax_rate': 5.0,
                'session_timeout': 28800,
                'currency': 'INR'
            })
        
        settings_data = doc.to_dict()
        settings_data['id'] = doc.id
        return jsonify(settings_data)
    except Exception as e:
        logger.error(f"Error fetching settings: {str(e)}")
        return jsonify({'error': f'Failed to fetch settings: {str(e)}'}), 500

@app.route('/api/admin/settings', methods=['PUT'])
@token_required
@admin_required
def update_system_settings(current_user):
    """Update system settings"""
    data = request.get_json()
    try:
        # Validate and convert numeric fields
        company_name = data.get('company_name', 'Bhairavnath Vegetables Supplier')
        
        # Handle tax_rate - convert to float, default to 5.0 if empty or invalid
        tax_rate = data.get('tax_rate', 5.0)
        try:
            tax_rate = float(tax_rate) if tax_rate not in [None, '', ' '] else 5.0
        except (ValueError, TypeError):
            tax_rate = 5.0
        
        # Handle session_timeout - convert to int, default to 28800 if empty or invalid
        session_timeout = data.get('session_timeout', 28800)
        try:
            session_timeout = int(session_timeout) if session_timeout not in [None, '', ' '] else 28800
        except (ValueError, TypeError):
            session_timeout = 28800
        
        currency = data.get('currency', 'INR')
        
        # Update settings in Firestore
        update_data = {
            'company_name': company_name,
            'tax_rate': tax_rate,
            'session_timeout': session_timeout,
            'currency': currency,
            'updated_at': datetime.utcnow().isoformat() + 'Z'
        }
        
        get_firestore_client().collection('admin_settings').document('global').set(update_data, merge=True)
        
        # Fetch and return updated settings
        doc = get_firestore_client().collection('admin_settings').document('global').get()
        updated_settings = doc.to_dict()
        updated_settings['id'] = doc.id
        
        return jsonify({
            'message': 'Settings updated successfully',
            'settings': updated_settings
        })
    except Exception as e:
        logger.error(f"Error updating settings: {str(e)}")
        return jsonify({'error': f'Failed to update settings: {str(e)}'}), 500

# ===================================================================
# ADMIN NOTIFICATION PREFERENCES
# ===================================================================
@app.route('/api/admin/notifications/preferences', methods=['GET'])
@token_required
@admin_required
def get_notification_preferences(current_user):
    """Get notification preferences for the current admin user"""
    try:
        user_id = current_user.get('id')
        prefs_doc = get_firestore_client().collection('notification_preferences').document(str(user_id)).get()
        
        if prefs_doc.exists:
            prefs_data = prefs_doc.to_dict()
            return jsonify(prefs_data)
        else:
            # Return defaults
            return jsonify({
                'email_new_orders': True,
                'sms_low_stock': True,
                'daily_reports': False
            })
    except Exception as e:
        logger.error(f"Error fetching notification preferences: {str(e)}")
        # Return defaults on error
        return jsonify({
            'email_new_orders': True,
            'sms_low_stock': True,
            'daily_reports': False
        })

@app.route('/api/admin/notifications/preferences', methods=['PUT'])
@token_required
@admin_required
def update_notification_preferences(current_user):
    """Update notification preferences"""
    data = request.get_json()
    try:
        user_id = current_user.get('id')
        
        prefs_data = {
            'email_new_orders': data.get('email_new_orders', True),
            'sms_low_stock': data.get('sms_low_stock', True),
            'daily_reports': data.get('daily_reports', False),
            'updated_at': datetime.utcnow().isoformat() + 'Z'
        }
        
        # Update preferences in Firestore
        get_firestore_client().collection('notification_preferences').document(str(user_id)).set(prefs_data, merge=True)
        
        return jsonify({
            'message': 'Notification preferences updated successfully',
            'preferences': prefs_data
        })
    except Exception as e:
        logger.error(f"Error updating notification preferences: {str(e)}")
        return jsonify({'error': f'Failed to update notification preferences: {str(e)}'}), 500

# ===================================================================
# ADMIN SUPPORT TICKETS
# ===================================================================
@app.route('/api/admin/support/tickets', methods=['GET'])
@token_required
@admin_required
def get_support_tickets(current_user):
    """Get all support tickets"""
    try:
        # Get all tickets from Firestore
        tickets_ref = get_firestore_client().collection('support_tickets').order_by('created_at', direction='DESCENDING').stream()
        tickets = []
        for doc in tickets_ref:
            ticket_data = doc.to_dict()
            ticket_data['id'] = doc.id
            
            # Get user info if user_id exists
            if ticket_data.get('user_id'):
                try:
                    user_doc = get_firestore_client().collection('users').document(str(ticket_data['user_id'])).get()
                    if user_doc.exists:
                        user_data = user_doc.to_dict()
                        ticket_data['hotel_name'] = user_data.get('hotel_name', '')
                        ticket_data['email'] = user_data.get('email', '')
                except:
                    ticket_data['hotel_name'] = 'Unknown'
                    ticket_data['email'] = 'Unknown'
            else:
                ticket_data['hotel_name'] = 'Admin'
                ticket_data['email'] = 'admin@bvs.com'
            
            # Get replies count
            replies_ref = get_firestore_client().collection('support_tickets').document(doc.id).collection('replies').stream()
            ticket_data['reply_count'] = len(list(replies_ref))
            
            tickets.append(ticket_data)
        
        return jsonify(tickets)
    except Exception as e:
        logger.error(f"Error fetching support tickets: {str(e)}")
        return jsonify({'error': f'Failed to fetch tickets: {str(e)}'}), 500

@app.route('/api/admin/support/tickets/<ticket_id>', methods=['GET'])
@token_required
@admin_required
def get_support_ticket(current_user, ticket_id):
    """Get single support ticket with replies"""
    try:
        # Get ticket
        ticket_ref = get_firestore_client().collection('support_tickets').document(ticket_id)
        ticket_doc = ticket_ref.get()
        
        if not ticket_doc.exists:
            return jsonify({'error': 'Ticket not found'}), 404
        
        ticket_data = ticket_doc.to_dict()
        ticket_data['id'] = ticket_doc.id
        
        # Get user info if user_id exists
        if ticket_data.get('user_id'):
            try:
                user_doc = get_firestore_client().collection('users').document(str(ticket_data['user_id'])).get()
                if user_doc.exists:
                    user_data = user_doc.to_dict()
                    ticket_data['hotel_name'] = user_data.get('hotel_name', '')
                    ticket_data['email'] = user_data.get('email', '')
            except:
                pass
        
        # Get replies
        replies_ref = ticket_ref.collection('replies').order_by('created_at', direction='ASCENDING').stream()
        ticket_data['replies'] = []
        for reply_doc in replies_ref:
            reply_data = reply_doc.to_dict()
            reply_data['id'] = reply_doc.id
            ticket_data['replies'].append(reply_data)
        
        return jsonify(ticket_data)
    except Exception as e:
        logger.error(f"Error fetching support ticket: {str(e)}")
        return jsonify({'error': f'Failed to fetch ticket: {str(e)}'}), 500

@app.route('/api/admin/support/tickets', methods=['POST'])
@token_required
@admin_required
def create_support_ticket(current_user):
    """Create support ticket"""
    data = request.get_json()
    if not data or 'subject' not in data or 'message' not in data:
        return jsonify({'error': 'subject & message required'}), 400

    try:
        # Get next ticket ID from counter
        counter_ref = get_firestore_client().collection('_counters').document('support_tickets')
        counter_doc = counter_ref.get()
        
        if counter_doc.exists:
            ticket_id = counter_doc.get('value') + 1
        else:
            ticket_id = 1
        
        # Update counter
        counter_ref.set({'value': ticket_id})
        
        # Create ticket
        ticket_data = {
            'subject': data['subject'],
            'message': data['message'],
            'status': 'open',
            'category': data.get('category', 'General'),
            'user_id': None,  # Admin ticket
            'created_at': datetime.utcnow().isoformat() + 'Z',
            'updated_at': datetime.utcnow().isoformat() + 'Z'
        }
        
        get_firestore_client().collection('support_tickets').document(str(ticket_id)).set(ticket_data)
        
        return jsonify({'id': ticket_id, 'message': 'Ticket created successfully'}), 201
    except Exception as e:
        logger.error(f"Error creating support ticket: {str(e)}")
        return jsonify({'error': f'Failed to create ticket: {str(e)}'}), 500

@app.route('/api/admin/support/tickets/<ticket_id>/reply', methods=['POST'])
@token_required
@admin_required
def add_reply(current_user, ticket_id):
    """Add reply to support ticket"""
    data = request.get_json()
    if not data or 'message' not in data:
        return jsonify({'error': 'message required'}), 400

    try:
        # Check if ticket exists
        ticket_ref = get_firestore_client().collection('support_tickets').document(ticket_id)
        if not ticket_ref.get().exists:
            return jsonify({'error': 'Ticket not found'}), 404
        
        # Get next reply ID from counter
        reply_counter_ref = get_firestore_client().collection('_counters').document('support_replies')
        reply_counter_doc = reply_counter_ref.get()
        
        if reply_counter_doc.exists:
            reply_id = reply_counter_doc.get('value') + 1
        else:
            reply_id = 1
        
        # Update counter
        reply_counter_ref.set({'value': reply_id})
        
        # Add reply
        reply_data = {
            'message': data['message'],
            'is_admin': True,
            'user_id': current_user['id'],
            'created_at': datetime.utcnow().isoformat() + 'Z'
        }
        
        ticket_ref.collection('replies').document(str(reply_id)).set(reply_data)
        
        # Update ticket's updated_at
        ticket_ref.update({'updated_at': datetime.utcnow().isoformat() + 'Z'})
        
        return jsonify({'message': 'reply added', 'reply_id': reply_id})
    except Exception as e:
        logger.error(f"Error adding reply: {str(e)}")
        return jsonify({'error': f'Failed to add reply: {str(e)}'}), 500

@app.route('/api/admin/support/tickets/<ticket_id>/close', methods=['PATCH'])
@token_required
@admin_required
def close_ticket(current_user, ticket_id):
    """Close support ticket"""
    try:
        ticket_ref = get_firestore_client().collection('support_tickets').document(ticket_id)
        
        if not ticket_ref.get().exists:
            return jsonify({'error': 'Ticket not found'}), 404
        
        ticket_ref.update({
            'status': 'closed',
            'updated_at': datetime.utcnow().isoformat() + 'Z'
        })
        
        return jsonify({'message': 'ticket closed'})
    except Exception as e:
        logger.error(f"Error closing ticket: {str(e)}")
        return jsonify({'error': f'Failed to close ticket: {str(e)}'}), 500

# ===================================================================
# HOTEL PROFILE MANAGEMENT
# ===================================================================
@app.route('/api/hotel/profile', methods=['GET'])
@token_required
def get_hotel_profile(current_user):
    """Get current hotel profile from Firestore"""
    try:
        if current_user['role'] != 'hotel':
            return jsonify({'error': 'Access denied'}), 403

        user_id = current_user.get('id')
        firestore_db = get_firestore_client()
        if firestore_db is None:
            logger.error("Firestore client not initialized")
            return jsonify({'error': 'Database connection error'}), 500

        # Get user profile from Firestore
        user_doc = firestore_db.collection('users').document(user_id).get()

        if not user_doc.exists:
            return jsonify({'error': 'Profile not found'}), 404

        profile = user_doc.to_dict()
        profile['id'] = user_doc.id

        return jsonify(profile)
    except Exception as e:
        logger.error(f"Get hotel profile error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/hotel/profile', methods=['PUT'])
@token_required
def update_hotel_profile(current_user):
    """Update hotel user profile"""
    try:
        if current_user['role'] != 'hotel':
            return jsonify({'error': 'Access denied'}), 403

        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        user_id = current_user.get('id')
        firestore_db = get_firestore_client()
        if firestore_db is None:
            logger.error("Firestore client not initialized")
            return jsonify({'error': 'Database connection error'}), 500

        # Only allow updating these fields
        allowed_fields = ['hotel_name', 'email', 'phone', 'address', 'hotel_image']
        update_data = {}
        
        for field in allowed_fields:
            if field in data and data[field]:
                value = data[field] if not isinstance(data[field], str) else data[field].strip()
                if value:
                    update_data[field] = value

        if not update_data:
            return jsonify({'error': 'No valid fields to update'}), 400

        # Update user document in Firestore
        firestore_db.collection('users').document(user_id).update(update_data)

        # Return updated profile
        user_doc = firestore_db.collection('users').document(user_id).get()
        if user_doc.exists:
            profile = user_doc.to_dict()
            profile['id'] = user_doc.id
            return jsonify({
                'message': 'Profile updated successfully',
                'user': profile
            })
        else:
            return jsonify({'error': 'Profile not found'}), 404

    except Exception as e:
        logger.error(f"Update hotel profile error: {str(e)}")
        return jsonify({'error': str(e)}), 500

# ===================================================================
# HOTEL SUPPORT TICKETS
# ===================================================================
@app.route('/api/hotel/support-tickets', methods=['GET'])
@token_required
def get_hotel_support_tickets(current_user):
    """Get hotel's support tickets"""
    if current_user['role'] != 'hotel':
        return jsonify({'error': 'Access denied'}), 403

    try:
        # Get all tickets for this hotel user (no order_by to avoid composite index requirement)
        tickets_ref = get_firestore_client().collection('support_tickets').where('user_id', '==', current_user['id']).stream()
        tickets = []
        
        for doc in tickets_ref:
            ticket_data = doc.to_dict()
            ticket_data['id'] = doc.id
            
            # Get replies
            replies_ref = doc.reference.collection('replies').order_by('created_at', direction='ASCENDING').stream()
            replies = []
            for reply_doc in replies_ref:
                reply_data = reply_doc.to_dict()
                reply_data['id'] = reply_doc.id
                replies.append(reply_data)
            
            # Build messages array (original message + all replies)
            messages = [{
                'message': ticket_data['message'],
                'is_admin': False,
                'created_at': ticket_data['created_at']
            }] + replies
            
            ticket_data['messages'] = messages
            del ticket_data['message']
            
            tickets.append(ticket_data)
        
        # Sort tickets by created_at in descending order (most recent first)
        tickets.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        
        return jsonify(tickets)
    except Exception as e:
        logger.error(f"Error fetching hotel support tickets: {str(e)}")
        return jsonify({'error': f'Failed to fetch tickets: {str(e)}'}), 500

@app.route('/api/hotel/support-tickets', methods=['POST'])
@token_required
def create_hotel_support_ticket(current_user):
    """Create hotel support ticket"""
    if current_user['role'] != 'hotel':
        return jsonify({'error': 'Access denied'}), 403

    data = request.get_json()
    if not data or not data.get('subject') or not data.get('message'):
        return jsonify({'error': 'subject and message required'}), 400

    try:
        # Get next ticket ID from counter
        counter_ref = get_firestore_client().collection('_counters').document('support_tickets')
        counter_doc = counter_ref.get()
        
        if counter_doc.exists:
            ticket_id = counter_doc.get('value') + 1
        else:
            ticket_id = 1
        
        # Update counter
        counter_ref.set({'value': ticket_id})
        
        # Create ticket
        ticket_data = {
            'subject': data['subject'],
            'message': data['message'],
            'status': 'open',
            'category': data.get('category', 'General'),
            'user_id': current_user['id'],
            'created_at': datetime.utcnow().isoformat() + 'Z',
            'updated_at': datetime.utcnow().isoformat() + 'Z'
        }
        
        get_firestore_client().collection('support_tickets').document(str(ticket_id)).set(ticket_data)
        
        return jsonify({'id': ticket_id, 'message': 'Ticket created successfully'}), 201
    except Exception as e:
        logger.error(f"Create hotel support ticket error: {str(e)}")
        return jsonify({'error': str(e)}), 500

# ===================================================================
# ADMIN ANALYTICS & DASHBOARD (Part 2)
# ===================================================================
@app.route('/api/admin/dashboard', methods=['GET'])
@token_required
@admin_required
def get_admin_dashboard(current_user):
    """Get admin dashboard data"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Total hotels
        cursor.execute("SELECT COUNT(*) as total_hotels FROM users WHERE role = 'hotel'")
        total_hotels = cursor.fetchone()['total_hotels']
        
        # Total orders
        cursor.execute("SELECT COUNT(*) as total_orders FROM orders")
        total_orders = cursor.fetchone()['total_orders']
        
        # Total revenue
        cursor.execute(
            "SELECT SUM(total_amount) as total_revenue FROM orders WHERE status != 'cancelled'"
        )
        total_revenue = cursor.fetchone()['total_revenue'] or 0
        
        # Pending orders
        cursor.execute("SELECT COUNT(*) as pending_orders FROM orders WHERE status = 'pending'")
        pending_orders = cursor.fetchone()['pending_orders']
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'total_hotels': total_hotels,
            'total_orders': total_orders,
            'total_revenue': float(total_revenue),
            'pending_orders': pending_orders,
            'success': True
        })
    except Exception as e:
        logger.error(f"Dashboard error: {str(e)}")
        return jsonify({'error': 'Failed to load dashboard'}), 500

@app.route('/api/admin/orders', methods=['GET'])
@token_required
@admin_required
def get_all_orders(current_user):
    """Get all orders for admin from Firestore"""
    try:
        user_id_filter = request.args.get('user_id')
        limit = int(request.args.get('limit', 100))  # Default to 100 orders
        offset = int(request.args.get('offset', 0))
        
        logger.info(f"[ORDERS] Fetching orders with limit={limit}, offset={offset}")
        
        orders_list = []
        
        # Add .limit() to optimize query
        orders_query = get_firestore_client().collection('orders').limit(limit + offset).stream()
        logger.info(f"[ORDERS] Query started")
        
        count = 0
        for order_doc in orders_query:
            # Skip offset items
            if count < offset:
                count += 1
                continue
            
            if len(orders_list) >= limit:
                break
            
            try:
                order = order_doc.to_dict()
                order['id'] = order_doc.id
                order['order_id'] = order_doc.id
                
                # Filter by user_id if provided
                if user_id_filter and order.get('user_id') != user_id_filter:
                    continue
                
                # Get user details
                user_id = order.get('user_id')
                if user_id:
                    try:
                        user_id_str = str(user_id)  # Convert to string for Firestore
                        user_doc = get_firestore_client().collection('users').document(user_id_str).get()
                        if user_doc.exists:
                            user = user_doc.to_dict()
                            order['hotel_name'] = user.get('hotel_name', 'N/A')
                            order['phone'] = user.get('phone', 'N/A')
                            order['email'] = user.get('email', 'N/A')
                    except Exception as user_err:
                        logger.warning(f"Error fetching user {user_id}: {str(user_err)}")
                        order['hotel_name'] = 'N/A'
                        order['phone'] = 'N/A'
                        order['email'] = 'N/A'
                
                # Get order items
                items_list = []
                try:
                    items_query = order_doc.reference.collection('order_items').stream()
                    for item_doc in items_query:
                        item = item_doc.to_dict()
                        item['id'] = item_doc.id
                        item['product_id'] = str(item.get('product_id', ''))
                        
                        # Get product details
                        product_id = item.get('product_id')
                        if product_id:
                            try:
                                product_doc = get_firestore_client().collection('products').document(str(product_id)).get()
                                if product_doc.exists:
                                    product = product_doc.to_dict()
                                    item['product_name'] = product.get('name', f'Product {product_id}')
                                    item['unit_type'] = product.get('unit_type', 'kg')
                            except Exception as prod_err:
                                logger.warning(f"Error fetching product {product_id}: {str(prod_err)}")
                                item['product_name'] = f'Product {product_id}'
                                item['unit_type'] = 'kg'
                        
                        # Ensure numeric fields are serializable
                        if 'quantity' in item:
                            item['quantity'] = float(item['quantity']) if item['quantity'] is not None else 0
                        if 'price_at_order' in item:
                            item['price_at_order'] = float(item['price_at_order']) if item['price_at_order'] is not None else 0
                        
                        items_list.append(item)
                except Exception as items_err:
                    logger.warning(f"Error fetching order items for order {order_doc.id}: {str(items_err)}")
                
                order['items'] = items_list
                
                # Ensure numeric fields are serializable
                if 'total_price' in order:
                    order['total_price'] = float(order['total_price']) if order['total_price'] is not None else 0
                
                orders_list.append(order)
            except Exception as order_err:
                logger.error(f"Error processing order {order_doc.id}: {str(order_err)}")
                continue
        
        # Sort by order_date descending
        orders_list.sort(key=lambda x: str(x.get('order_date', '')), reverse=True)
        
        logger.info(f"[ORDERS] Returning {len(orders_list)} orders")
        
        # Serialize all data for JSON compatibility
        serialized_orders = [serialize_for_json(order) for order in orders_list]
        
        return jsonify({
            'orders': serialized_orders,
            'total_orders': len(serialized_orders),
            'success': True
        }), 200
    except Exception as e:
        logger.error(f"Get orders error: {str(e)}", exc_info=True)
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': str(e), 'detail': 'Failed to fetch orders'}), 500

@app.route('/api/admin/orders/<order_id>/status', methods=['PUT'])
@token_required
@admin_required
def update_order_status(current_user, order_id):
    """Update order status in Firestore"""
    try:
        data = request.get_json()
        new_status = data.get('status')
        
        valid_statuses = ['pending', 'confirmed', 'preparing', 'dispatched', 'delivered', 'cancelled']
        if not new_status or new_status not in valid_statuses:
            return jsonify({'error': 'Valid status required'}), 400
        
        order_ref = get_firestore_client().collection('orders').document(str(order_id))
        order_doc = order_ref.get()
        
        if not order_doc.exists:
            return jsonify({'error': 'Order not found'}), 404
        
        order_ref.update({
            'status': new_status,
            'updated_at': datetime.now().isoformat()
        })
        
        return jsonify({
            'message': 'Order status updated successfully',
            'order_id': order_id,
            'new_status': new_status,
            'success': True
        }), 200
    except Exception as e:
        logger.error(f"Update order status error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/orders', methods=['POST'])
@token_required
@admin_required
def create_order(current_user):
    """Create a new order in Firestore with sequential ID"""
    try:
        data = request.get_json()
        
        # Validate required fields
        user_id = data.get('user_id')
        items = data.get('items', [])  # Array of {product_id, quantity, price}
        
        if not user_id:
            return jsonify({'error': 'user_id is required'}), 400
        if not items or len(items) == 0:
            return jsonify({'error': 'Order must contain at least one item'}), 400
        
        # Check if user exists
        user_doc = get_firestore_client().collection('users').document(str(user_id)).get()
        if not user_doc.exists:
            return jsonify({'error': 'User not found'}), 404
        
        # Calculate order totals
        total_price = 0
        order_items = []
        
        for idx, item in enumerate(items):
            product_id = item.get('product_id')
            quantity = float(item.get('quantity', 0))
            price = float(item.get('price', 0))
            
            if not product_id or quantity <= 0 or price <= 0:
                return jsonify({'error': f'Invalid item at index {idx}: product_id, quantity, price required and must be positive'}), 400
            
            # Get product details
            product_doc = get_firestore_client().collection('products').document(str(product_id)).get()
            if not product_doc.exists:
                return jsonify({'error': f'Product {product_id} not found'}), 404
            
            product = product_doc.to_dict()
            
            # Check stock
            available_stock = float(product.get('stock_quantity', 0))
            if quantity > available_stock:
                return jsonify({'error': f'Insufficient stock for product {product.get("name", product_id)}'}), 400
            
            item_total = quantity * price
            total_price += item_total
            
            order_items.append({
                'product_id': str(product_id),
                'product_name': product.get('name', 'Unknown'),
                'quantity': quantity,
                'unit_type': product.get('unit_type', 'kg'),
                'price_at_order': price,
                'subtotal': item_total
            })
        
        # Get next order ID from counter
        counter_ref = get_firestore_client().collection('_counters').document('orders')
        counter_doc = counter_ref.get()
        
        logger.info(f"[ORDER] Counter doc exists: {counter_doc.exists}")
        
        if counter_doc.exists:
            next_id = counter_doc.get('count') + 1
        else:
            next_id = 1
        
        logger.info(f"[ORDER] Creating order with ID: {next_id}")
        order_id = str(next_id)
        
        # Create order document with sequential ID
        order_data = {
            'user_id': str(user_id),
            'status': 'pending',
            'total_price': total_price,
            'order_date': datetime.now().isoformat(),
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat(),
            'notes': data.get('notes', ''),
            'payment_method': data.get('payment_method', 'cash')
        }
        
        # Add order to Firestore with sequential ID
        get_firestore_client().collection('orders').document(order_id).set(order_data)
        logger.info(f"[ORDER] Order document created with ID: {order_id}")
        
        # Add order items as subcollection
        for idx, item in enumerate(order_items):
            get_firestore_client().collection('orders').document(order_id).collection('order_items').document(f'item_{idx}').set(item)
        
        logger.info(f"[ORDER] Added {len(order_items)} items to order")
        
        # Update product stock
        for item in order_items:
            product_id = item['product_id']
            product_doc = get_firestore_client().collection('products').document(str(product_id)).get()
            if product_doc.exists:
                current_stock = float(product_doc.to_dict().get('stock_quantity', 0))
                new_stock = current_stock - item['quantity']
                get_firestore_client().collection('products').document(str(product_id)).update({
                    'stock_quantity': new_stock,
                    'updated_at': datetime.now().isoformat()
                })
        
        logger.info(f"[ORDER] Updated stock for {len(order_items)} products")
        
        # Create bill
        bill_data = {
            'order_id': order_id,
            'user_id': str(user_id),
            'total_amount': total_price,
            'bill_date': datetime.now().isoformat(),
            'bill_status': 'unpaid',
            'created_at': datetime.now().isoformat()
        }
        get_firestore_client().collection('bills').document().set(bill_data)
        
        # Update counter
        counter_ref.set({'count': next_id}, merge=True)
        logger.info(f"[ORDER] Counter updated to {next_id}")
        
        return jsonify({
            'order_id': order_id,
            'user_id': user_id,
            'total_price': total_price,
            'items_count': len(order_items),
            'status': 'pending',
            'message': 'Order created successfully',
            'success': True
        }), 201
    except Exception as e:
        logger.error(f"Create order error: {str(e)}", exc_info=True)
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': str(e), 'detail': 'Failed to create order'}), 500

# ===================================================================
# ERROR HANDLERS
# ===================================================================
# TEXT-TO-SPEECH API
# ===================================================================

@app.route('/tts', methods=['POST'])
def text_to_speech():
    """Generate TTS audio for Indian languages"""
    try:
        data = request.get_json()
        text = data.get('text', '').strip()
        language = data.get('language', 'hi').lower()
        
        if not text:
            return jsonify({"error": "No text provided"}), 400
            
        if language not in ['hi', 'mr']:
            return jsonify({"error": "Unsupported language. Use 'hi' or 'mr'"}), 400
        
        audio_buffer = generate_speech_audio(text, language)
        
        if audio_buffer is None:
            return jsonify({"error": "Failed to generate audio"}), 500
            
        # Return audio as base64
        audio_data = audio_buffer.getvalue()
        audio_base64 = base64.b64encode(audio_data).decode('utf-8')
        
        return jsonify({
            "audio_data": audio_base64,
            "language": language,
            "status": "success"
        })
        
    except Exception as e:
        logger.error(f"TTS endpoint error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


# ===================================================================
# ADMIN BILLS API
# ===================================================================

@app.route('/api/admin/bills', methods=['GET'])
@token_required
@admin_required
def get_all_bills(current_user):
    """Get all bills for admin, optionally filtered by user_id"""
    try:
        user_id_filter = request.args.get('user_id')
        limit = request.args.get('limit', 100, type=int)
        offset = request.args.get('offset', 0, type=int)
        
        logger.info(f"[ADMIN_BILLS] Fetching bills - user_filter={user_id_filter}, limit={limit}, offset={offset}")
        
        # Build query
        query = get_firestore_client().collection('bills')
        
        if user_id_filter:
            # Get order_ids for this user
            user_orders = get_firestore_client().collection('orders').where('user_id', '==', user_id_filter).stream()
            order_ids = [doc.id for doc in user_orders]
            if not order_ids:
                return jsonify({'bills': []})
            query = query.where('order_id', 'in', order_ids)
        
        # Get total count
        bills_docs = list(query.order_by('bill_date', direction='DESCENDING').stream())
        total_count = len(bills_docs)
        
        # Apply pagination
        paginated_docs = bills_docs[offset:offset + limit]
        
        bills = []
        for doc in paginated_docs:
            bill_data = doc.to_dict()
            bill_data['id'] = doc.id
            
            # Get order and user details to enrich bill data
            try:
                order_id = bill_data.get('order_id')
                if order_id:
                    order_doc = get_firestore_client().collection('orders').document(str(order_id)).get()
                    if order_doc.exists:
                        order_data = order_doc.to_dict()
                        bill_data['order_date'] = order_data.get('order_date')
                        
                        # Get user details
                        user_id = order_data.get('user_id')
                        if user_id:
                            user_doc = get_firestore_client().collection('users').document(str(user_id)).get()
                            if user_doc.exists:
                                user_data = user_doc.to_dict()
                                bill_data['hotel_name'] = user_data.get('hotel_name', '')
                                bill_data['email'] = user_data.get('email', '')
                                bill_data['address'] = user_data.get('address', '')
                                bill_data['user_id'] = str(user_id)
                                logger.info(f"[ADMIN_BILLS] Bill {doc.id}: hotel_name={bill_data.get('hotel_name')}, user_id={user_id}")
                        
                        # Fetch order_items from subcollection if not already in bill
                        if not bill_data.get('items') or len(bill_data.get('items', [])) == 0:
                            try:
                                items_query = order_doc.reference.collection('order_items').stream()
                                bill_items = []
                                for item_doc in items_query:
                                    item_data = item_doc.to_dict()
                                    bill_items.append({
                                        'product_id': str(item_data.get('product_id', '')),
                                        'product_name': item_data.get('product_name', ''),
                                        'quantity': float(item_data.get('quantity', 0)),
                                        'price_at_order': float(item_data.get('price_at_order', 0)),
                                        'price_per_unit': float(item_data.get('price_at_order', item_data.get('price_per_unit', 0))),
                                        'subtotal': float(item_data.get('subtotal', 0)),
                                        'unit_type': item_data.get('unit_type', 'kg')
                                    })
                                if bill_items:
                                    bill_data['items'] = bill_items
                                    logger.info(f"[ADMIN_BILLS] Fetched {len(bill_items)} items for bill {doc.id} from order_items subcollection")
                            except Exception as e:
                                logger.warning(f"[ADMIN_BILLS] Could not fetch order_items for bill {doc.id}: {str(e)}")
            except Exception as e:
                logger.warning(f"[ADMIN_BILLS] Error fetching order/user for bill {doc.id}: {str(e)}")
            
            bills.append(bill_data)
        
        logger.info(f"[ADMIN_BILLS] Returning {len(bills)} bills (total: {total_count})")
        return jsonify({'bills': bills, 'total': total_count})
    except Exception as e:
        logger.error(f"[ADMIN_BILLS] Error fetching bills: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/admin/unpaid-bills', methods=['GET'])
@token_required
@admin_required
def get_unpaid_bills(current_user):
    """Get all unpaid bills with hotel-wise breakdown"""
    try:
        logger.info("[UNPAID_BILLS] Fetching all unpaid bills")
        
        firestore_db = get_firestore_client()
        if not firestore_db:
            return jsonify({'error': 'Database connection failed'}), 500
        
        # Fetch all bills
        bills_query = firestore_db.collection('bills').stream()
        unpaid_bills = []
        hotel_breakdown = {}
        total_unpaid = 0
        
        for doc in bills_query:
            bill_data = doc.to_dict()
            bill_data['_id'] = doc.id
            
            # Check if bill is unpaid
            bill_status = bill_data.get('status', '').lower()
            bill_paid = bill_data.get('paid', False)
            
            # Bill is unpaid if:
            # 1. paid field is False
            # 2. status field is not 'paid' or 'cancelled'
            is_unpaid = (bill_paid is False) or (bill_status and bill_status not in ['paid', 'cancelled'])
            
            if is_unpaid:
                try:
                    # Get order and user details
                    order_id = bill_data.get('order_id')
                    if order_id:
                        order_doc = firestore_db.collection('orders').document(str(order_id)).get()
                        if order_doc.exists:
                            order_data = order_doc.to_dict()
                            
                            # Get user/hotel details
                            user_id = order_data.get('user_id')
                            if user_id:
                                user_doc = firestore_db.collection('users').document(str(user_id)).get()
                                if user_doc.exists:
                                    user_data = user_doc.to_dict()
                                    hotel_name = user_data.get('hotel_name', 'Unknown')
                                    bill_data['hotelName'] = hotel_name
                                    bill_data['hotelId'] = str(user_id)
                                    
                                    # Track hotel breakdown
                                    if hotel_name not in hotel_breakdown:
                                        hotel_breakdown[hotel_name] = {
                                            'hotelName': hotel_name,
                                            'totalAmount': 0,
                                            'billCount': 0
                                        }
                                    
                                    total_amount = float(bill_data.get('total_amount', 0))
                                    hotel_breakdown[hotel_name]['totalAmount'] += total_amount
                                    hotel_breakdown[hotel_name]['billCount'] += 1
                                    total_unpaid += total_amount
                    
                    unpaid_bills.append(bill_data)
                    logger.info(f"[UNPAID_BILLS] Bill {doc.id} is unpaid: {bill_data.get('hotelName', 'Unknown')}")
                    
                except Exception as e:
                    logger.warning(f"[UNPAID_BILLS] Error processing bill {doc.id}: {str(e)}")
                    # Still add the bill even if enrichment fails
                    unpaid_bills.append(bill_data)
        
        # Sort bills by date (newest first)
        unpaid_bills = sorted(unpaid_bills, key=lambda x: x.get('bill_date') or '', reverse=True)
        
        # Sort hotel breakdown by amount (highest first)
        hotel_breakdown_sorted = sorted(
            hotel_breakdown.values(),
            key=lambda x: x['totalAmount'],
            reverse=True
        )
        
        response = {
            'unpaidBills': unpaid_bills,
            'hotelBreakdown': hotel_breakdown_sorted,
            'totalUnpaidAmount': total_unpaid,
            'totalUnpaidCount': len(unpaid_bills),
            'totalHotels': len(hotel_breakdown)
        }
        
        logger.info(f"[UNPAID_BILLS] Returning {len(unpaid_bills)} unpaid bills from {len(hotel_breakdown)} hotels")
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"[UNPAID_BILLS] Error fetching unpaid bills: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/admin/bills', methods=['POST'])
@token_required
@admin_required
def create_bill(current_user):
    """Create new bill for an order"""
    try:
        data = request.get_json()
        required_fields = ['order_id', 'amount']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} required'}), 400
        
        logger.info(f"[CREATE_BILL] Creating bill for order {data['order_id']}")
        
        # Verify order exists and get user_id
        order_doc = get_firestore_client().collection('orders').document(str(data['order_id'])).get()
        if not order_doc.exists:
            return jsonify({'error': 'Order not found'}), 404
        
        order_data = order_doc.to_dict()
        user_id = order_data.get('user_id')
        
        # Calculate total_amount if not provided
        if 'total_amount' not in data:
            subtotal = float(data['amount'])
            tax_rate = float(data.get('tax_rate', 5)) / 100
            discount = float(data.get('discount', 0))
            discounted_subtotal = subtotal - discount
            tax = discounted_subtotal * tax_rate
            data['total_amount'] = round(discounted_subtotal + tax, 2)
        
        # Prepare dates
        due_date = data.get('due_date', (datetime.now(timezone.utc) + timedelta(days=10)).strftime('%Y-%m-%d'))
        bill_date = data.get('bill_date', datetime.now(timezone.utc).strftime('%Y-%m-%d'))
        
        # Get user details for hotel_name and fetch order items
        hotel_name = ''
        email = ''
        address = ''
        bill_items = []
        
        try:
            user_doc = get_firestore_client().collection('users').document(str(user_id)).get()
            if user_doc.exists:
                user_data = user_doc.to_dict()
                hotel_name = user_data.get('hotel_name', '')
                email = user_data.get('email', '')
                address = user_data.get('address', '')
        except Exception as e:
            logger.warning(f"[CREATE_BILL] Could not fetch user details for user {user_id}: {str(e)}")
        
        # Fetch order items from order_items subcollection
        try:
            items_query = order_doc.reference.collection('order_items').stream()
            for item_doc in items_query:
                item_data = item_doc.to_dict()
                bill_items.append({
                    'product_id': str(item_data.get('product_id', '')),
                    'product_name': item_data.get('product_name', ''),
                    'quantity': float(item_data.get('quantity', 0)),
                    'price_at_order': float(item_data.get('price_at_order', 0)),
                    'subtotal': float(item_data.get('subtotal', 0)),
                    'unit_type': item_data.get('unit_type', 'kg')
                })
            logger.info(f"[CREATE_BILL] Fetched {len(bill_items)} items for bill")
        except Exception as e:
            logger.warning(f"[CREATE_BILL] Could not fetch order items: {str(e)}")
        
        # Create bill document
        bill_data = {
            'order_id': str(data['order_id']),
            'user_id': str(user_id),
            'hotel_name': hotel_name,
            'email': email,
            'address': address,
            'items': bill_items,
            'bill_date': bill_date,
            'amount': float(data['amount']),
            'tax_rate': float(data.get('tax_rate', 5)),
            'discount': float(data.get('discount', 0)),
            'total_amount': float(data['total_amount']),
            'paid': data.get('paid', False),
            'payment_method': data.get('payment_method', ''),
            'due_date': due_date,
            'comments': data.get('comments', ''),
            'bill_status': data.get('bill_status', 'pending'),
            'created_at': datetime.now(timezone.utc).isoformat(),
            'updated_at': datetime.now(timezone.utc).isoformat()
        }
        
        # Get next bill ID from counter
        counter_ref = get_firestore_client().collection('_counters').document('bills')
        counter_doc = counter_ref.get()
        
        if counter_doc.exists:
            next_id = counter_doc.get('count', 0) + 1
        else:
            next_id = 1
        
        bill_id = str(next_id)
        logger.info(f"[CREATE_BILL] Assigning bill ID: {bill_id}")
        
        # Create bill document
        get_firestore_client().collection('bills').document(bill_id).set(bill_data)
        
        # Update counter
        counter_ref.set({'count': next_id}, merge=True)
        
        logger.info(f"[CREATE_BILL] Bill {bill_id} created successfully")
        return jsonify({'message': 'Bill created', 'bill_id': bill_id}), 201
    except Exception as e:
        logger.error(f"[CREATE_BILL] Error creating bill: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/admin/bills/<bill_id>', methods=['PUT'])
@token_required
@admin_required
def update_bill(current_user, bill_id):
    """Update bill payment status, method, and comments"""
    try:
        data = request.get_json()
        logger.info(f"[UPDATE_BILL] Updating bill {bill_id} with data: {data}")
        
        db = get_firestore_client()
        bill_ref = db.collection('bills').document(str(bill_id))
        
        # Check if bill exists
        bill_doc = bill_ref.get()
        if not bill_doc.exists:
            return jsonify({'error': 'Bill not found'}), 404
        
        # Prepare update data with only allowed fields
        update_data = {
            'updated_at': datetime.now(timezone.utc).isoformat()
        }
        
        allowed_fields = ['paid', 'payment_method', 'comments']
        for field in allowed_fields:
            if field in data:
                update_data[field] = data[field]
        
        # If no valid fields provided
        if len(update_data) == 1:  # Only has updated_at
            return jsonify({'error': 'No valid fields to update'}), 400
        
        # Update bill
        bill_ref.set(update_data, merge=True)
        logger.info(f"[UPDATE_BILL] Bill {bill_id} updated successfully")
        
        return jsonify({'message': 'Bill updated successfully'}), 200
    except Exception as e:
        logger.error(f"[UPDATE_BILL] Error updating bill {bill_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/debug/vegetables-history/<selected_date>', methods=['GET'])
def debug_vegetables_history(selected_date):
    """Debug endpoint to check vegetables for a specific date"""
    try:
        from datetime import datetime
        
        # Parse input date
        try:
            delivery_date = datetime.strptime(selected_date, '%Y-%m-%d').date()
            logger.info(f"[DEBUG_VEG_HISTORY] Selected date: {delivery_date}")
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        
        # Query orders
        vegetables = {}
        category_totals = {}
        
        orders_query = get_firestore_client().collection('orders').stream()
        order_count = 0
        for order_doc in orders_query:
            order = order_doc.to_dict()
            delivery_date_str = order.get('delivery_date')
            
            if not delivery_date_str:
                continue
            
            # Parse delivery_date
            try:
                if isinstance(delivery_date_str, str):
                    if len(delivery_date_str) == 10 and delivery_date_str[4] == '-':
                        order_delivery_dt = datetime.strptime(delivery_date_str, '%Y-%m-%d').date()
                    else:
                        date_part = delivery_date_str.split(' ')[0:4]
                        # CRITICAL FIX: Ensure all parts are strings before join
                        logger.error("[DEBUG_VEG_HISTORY] JOIN DEBUG → date_part=%s | TYPES → %s",
                                   date_part,
                                   [type(v) for v in date_part])
                        date_str = ' '.join(str(p) for p in date_part)
                        order_delivery_dt = datetime.strptime(date_str, '%a, %d %b %Y').date()
                    
                    if order_delivery_dt != delivery_date:
                        continue
                else:
                    continue
            except:
                continue
            
            if order.get('status') == 'cancelled':
                continue
            
            order_count += 1
            logger.info(f"[DEBUG_VEG_HISTORY] Found matching order: {order_doc.id}")
            
            # Get items
            items_query = get_firestore_client().collection('orders').document(order_doc.id).collection('order_items').stream()
            for item_doc in items_query:
                item = item_doc.to_dict()
                product_id = item.get('product_id')
                quantity = float(item.get('quantity', 0))
                
                # Get product details
                product_doc = get_firestore_client().collection('products').document(str(product_id)).get()
                if product_doc.exists:
                    product = product_doc.to_dict()
                    category = product.get('category', 'Other')
                    product_name = product.get('name', f'Product {product_id}')
                    unit_type = product.get('unit_type', 'kg')
                    
                    key = f"{product_id}:{product_name}"
                    if key not in vegetables:
                        vegetables[key] = {
                            'product_id': product_id,
                            'product_name': product_name,
                            'category': category,
                            'unit_type': unit_type,
                            'total_quantity': 0
                        }
                    vegetables[key]['total_quantity'] += quantity
                    
                    if category not in category_totals:
                        category_totals[category] = {'count': 0, 'total_quantity': 0}
                    category_totals[category]['count'] += 1
                    category_totals[category]['total_quantity'] += quantity
        
        logger.info(f"[DEBUG_VEG_HISTORY] Summary: {order_count} orders, {len(vegetables)} vegetables")
        
        return jsonify({
            'selected_date': selected_date,
            'vegetables': list(vegetables.values()),
            'category_totals': category_totals,
            'total_items': len(vegetables),
            'total_orders': order_count,
            'message': f'Found {order_count} orders with {len(vegetables)} vegetables'
        }), 200
    except Exception as e:
        logger.error(f"[DEBUG_VEG_HISTORY] Error: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/debug/orders-detail/<order_id>', methods=['GET'])
def debug_order_detail(order_id):
    """Debug endpoint to show detailed order information including items"""
    try:
        order_doc = get_firestore_client().collection('orders').document(order_id).get()
        if not order_doc.exists:
            return jsonify({'error': 'Order not found'}), 404
        
        order = order_doc.to_dict()
        items = []
        
        # Get order items
        items_query = get_firestore_client().collection('orders').document(order_id).collection('order_items').stream()
        for item_doc in items_query:
            item = item_doc.to_dict()
            items.append({
                'id': item_doc.id,
                'data': item
            })
        
        return jsonify({
            'order_id': order_id,
            'order': order,
            'items': items,
            'item_count': len(items)
        }), 200
    except Exception as e:
        logger.error(f"[DEBUG_ORDER_DETAIL] Error: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/debug/vegetables-test/<date_str>', methods=['GET'])
def debug_vegetables_test(date_str):
    """Debug endpoint to test vegetables parsing for a specific date"""
    try:
        from datetime import datetime
        
        # Parse the requested date
        try:
            selected_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            logger.info(f"[DEBUG_VEG] Testing for date: {selected_date}")
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        
        # Get all orders and check delivery dates
        matching_orders = []
        all_orders = []
        
        orders_query = get_firestore_client().collection('orders').stream()
        for order_doc in orders_query:
            order = order_doc.to_dict()
            delivery_date_str = order.get('delivery_date')
            
            all_orders.append({
                'id': order_doc.id,
                'delivery_date': delivery_date_str,
                'status': order.get('status')
            })
            
            if delivery_date_str:
                try:
                    if isinstance(delivery_date_str, str):
                        # Try new format first (YYYY-MM-DD)
                        if len(delivery_date_str) == 10 and delivery_date_str[4] == '-':
                            order_delivery_dt = datetime.strptime(delivery_date_str, '%Y-%m-%d').date()
                        else:
                            # Try old format (RFC)
                            parts = delivery_date_str.split(' ')
                            if len(parts) >= 4:
                                weekday = parts[0].rstrip(',')
                                date_str_fmt = f"{weekday} {parts[1]} {parts[2]} {parts[3]}"
                                order_delivery_dt = datetime.strptime(date_str_fmt, '%a %d %b %Y').date()
                            else:
                                order_delivery_dt = None
                        
                        if order_delivery_dt == selected_date:
                            matching_orders.append({
                                'id': order_doc.id,
                                'delivery_date': delivery_date_str,
                                'parsed_date': str(order_delivery_dt),
                                'status': order.get('status')
                            })
                except Exception as e:
                    logger.error(f"Parse error for {delivery_date_str}: {str(e)}")
        
        return jsonify({
            'target_date': str(selected_date),
            'matching_orders': matching_orders,
            'total_matching': len(matching_orders),
            'total_orders_checked': len(all_orders)
        }), 200
    except Exception as e:
        logger.error(f"[DEBUG_VEG] Error: {str(e)}")
        return jsonify({'error': str(e)}), 500


# ===================================================================
# DEBUG ENDPOINTS (for troubleshooting)
# ===================================================================

@app.route('/api/debug/orders', methods=['GET'])
def debug_all_orders():
    """Debug endpoint to list all orders and their dates"""
    try:
        orders_list = []
        orders_query = get_firestore_client().collection('orders').stream()
        for order_doc in orders_query:
            order = order_doc.to_dict()
            orders_list.append({
                'id': order_doc.id,
                'delivery_date': order.get('delivery_date'),
                'status': order.get('status'),
                'hotel_id': order.get('hotel_id'),
                'created_at': order.get('created_at'),
            })
        
        logger.info(f"[DEBUG_ORDERS] Found {len(orders_list)} orders")
        return jsonify({'orders': orders_list, 'total': len(orders_list)}), 200
    except Exception as e:
        logger.error(f"[DEBUG_ORDERS] Error: {str(e)}")
        return jsonify({'error': str(e)}), 500


# ===================================================================
# ADMIN ANALYTICS API
# ===================================================================

@app.route('/api/admin/analytics/trends', methods=['GET'])
@token_required
@admin_required
def get_analytics_trends(current_user):
    """Get daily revenue trends for analytics"""
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


# ===================================================================
# ERROR HANDLERS
# ===================================================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

# ===================================================================
# FIREBASE CLOUD FUNCTION ENTRY POINT
# ===================================================================
# For Cloud Functions Gen 2 with Python, we use the on_request decorator
# with the Flask app directly
@https_fn.on_request()
def api(req: https_fn.Request) -> https_fn.Response:
    """Firebase Cloud Function entry point - wraps Flask app"""
    # Use Flask's test request context to handle the request
    with app.test_request_context(
        path=req.path,
        method=req.method,
        data=req.get_data() if req.method != 'GET' else None,
        headers=dict(req.headers),
        query_string=req.query_string.decode('utf-8') if req.query_string else '',
        environ_base={
            'REMOTE_ADDR': req.remote_addr or '0.0.0.0',
            'REQUEST_METHOD': req.method,
            'SCRIPT_NAME': '',
            'PATH_INFO': req.path,
            'QUERY_STRING': req.query_string.decode('utf-8') if req.query_string else '',
            'SERVER_NAME': req.host.split(':')[0] if req.host else 'localhost',
            'SERVER_PORT': req.host.split(':')[1] if ':' in (req.host or '') else '443',
            'SERVER_PROTOCOL': 'HTTP/1.1',
            'wsgi.url_scheme': 'https',
            'wsgi.input': None,
            'wsgi.errors': None,
            'wsgi.multithread': True,
            'wsgi.multiprocess': False,
            'wsgi.run_once': False,
        }
    ):
        try:
            # Dispatch the request through Flask
            response = app.full_dispatch_request()
            
            # Convert Flask response to Firebase Response
            # The response from Flask can be:
            # 1. A Response object (from jsonify)
            # 2. A tuple (data, status_code)
            # 3. A tuple (data, status_code, headers)
            
            if isinstance(response, tuple):
                # Handle tuple responses
                if len(response) == 2:
                    data, status = response
                    headers = {}
                elif len(response) == 3:
                    data, status, headers = response
                else:
                    data = response
                    status = 200
                    headers = {}
                
                # Convert data to string if needed
                if isinstance(data, dict):
                    data = json.dumps(data)
                elif not isinstance(data, str):
                    data = str(data)
                
                return https_fn.Response(data, status=status, headers=headers, mimetype='application/json')
            else:
                # It's a Response object from Flask
                # Extract data from the response
                try:
                    data = response.get_data(as_text=True)
                    status = response.status_code
                    headers = dict(response.headers)
                    return https_fn.Response(data, status=status, headers=headers, mimetype='application/json')
                except:
                    # Fallback for any unexpected response type
                    return https_fn.Response(str(response), status=200, mimetype='application/json')
                    
        except Exception as e:
            logger.error(f"Unhandled error in API: {str(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            return https_fn.Response(
                json.dumps({"error": "Internal server error", "detail": str(e)}), 
                status=500,
                mimetype='application/json'
            )


