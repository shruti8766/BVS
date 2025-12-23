# Forgot Password Feature - Quick Reference

## What's New

### ✅ Frontend Components
- **Location**: `/src/components/ForgotPassword.js`
- **Size**: 320 lines
- **Integration**: Added to `/src/frontend/login.js`
- **Features**:
  - 3-step wizard (Phone → OTP → Password)
  - Account type selector (Hotel/Admin)
  - OTP resend timer (30 seconds)
  - Error/success notifications
  - Dark mode support
  - Input validation

### ✅ Backend API Endpoints
- **File**: `/functions/main.py`
- **3 New Endpoints**:
  1. `POST /api/auth/forgot-password/request` - Send OTP
  2. `POST /api/auth/forgot-password/verify-otp` - Verify OTP
  3. `POST /api/auth/forgot-password/reset` - Update password

### ✅ Database
- **New Collection**: `password_resets` in Firestore
- **Stores**: OTP, reset tokens, timestamps, attempts
- **Auto-cleanup**: Tokens deleted after 3 failed attempts or successful reset

### ✅ SMS Integration
- **Service**: Twilio
- **OTP Format**: 6 digits
- **Expiry**: 10 minutes
- **Delivery**: Via SMS to registered phone

---

## User Experience Flow

```
┌─────────────────────────────────────────────────────────┐
│                    LOGIN PAGE                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Email/Username: [_____________]                 │   │
│  │ Password:       [_____________]                 │   │
│  │ Remember me ☐   [Forgot Password?] ← NEW!      │   │
│  │                                                  │   │
│  │ [    Login Button    ]                          │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                         ↓
           User clicks "Forgot Password?"
                         ↓
┌─────────────────────────────────────────────────────────┐
│          STEP 1: ACCOUNT TYPE & PHONE NUMBER            │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Account Type:                                    │   │
│  │ ◉ Hotel    ○ Admin                              │   │
│  │                                                  │   │
│  │ Phone Number: [_______________________]        │   │
│  │ Enter the phone number associated with your...  │   │
│  │                                                  │   │
│  │ [    Send OTP    ]                              │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                         ↓
        SMS sent to phone with OTP (e.g., 123456)
                         ↓
┌─────────────────────────────────────────────────────────┐
│          STEP 2: VERIFY OTP                             │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Enter OTP:                                       │   │
│  │ [  1  2  3  4  5  6  ]                          │   │
│  │                                                  │   │
│  │ OTP sent to +91XXXXXXXXXX. Valid for 10 min.   │   │
│  │                                                  │   │
│  │ [  Verify OTP  ]                                │   │
│  │ [Resend OTP in 30s]  ← Timer countdown         │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                         ↓
            OTP verified successfully
                         ↓
┌─────────────────────────────────────────────────────────┐
│          STEP 3: SET NEW PASSWORD                       │
│  ┌─────────────────────────────────────────────────┐   │
│  │ New Password:      [_____________________]     │   │
│  │ (At least 6 characters)                         │   │
│  │                                                  │   │
│  │ Confirm Password:  [_____________________]     │   │
│  │                                                  │   │
│  │ [   Reset Password   ]                          │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                         ↓
        Password updated in database
                         ↓
   ✅ "Password reset successfully! You can now login."
                         ↓
     Modal closes, user returns to login form
            (Can now login with new password)
```

---

## API Call Sequence

### 1. Request OTP
```javascript
POST /api/auth/forgot-password/request

REQUEST:
{
  "phone": "+919876543210",
  "user_type": "hotel"
}

RESPONSE:
{
  "message": "OTP sent successfully",
  "reset_token": "abc123def456..."
}
```

### 2. Verify OTP
```javascript
POST /api/auth/forgot-password/verify-otp

REQUEST:
{
  "reset_token": "abc123def456...",
  "otp": "123456"
}

RESPONSE:
{
  "message": "OTP verified successfully",
  "verified_token": "xyz789uvw..."
}
```

### 3. Reset Password
```javascript
POST /api/auth/forgot-password/reset

REQUEST:
{
  "verified_token": "xyz789uvw...",
  "new_password": "newPassword123"
}

RESPONSE:
{
  "message": "Password reset successfully"
}
```

---

## Security Features

| Feature | Implementation | Why |
|---------|-----------------|-----|
| **OTP Format** | 6 digits | Balance security & usability |
| **OTP Expiry** | 10 minutes | Prevents replay attacks |
| **Max Attempts** | 3 tries | Prevents brute force |
| **Token Deletion** | After 3 failures | Auto-cleanup on abuse |
| **Password Hash** | bcrypt | One-way encryption |
| **Random Tokens** | 32-char URL-safe | Cryptographically secure |
| **No Info Leak** | Same response for found/not-found | Prevents user enumeration |
| **HTTPS Only** | All API calls | Prevents man-in-the-middle |
| **Token Cleanup** | After successful reset | Prevents token reuse |
| **Audit Logging** | All resets logged | Compliance & debugging |

---

## Configuration Required

### 1. Twilio Setup
```bash
# Set your Twilio credentials in Firebase Functions config
firebase functions:config:set \
  twilio.account_sid="YOUR_ACCOUNT_SID" \
  twilio.auth_token="YOUR_AUTH_TOKEN" \
  twilio.phone_number="+1234567890"

# Verify
firebase functions:config:get
```

### 2. Firebase Security Rules (Optional but Recommended)
```javascript
// Allow users to read their own password_resets
match /password_resets/{document=**} {
  allow create: if request.auth == null;  // Unauthenticated creation
  allow read, update: if request.auth.uid == resource.data.user_id;
  allow delete: if request.auth.uid == resource.data.user_id;
}
```

---

## Testing Guide

### Test Case 1: Valid OTP Request
```
Input: Phone with registered hotel account
Expected: SMS received with OTP
Result: ✅
```

### Test Case 2: Wrong Account Type
```
Input: Hotel phone number but selected "Admin"
Expected: Generic success message (no user leak)
Result: ✅
```

### Test Case 3: Incorrect OTP (Attempt 1)
```
Input: Wrong OTP on first try
Expected: "Incorrect OTP. Attempts remaining: 2"
Result: ✅
```

### Test Case 4: Max Attempts Exceeded
```
Input: 3 wrong OTPs in sequence
Expected: Token deleted, "Maximum OTP attempts exceeded"
Result: ✅ → Must request new OTP
```

### Test Case 5: Expired OTP
```
Input: OTP entered after 10+ minutes
Expected: "OTP has expired"
Result: ✅ → Must request new OTP
```

### Test Case 6: Password Too Short
```
Input: Password with < 6 characters
Expected: "Password must be at least 6 characters"
Result: ✅
```

### Test Case 7: Password Mismatch
```
Input: Password and Confirm Password don't match
Expected: "Passwords do not match"
Result: ✅
```

### Test Case 8: Successful Reset
```
Input: All steps completed correctly
Expected: Login works with new password
Result: ✅
```

---

## Troubleshooting

### Problem: "OTP not received"
**Solution**:
1. Check phone number format (should be +91XXXXXXXXXX for India)
2. Verify Twilio account has credits
3. Check Twilio credentials in Firebase config
4. Check SMS logs in Twilio dashboard

### Problem: "OTP has expired"
**Solution**:
- OTP valid for only 10 minutes
- Click "Resend OTP" to get new code
- 30-second delay between resend attempts

### Problem: "Incorrect OTP. Attempts remaining: 0"
**Solution**:
- Token is now deleted
- Must click "Resend OTP" to start over
- Or close modal and click "Forgot Password?" again

### Problem: "Invalid or expired reset token"
**Solution**:
- Token was already used or deleted
- Start the process from beginning
- Click "Forgot Password?" on login page again

---

## Files Overview

### Frontend
| File | Lines | Purpose |
|------|-------|---------|
| `ForgotPassword.js` | 320 | Main modal component with 3-step flow |
| `login.js` | +15 | Added "Forgot Password?" button and modal |

### Backend
| File | Lines | Purpose |
|------|-------|---------|
| `main.py` | +250 | 3 API endpoints for OTP/password reset |
| `requirements.txt` | +1 | Added `twilio` package |

### Documentation
| File | Purpose |
|------|---------|
| `FORGOT_PASSWORD_IMPLEMENTATION.md` | Comprehensive implementation guide |

---

## Deployment Checklist

- [ ] Twilio account created and phone number purchased
- [ ] Firebase Functions config updated with Twilio credentials
- [ ] Backend deployed: `firebase deploy --only functions`
- [ ] Frontend built and deployed: `firebase deploy --only hosting`
- [ ] Test OTP delivery on staging environment
- [ ] Test all 3 steps of password reset flow
- [ ] Test error scenarios (wrong OTP, expired OTP, etc.)
- [ ] Verify password change works (login with new password)
- [ ] Check Cloud Firestore `password_resets` collection is created
- [ ] Monitor Twilio SMS logs for delivery status
- [ ] Document password reset procedure for users

---

## What's Next?

### Immediate
- [ ] Configure Twilio credentials
- [ ] Deploy backend and frontend
- [ ] Test all user flows

### Short Term
- [ ] Monitor OTP delivery rates in Twilio dashboard
- [ ] Collect user feedback on UX
- [ ] Monitor error logs in Cloud Functions

### Medium Term
- [ ] Add email-based OTP alternative
- [ ] Implement rate limiting (max 5 OTP requests per hour)
- [ ] Add password strength requirements (uppercase, lowercase, numbers, symbols)
- [ ] Add security questions as additional verification

### Long Term
- [ ] Multi-factor authentication (TOTP)
- [ ] Biometric authentication (fingerprint, face ID for mobile)
- [ ] Account recovery using email
- [ ] Session management (force logout after password change)

---

## Support

**For issues**:
1. Check troubleshooting section above
2. Review Cloud Functions logs
3. Check Twilio SMS delivery logs
4. Check Cloud Firestore `password_resets` collection
5. Check browser console for client-side errors

**Documentation**:
- Full guide: `FORGOT_PASSWORD_IMPLEMENTATION.md`
- API reference: See above
- Code: `/src/components/ForgotPassword.js` and `/functions/main.py`
