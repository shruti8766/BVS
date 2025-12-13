from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
import json
import os
import re
import sys
from datetime import datetime
from typing import Dict, Any, List, Optional

# Import external dependencies
try:
    from supabase import create_client
    supabase_available = True
except ImportError:
    supabase_available = False

try:
    from openai import OpenAI
    openai_available = True
except ImportError:
    openai_available = False

try:
    from deep_translator import GoogleTranslator
    translator_available = True
except ImportError:
    translator_available = False

try:
    from langdetect import detect
    detector_available = True
except ImportError:
    detector_available = False

# MMS-TTS Imports
try:
    from transformers import VitsModel, AutoTokenizer
    import torch
    import soundfile as sf
    import io
    import base64
    mms_tts_available = True
except ImportError:
    mms_tts_available = False

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

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

# Response messages for terminal actions
# Fix the TERMINAL_RESPONSES dictionary - there were syntax errors
TERMINAL_RESPONSES = {
    "vegetable_prices": "Here are our current vegetable prices:\n\nTomatoes: ₹25/kg\nOnions: ₹30/kg\nPotatoes: ₹20/kg\nGreen Peas: ₹40/kg\nCauliflower: ₹35/kg\nCabbage: ₹18/kg\nCarrots: ₹45/kg\n\nCall {CONTACT_PHONE} for complete price list.",
    "fruit_prices": "Here are our current fruit prices:\n\nBananas: ₹40/dozen\nApples: ₹80/kg\nOranges: ₹60/kg\nGrapes: ₹70/kg\nPomegranates: ₹90/kg\n\nCall {CONTACT_PHONE} for complete fruit price list.",
    "bulk_discounts": "We offer special discounts for bulk orders:\n\n- Orders above ₹5000: 5% discount\n- Orders above ₹10000: 10% discount\n- Regular hotel clients: Additional 5%\n\nCall {CONTACT_PHONE} to discuss your bulk requirements.",
    "seasonal_specials": "Current seasonal specials:\n\n🥕 Fresh seasonal vegetables available\n🍓 Seasonal fruits at best prices\n🌱 Organic options available\n\nCall {CONTACT_PHONE} for current seasonal offers.",
    "phone_order": "Call us at {CONTACT_PHONE} to place your order. Our team will assist you with:\n\n- Product availability\n- Current pricing\n- Delivery scheduling\n- Payment options",
    "email_order": "Email your order to {CONTACT_EMAIL} with:\n\n- Your contact details\n- Item list with quantities\n- Delivery address\n- Preferred delivery time\n\nWe'll confirm within 30 minutes.",
    "whatsapp_order": "Send your order via WhatsApp to {CONTACT_PHONE} with:\n\n📋 Item list\n📦 Quantities\n🏠 Delivery address\n⏰ Preferred time\n\nWe'll confirm immediately.",
    "custom_order": "We handle custom requirements:\n\n- Specific vegetable grades\n- Special packaging\n- Regular supply contracts\n- Hotel-specific requirements\n\nCall {CONTACT_PHONE} to discuss your needs.",
    "delivery_areas": "We deliver across Pune:\n\n✅ Central Pune\n✅ West Pune\n✅ East Pune\n✅ Pune Camp\n✅ Hadapsar\n✅ Kothrud\n✅ Bavdhan\n\nCall to confirm your area.",
    "delivery_timing": "Delivery Timings:\n\n🕘 Morning: 8 AM - 11 AM\n🕛 Afternoon: 2 PM - 5 PM\n🕢 Evening: 6 PM - 9 PM\n\nNext day delivery for orders before 8 PM.",
    "delivery_charges": "Delivery Charges:\n\n📍 Within 5km: Free\n📍 5-10km: ₹50\n📍 10-15km: ₹80\n📍 15km+: ₹100 (call to confirm)\n\nFree delivery for orders above ₹2000.",
    "schedule_delivery": "To schedule delivery:\n\n1. Call {CONTACT_PHONE}\n2. Provide your order details\n3. Choose delivery slot\n4. Get confirmation\n\nWe support one-time and regular deliveries.",
    "call_contact": "Call us at {CONTACT_PHONE} for:\n\n- Immediate order placement\n- Price inquiries\n- Delivery queries\n- Account management\n\nAvailable daily 6 AM - 10 PM.",
    "email_contact": "Email us at {CONTACT_EMAIL} for:\n\n- Detailed quotations\n- Contract discussions\n- Product inquiries\n- Feedback & suggestions\n\nWe respond within 2 hours.",
    "visit_office": "Visit our office:\n\n📍 {OFFICE_ADDRESS}\n\n🕘 Open: 6 AM - 10 PM\n📞 Call before visiting: {CONTACT_PHONE}",
    "business_hours": "Business Hours:\n\n🏪 Office: 6 AM - 10 PM (Daily)\n📞 Phone: 6 AM - 10 PM\n🚚 Delivery: 8 AM - 9 PM\n\nWe're open all days including Sundays.",
    "office_address": "Our office address:\n\n{OFFICE_ADDRESS}\n\n{OFFICE_MAP_EMBED}\n\nCall {CONTACT_PHONE} for directions.",
    "get_directions": "Get directions to our office:\n\n📍 {OFFICE_ADDRESS}\n\n📱 Open in Google Maps\n🚗 Ample parking available\n📞 Call if lost: {CONTACT_PHONE}",
    "market_location": "We're located in Pune's main vegetable market:\n\n🥬 Gultekdi Market Yard\n📍 Pune's largest vegetable market\n🚚 Easy loading/unloading\n📦 Fresh stock daily\n\nVisit us for the best quality!"
}

# Business constants
OFFICE_ADDRESS = "Gultekdi, Market Yard, Pune - 411037"
CONTACT_PHONE = "9881325644"
CONTACT_EMAIL = "surajgaikwad9812@gmail.com"
BOT_NAME = "BVS Assistant"
OFFICE_MAP_EMBED = """<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d7567.840939186108!2d73.85508989357909!3d18.4872613!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bc2c01fc774bf91%3A0xd873ca459e33d07f!2sMarket%20Yard!5e0!3m2!1sen!2sin!4v1760519136324!5m2!1sen!2sin" width="100%" height="200" style="border:0; border-radius: 8px;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>"""
MARKET_MAP_EMBED = """<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d7567.840939186108!2d73.8550898935791!3d18.4872613!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bc2c01fc774bf91%3A0xd873ca459e33d07f!2sMarket%20Yard!5e0!3m2!1sen!2sin!4v1760950417216!5m2!1sen!2sin" width="100%" height="300" style="border:0; border-radius: 8px;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>"""

# Environment variables
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://vexaecpygrwbulhpskri.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZleGFlY3B5Z3J3YnVsaHBza3JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4OTUwMjIsImV4cCI6MjA3NTQ3MTAyMn0.WPmEYB_cjF2X2KNV09lrTMhJDO5js9VzJlzgkqioIxI")
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "sk-f9eedf9532cd48599a8a164612d7bff6")

# MMS-TTS Models Configuration
TTS_MODELS = {
    'hi': "Anjan9320/fb-mms-tts-hin-ft-male",  # Hindi
    'mr': "facebook/mms-tts-mar",  # Marathi
    'en': None  # Keep using ElevenLabs for English
}

# Model cache
tts_models = {}
tts_tokenizers = {}

# Initialize clients
supabase = None
if supabase_available and SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        logger.info("Supabase client initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {str(e)}")
        supabase = None

deepseek = None
if openai_available and DEEPSEEK_API_KEY:
    try:
        deepseek = OpenAI(api_key=DEEPSEEK_API_KEY, base_url="https://api.deepseek.com")
        logger.info("DeepSeek client initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize DeepSeek client: {str(e)}")
        deepseek = None

# Language configuration
TARGET_LANGUAGES = {
    "mr": "Marathi",
    "hi": "Hindi", 
    "te": "Telugu",
    "en": "English"
}
_LAST_DETECTED_LANG = 'en'

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

@app.route('/chat', methods=['OPTIONS'])
def options_chat():
    return jsonify({'status': 'success'}), 200

# MMS-TTS Functions
def load_tts_model(language_code):
    """Load TTS model for specific language"""
    if language_code not in TTS_MODELS or language_code == 'en':
        return None, None
        
    if language_code in tts_models:
        return tts_models[language_code], tts_tokenizers[language_code]
    
    try:
        model_id = TTS_MODELS[language_code]
        logger.info(f"Loading TTS model for {language_code}: {model_id}")
        
        model = VitsModel.from_pretrained(model_id)
        tokenizer = AutoTokenizer.from_pretrained(model_id)
        
        tts_models[language_code] = model
        tts_tokenizers[language_code] = tokenizer
        
        logger.info(f"Successfully loaded TTS model for {language_code}")
        return model, tokenizer
        
    except Exception as e:
        logger.error(f"Error loading TTS model for {language_code}: {str(e)}")
        return None, None

def generate_speech_audio(text, language_code):
    """Generate speech audio using MMS-TTS models"""
    if language_code == 'en' or not text.strip():
        return None
        
    model, tokenizer = load_tts_model(language_code)
    
    if model is None or tokenizer is None:
        return None
    
    try:
        # Clean text for TTS
        clean_text = remove_emojis(text).strip()
        if not clean_text:
            return None
            
        logger.info(f"Generating TTS audio for {language_code}: {clean_text[:50]}...")
        
        # Tokenize and generate
        inputs = tokenizer(clean_text, return_tensors="pt")
        
        with torch.no_grad():
            output = model(**inputs)
            waveform = output.waveform
            
        # Convert to bytes
        audio_buffer = io.BytesIO()
        sf.write(audio_buffer, waveform.squeeze().cpu().numpy(), 
                model.config.sampling_rate, format='WAV')
        audio_buffer.seek(0)
        
        logger.info("TTS audio generation successful")
        return audio_buffer
        
    except Exception as e:
        logger.error(f"Error generating TTS audio: {str(e)}")
        return None

# Translation functions
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
    if not translator_available or dest_lang == 'en' or not text.strip():
        return text
    
    try:
        translated = GoogleTranslator(source='en', target=dest_lang).translate(text)
        logger.info(f"Translated from English to {dest_lang}: {translated}")
        return translated
    except Exception as e:
        logger.warning(f"Translation from English failed: {str(e)}")
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
    elif any(char in ['ं', 'ँ', 'ः', 'अ', 'आ'] for char in text):  # Hindi/Marathi characters
        return 'hi'  # Default to Hindi if uncertain but has Devanagari chars
    else:
        return 'en'

# Data access functions
def fetch_available_products(limit: int = 20) -> List[Dict[str, Any]]:
    """Fetch available products from Supabase with prices"""
    if not supabase:
        # Return comprehensive vegetable and fruit data
        return [
            # Common Vegetables
            {"product_name": "Tomatoes", "category": "Vegetables", "unit": "kg", "current_price": 25},
            {"product_name": "Onions", "category": "Vegetables", "unit": "kg", "current_price": 30},
            {"product_name": "Potatoes", "category": "Vegetables", "unit": "kg", "current_price": 20},
            {"product_name": "Green Peas", "category": "Vegetables", "unit": "kg", "current_price": 40},
            {"product_name": "Cauliflower", "category": "Vegetables", "unit": "kg", "current_price": 35},
            {"product_name": "Cabbage", "category": "Vegetables", "unit": "kg", "current_price": 18},
            {"product_name": "Carrots", "category": "Vegetables", "unit": "kg", "current_price": 45},
            {"product_name": "Beetroot", "category": "Vegetables", "unit": "kg", "current_price": 30},
            {"product_name": "Radish", "category": "Vegetables", "unit": "kg", "current_price": 25},
            {"product_name": "Cucumber", "category": "Vegetables", "unit": "kg", "current_price": 20},
            
            # Leafy Vegetables
            {"product_name": "Spinach", "category": "Leafy Vegetables", "unit": "kg", "current_price": 15},
            {"product_name": "Coriander", "category": "Leafy Vegetables", "unit": "bunch", "current_price": 10},
            {"product_name": "Mint", "category": "Leafy Vegetables", "unit": "bunch", "current_price": 12},
            {"product_name": "Fenugreek Leaves", "category": "Leafy Vegetables", "unit": "bunch", "current_price": 15},
            
            # Fruits
            {"product_name": "Bananas", "category": "Fruits", "unit": "dozen", "current_price": 40},
            {"product_name": "Apples", "category": "Fruits", "unit": "kg", "current_price": 80},
            {"product_name": "Oranges", "category": "Fruits", "unit": "kg", "current_price": 60},
        ]
    
    try:
        resp = (
            supabase.table("products")
            .select("product_name, category, unit, current_price, is_available")
            .eq("is_available", True)
            .order("current_price", desc=False)
            .limit(limit)
            .execute()
        )
        return resp.data or []
    except Exception as e:
        logger.error(f"Error fetching products: {str(e)}")
        # Return basic vegetable data on error
        return [
            {"product_name": "Tomatoes", "category": "Vegetables", "unit": "kg", "current_price": 25},
            {"product_name": "Onions", "category": "Vegetables", "unit": "kg", "current_price": 30},
            {"product_name": "Potatoes", "category": "Vegetables", "unit": "kg", "current_price": 20},
        ]

# Intent detection patterns - Reordered to prioritize LOCATION over CONTACT
INTENTS = {
    "GREET": re.compile(r"\b(hi|hello|hey|namaste|namaskar|good\s*(morning|afternoon|evening))\b", re.I),
    "HOME_DELIVERY": re.compile(r"\b(home|household|retail|small\s*order|door\s*delivery)\b", re.I),
    "QUOTE": re.compile(r"\b(price|prices|rate|rates|quote|quotation|catalog|list|cost|get price list)\b", re.I),
    "SCHEDULE": re.compile(r"\b(weekly|daily|standing\s*order|recurring)\b", re.I),
    # LOCATION before CONTACT to prioritize
    "LOCATION": re.compile(r"\b(office\s*location|where\s+are\s+you\s*located|your\s*location|office\s*address|your\s*address|map|directions|find\s*you|address|location)\b", re.I),
    "CONTACT": re.compile(r"\b(contact|phone\s*(number)?|your\s*phone|email|reach|contact us)\b", re.I),
    "SOURCING": re.compile(r"\b(source|origin|farm|where.*from)\b", re.I),
    "QUALITY": re.compile(r"\b(quality|fresh|farm\s*to\s*table|grade)\b", re.I),
    "DELIVERY": re.compile(r"\b(deliver|delivery|slot|when|timeline|delivery info)\b", re.I),
    "CLIENTS": re.compile(r"\b(hotels?|canteens?|clients?|served|how\s*many)\b", re.I),
    "ORDER_CONTACT": re.compile(r"\b(order|orders|book|place|enquire|enquiry|details|more\s*details|place an order)\b", re.I),
    "CONNECT": re.compile(r"\b(connect|owner|speak|call\s*you|reach\s*out)\b", re.I),
    "PRODUCT_TYPES": re.compile(r"\b(types?|variet(y|ies)|what\s*vegetables|catalog|range|what.*vegetable|kind.*vegetable)\b", re.I),
    "CUSTOM_ORDER": re.compile(r"\b(custom|specific|exact|as\s*you\s*want|special\s*item|non[-\s]*standard)\b", re.I),
    "NON_PRODUCE": re.compile(r"\b(phones?|mobiles?|electronics?|laptops?|computers?|tvs?|fridges?|ac|air\s*conditioners?|washing\s*machines?|headphones?|earphones?|chargers?|batteries?|gadgets?)\b", re.I),
    
    # Additional intents
    "PAYMENT": re.compile(r"\b(payment|pay|paid|methods?|options?|cash|check|cheque|online|transfer|upi|bank|card|credit|debit)\b", re.I),
    "MINIMUM_ORDER": re.compile(r"\b(minimum|min\.?|least|smallest)\b.*\b(order|quantity|amount|value|qty)\b", re.I),
    "DELIVERY_AREAS": re.compile(r"\b(deliver|delivery|areas?|zones?|pincodes?|locations?|cities?|pune|where.*deliver)\b", re.I),
    "BUSINESS_HOURS": re.compile(r"\b(hours?|timing|time|schedule|open|close|available|business)\b", re.I),
    "FRUITS": re.compile(r"\b(fruits?|mango|banana|apple|orange|grapes?|pomegranate|watermelon)\b", re.I),
    "SPECIFIC_ITEM": re.compile(r"\b(do you have|do you supply|can you get|provide|available)\b.*\b(olive|kiwi|avocado|broccoli|zucchini|asparagus|artichoke|specific|particular)\b", re.I),
    "DELIVERY_LOCATION": re.compile(r"\b(mumbai|delhi|bangalore|hyderabad|chennai|kolkata|outside|other\s*cities?|different\s*city|another\s*city)\b", re.I),
    "CURRENT_LOCATION": re.compile(r"\b(pune|local|within\s*city|same\s*city|here)\b", re.I),
    "SOMETHING_ELSE": re.compile(r"\b(something else|other|anything else)\b", re.I),
}

def detect_delivery_intent(text: str) -> str:
    """Enhanced intent detection for delivery locations"""
    text_lower = text.lower()
    
    # Check for outside Pune locations
    outside_locations = ['mumbai', 'delhi', 'bangalore', 'hyderabad', 'chennai', 'kolkata', 
                        'outside pune', 'other city', 'different city', 'another city']
    
    # Check for Pune locations
    pune_locations = ['pune', 'within pune', 'in pune', 'local delivery', 'same city']
    
    if any(loc in text_lower for loc in outside_locations):
        return "DELIVERY_LOCATION"
    elif any(loc in text_lower for loc in pune_locations):
        return "CURRENT_LOCATION"
    
    # Fall back to regular intent detection
    return detect_intent(text)


# Non-produce detectors
NON_PRODUCE_VERBS = re.compile(
    r"\b(supply|sell|stock|provide|offer|deal|have|carry|buy|purchase|deliver|ship|send)\b",
    re.I,
)

def is_non_produce_query(text: str) -> bool:
    """Check if query is about non-produce items"""
    if not text:
        return False
    
    text_lower = text.lower()
    
    # List of non-produce categories we want to detect
    non_produce_categories = [
        'phone', 'mobile', 'electronic', 'laptop', 'computer', 'tv', 'fridge', 
        'ac', 'air conditioner', 'washing machine', 'headphone', 'earphone',
        'charger', 'battery', 'gadget', 'appliance', 'device'
    ]
    
    # Check if any non-produce category is mentioned
    has_non_produce = any(category in text_lower for category in non_produce_categories)
    
    # Also check for verbs that indicate they want to buy/sell these items
    has_verb = bool(NON_PRODUCE_VERBS.search(text))
    
    return has_non_produce and has_verb


def detect_intent(text: str) -> str:
    """Detect user intent from text"""
    # Check for non-produce FIRST
    if is_non_produce_query(text):
        return "NON_PRODUCE"
    
    # Then check other intents
    for name, pat in INTENTS.items():
        if name != "NON_PRODUCE" and pat.search(text or ""):  # Skip NON_PRODUCE since we already checked it
            return name
    return "UNKNOWN"

# Response builder functions - USING VERSION 1 SHORTER RESPONSES
def resp_greeting() -> str:
    return "Hey! Welcome to BVS—fresh veggies for hotels and caterers. Tell us your business type and what you need, and we'll send a quick quote."

def resp_home_delivery() -> str:
    return "We focus on bulk supply to hotels, canteens, and caterers. For retail home deliveries, please check with local markets."

def resp_seasonal_items() -> str:
    return "We supply all vegetable varieties based on season and availability."


def resp_clients() -> str:
    return "We serve hotels, canteens, and caterers across Pune."

def resp_sourcing() -> str:
    return "We source fresh vegetables directly from trusted suppliers."

def resp_quality() -> str:
    return "We maintain quality standards with fresh supply and prompt delivery."

def resp_product_types() -> str:
    """Enhanced response with comprehensive vegetable and fruit types in professional table format"""
    vegetable_types = """**COMPREHENSIVE PRODUCE CATALOG**

| Category | Types Available | Examples |
|----------|----------------|----------|
| **LEAFY GREENS** | All seasonal leafy vegetables | Spinach, Lettuce, Kale, Fenugreek, Coriander, Mint |
| **ROOT VEGETABLES** | Fresh root produce | Carrots, Radish, Beetroot, Turnips, Sweet Potatoes |
| **BULB VEGETABLES** | Complete range | Onions, Garlic, Leeks, Spring Onions, Shallots |
| **STEM VEGETABLES** | Premium selection | Celery, Asparagus, Rhubarb, Bamboo Shoots |
| **FLOWER VEGETABLES** | Fresh flower varieties | Cauliflower, Broccoli, Artichokes |
| **FRUIT VEGETABLES** | All seasonal varieties | Tomatoes, Cucumbers, Bell Peppers, Eggplants |
| **POD VEGETABLES** | Fresh pods & legumes | Green Peas, Beans, Okra, Broad Beans |
| **TUBER VEGETABLES** | Quality tubers | Potatoes, Sweet Potatoes, Yams, Taro |
| **GOURD VEGETABLES** | All gourd types | Pumpkins, Bottle Gourds, Bitter Gourds, Ridge Gourds |

**FRUITS CATALOG**

| Category | Types Available | Examples |
|----------|----------------|----------|
| **TROPICAL FRUITS** | All seasonal tropical fruits | Mangoes, Bananas, Pineapples, Papayas, Pomegranates |
| **CITRUS FRUITS** | Fresh citrus varieties | Oranges, Mosambi, Lemons, Grapefruits |
| **BERRIES** | Premium berries | Grapes, Strawberries, Blueberries |
| **MELONS** | All melon types | Watermelons, Muskmelons, Cantaloupes |
| **STONE FRUITS** | Quality stone fruits | Apples, Pears, Cherries, Plums |
| **EXOTIC FRUITS** | Available on request | Kiwi, Avocado, Dragon Fruit, etc. |

We supply ALL vegetable and fruit varieties available in the market. 
For specific requirements or custom orders, please call us at **{CONTACT_PHONE}**.""".format(CONTACT_PHONE=CONTACT_PHONE)
    
    return vegetable_types

def resp_non_produce() -> str:
    return "We specialize exclusively in fresh vegetables and fruits for hotels and caterers. We don't supply electronics, phones, or other non-agricultural products. What vegetables or fruits do you need?"

def resp_unknown() -> str:
    return "We can arrange that for you. Please share the specific items and quantities you need."

def resp_schedule() -> str:
    return "We support daily or weekly schedules for professional kitchens. Share your requirements to plan consistent supply."

def resp_contact() -> str:
    return f"Call {CONTACT_PHONE} or email {CONTACT_EMAIL}. Office: {OFFICE_ADDRESS}"

def resp_delivery() -> str:
    return "Same- or next-day delivery based on availability. Share your address and date to confirm."

def resp_order_contact() -> str:
    return f"For orders, call {CONTACT_PHONE} or email with your requirements for a quick quote."

def resp_connect() -> str:  # FIXED: ADDED MISSING FUNCTION
    return f"Call {CONTACT_PHONE} to speak directly with our team about your vegetable supply needs."

def resp_custom_order() -> str:
    return "Yes, we customize orders to your kitchen's needs. Share your item list and quantities for pricing."

def resp_payment() -> str:
    return "We accept cash, checks, and online transfers including UPI."

def resp_minimum_order() -> str:
    return "No minimum order requirements - we serve all order sizes."

def resp_delivery_areas() -> str:
    return "We deliver across Pune and surrounding areas. For locations outside Pune, please contact us directly to discuss feasibility."

def resp_business_hours() -> str:
    return "Order calls accepted daily from 6 PM to 11 PM."

def resp_specific_item() -> str:
    return "Yes, we can arrange that. Please share the quantity and delivery requirements."

def resp_delivery_location() -> str:
    return "We currently focus on serving Pune and surrounding areas. For supply outside Pune, please contact us directly to discuss feasibility and logistics."

def resp_current_location() -> str:
    return "Yes, we deliver across Pune. Share your specific location and requirements for delivery confirmation."

def resp_quote() -> str:
    items = fetch_available_products(8)
    if not items:
        return "We can supply all vegetables and fruits. Please share your specific requirements for pricing."
    
    sample_lines = []
    for it in items[:6]:
        name = it.get("product_name") or "Item"
        unit = it.get("unit") or "unit"
        price = it.get("current_price")
        
        if price is not None:
            price_str = f"₹{price}/{unit}"
            sample_lines.append(f"- {name}: {price_str}")
    
    samples = "\n".join(sample_lines) if sample_lines else "- Share your list for exact pricing"
    return f"We supply everything. Sample prices:\n{samples}\nWhat specific items and quantities do you need?"

# UPDATED FRUIT RESPONSE
def resp_fruits() -> str:
    return "Yes, we supply all fruits available in the market. What specific fruits and quantities do you require?"

# NEW RESPONSE FOR SOMETHING ELSE
def resp_something_else() -> str:
    return "Sure! What specific vegetables, fruits, or other requirements do you have in mind? Share the details for a quick quote."

# NEW RESPONSE FOR LOCATION
def resp_location() -> str:
    return f"Our office is at: {OFFICE_ADDRESS}\n\n{OFFICE_MAP_EMBED}"

# LLM integration
def llm_answer(user_text: str, context: str) -> Optional[str]:
    """Get response from DeepSeek AI"""
    if not deepseek:
        return None
    
    # ENHANCED SYSTEM PROMPT WITH REAL BUSINESS INFO
    system_prompt = f"""You are a professional vegetable and fruit supplier assistant for Bhairavnath Vegetable Supplier (BVS). 

BUSINESS INFORMATION:
- Company: Bhairavnath Vegetable Supplier (BVS)
- Contact: {CONTACT_PHONE}
- Email: {CONTACT_EMAIL} 
- Address: {OFFICE_ADDRESS}
- Focus: Bulk supply to hotels, canteens, caterers in Pune

IMPORTANT RULES:
1. ALWAYS use the real contact number: {CONTACT_PHONE} - NEVER invent fake numbers
2. NEVER say "no" or "we don't have" - always respond positively
3. We supply ALL vegetables and fruits available in the market
4. For specific items, say "Yes, we can arrange that" 
5. Keep responses concise and professional
6. Always ask for specific requirements and quantities
7. For delivery outside Pune, say we focus on Pune but they can contact us to discuss
8. If asked about non-agricultural products like phones, laptops, electronics, etc., respond: "We focus exclusively on agricultural produce - fresh vegetables and fruits for professional kitchens."

Current available products: {context}"""
    
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"Context:\n{context}\n\nQuestion:\n{user_text}"},
    ]
    
    try:
        resp = deepseek.chat.completions.create(
            model="deepseek-chat",
            messages=messages,
            temperature=0.3,
            max_tokens=200
        )
        return resp.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"DeepSeek API error: {str(e)}")
        return None
    
def remove_emojis(text):
    """Remove emojis from text for clean TTS"""
    if not text:
        return text
        
    emoji_pattern = re.compile(
        "["
        "\U0001F600-\U0001F64F"  # emoticons
        "\U0001F300-\U0001F5FF"  # symbols & pictographs
        "\U0001F680-\U0001F6FF"  # transport & map symbols
        "\U0001F700-\U0001F77F"  # alchemical symbols
        "\U0001F780-\U0001F7FF"  # Geometric Shapes Extended
        "\U0001F800-\U0001F8FF"  # Supplemental Arrows-C
        "\U0001F900-\U0001F9FF"  # Supplemental Symbols and Pictographs
        "\U0001FA00-\U0001FA6F"  # Chess Symbols
        "\U0001FA70-\U0001FAFF"  # Symbols and Pictographs Extended-A
        "\U00002702-\U000027B0"  # Dingbats
        "\U000024C2-\U0001F251" 
        "]+",
        flags=re.UNICODE
    )
    
    clean_text = emoji_pattern.sub('', text).strip()
    return clean_text

# def handle_message(text: str) -> str:
#     """Main message handler with enhanced translation support"""
#     global _LAST_DETECTED_LANG
    
#     if not text or not text.strip():
#         return "Please share your vegetable requirements for a quote."
    
#     # Detect language with enhanced accuracy
#     detected_lang = detect_language(text)
#     _LAST_DETECTED_LANG = detected_lang
#     logger.info(f"Detected language: {detected_lang} - Text: {text}")
    
#     # Translate to English for processing if needed
#     if translator_available and detected_lang != 'en':
#         text_for_processing = translate_text_to_english(text, detected_lang)
#         logger.info(f"Translated to English: {text_for_processing}")
#     else:
#         text_for_processing = text

#     # Define response_map at the TOP - BEFORE using it
#     response_map = {
#         "NON_PRODUCE": resp_non_produce,
#         "GREET": resp_greeting,
#         "HOME_DELIVERY": resp_home_delivery,
#         "ORDER_CONTACT": resp_order_contact,
#         "CONNECT": resp_connect,
#         "PRODUCT_TYPES": resp_product_types,
#         "CUSTOM_ORDER": resp_custom_order,
#         "QUOTE": resp_quote,
#         "SCHEDULE": resp_schedule,
#         "CONTACT": resp_contact,
#         "SOURCING": resp_sourcing,
#         "QUALITY": resp_quality,
#         "DELIVERY": resp_delivery,
#         "CLIENTS": resp_clients,
#         "PAYMENT": resp_payment,
#         "MINIMUM_ORDER": resp_minimum_order,
#         "DELIVERY_AREAS": resp_delivery_areas,
#         "BUSINESS_HOURS": resp_business_hours,
#         "FRUITS": resp_fruits,
#         "SPECIFIC_ITEM": resp_specific_item,
#         "DELIVERY_LOCATION": resp_delivery_location,
#         "CURRENT_LOCATION": resp_current_location,
#         "SOMETHING_ELSE": resp_something_else,
#         "LOCATION": resp_location,
#     }

#     # Use enhanced delivery intent detection first
#     delivery_intent = detect_delivery_intent(text_for_processing)
    
#     if delivery_intent in ["DELIVERY_LOCATION", "CURRENT_LOCATION"]:
#         english_response = response_map.get(delivery_intent, resp_unknown)()
#     else:
#         intent = detect_intent(text_for_processing)
#         logger.info(f"Detected intent: {intent}")
        
#         if intent in response_map:
#             english_response = response_map[intent]()
#         else:
#             # Try LLM for unknown queries
#             ctx_items = fetch_available_products(8)
#             ctx_lines = [f"{it.get('product_name')} ({it.get('category')})"
#                           for it in ctx_items if it.get('product_name')]
#             ctx = "Available: " + ", ".join(ctx_lines) if ctx_lines else "Share your requirements"

#             if deepseek:
#                 ans = llm_answer(text_for_processing, ctx)
#                 english_response = ans if ans else resp_unknown()
#             else:
#                 english_response = resp_unknown()

#     # Translate response back to user's language if needed
#     logger.info(f"Original language: {detected_lang}, English response: {english_response[:100]}...")
    
#     final_response = english_response
#     if translator_available and detected_lang != 'en':
#         try:
#             final_response = translate_response_from_english(english_response, detected_lang)
#             logger.info(f"Translated response to {detected_lang}: {final_response[:100]}...")
#         except Exception as e:
#             logger.error(f"Translation failed: {str(e)}")
#             # Keep English response if translation fails

#     return final_response

@app.route('/health', methods=['GET'])
def health_check():
    status_info = {
        "status": "healthy", 
        "message": "BVS Backend server is running",
        "services": {
            "supabase": supabase is not None,
            "deepseek": deepseek is not None,
            "translation": translator_available,
            "language_detection": detector_available,
            "mms_tts": mms_tts_available
        }
    }
    return jsonify(status_info)

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

# @app.route('/chat', methods=['POST'])
# def chat():
#     try:
#         data = request.get_json()
#         user_message = data.get('message', '').strip()
        
#         logger.info(f"Received message: {user_message}")
        
#         # Generate response
#         response_text = handle_message(user_message)
        
#         # Detect language for TTS
#         detected_lang = detect_language(user_message)
        
#         # For TTS, decide which system to use
#         tts_system = 'elevenlabs'  # default
#         tts_text = response_text
        
#         # Use MMS-TTS for Indian languages, ElevenLabs for English
#         if detected_lang in ['hi', 'mr']:
#             tts_system = 'mms_tts'
#             # For Indian languages, we'll use the frontend to call TTS separately
#             # to avoid blocking the response
#         else:
#             # For English, use existing ElevenLabs flow
#             tts_system = 'elevenlabs'
        
#         logger.info(f"SENDING RESPONSE: {response_text}")
#         logger.info(f"TTS SYSTEM: {tts_system}, LANGUAGE: {detected_lang}")
        
#         return jsonify({
#             "response": response_text,
#             "tts_text": tts_text,
#             "tts_system": tts_system,
#             "detected_language": detected_lang,
#             "status": "success"
#         })
#     except Exception as e:
#         logger.error(f"Error: {str(e)}")
#         return jsonify({"error": "Internal server error"}), 500

# @app.route('/products', methods=['GET'])
# def get_products():
#     """Endpoint to get available products"""
#     try:
#         limit = request.args.get('limit', 20, type=int)
#         products = fetch_available_products(limit)
#         return jsonify({
#             "products": products,
#             "count": len(products),
#             "status": "success"
#         })
#     except Exception as e:
#         logger.error(f"Error fetching products: {str(e)}")
#         return jsonify({"error": "Failed to fetch products"}), 500

# @app.route('/products', methods=['GET'])
# def get_products():
#     """Endpoint to get available products"""
#     try:
#         limit = request.args.get('limit', 20, type=int)
#         products = fetch_available_products(limit)
#         return jsonify({
#             "products": products,
#             "count": len(products),
#             "status": "success"
#         })
#     except Exception as e:
#         logger.error(f"Error fetching products: {str(e)}")
#         return jsonify({"error": "Failed to fetch products"}), 500


@app.route('/api/public/products', methods=['GET'])
def get_public_products():
    """Public endpoint to get available products"""
    try:
        limit = request.args.get('limit', 20, type=int)
        products = fetch_available_products(limit)
        return jsonify({
            "products": products,
            "count": len(products),
            "status": "success"
        })
    except Exception as e:
        logger.error(f"Error fetching products: {str(e)}")
        return jsonify({"error": "Failed to fetch products"}), 500


# Update the handle_message function to support menu interactions
def handle_message(text: str) -> str:
    """Main message handler with enhanced translation support"""
    global _LAST_DETECTED_LANG
    
    if not text or not text.strip():
        return "Please share your vegetable requirements for a quote."
    
    # Detect language with enhanced accuracy
    detected_lang = detect_language(text)
    _LAST_DETECTED_LANG = detected_lang
    logger.info(f"Detected language: {detected_lang} - Text: {text}")
    
    # Translate to English for processing if needed
    if translator_available and detected_lang != 'en':
        text_for_processing = translate_text_to_english(text, detected_lang)
        logger.info(f"Translated to English: {text_for_processing}")
    else:
        text_for_processing = text

    # Define response_map
    response_map = {
        "NON_PRODUCE": resp_non_produce,
        "GREET": resp_greeting,
        "HOME_DELIVERY": resp_home_delivery,
        "ORDER_CONTACT": resp_order_contact,
        "CONNECT": resp_connect,
        "PRODUCT_TYPES": resp_product_types,
        "CUSTOM_ORDER": resp_custom_order,
        "QUOTE": resp_quote,
        "SCHEDULE": resp_schedule,
        "CONTACT": resp_contact,
        "SOURCING": resp_sourcing,
        "QUALITY": resp_quality,
        "DELIVERY": resp_delivery,
        "CLIENTS": resp_clients,
        "PAYMENT": resp_payment,
        "MINIMUM_ORDER": resp_minimum_order,
        "DELIVERY_AREAS": resp_delivery_areas,
        "BUSINESS_HOURS": resp_business_hours,
        "FRUITS": resp_fruits,
        "SPECIFIC_ITEM": resp_specific_item,
        "DELIVERY_LOCATION": resp_delivery_location,
        "CURRENT_LOCATION": resp_current_location,
        "SOMETHING_ELSE": resp_something_else,
        "LOCATION": resp_location,
    }

    # Use enhanced delivery intent detection first
    delivery_intent = detect_delivery_intent(text_for_processing)
    
    if delivery_intent in ["DELIVERY_LOCATION", "CURRENT_LOCATION"]:
        english_response = response_map.get(delivery_intent, resp_unknown)()
    else:
        intent = detect_intent(text_for_processing)
        logger.info(f"Detected intent: {intent}")
        
        if intent in response_map:
            english_response = response_map[intent]()
        else:
            # Try LLM for unknown queries
            ctx_items = fetch_available_products(8)
            ctx_lines = [f"{it.get('product_name')} ({it.get('category')})"
                          for it in ctx_items if it.get('product_name')]
            ctx = "Available: " + ", ".join(ctx_lines) if ctx_lines else "Share your requirements"

            if deepseek:
                ans = llm_answer(text_for_processing, ctx)
                english_response = ans if ans else resp_unknown()
            else:
                english_response = resp_unknown()

    # Translate response back to user's language if needed
    logger.info(f"Original language: {detected_lang}, English response: {english_response[:100]}...")
    
    final_response = english_response
    if translator_available and detected_lang != 'en':
        try:
            final_response = translate_response_from_english(english_response, detected_lang)
            logger.info(f"Translated response to {detected_lang}: {final_response[:100]}...")
        except Exception as e:
            logger.error(f"Translation failed: {str(e)}")
            # Keep English response if translation fails

    return final_response

def handle_message_with_menu(text: str, current_menu: str = None) -> Dict[str, Any]:
    """Enhanced message handler with menu support"""
    global _LAST_DETECTED_LANG
    
    if not text or not text.strip():
        # Return main menu if no text
        return format_menu_response("main_menu")
    
    # Check if this is a menu action
    if text.startswith("menu_"):
        action = text[5:]  # Remove "menu_" prefix
        if action in MENU_STRUCTURE:
            return format_menu_response(action)
        elif action in TERMINAL_RESPONSES:
            return format_terminal_response(action)
    
    # Detect language
    detected_lang = detect_language(text)
    _LAST_DETECTED_LANG = detected_lang
    
    # Translate to English for processing if needed
    if translator_available and detected_lang != 'en':
        text_for_processing = translate_text_to_english(text, detected_lang)
    else:
        text_for_processing = text
    
    # Check if this matches any menu option text
    menu_action = find_menu_action_by_text(text_for_processing)
    if menu_action:
        if menu_action in MENU_STRUCTURE:
            return format_menu_response(menu_action)
        elif menu_action in TERMINAL_RESPONSES:
            return format_terminal_response(menu_action)
    
    # Fall back to original intent detection for free text
    intent = detect_intent(text_for_processing)
    
    # Map intents to menu actions
    intent_to_menu = {
        "QUOTE": "price_list",
        "ORDER_CONTACT": "place_order", 
        "DELIVERY": "delivery_info",
        "CONTACT": "contact_us",
        "LOCATION": "location",
        "GREET": "main_menu"
    }
    
    if intent in intent_to_menu:
        return format_menu_response(intent_to_menu[intent])
    else:
        # Use original handling for other intents
        response_text = handle_message(text)
        return {
            "response": response_text,
            "menu": None,
            "is_terminal": True,
            "detected_language": detected_lang
        }
    
def find_menu_action_by_text(text: str) -> str:
    """Find menu action by matching option text"""
    text_lower = text.lower().strip()
    
    # Map common phrases to menu actions
    phrase_to_action = {
        "price": "price_list",
        "pricing": "price_list", 
        "cost": "price_list",
        "order": "place_order",
        "buy": "place_order",
        "purchase": "place_order",
        "delivery": "delivery_info",
        "shipping": "delivery_info",
        "contact": "contact_us",
        "call": "contact_us",
        "email": "contact_us",
        "location": "location",
        "address": "location",
        "map": "location",
        "main menu": "main_menu",
        "back": "main_menu",
        "home": "main_menu"
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
    
    # Format options with action prefixes
    formatted_options = []
    for option in menu_data["options"]:
        formatted_options.append({
            "text": option["text"],
            "action": f"menu_{option['action']}"
        })
    
    return {
        "response": menu_data["message"],
        "menu": formatted_options,
        "is_terminal": False,
        "current_menu": menu_id,
        "detected_language": _LAST_DETECTED_LANG
    }

def format_terminal_response(action: str) -> Dict[str, Any]:
    """Format a terminal response (end of menu chain)"""
    response_text = TERMINAL_RESPONSES.get(action, "Thank you for your inquiry!").format(
        CONTACT_PHONE=CONTACT_PHONE,
        CONTACT_EMAIL=CONTACT_EMAIL,
        OFFICE_ADDRESS=OFFICE_ADDRESS,
        OFFICE_MAP_EMBED=OFFICE_MAP_EMBED,
        MARKET_MAP_EMBED=MARKET_MAP_EMBED
    )
    
    # Add back to main menu option
    back_option = {
        "text": "Back to Main Menu",
        "action": "menu_main_menu"
    }
    
    return {
        "response": response_text,
        "menu": [back_option],
        "is_terminal": True,
        "current_menu": action,
        "detected_language": _LAST_DETECTED_LANG
    }

# Update the chat endpoint to use menu system
@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        user_message = data.get('message', '').strip()
        current_menu = data.get('current_menu', None)
        
        logger.info(f"Received message: {user_message}, Current menu: {current_menu}")
        
        # Use menu-based handling
        response_data = handle_message_with_menu(user_message, current_menu)
        
        # Detect language for TTS
        detected_lang = response_data.get("detected_language", "en")
        
        # For TTS, decide which system to use
        tts_system = 'elevenlabs'
        tts_text = response_data["response"]
        
        if detected_lang in ['hi', 'mr']:
            tts_system = 'mms_tts'
        
        logger.info(f"SENDING RESPONSE: {response_data['response'][:100]}...")
        logger.info(f"TTS SYSTEM: {tts_system}, LANGUAGE: {detected_lang}")
        
        return jsonify({
            "response": response_data["response"],
            "menu_options": response_data.get("menu"),
            "is_terminal": response_data.get("is_terminal", False),
            "current_menu": response_data.get("current_menu"),
            "tts_text": tts_text,
            "tts_system": tts_system,
            "detected_language": detected_lang,
            "status": "success"
        })
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    print("🚀 Starting BVS Vegetable Supplier Server...")
    print("💬 Server: http://localhost:8000")
    print("🥦 Focus: Vegetables for Hotels, Canteens, Caterers")
    print("📞 Contact: 9881325644")
    print("📍 Location: Gultekdi, Market Yard, Pune")
    
    # Print service status
    status = []
    if supabase: status.append("Supabase: ✅")
    if deepseek: status.append("DeepSeek: ✅") 
    if translator_available: status.append("Translation: ✅")
    if detector_available: status.append("Language Detection: ✅")
    if mms_tts_available: status.append("MMS-TTS: ✅")
    
    print(f"🔧 Services: {', '.join(status) if status else 'Basic fallback mode'}")
    
    app.run(host='0.0.0.0', port=8000, debug=True)