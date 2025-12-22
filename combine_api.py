from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
import json
import os
import re
import sys
import traceback
from datetime import datetime
from typing import Dict, Any, List, Optional

#----------------------------------------------------------------------------------

import mysql.connector
from datetime import datetime, timedelta
import bcrypt
import jwt
import os
from functools import wraps
import json
import random
from twilio.rest import Client

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
    print("✅ deep-translator imported successfully")
except ImportError as e:
    translator_available = False
    print(f"❌ deep-translator import FAILED: {e}")

try:
    from langdetect import detect
    detector_available = True
except ImportError:
    detector_available = False

# MMS-TTS Imports - Disabled to avoid TensorFlow issues
mms_tts_available = False
# try:
#     from transformers import VitsModel, AutoTokenizer
#     import torch
#     import soundfile as sf
#     import io
#     import base64
#     mms_tts_available = True
# except ImportError:
#     mms_tts_available = False

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

# Marathi Menu Structure
MENU_STRUCTURE_MR = {
    "main_menu": {
        "message": "नमस्कार! भैरवनाथ वेजिटेबल सप्लायरमध्ये आपले स्वागत आहे—हॉटेल्स आणि कॅटरर्ससाठी ताज्या भाज्या. आज मी तुम्हाला कशात मदत करू शकतो?",
        "options": [
            {"text": "किंमत यादी मिळवा", "action": "price_list"},
            {"text": "ऑर्डर द्या", "action": "place_order"},
            {"text": "डिलिव्हरी माहिती", "action": "delivery_info"},
            {"text": "आमच्याशी संपर्क साधा", "action": "contact_us"},
            {"text": "आमचे स्थान", "action": "location"}
        ]
    },
    "price_list": {
        "message": "आमचे किंमत पर्याय येथे आहेत:",
        "options": [
            {"text": "भाज्यांच्या किंमती", "action": "vegetable_prices"},
            {"text": "फळांच्या किंमती", "action": "fruit_prices"},
            {"text": "मोठ्या ऑर्डरसाठी सवलत", "action": "bulk_discounts"},
            {"text": "हंगामी ऑफर", "action": "seasonal_specials"},
            {"text": "मुख्य मेनूवर परत या", "action": "main_menu"}
        ]
    },
    "delivery_info": {
        "message": "डिलिव्हरी माहिती:",
        "options": [
            {"text": "डिलिव्हरी क्षेत्र", "action": "delivery_areas"},
            {"text": "डिलिव्हरी वेळ", "action": "delivery_timing"},
            {"text": "डिलिव्हरी शुल्क", "action": "delivery_charges"},
            {"text": "मुख्य मेनूवर परत या", "action": "main_menu"}
        ]
    },
    "contact_us": {
        "message": "संपर्क पर्याय:",
        "options": [
            {"text": "आम्हाला कॉल करा", "action": "call_contact"},
            {"text": "आम्हाला ईमेल करा", "action": "email_contact"},
            {"text": "मुख्य मेनूवर परत या", "action": "main_menu"}
        ]
    },
    "location": {
        "message": "स्थान माहिती:",
        "options": [
            {"text": "ऑफिस पत्ता", "action": "office_address"},
            {"text": "मार्केट स्थान", "action": "market_location"},
            {"text": "मुख्य मेनूवर परत या", "action": "main_menu"}
        ]
    }
}

TERMINAL_RESPONSES_MR = {
    "vegetable_prices": "आमच्या सध्याच्या भाज्यांच्या किंमती:\n\nटोमॅटो: ₹25/किलो\nकांदे: ₹30/किलो\nबटाटे: ₹20/किलो\nवाटाणे: ₹40/किलो\nफुलकोबी: ₹35/किलो\nकोबी: ₹18/किलो\nगाजर: ₹45/किलो\n\nसंपूर्ण किंमत यादीसाठी {CONTACT_PHONE} वर कॉल करा.",
    "fruit_prices": "आमच्या सध्याच्या फळांच्या किंमती:\n\nकेळी: ₹40/डझन\nसफरचंद: ₹80/किलो\nसंत्री: ₹60/किलो\nद्राक्षे: ₹70/किलो\nडाळिंब: ₹90/किलो\n\nसंपूर्ण फळांच्या किंमत यादीसाठी {CONTACT_PHONE} वर कॉल करा.",
    "bulk_discounts": "आम्ही मोठ्या ऑर्डरसाठी विशेष सूट देतो:\n\n- ₹5000 पेक्षा जास्त ऑर्डर: 5% सूट\n- ₹10000 पेक्षा जास्त ऑर्डर: 10% सूट\n\nतुमच्या मोठ्या गरजांवर चर्चा करण्यासाठी {CONTACT_PHONE} वर कॉल करा.",
    "office_address": "आमचा ऑफिस पत्ता:\n\n{OFFICE_ADDRESS}\n\nदिशानिर्देशांसाठी {CONTACT_PHONE} वर कॉल करा.",
    "market_location": "आम्ही पुण्याच्या मुख्य भाजी मार्केटमध्ये आहोत:\n\n🥬 गुलटेकडी मार्केट यार्ड\n📍 पुण्यातील सर्वात मोठे भाजी मार्केट\n\nउत्तम दर्जासाठी आमच्याकडे या!"
}

# Hindi Menu Structure  
MENU_STRUCTURE_HI = {
    "main_menu": {
        "message": "नमस्ते! भैरवनाथ वेजिटेबल सप्लायर में आपका स्वागत है—होटलों और कैटरर्स के लिए ताजी सब्जियाँ। आज मैं आपकी कैसे मदद कर सकता हूँ?",
        "options": [
            {"text": "मूल्य सूची प्राप्त करें", "action": "price_list"},
            {"text": "ऑर्डर दें", "action": "place_order"},
            {"text": "डिलीवरी जानकारी", "action": "delivery_info"},
            {"text": "हमसे संपर्क करें", "action": "contact_us"},
            {"text": "हमारा स्थान", "action": "location"}
        ]
    },
    "price_list": {
        "message": "यहाँ हमारे मूल्य विकल्प हैं:",
        "options": [
            {"text": "सब्जियों की कीमतें", "action": "vegetable_prices"},
            {"text": "फलों की कीमतें", "action": "fruit_prices"},
            {"text": "बड़े ऑर्डर छूट", "action": "bulk_discounts"},
            {"text": "मौसमी ऑफर", "action": "seasonal_specials"},
            {"text": "मुख्य मेनू पर वापस जाएं", "action": "main_menu"}
        ]
    },
    "delivery_info": {
        "message": "डिलीवरी जानकारी:",
        "options": [
            {"text": "डिलीवरी क्षेत्र", "action": "delivery_areas"},
            {"text": "डिलीवरी समय", "action": "delivery_timing"},
            {"text": "डिलीवरी शुल्क", "action": "delivery_charges"},
            {"text": "मुख्य मेनू पर वापस जाएं", "action": "main_menu"}
        ]
    },
    "contact_us": {
        "message": "संपर्क विकल्प:",
        "options": [
            {"text": "हमें कॉल करें", "action": "call_contact"},
            {"text": "हमें ईमेल करें", "action": "email_contact"},
            {"text": "मुख्य मेनू पर वापस जाएं", "action": "main_menu"}
        ]
    },
    "location": {
        "message": "स्थान जानकारी:",
        "options": [
            {"text": "ऑफिस पता", "action": "office_address"},
            {"text": "मार्केट स्थान", "action": "market_location"},
            {"text": "मुख्य मेनू पर वापस जाएं", "action": "main_menu"}
        ]
    }
}

TERMINAL_RESPONSES_HI = {
    "vegetable_prices": "हमारी वर्तमान सब्जियों की कीमतें:\n\nटमाटर: ₹25/किलो\nप्याज: ₹30/किलो\nआलू: ₹20/किलो\nमटर: ₹40/किलो\nफूलगोभी: ₹35/किलो\nपत्तागोभी: ₹18/किलो\nगाजर: ₹45/किलो\n\nसंपूर्ण मूल्य सूची के लिए {CONTACT_PHONE} पर कॉल करें.",
    "fruit_prices": "हमारी वर्तमान फलों की कीमतें:\n\nकेले: ₹40/दर्जन\nसेब: ₹80/किलो\nसंतरे: ₹60/किलो\nअंगूर: ₹70/किलो\nअनार: ₹90/किलो\n\nसंपूर्ण फलों की मूल्य सूची के लिए {CONTACT_PHONE} पर कॉल करें.",
    "bulk_discounts": "हम बड़े ऑर्डर के लिए विशेष छूट देते हैं:\n\n- ₹5000 से अधिक ऑर्डर: 5% छूट\n- ₹10000 से अधिक ऑर्डर: 10% छूट\n\nअपनी बड़ी आवश्यकताओं पर चर्चा करने के लिए {CONTACT_PHONE} पर कॉल करें.",
    "office_address": "हमारा ऑफिस पता:\n\n{OFFICE_ADDRESS}\n\nदिशा-निर्देशों के लिए {CONTACT_PHONE} पर कॉल करें.",
    "market_location": "हम पुणे के मुख्य सब्जी मार्केट में हैं:\n\n🥬 गुलटेकडी मार्केट यार्ड\n📍 पुणे का सबसे बड़ा सब्जी मार्केट\n\nबेहतरीन गुणवत्ता के लिए हमारे पास आएं!"
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
    logger.info(f"[TRANSLATE] Called with dest_lang={dest_lang}, translator_available={translator_available}")
    logger.info(f"[TRANSLATE] Text to translate: '{text[:100]}...'")
    
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
        import traceback
        logger.error(traceback.format_exc())
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
    r"\b(supply|sell|stock|provide|offer|deal|have|carry|buy|purchase|deliver|ship|send|want|need|get|kilo|kg|parcel)\b",
    re.I,
)

# Comprehensive list of vegetables, fruits, and pulses we DO supply
PRODUCE_KEYWORDS = [
    # Vegetables
    'vegetable', 'veggie', 'tomato', 'onion', 'potato', 'carrot', 'cabbage', 'cauliflower',
    'broccoli', 'spinach', 'lettuce', 'cucumber', 'pepper', 'capsicum', 'eggplant', 'brinjal',
    'peas', 'bean', 'okra', 'bhindi', 'radish', 'beetroot', 'turnip', 'pumpkin', 'gourd',
    'squash', 'zucchini', 'corn', 'mushroom', 'celery', 'asparagus', 'artichoke', 'garlic',
    'ginger', 'chili', 'coriander', 'mint', 'fenugreek', 'kale',
    # Marathi vegetable names
    'भाजी', 'टोमॅटो', 'कांदे', 'बटाटे', 'गाजर', 'कोबी', 'फुलकोबी', 'वाटाणे', 'भोपळा',
    # Hindi vegetable names  
    'सब्जी', 'टमाटर', 'प्याज', 'आलू', 'गाजर', 'पत्तागोभी', 'फूलगोभी', 'मटर', 'कद्दू',
    # Fruits
    'fruit', 'apple', 'banana', 'orange', 'mango', 'grape', 'pomegranate', 'watermelon',
    'melon', 'papaya', 'pineapple', 'strawberry', 'cherry', 'peach', 'plum', 'kiwi',
    'avocado', 'lemon', 'lime', 'guava', 'lychee', 'coconut',
    # Marathi fruit names
    'फळ', 'सफरचंद', 'केळी', 'संत्री', 'आंबा', 'द्राक्षे', 'डाळिंब', 'कलिंगड',
    # Hindi fruit names
    'फल', 'सेब', 'केला', 'संतरा', 'आम', 'अंगूर', 'अनार', 'तरबूज',
    # Pulses/Grains
    'pulse', 'lentil', 'dal', 'chickpea', 'bean', 'pea', 'rice', 'wheat',
    'डाळ', 'तूर', 'मूग', 'चणा', 'दाल', 'चना', 'मूंग'
]

def is_non_produce_query(text: str) -> bool:
    """Enhanced check - returns True if asking for NON food/produce items"""
    if not text:
        return False
    
    text_lower = text.lower()
    
    # First check if they're asking about our produce - if yes, it's NOT non-produce
    if any(produce in text_lower for produce in PRODUCE_KEYWORDS):
        logger.info(f"[NON_PRODUCE] Found produce keyword, returning False")
        return False
    
    # List of NON-FOOD/NON-PRODUCE items
    non_produce_categories = [
        # Electronics
        'phone', 'mobile', 'smartphone', 'iphone', 'android', 'laptop', 'computer', 'pc',
        'tablet', 'ipad', 'tv', 'television', 'monitor', 'screen', 'camera', 'headphone',
        'earphone', 'earbuds', 'speaker', 'charger', 'cable', 'battery', 'powerbank',
        # Appliances
        'fridge', 'refrigerator', 'ac', 'air conditioner', 'washing machine', 'microwave',
        'oven', 'mixer', 'grinder', 'cooker', 'heater', 'fan', 'iron',
        # Clothing/Fashion
        'clothes', 'shirt', 'pant', 'shoe', 'dress', 'jacket', 'bag', 'watch', 'jewelry',
        # Furniture/Home
        'furniture', 'chair', 'table', 'bed', 'sofa', 'cupboard', 'desk',
        # Vehicles
        'car', 'bike', 'scooter', 'vehicle', 'auto', 'cycle',
        # Stationery
        'book', 'pen', 'pencil', 'paper', 'notebook',
        # Random nonsense words people might test with
        'vapabv', 'xyz', 'asdf', 'test', 'random'
    ]
    
    # Check if any non-produce category is mentioned
    has_non_produce = any(category in text_lower for category in non_produce_categories)
    
    if has_non_produce:
        logger.info(f"[NON_PRODUCE] Found non-produce item: {text_lower}")
        return True
    
    return False


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
    """Returns language-specific response for non-produce queries"""
    global _LAST_DETECTED_LANG
    
    if _LAST_DETECTED_LANG == 'mr':
        return "माफ करा, आम्ही फक्त ताज्या भाज्या आणि फळे पुरवतो हॉटेल्स आणि कॅटरर्ससाठी. आम्ही इलेक्ट्रॉनिक्स किंवा इतर गैर-कृषी उत्पादने पुरवत नाही. तुम्हाला कोणत्या भाज्या किंवा फळांची गरज आहे?"
    elif _LAST_DETECTED_LANG == 'hi':
        return "क्षमा करें, हम केवल होटलों और कैटरर्स के लिए ताजी सब्जियां और फल की आपूर्ति करते हैं। हम इलेक्ट्रॉनिक्स या अन्य गैर-कृषि उत्पाद प्रदान नहीं करते। आपको किन सब्जियों या फलों की आवश्यकता है?"
    else:
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
    
    # Detect language and set it globally FIRST
    detected_lang = detect_language(text)
    _LAST_DETECTED_LANG = detected_lang
    logger.info(f"[MENU] Detected language: {detected_lang}, set _LAST_DETECTED_LANG to: {_LAST_DETECTED_LANG}")
    
    # If user speaks in Marathi or Hindi, show main menu automatically (now with proper language set)
    if detected_lang in ['mr', 'hi']:
        logger.info(f"[MENU] Showing main menu in {detected_lang}")
        return format_menu_response("main_menu")
    
    # For English, continue with normal flow
    text_for_processing = text
    
    # Check if this matches any menu option text
    menu_action = find_menu_action_by_text(text_for_processing)
    logger.info(f"[MENU] find_menu_action_by_text returned: {menu_action}")
    if menu_action:
        if menu_action in MENU_STRUCTURE:
            return format_menu_response(menu_action)
        elif menu_action in TERMINAL_RESPONSES:
            return format_terminal_response(menu_action)
    
    # Fall back to original intent detection for free text
    intent = detect_intent(text_for_processing)
    logger.info(f"[MENU] detect_intent returned: {intent}")
    
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
        logger.info(f"[MENU] Intent '{intent}' mapped to menu '{intent_to_menu[intent]}'")
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
    
    # Map common phrases to menu actions (including more variations)
    phrase_to_action = {
        "price": "price_list",
        "pricing": "price_list", 
        "cost": "price_list",
        "rate": "price_list",
        "list": "price_list",
        "price list": "price_list",
        "get price": "price_list",
        "quote": "price_list",
        "quotation": "price_list",
        "catalog": "price_list",
        "catalogue": "price_list",
        "order": "place_order",
        "buy": "place_order",
        "purchase": "place_order",
        "place order": "place_order",
        "book": "place_order",
        "delivery": "delivery_info",
        "shipping": "delivery_info",
        "deliver": "delivery_info",
        "contact": "contact_us",
        "call": "contact_us",
        "email": "contact_us",
        "reach": "contact_us",
        "phone": "contact_us",
        "location": "location",
        "address": "location",
        "map": "location",
        "where": "location",
        "directions": "location",
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
    """Format a menu response using language-specific menu structures"""
    global _LAST_DETECTED_LANG
    
    # Select the correct menu structure based on detected language
    if _LAST_DETECTED_LANG == 'mr':
        menu_structure = MENU_STRUCTURE_MR
        terminal_responses = TERMINAL_RESPONSES_MR
        logger.info(f"[FORMAT_MENU] Using Marathi menu structure")
    elif _LAST_DETECTED_LANG == 'hi':
        menu_structure = MENU_STRUCTURE_HI
        terminal_responses = TERMINAL_RESPONSES_HI
        logger.info(f"[FORMAT_MENU] Using Hindi menu structure")
    else:
        menu_structure = MENU_STRUCTURE
        terminal_responses = TERMINAL_RESPONSES
        logger.info(f"[FORMAT_MENU] Using English menu structure")
    
    menu_data = menu_structure.get(menu_id, menu_structure["main_menu"])
    menu_message = menu_data["message"]
    
    logger.info(f"[FORMAT_MENU] menu_id={menu_id}, lang={_LAST_DETECTED_LANG}, message='{menu_message[:50]}...'")
    
    # Format options with action prefixes (NO translation needed - already in correct language!)
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
        "current_menu": menu_id,
        "detected_language": _LAST_DETECTED_LANG
    }

def format_terminal_response(action: str) -> Dict[str, Any]:
    """Format a terminal response (end of menu chain) with flowing menu"""
    global _LAST_DETECTED_LANG
    
    # Select the correct responses based on detected language
    if _LAST_DETECTED_LANG == 'mr':
        terminal_responses = TERMINAL_RESPONSES_MR
        logger.info(f"[TERMINAL] Using Marathi responses")
    elif _LAST_DETECTED_LANG == 'hi':
        terminal_responses = TERMINAL_RESPONSES_HI
        logger.info(f"[TERMINAL] Using Hindi responses")
    else:
        terminal_responses = TERMINAL_RESPONSES
        logger.info(f"[TERMINAL] Using English responses")
    
    response_text = terminal_responses.get(action, "Thank you for your inquiry!").format(
        CONTACT_PHONE=CONTACT_PHONE,
        CONTACT_EMAIL=CONTACT_EMAIL,
        OFFICE_ADDRESS=OFFICE_ADDRESS,
        OFFICE_MAP_EMBED=OFFICE_MAP_EMBED,
        MARKET_MAP_EMBED=MARKET_MAP_EMBED
    )
    
    logger.info(f"[TERMINAL] action={action}, lang={_LAST_DETECTED_LANG}, response='{response_text[:50]}...'")
    
    # Define flowing menu options based on action
    flowing_menus = {
        "vegetable_prices": ["fruit_prices", "bulk_discounts", "place_order", "main_menu"],
        "fruit_prices": ["vegetable_prices", "bulk_discounts", "place_order", "main_menu"],
        "bulk_discounts": ["vegetable_prices", "fruit_prices", "place_order", "main_menu"],
        "seasonal_specials": ["vegetable_prices", "fruit_prices", "place_order", "main_menu"],
        "office_address": ["market_location", "get_directions", "contact_us", "main_menu"],
        "market_location": ["office_address", "get_directions", "contact_us", "main_menu"],
        "get_directions": ["office_address", "market_location", "contact_us", "main_menu"],
        "contact_details": ["delivery_info", "place_order", "location", "main_menu"],
        "delivery_schedule": ["delivery_areas", "contact_us", "place_order", "main_menu"],
        "delivery_areas": ["delivery_schedule", "contact_us", "place_order", "main_menu"],
    }
    
    # Get flowing menu for this action, default to main menu
    menu_actions = flowing_menus.get(action, ["main_menu"])
    
    # Format menu options with language-specific texts
    if _LAST_DETECTED_LANG == 'mr':
        menu_texts = {
            "vegetable_prices": "भाज्यांच्या किंमती",
            "fruit_prices": "फळांच्या किंमती",
            "bulk_discounts": "मोठ्या ऑर्डरसाठी सवलत",
            "place_order": "ऑर्डर द्या",
            "office_address": "ऑफिस पत्ता",
            "market_location": "मार्केट स्थान",
            "contact_us": "आमच्याशी संपर्क साधा",
            "delivery_info": "डिलिव्हरी माहिती",
            "main_menu": "मुख्य मेनूवर परत या"
        }
    elif _LAST_DETECTED_LANG == 'hi':
        menu_texts = {
            "vegetable_prices": "सब्जियों की कीमतें",
            "fruit_prices": "फलों की कीमतें",
            "bulk_discounts": "बड़े ऑर्डर छूट",
            "place_order": "ऑर्डर दें",
            "office_address": "ऑफिस पता",
            "market_location": "मार्केट स्थान",
            "contact_us": "हमसे संपर्क करें",
            "delivery_info": "डिलीवरी जानकारी",
            "main_menu": "मुख्य मेनू पर वापस जाएं"
        }
    else:
        menu_texts = {
            "vegetable_prices": "Vegetable Prices",
            "fruit_prices": "Fruit Prices",
            "bulk_discounts": "Bulk Discounts",
            "place_order": "Place an Order",
            "office_address": "Office Address",
            "market_location": "Market Location",
            "contact_us": "Contact Us",
            "delivery_info": "Delivery Info",
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
        user_id = data.get('user_id', 'default')
        
        logger.info(f"Received message: {user_message}, User ID: {user_id}")
        
        global _LAST_DETECTED_LANG
        
        # Handle menu actions - preserve language momentum
        if user_message.startswith("menu_"):
            logger.info(f"[CHAT] Menu action detected, preserving language: {_LAST_DETECTED_LANG}")
            detected_lang = _LAST_DETECTED_LANG
            # handle_message_with_menu already translates everything
            response_data = handle_message_with_menu(user_message, current_menu)
            logger.info(f"[CHAT] Menu response already translated to {_LAST_DETECTED_LANG}")
        else:
            # Regular user message - detect language and update global state
            detected_lang = detect_language(user_message)
            _LAST_DETECTED_LANG = detected_lang
            logger.info(f"[CHAT] User message detected, language: {detected_lang}")
            
            # handle_message_with_menu already handles translation
            response_data = handle_message_with_menu(user_message, current_menu)
            
            # If no menu found, use main message handler
            if not response_data.get("menu") and response_data.get("is_terminal"):
                response_text = handle_message(user_message)
                response_data = {
                    "response": response_text,
                    "menu": None,
                    "is_terminal": True,
                    "detected_language": detected_lang
                }
        
        # Use detected language for TTS
        response_data["detected_language"] = detected_lang
        
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
            "user_id": user_id,
            "status": "success"
        })
    except Exception as e:
        logger.error(f"❌ CHAT ERROR: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500
    
    
# --------------------------------------------------------------------------------

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

    logger.info(f"Login attempt for username: {username}")

    if not username or not password:
        logger.warning("Login failed: Missing username or password")
        return jsonify({'error': 'Username and password required'}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
        user = cursor.fetchone()

        if not user:
            logger.warning(f"Login failed: User '{username}' not found")
            return jsonify({'error': 'Invalid credentials'}), 401

        logger.info(f"User found: {username}, role: {user.get('role')}")
        
        # Check if password is hashed or plain text
        stored_password = user['password_hash']
        
        # Try plain text comparison first (for existing users)
        password_valid = False
        if stored_password == password:
            password_valid = True
            logger.info("Password matched (plain text)")
        # Try bcrypt if available and password looks hashed
        elif stored_password and stored_password.startswith('$2'):
            try:
                password_valid = bcrypt.checkpw(password.encode('utf-8'), stored_password.encode('utf-8'))
                logger.info(f"Password matched (bcrypt): {password_valid}")
            except Exception as e:
                logger.error(f"Bcrypt check failed: {str(e)}")
                password_valid = False
        
        if password_valid:
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

            logger.info(f"Login successful for user: {username}")
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
            logger.warning(f"Login failed: Invalid password for user '{username}'")
            return jsonify({'error': 'Invalid credentials'}), 401

    except Exception as e:
        logger.error(f"Login error: {str(e)}")
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
    """Get all orders for the logged-in hotel with pricing status"""
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
            
            # Add pricing status for frontend badge
            order['pricing_badge'] = 'Awaiting Price Confirmation' if order['pricing_status'] == 'pending_pricing' else 'Price Confirmed'

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
    """Get all bills for the logged-in hotel with bill status"""
    if current_user['role'] != 'hotel':
        return jsonify({'error': 'Access denied'}), 403

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT b.*, o.order_date, u.hotel_name, o.pricing_status
            FROM bills b 
            JOIN orders o ON b.order_id = o.id 
            JOIN users u ON o.user_id = u.id 
            WHERE o.user_id = %s 
            ORDER BY b.bill_date DESC
        """, (current_user['id'],))

        bills = cursor.fetchall()
        
        # Add bill status badge and calculate/hide prices based on status
        for bill in bills:
            # ALWAYS recalculate from order_items for non-draft bills
            if bill['bill_status'] != 'draft':
                print(f"[{datetime.now()}] Recalculating bill {bill['id']} for order {bill['order_id']}, current DB values: total_amount={bill.get('total_amount')}, amount={bill.get('amount')}")
                
                calc_cursor = conn.cursor(dictionary=True)
                # First check what items exist
                calc_cursor.execute("""
                    SELECT product_id, quantity, price_at_order
                    FROM order_items
                    WHERE order_id = %s
                """, (bill['order_id'],))
                items = calc_cursor.fetchall()
                print(f"[{datetime.now()}] Found {len(items)} items for order {bill['order_id']}: {items}")
                
                # Now calculate total
                calc_cursor.execute("""
                    SELECT SUM(price_at_order * quantity) as calculated_total
                    FROM order_items
                    WHERE order_id = %s AND price_at_order IS NOT NULL
                """, (bill['order_id'],))
                
                result = calc_cursor.fetchone()
                calc_cursor.close()
                
                print(f"[{datetime.now()}] Calculation result: {result}")
                
                if result and result['calculated_total']:
                    calculated = float(result['calculated_total'])
                    bill['total_amount'] = calculated
                    bill['amount'] = calculated
                    print(f"[{datetime.now()}] ✅ Hotel bill {bill['id']} updated to ₹{calculated}")
                else:
                    print(f"[{datetime.now()}] ⚠️ No calculated total for bill {bill['id']}, keeping DB values")
            
            # Set status badges
            if bill['bill_status'] == 'draft':
                bill['status_badge'] = '⏳ Awaiting Price Finalization'
                bill['total_amount'] = None  # Hide price for draft
                bill['amount'] = None
                bill['is_draft'] = True
            elif bill['bill_status'] == 'finalized':
                bill['status_badge'] = '✅ Bill Ready'
                bill['is_draft'] = False
            elif bill['bill_status'] == 'sent':
                bill['status_badge'] = '📧 Bill Sent'
                bill['is_draft'] = False
            elif bill['bill_status'] == 'paid':
                bill['status_badge'] = '✔️ Paid'
                bill['is_draft'] = False
        
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
    """Hotel user places a new order - Two-stage pricing workflow"""
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
        print(f"[{datetime.now()}] Processing order for user {user_id}...")
        
        # Verify products exist and are available, get names for message
        order_items_details = []  # List to hold formatted item strings
        for item in data['items']:
            cursor.execute("""
                SELECT is_available, name, unit_type 
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
            quantity = float(item['quantity'])
            # Format item without price (since it's not finalized yet)
            item_str = f"{product['name']} : {quantity}{product['unit_type']}"
            order_items_details.append(item_str)
        print(f"[{datetime.now()}] All products verified")

        order_date = datetime.now().strftime('%d-%m-%Y')  # Format for message: DD-MM-YYYY
        # Create order with 'pending' status and 'pending_pricing' pricing_status
        print(f"[{datetime.now()}] Creating order with pending pricing...")
        cursor.execute("""
            INSERT INTO orders (user_id, order_date, delivery_date, total_amount,
                              status, pricing_status, special_instructions)
            VALUES (%s, %s, %s, %s, 'pending', 'pending_pricing', %s)
        """, (
            user_id,
            datetime.now().strftime('%Y-%m-%d'),  # DB format YYYY-MM-DD
            data['delivery_date'],
            0.0,  # Total will be calculated when prices are finalized
            data.get('special_instructions', '')
        ))
        order_id = cursor.lastrowid
        print(f"[{datetime.now()}] Order created: ID #{order_id} (pricing_status=pending_pricing)")

        # Create order items with price_at_order = NULL (will be filled when prices finalized)
        cursor = conn.cursor()  # Switch back to tuple cursor for inserts
        print(f"[{datetime.now()}] Adding {len(data['items'])} items with NULL prices...")
        for item in data['items']:
            cursor.execute("""
                INSERT INTO order_items (order_id, product_id, quantity, price_at_order)
                VALUES (%s, %s, %s, NULL)
            """, (order_id, item['product_id'], item['quantity']))
        print(f"[{datetime.now()}] Items added successfully")

        # Create bill as DRAFT with total_amount = 0
        due_date = (datetime.now() + timedelta(days=10)).strftime('%Y-%m-%d')
        bill_date = datetime.now().strftime('%Y-%m-%d')
        cursor.execute("""
            INSERT INTO bills (order_id, bill_date, total_amount, bill_status, paid, payment_method, due_date, comments)
            VALUES (%s, %s, %s, 'draft', %s, %s, %s, %s)
        """, (
            order_id,
            bill_date,
            0.0,  # Draft bill, total will be set when prices finalized
            False,
            '',
            due_date,
            'Awaiting price finalization from market'
        ))
        bill_id = cursor.lastrowid
        conn.commit()
        print(f"[{datetime.now()}] Draft Bill created: ID #{bill_id} for order #{order_id}")

        print(f"[{datetime.now()}] Order #{order_id} fully processed")

        return jsonify({
            'message': 'Order placed successfully! Final prices will be confirmed after market pricing.',
            'order_id': order_id,
            'bill_id': bill_id,
            'pricing_status': 'pending_pricing',
            'delivery_info': 'Your order will be delivered between 11 AM to 3 PM tomorrow.'
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

@app.route('/api/admin/analytics', methods=['GET'])
@token_required
@admin_required
def get_admin_analytics(current_user):
    """Comprehensive analytics for admin dashboard"""
    try:
        # Return empty/default analytics structure for now since MySQL migration is in progress
        # This prevents the endpoint from failing due to MySQL dependency
        logger.warning("Analytics endpoint called - returning default structure (MySQL removed, Firestore migration pending)")
        
        return jsonify({
            'revenue': {'yesterday': 0, 'month': 0, 'year': 0},
            'hotels': {'total_hotels': 0, 'unpaid_hotels_count': 0, 'unpaid_hotels': [], 'revenue_by_hotel': []},
            'trends': {'daily': [], 'monthly': []},
            'payments': {'status_summary': []},
            'products': {'top_products': []},
            'success': True
        })
    except Exception as e:
        logger.error(f"Get analytics error: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': f'Failed to fetch analytics: {str(e)}'}), 500

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


@app.route('/api/admin/orders/pending-pricing', methods=['GET'])
@token_required
@admin_required
def get_pending_pricing_orders(current_user):
    """Get all orders waiting for price finalization"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT o.*, u.hotel_name, u.email, u.phone
            FROM orders o 
            JOIN users u ON o.user_id = u.id 
            WHERE o.pricing_status = 'pending_pricing'
            ORDER BY o.order_date DESC
        """)

        orders = cursor.fetchall()

        # Get items for each order
        for order in orders:
            cursor.execute("""
                SELECT oi.*, p.name as product_name, p.unit_type, p.price_per_unit as current_price
                FROM order_items oi 
                JOIN products p ON oi.product_id = p.id 
                WHERE oi.order_id = %s
            """, (order['id'],))
            order['items'] = cursor.fetchall()

        return jsonify({'pending_orders': orders})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@app.route('/api/admin/orders/todays-vegetables', methods=['GET'])
@token_required
@admin_required
def get_todays_vegetables(current_user):
    """
    Get aggregated list of vegetables for today's delivery (from yesterday's orders)
    
    LOGIC:
    - Orders placed on Day X are for delivery on Day X+1
    - After 1:00 AM on Day X+1, we show orders from Day X
    - Before 1:00 AM on Day X+1, we still show orders from Day X-1
    
    Example: Monday orders → Shown Tuesday after 1 AM → Delivered Tuesday
    """
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        from datetime import datetime, time
        now = datetime.now()
        current_time = now.time()
        
        # Show yesterday's orders (for today's delivery)
        # Orders placed yesterday are for today
        if current_time >= time(1, 0):  # After 1 AM
            target_date = now.date() - timedelta(days=1)  # Yesterday's orders
        else:  # Before 1 AM (still yesterday technically)
            target_date = now.date() - timedelta(days=2)  # Day before yesterday's orders
        
        date_str = now.strftime('%d %B %Y')
        day_str = now.strftime('%A')
        
        print(f"[{datetime.now()}] Today's vegetables - Current time: {current_time.strftime('%H:%M')}")
        print(f"[{datetime.now()}] Today's vegetables - Order date (Day X): {target_date} → Delivery date (Day X+1): {now.date()}")
        
        # Get vegetables from ALL orders placed on target_date (not just pending pricing)
        cursor.execute("""
            SELECT 
                p.id as product_id,
                p.name as product_name,
                p.category,
                p.unit_type,
                SUM(oi.quantity) as total_quantity,
                COUNT(DISTINCT o.id) as order_count,
                DATE(o.order_date) as order_date
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            JOIN products p ON oi.product_id = p.id
            WHERE DATE(o.order_date) = %s
            AND o.status != 'cancelled'
            GROUP BY p.id, p.name, p.category, p.unit_type, DATE(o.order_date)
            ORDER BY p.category, p.name
        """, (target_date,))
        
        print(f"[{datetime.now()}] Found {cursor.rowcount} vegetable records from {target_date}")
        
        vegetables = cursor.fetchall()
        
        # Calculate totals by category
        category_totals = {}
        for veg in vegetables:
            cat = veg['category'] or 'Other'
            if cat not in category_totals:
                category_totals[cat] = {
                    'count': 0,
                    'total_quantity': 0
                }
            category_totals[cat]['count'] += 1
            category_totals[cat]['total_quantity'] += float(veg['total_quantity'])
        
        return jsonify({
            'date': date_str,
            'day': day_str,
            'target_date': target_date.strftime('%Y-%m-%d'),
            'vegetables': vegetables,
            'category_totals': category_totals,
            'total_items': len(vegetables),
            'total_orders': len(set([v['order_count'] for v in vegetables])) if vegetables else 0
        })
        
    except Exception as e:
        print(f"[{datetime.now()}] Error fetching today's vegetables: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@app.route('/api/admin/orders/todays-hotels-orders', methods=['GET'])
@token_required
@admin_required
def get_todays_hotels_orders(current_user):
    """
    Get today's orders grouped by hotel (from yesterday's orders)
    
    LOGIC:
    - Orders placed on Day X are for delivery on Day X+1
    - After 1:00 AM on Day X+1, we show orders from Day X
    - Before 1:00 AM on Day X+1, we still show orders from Day X-1
    
    Example: Monday orders → Shown Tuesday after 1 AM → Delivered Tuesday
    """
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        from datetime import datetime, time
        now = datetime.now()
        current_time = now.time()
        
        # Show yesterday's orders (for today's delivery)
        if current_time >= time(1, 0):  # After 1 AM
            target_date = now.date() - timedelta(days=1)  # Yesterday's orders
        else:  # Before 1 AM
            target_date = now.date() - timedelta(days=2)  # Day before yesterday's orders
        
        date_str = now.strftime('%d %B %Y')
        day_str = now.strftime('%A')
        
        print(f"[{datetime.now()}] Today's hotels orders - Current time: {current_time.strftime('%H:%M')}")
        print(f"[{datetime.now()}] Today's hotels orders - Order date (Day X): {target_date} → Delivery date (Day X+1): {now.date()}")
        
        # Get all orders from target_date with hotel details
        cursor.execute("""
            SELECT 
                o.id as order_id,
                o.order_date,
                o.delivery_date,
                o.total_amount,
                o.status,
                o.pricing_status,
                o.special_instructions,
                u.id as hotel_id,
                u.hotel_name,
                u.email,
                u.phone,
                u.address
            FROM orders o
            JOIN users u ON o.user_id = u.id
            WHERE DATE(o.order_date) = %s
            AND o.status != 'cancelled'
            ORDER BY u.hotel_name, o.id
        """, (target_date,))
        
        orders = cursor.fetchall()
        
        # Get items for each order
        for order in orders:
            cursor.execute("""
                SELECT 
                    oi.product_id,
                    oi.quantity,
                    oi.price_at_order,
                    p.name as product_name,
                    p.unit_type,
                    p.category
                FROM order_items oi
                JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id = %s
                ORDER BY p.category, p.name
            """, (order['order_id'],))
            order['items'] = cursor.fetchall()
        
        return jsonify({
            'date': date_str,
            'day': day_str,
            'target_date': target_date.strftime('%Y-%m-%d'),
            'orders': orders,
            'total_orders': len(orders)
        })
        
    except Exception as e:
        print(f"[{datetime.now()}] Error fetching today's hotels orders: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@app.route('/api/admin/orders/vegetables-history', methods=['GET'])
@token_required
@admin_required
def get_vegetables_history(current_user):
    """Get aggregated vegetables for a specific date (history view)"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # Get date parameter from query string (format: YYYY-MM-DD)
        selected_date_str = request.args.get('date')
        
        if not selected_date_str:
            return jsonify({'error': 'Date parameter required (format: YYYY-MM-DD)'}), 400
        
        # Parse the date - this is the date we want to VIEW
        selected_date = datetime.strptime(selected_date_str, '%Y-%m-%d').date()
        
        # Show vegetables from the DAY BEFORE selected date
        # Because orders placed on day X are for delivery on day X+1
        target_date = selected_date - timedelta(days=1)
        
        date_str = selected_date.strftime('%d %B %Y')
        day_str = selected_date.strftime('%A')
        
        print(f"[{datetime.now()}] ========================================")
        print(f"[{datetime.now()}] VEGETABLES HISTORY REQUEST")
        print(f"[{datetime.now()}] Selected date (viewing): {selected_date}")
        print(f"[{datetime.now()}] Target date (orders from): {target_date}")
        print(f"[{datetime.now()}] ========================================")
        
        # Get vegetables from orders placed on target_date (day before)
        cursor.execute("""
            SELECT 
                p.id as product_id,
                p.name as product_name,
                p.category,
                p.unit_type,
                SUM(oi.quantity) as total_quantity,
                COUNT(DISTINCT o.id) as order_count,
                DATE(o.order_date) as order_date
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            JOIN products p ON oi.product_id = p.id
            WHERE DATE(o.order_date) = %s
            AND o.status != 'cancelled'
            GROUP BY p.id, p.name, p.category, p.unit_type, DATE(o.order_date)
            ORDER BY p.category, p.name
        """, (target_date,))
        
        vegetables = cursor.fetchall()
        
        print(f"[{datetime.now()}] Found {len(vegetables)} unique products from {target_date}")
        print(f"[{datetime.now()}] ========================================")
        
        # Calculate totals by category
        category_totals = {}
        for veg in vegetables:
            cat = veg['category'] or 'Other'
            if cat not in category_totals:
                category_totals[cat] = {
                    'count': 0,
                    'total_quantity': 0
                }
            category_totals[cat]['count'] += 1
            category_totals[cat]['total_quantity'] += float(veg['total_quantity'])
        
        return jsonify({
            'date': date_str,
            'day': day_str,
            'selected_date': selected_date_str,
            'target_date': target_date.strftime('%Y-%m-%d'),  # ADD THIS!
            'vegetables': vegetables,
            'category_totals': category_totals,
            'total_items': len(vegetables),
            'total_orders': len(vegetables)
        })
        
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
    except Exception as e:
        print(f"[{datetime.now()}] Error fetching vegetables history: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@app.route('/api/admin/orders/todays-filling', methods=['GET'])
@token_required
@admin_required
def get_todays_filling(current_user):
    """
    Get today's orders in matrix format (products x hotels)
    
    LOGIC:
    - Orders placed on Day X are for delivery on Day X+1
    - After 1:00 AM on Day X+1, we show orders from Day X
    - Before 1:00 AM on Day X+1, we still show orders from Day X-1
    
    Example: Monday orders → Shown Tuesday after 1 AM → Delivered Tuesday
    """
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        from datetime import datetime, time
        now = datetime.now()
        current_time = now.time()
        
        # Show yesterday's orders (for today's delivery)
        if current_time >= time(1, 0):  # After 1 AM
            target_date = now.date() - timedelta(days=1)
        else:  # Before 1 AM
            target_date = now.date() - timedelta(days=2)
        
        date_str = now.strftime('%d %B %Y')
        day_str = now.strftime('%A')
        
        print(f"[{datetime.now()}] Today's filling matrix - Current time: {current_time.strftime('%H:%M')}")
        print(f"[{datetime.now()}] Today's filling matrix - Order date (Day X): {target_date} → Delivery date (Day X+1): {now.date()}")
        
        # Get all hotels with orders on target_date
        cursor.execute("""
            SELECT DISTINCT
                u.id as hotel_id,
                u.hotel_name
            FROM orders o
            JOIN users u ON o.user_id = u.id
            WHERE DATE(o.order_date) = %s
            AND o.status != 'cancelled'
            ORDER BY u.hotel_name
        """, (target_date,))
        
        hotels = cursor.fetchall()
        
        # Get all products ordered on target_date with quantities per hotel
        cursor.execute("""
            SELECT 
                p.id as product_id,
                p.name as product_name,
                p.unit_type,
                p.category,
                u.id as hotel_id,
                SUM(oi.quantity) as quantity
            FROM orders o
            JOIN users u ON o.user_id = u.id
            JOIN order_items oi ON o.id = oi.order_id
            JOIN products p ON oi.product_id = p.id
            WHERE DATE(o.order_date) = %s
            AND o.status != 'cancelled'
            GROUP BY p.id, p.name, p.unit_type, p.category, u.id
            ORDER BY p.category, p.name
        """, (target_date,))
        
        items = cursor.fetchall()
        
        # Build products list with quantities dictionary
        products_dict = {}
        for item in items:
            product_id = item['product_id']
            if product_id not in products_dict:
                products_dict[product_id] = {
                    'product_id': product_id,
                    'product_name': item['product_name'],
                    'unit_type': item['unit_type'],
                    'category': item['category'],
                    'quantities': {}
                }
            products_dict[product_id]['quantities'][item['hotel_id']] = float(item['quantity'])
        
        products = list(products_dict.values())
        
        return jsonify({
            'date': date_str,
            'day': day_str,
            'target_date': target_date.strftime('%Y-%m-%d'),
            'hotels': hotels,
            'products': products,
            'total_hotels': len(hotels),
            'total_products': len(products)
        })
        
    except Exception as e:
        print(f"[{datetime.now()}] Error fetching today's filling: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@app.route('/api/admin/orders/filling-history', methods=['GET'])
@token_required
@admin_required
def get_filling_history(current_user):
    """Get filling orders for a specific date in matrix format (history view)"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        selected_date_str = request.args.get('date')
        
        if not selected_date_str:
            return jsonify({'error': 'Date parameter required (format: YYYY-MM-DD)'}), 400
        
        selected_date = datetime.strptime(selected_date_str, '%Y-%m-%d').date()
        target_date = selected_date - timedelta(days=1)
        
        date_str = selected_date.strftime('%d %B %Y')
        day_str = selected_date.strftime('%A')
        
        print(f"[{datetime.now()}] Filling History Matrix for {selected_date} - showing orders from: {target_date}")
        
        # Get all hotels with orders on target_date
        cursor.execute("""
            SELECT DISTINCT
                u.id as hotel_id,
                u.hotel_name
            FROM orders o
            JOIN users u ON o.user_id = u.id
            WHERE DATE(o.order_date) = %s
            AND o.status != 'cancelled'
            ORDER BY u.hotel_name
        """, (target_date,))
        
        hotels = cursor.fetchall()
        
        # Get all products ordered on target_date with quantities per hotel
        cursor.execute("""
            SELECT 
                p.id as product_id,
                p.name as product_name,
                p.unit_type,
                p.category,
                u.id as hotel_id,
                SUM(oi.quantity) as quantity
            FROM orders o
            JOIN users u ON o.user_id = u.id
            JOIN order_items oi ON o.id = oi.order_id
            JOIN products p ON oi.product_id = p.id
            WHERE DATE(o.order_date) = %s
            AND o.status != 'cancelled'
            GROUP BY p.id, p.name, p.unit_type, p.category, u.id
            ORDER BY p.category, p.name
        """, (target_date,))
        
        items = cursor.fetchall()
        
        # Build products list with quantities dictionary
        products_dict = {}
        for item in items:
            product_id = item['product_id']
            if product_id not in products_dict:
                products_dict[product_id] = {
                    'product_id': product_id,
                    'product_name': item['product_name'],
                    'unit_type': item['unit_type'],
                    'category': item['category'],
                    'quantities': {}
                }
            products_dict[product_id]['quantities'][item['hotel_id']] = float(item['quantity'])
        
        products = list(products_dict.values())
        
        return jsonify({
            'date': date_str,
            'day': day_str,
            'selected_date': selected_date_str,
            'target_date': target_date.strftime('%Y-%m-%d'),
            'hotels': hotels,
            'products': products,
            'total_hotels': len(hotels),
            'total_products': len(products)
        })
        
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
    except Exception as e:
        print(f"[{datetime.now()}] Error fetching filling history: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@app.route('/api/admin/orders/hotels-orders-history', methods=['GET'])
@token_required
@admin_required
def get_hotels_orders_history(current_user):
    """Get hotels orders for a specific date (history view)"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # Get date parameter from query string (format: YYYY-MM-DD)
        selected_date_str = request.args.get('date')
        
        if not selected_date_str:
            return jsonify({'error': 'Date parameter required (format: YYYY-MM-DD)'}), 400
        
        # Parse the date - this is the date we want to VIEW
        selected_date = datetime.strptime(selected_date_str, '%Y-%m-%d').date()
        
        # Show orders from the DAY BEFORE selected date
        # Because orders placed on day X are for delivery on day X+1
        target_date = selected_date - timedelta(days=1)
        
        date_str = selected_date.strftime('%d %B %Y')
        day_str = selected_date.strftime('%A')
        
        print(f"[{datetime.now()}] Hotels Orders History for {selected_date} - showing orders from: {target_date}")
        
        # Get orders with hotel details
        cursor.execute("""
            SELECT 
                o.id as order_id,
                o.order_date,
                o.delivery_date,
                o.status,
                o.pricing_status,
                o.special_instructions,
                u.id as hotel_id,
                u.hotel_name,
                u.email,
                u.phone,
                u.address
            FROM orders o
            JOIN users u ON o.user_id = u.id
            WHERE DATE(o.order_date) = %s
            AND o.status != 'cancelled'
            ORDER BY u.hotel_name, o.id
        """, (target_date,))
        
        orders = cursor.fetchall()
        
        print(f"[{datetime.now()}] Found {len(orders)} orders from {target_date} for viewing on {selected_date}")
        
        # Fetch items for each order
        for order in orders:
            cursor.execute("""
                SELECT 
                    oi.product_id,
                    p.name as product_name,
                    oi.quantity,
                    oi.price_at_order,
                    p.unit_type,
                    p.category
                FROM order_items oi
                JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id = %s
                ORDER BY p.name
            """, (order['order_id'],))
            order['items'] = cursor.fetchall()
        
        return jsonify({
            'date': date_str,
            'day': day_str,
            'selected_date': selected_date_str,
            'target_date': target_date.strftime('%Y-%m-%d'),
            'orders': orders,
            'total_orders': len(orders)
        })
        
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
    except Exception as e:
        print(f"[{datetime.now()}] Error fetching hotels orders history: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@app.route('/api/admin/orders/<int:order_id>/finalize-prices', methods=['PUT'])
@token_required
@admin_required
def finalize_order_prices(current_user, order_id):
    """Admin finalizes prices for an order from market"""
    data = request.get_json()
    print(f"[{datetime.now()}] Finalize prices request for order {order_id}: {data}")
    
    if not data.get('items') or not isinstance(data['items'], list):
        return jsonify({'error': 'Items array with prices is required'}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # Verify order exists and is pending pricing
        cursor.execute("""
            SELECT o.*, u.hotel_name, u.email, u.phone
            FROM orders o 
            JOIN users u ON o.user_id = u.id
            WHERE o.id = %s
        """, (order_id,))
        
        order = cursor.fetchone()
        if not order:
            return jsonify({'error': 'Order not found'}), 404
        
        if order['pricing_status'] != 'pending_pricing':
            return jsonify({'error': 'Order is not pending pricing'}), 400

        # Calculate new total amount and update prices
        total_amount = 0.0
        order_items_details = []
        cursor = conn.cursor()  # Switch to non-dict cursor for updates
        
        for item in data['items']:
            product_id = item['product_id']
            new_price = float(item['price_per_unit'])
            
            # Get quantity from order_items
            cursor.execute("""
                SELECT quantity FROM order_items WHERE order_id = %s AND product_id = %s
            """, (order_id, product_id))
            
            result = cursor.fetchone()
            if not result:
                return jsonify({'error': f'Product {product_id} not found in order'}), 400
            
            quantity = float(result[0])
            item_total = new_price * quantity
            total_amount += item_total
            print(f"[{datetime.now()}] Item {product_id}: {quantity} x ₹{new_price} = ₹{item_total}")
            
            # Update price_at_order
            cursor.execute("""
                UPDATE order_items 
                SET price_at_order = %s 
                WHERE order_id = %s AND product_id = %s
            """, (new_price, order_id, product_id))
            
            # Get product name for WhatsApp message
            cursor.execute("SELECT name, unit_type FROM products WHERE id = %s", (product_id,))
            product = cursor.fetchone()
            item_str = f"{product[0]}: {quantity}{product[1]} @ ₹{new_price}/unit = ₹{item_total:.0f}"
            order_items_details.append(item_str)
        
        print(f"[{datetime.now()}] Calculated total_amount: ₹{total_amount}")
        
        # Update bill with finalized total
        now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        cursor.execute("""
            UPDATE bills 
            SET total_amount = %s, amount = %s, bill_status = 'finalized', finalized_at = %s, bill_date = %s
            WHERE order_id = %s
        """, (total_amount, total_amount, now, datetime.now().strftime('%Y-%m-%d'), order_id))
        
        print(f"[{datetime.now()}] Bill updated for order {order_id} with total_amount={total_amount}")
        
        # Update order with finalized pricing status and auto-confirm
        cursor.execute("""
            UPDATE orders 
            SET pricing_status = 'prices_finalized', price_locked_at = %s, total_amount = %s, status = 'confirmed', updated_at = %s
            WHERE id = %s
        """, (now, total_amount, now, order_id))
        
        print(f"[{datetime.now()}] Order updated with pricing_status=prices_finalized, status=confirmed, total_amount={total_amount}")
        
        conn.commit()
        print(f"[{datetime.now()}] Transaction committed successfully")
        
        return jsonify({
            'message': 'Prices finalized successfully',
            'order_id': order_id,
            'total_amount': total_amount
        }), 200
        
    except Exception as e:
        conn.rollback()
        print(f"[{datetime.now()}] Error finalizing prices: {str(e)}")
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
    
    required_fields = ['name']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Enhanced validation
        # Price is not managed, set to 0.00 by default
        try:
            price = float(data.get('price_per_unit', 0.00))
            if price < 0:
                price = 0.00
        except (ValueError, TypeError):
            price = 0.00
        
        # Stock is unlimited by default, set to 999999 if not provided
        try:
            stock = int(data.get('stock_quantity', 999999))
            if stock < 0:
                stock = 999999
        except (ValueError, TypeError):
            stock = 999999
        
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
        
        # ALWAYS recalculate totals from order_items for non-draft bills
        for bill in bills:
            if bill['bill_status'] != 'draft':
                print(f"[{datetime.now()}] Admin: Recalculating bill {bill['id']} for order {bill['order_id']}, current DB values: total_amount={bill.get('total_amount')}, amount={bill.get('amount')}")
                
                calc_cursor = conn.cursor(dictionary=True)
                # First check what items exist
                calc_cursor.execute("""
                    SELECT product_id, quantity, price_at_order
                    FROM order_items
                    WHERE order_id = %s
                """, (bill['order_id'],))
                items = calc_cursor.fetchall()
                print(f"[{datetime.now()}] Admin: Found {len(items)} items for order {bill['order_id']}: {items}")
                
                # Now calculate total
                calc_cursor.execute("""
                    SELECT SUM(price_at_order * quantity) as calculated_total
                    FROM order_items
                    WHERE order_id = %s AND price_at_order IS NOT NULL
                """, (bill['order_id'],))
                
                result = calc_cursor.fetchone()
                calc_cursor.close()
                
                print(f"[{datetime.now()}] Admin: Calculation result: {result}")
                
                if result and result['calculated_total']:
                    calculated = float(result['calculated_total'])
                    bill['total_amount'] = calculated
                    bill['amount'] = calculated
                    print(f"[{datetime.now()}] ✅ Admin bill {bill['id']} updated to ₹{calculated}")
                else:
                    print(f"[{datetime.now()}] ⚠️ Admin: No calculated total for bill {bill['id']}, keeping DB values")
        
        return jsonify(bills)
    except Exception as e:
        print(f"[{datetime.now()}] Error fetching admin bills: {str(e)}")
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
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id, username, email, phone, role, hotel_name, hotel_image as profile_image, last_login FROM users WHERE id = %s", (current_user['id'],))
        user = cursor.fetchone()
        if user:
            return jsonify(user)
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
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/admin/profile', methods=['PUT'])
@token_required
@admin_required
def update_admin_profile(current_user):
    """Update admin profile (email, phone, hotel_name, profile_image)"""
    data = request.get_json()
    logger.info(f"Profile update request for user {current_user['id']}, fields: {list(data.keys())}")
    
    allowed_fields = ['email', 'phone', 'hotel_name', 'profile_image']
    update_fields = []
    values = []
    
    for field in allowed_fields:
        if field in data:
            # Map profile_image to hotel_image in database
            db_field = 'hotel_image' if field == 'profile_image' else field
            update_fields.append(f"{db_field} = %s")
            
            # Log image size if it's a profile_image
            if field == 'profile_image' and data[field]:
                image_size = len(data[field])
                logger.info(f"Updating profile_image, size: {image_size} bytes")
                if image_size > 16777215:  # MEDIUMTEXT limit
                    return jsonify({'error': f'Image too large: {image_size} bytes. Maximum is 16MB. Please use a smaller image or paste an image URL.'}), 400
            
            values.append(data[field])
    
    if not update_fields:
        return jsonify({'error': 'No valid fields to update'}), 400

    values.append(current_user['id'])
    query = f"UPDATE users SET {', '.join(update_fields)} WHERE id = %s"
    
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # First verify user exists
        cursor.execute("SELECT id FROM users WHERE id = %s", (current_user['id'],))
        if not cursor.fetchone():
            logger.error(f"User {current_user['id']} not found in database")
            return jsonify({'error': 'User not found'}), 404
        
        # Execute update
        logger.info(f"Executing SQL: {query}")
        logger.info(f"With user_id: {current_user['id']}")
        cursor.execute(query, values)
        conn.commit()
        
        affected_rows = cursor.rowcount
        logger.info(f"Rows affected: {affected_rows}")
        
        # rowcount can be 0 if the values are the same, which is OK
        # We should return success as long as no error occurred
        logger.info(f"Profile updated successfully for user {current_user['id']}")
        return jsonify({
            'message': 'Profile updated successfully',
            'rows_affected': affected_rows
        })
        
    except Exception as e:
        conn.rollback()
        logger.error(f"Profile update error: {str(e)}")
        error_msg = str(e)
        if 'Data too long' in error_msg:
            return jsonify({'error': 'Image data too large for database. Please use a smaller image (under 2MB) or paste an image URL instead.'}), 400
        return jsonify({'error': f'Database error: {error_msg}'}), 500
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


#---------------------------------------------------------------------------------------


if __name__ == '__main__':
    print("🚀 Starting BVS Vegetable Supplier Server...")
    print("💬 Server: http://localhost:5000")
    print("🥦 Focus: Vegetables for Hotels, Canteens, Caterers")
    print("📞 Contact: 9881325644")
    print("📍 Location: Gultekdi, Market Yard, Pune")
    print("🚀 BVS Vegetable Suppliers API Starting...")
    print("📊 Features: Vegetables, Orders, Bills, Sessions, Admin Panel")
    print("🌐 Public Routes: Home, Vegetables, History")
    print("🔐 Authentication: Login, Logout, Session Management")
    print("🏨 Hotel Features: Dashboard, Cart, Order History, Bills")
    print("👑 Admin Features: Full System Control")
    
    # Print service status
    status = []
    if supabase: status.append("Supabase: ✅")
    if deepseek: status.append("DeepSeek: ✅") 
    if translator_available: status.append("Translation: ✅")
    if detector_available: status.append("Language Detection: ✅")
    if mms_tts_available: status.append("MMS-TTS: ✅")
    
    print(f"🔧 Services: {', '.join(status) if status else 'Basic fallback mode'}")
    
    app.run(host='0.0.0.0', port=5000, debug=True)