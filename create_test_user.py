#!/usr/bin/env python3
"""Create a test user in Firestore for testing the API"""

import firebase_admin
from firebase_admin import credentials, firestore
import bcrypt
import json
import os

# Initialize Firebase
try:
    # Try to use service account key
    cred = credentials.Certificate('serviceAccountKey.json')
    firebase_admin.initialize_app(cred)
    print("Firebase initialized with serviceAccountKey.json")
except Exception as e:
    print(f"Error initializing Firebase: {e}")
    exit(1)

# Get Firestore client
db = firestore.client()

# Test user data
test_user = {
    'username': 'testhotel',
    'password_hash': bcrypt.hashpw('Test@1234'.encode('utf-8'), bcrypt.gensalt(10)).decode('utf-8'),
    'hotel_name': 'Test Hotel',
    'email': 'test@hotel.com',
    'phone': '9876543210',
    'address': 'Test Address, Pune',
    'role': 'admin',
    'is_active': True,
    'created_at': firestore.SERVER_TIMESTAMP,
    'updated_at': firestore.SERVER_TIMESTAMP
}

# Create user in Firestore
try:
    # Use a specific ID for test user
    user_ref = db.collection('users').document('test_user_001')
    user_ref.set(test_user)
    print(f"Test user created successfully!")
    print(f"User ID: test_user_001")
    print(f"Username: testhotel")
    print(f"Password: Test@1234")
except Exception as e:
    print(f"Error creating test user: {e}")
    exit(1)

# Verify user was created
try:
    user_doc = db.collection('users').document('test_user_001').get()
    if user_doc.exists:
        print(f"\nVerification: User document exists in Firestore")
        user_data = user_doc.to_dict()
        print(f"Username: {user_data.get('username')}")
        print(f"Role: {user_data.get('role')}")
        print(f"Hotel Name: {user_data.get('hotel_name')}")
    else:
        print(f"ERROR: User document not found after creation!")
except Exception as e:
    print(f"Error verifying user: {e}")
    exit(1)

print("\nTest user ready for API testing!")
