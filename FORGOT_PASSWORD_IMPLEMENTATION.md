# Forgot Password Feature - Implementation Guide

## Overview
The forgot password feature enables users (both admin and hotel accounts) to reset their password using OTP (One-Time Password) sent to their registered phone number via SMS.

## Architecture

### Frontend Components

#### 1. **ForgotPassword Modal** (`/src/components/ForgotPassword.js`)
- **Purpose**: Reusable modal component for password reset flow
- **Location**: `/src/components/ForgotPassword.js`
- **Size**: ~320 lines
- **Props**: 
  - `isOpen` (boolean) - Controls modal visibility
  - `onClose` (function) - Callback to close modal

**Features**:
- 3-step flow (Phone → OTP → New Password)
- Account type selection (Hotel/Admin)
- Phone number validation
- 6-digit OTP input
- Password confirmation
- Error/success messages
- OTP resend timer (30 seconds)
- Dark mode support

**State Management**:
```javascript
const [step, setStep] = useState(1);          // 1: phone, 2: otp, 3: password
const [userType, setUserType] = useState('hotel'); // hotel or admin
const [phone, setPhone] = useState('');
const [otp, setOtp] = useState('');
const [newPassword, setNewPassword] = useState('');
const [confirmPassword, setConfirmPassword] = useState('');
const [resetToken, setResetToken] = useState('');
const [verifiedToken, setVerifiedToken] = useState('');
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');
const [success, setSuccess] = useState('');
const [otpResendTimer, setOtpResendTimer] = useState(0);
```

#### 2. **Login Page Integration** (`/src/frontend/login.js`)
- **Added**: "Forgot Password?" link in login form
- **Location**: Below password field, next to "Remember me" checkbox
- **Functionality**: Opens ForgotPassword modal on click
- **User Type Selection**: Modal allows user to select between Hotel/Admin accounts

### Backend API Endpoints

All endpoints are in `/functions/main.py`

#### 1. **Request Password Reset**
- **Endpoint**: `POST /api/auth/forgot-password/request`
- **Purpose**: Send OTP to user's phone

**Request Body**:
```json
{
  "phone": "+91XXXXXXXXXX",
  "user_type": "hotel" | "admin"
}
```

**Response Success (200)**:
```json
{
  "message": "OTP sent successfully",
  "reset_token": "secure_token_here"
}
```

**Process**:
1. Validate phone format
2. Lookup user by phone and user_type
3. Generate 6-digit OTP using `random.randint(100000, 999999)`
4. Send OTP via Twilio SMS
5. Store in Firestore `password_resets` collection:
   - Token: secure random string
   - User ID, phone, OTP
   - Created timestamp
   - Expiry: 10 minutes from now
   - Attempts: 0
   - Verified: false

**Security**:
- Same response for found/not-found users (no information leakage)
- OTP expires after 10 minutes
- Token generated with `secrets.token_urlsafe(32)`

#### 2. **Verify OTP**
- **Endpoint**: `POST /api/auth/forgot-password/verify-otp`
- **Purpose**: Validate OTP and get verified token

**Request Body**:
```json
{
  "reset_token": "secure_token_here",
  "otp": "123456"
}
```

**Response Success (200)**:
```json
{
  "message": "OTP verified successfully",
  "verified_token": "verified_token_here"
}
```

**Process**:
1. Lookup token in `password_resets` collection
2. Check if expired (creation + 10 min > now) → return error
3. Check if OTP matches
4. Check attempts < 3 (max 3 attempts) → increment if wrong
5. If wrong OTP and attempts = 3 → delete token, return error
6. If correct → mark `verified = true`, return `verified_token`

**Errors**:
- `"OTP has expired"` - If creation + 10 minutes has passed
- `"Incorrect OTP. Attempts remaining: {3-attempts}"` - For wrong OTP
- `"Maximum OTP attempts exceeded"` - After 3 failures

#### 3. **Reset Password**
- **Endpoint**: `POST /api/auth/forgot-password/reset`
- **Purpose**: Update password with verified token

**Request Body**:
```json
{
  "verified_token": "verified_token_here",
  "new_password": "newpassword123"
}
```

**Response Success (200)**:
```json
{
  "message": "Password reset successfully"
}
```

**Process**:
1. Lookup verified token in `password_resets` collection
2. Check `verified = true`
3. Validate password length (min 6 characters)
4. Hash password with bcrypt
5. Update user document in `users` collection
6. Delete reset token from `password_resets`
7. Log password reset for audit trail

**Errors**:
- `"Invalid or expired reset token"` - Token not found or not verified
- `"Password must be at least 6 characters"` - Password too short

### Database Structure

#### Firestore Collection: `password_resets`

```
/password_resets/{reset_token}
{
  user_id: string,           // Firebase UID
  phone: string,             // E.164 format: +91XXXXXXXXXX
  user_type: string,         // "hotel" or "admin"
  otp: string,               // 6-digit code
  created_at: timestamp,     // When OTP was generated
  expires_at: timestamp,     // created_at + 10 minutes
  verified: boolean,         // true after successful OTP verification
  verified_at: timestamp,    // When OTP was verified (optional)
  attempts: integer          // Number of failed OTP attempts (0-3)
}
```

**Indexes Recommended**:
- `(user_id, created_at)` - For cleanup queries
- `(phone, user_type, created_at)` - For lookups

## User Flow

### Step 1: Request OTP
1. User clicks "Forgot Password?" on login page
2. Modal opens - "Step 1 of 3"
3. User selects account type (Hotel/Admin)
4. User enters phone number
5. Click "Send OTP"
6. → API sends OTP via SMS to phone
7. → Success message: "OTP sent to your phone number"
8. → Advance to Step 2

### Step 2: Verify OTP
1. User receives SMS with 6-digit OTP
2. User enters OTP (auto-formatted with spaces)
3. Click "Verify OTP"
4. → API validates OTP
5. → Success message: "OTP verified! Now set your new password."
6. → Advance to Step 3

**Resend OTP**:
- Button appears after 30-second countdown
- Disabled until countdown finishes
- Takes user back to Step 1 to enter phone again

**Error Handling**:
- "Incorrect OTP. Attempts remaining: 2" (shows remaining attempts)
- After 3 failures: Token deleted, must request new OTP

### Step 3: Set New Password
1. User enters new password (min 6 characters)
2. User confirms password
3. Click "Reset Password"
4. → API updates password in database
5. → Success message: "Password reset successfully! You can now login."
6. → Auto-close after 2 seconds
7. → User back at login form

**Validation**:
- Password length: minimum 6 characters
- Password confirmation: must match
- Empty fields: required

## Integration Points

### Login Page Changes
**File**: `/src/frontend/login.js`

**Changes**:
1. Import ForgotPassword component:
   ```javascript
   import ForgotPassword from '../components/ForgotPassword';
   ```

2. Add state for modal:
   ```javascript
   const [showForgotPassword, setShowForgotPassword] = useState(false);
   ```

3. Add button in form (after password field):
   ```jsx
   <button
     type="button"
     onClick={() => setShowForgotPassword(true)}
     className="text-sm text-green-600 hover:text-green-700 font-medium"
   >
     Forgot Password?
   </button>
   ```

4. Add modal in JSX:
   ```jsx
   <ForgotPassword 
     isOpen={showForgotPassword}
     onClose={() => setShowForgotPassword(false)}
   />
   ```

## Configuration

### Environment Variables
Set these in Firebase Functions config (or `.env` for local testing):

```bash
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890  # Your Twilio phone number
```

**Setup**:
```bash
firebase functions:config:set twilio.account_sid="YOUR_SID"
firebase functions:config:set twilio.auth_token="YOUR_TOKEN"
firebase functions:config:set twilio.phone_number="YOUR_PHONE"
```

**Verify Config**:
```bash
firebase functions:config:get
```

### OTP Configuration
Currently hardcoded in `/functions/main.py`:
- **OTP Length**: 6 digits
- **OTP Expiry**: 10 minutes
- **Max Attempts**: 3 failures before token deletion
- **Resend Timer**: 30 seconds (frontend only)

To change, edit:
```python
OTP_EXPIRY_MINUTES = 10
MAX_OTP_ATTEMPTS = 3
```

## Testing Checklist

### Request OTP Endpoint
- [ ] Valid phone number → OTP sent successfully
- [ ] Invalid phone format → Validation error
- [ ] Phone not in database → Generic "success" response (no info leak)
- [ ] Valid admin phone → OTP sent to admin user
- [ ] Valid hotel phone → OTP sent to hotel user

### Verify OTP Endpoint
- [ ] Correct OTP → Returns verified_token
- [ ] Wrong OTP (1st time) → "Incorrect OTP. Attempts remaining: 2"
- [ ] Wrong OTP (2nd time) → "Incorrect OTP. Attempts remaining: 1"
- [ ] Wrong OTP (3rd time) → Token deleted, "Maximum OTP attempts exceeded"
- [ ] Expired OTP (after 10 min) → "OTP has expired"
- [ ] Invalid token → Error response

### Reset Password Endpoint
- [ ] Valid verified_token + password → Password updated
- [ ] Password < 6 chars → Validation error
- [ ] Unverified token → Error
- [ ] Already used token → Error (should be deleted)

### Frontend UI
- [ ] Modal opens on "Forgot Password?" click
- [ ] Account type selector (Hotel/Admin) visible
- [ ] Phone input accepts numbers and + symbol
- [ ] OTP input only accepts digits
- [ ] OTP auto-formatted as user types
- [ ] Password confirmation validated
- [ ] Error messages display correctly
- [ ] Success messages display and close after 2 seconds
- [ ] Resend timer counts down from 30s

## Deployment

### Deploy Backend
```bash
cd functions
firebase deploy --only functions
```

### Deploy Frontend
```bash
npm run build
firebase deploy --only hosting
```

### Verify Deployment
1. Go to `/login` page
2. Click "Forgot Password?"
3. Select account type
4. Enter phone number (test with a valid user)
5. Should receive SMS with OTP
6. Enter OTP
7. Set new password
8. Should be able to login with new password

## Security Considerations

### What's Protected
✅ OTP is 6 digits (1 million combinations)
✅ OTP expires after 10 minutes
✅ Maximum 3 OTP attempts before token deletion
✅ Reset tokens are 32-character URL-safe random strings
✅ Passwords hashed with bcrypt before storage
✅ No user existence information leaked (same response for found/not-found)
✅ Uses HTTPS for all API calls
✅ JWT tokens not involved in password reset (avoids token hijacking)

### What to Avoid
❌ Don't expose OTP in logs (frontend logs are safe)
❌ Don't store plaintext passwords
❌ Don't reuse reset tokens after successful reset
❌ Don't allow concurrent password resets

### Audit Trail
Password resets are logged in Cloud Firestore:
```
/audit_logs/{timestamp}
{
  action: "password_reset",
  user_id: "...",
  phone: "...",
  user_type: "hotel|admin",
  timestamp: timestamp,
  success: true
}
```

## Troubleshooting

### OTP Not Received
1. Check phone number format: Should start with +91 for India
2. Check Twilio credentials in Firebase config
3. Check Twilio account has sufficient balance
4. Check if phone number is in Firestore `users` collection

### "OTP has expired" Error
- OTP valid for 10 minutes only
- User must request new OTP
- Resend button available after 30 seconds on frontend

### Token-Related Errors
- Verified token only valid for reset endpoint
- Each endpoint expects different token format:
  - Step 1: Returns `reset_token`
  - Step 2: Consumes `reset_token`, returns `verified_token`
  - Step 3: Consumes `verified_token`

### Can't Reset Password After Verification
- Reset token is deleted after successful reset
- Can't reuse same token
- User must request new OTP if password reset fails

## Future Enhancements

1. **Email OTP**: Add email-based OTP as alternative
2. **Security Questions**: Add optional security questions
3. **SMS Rate Limiting**: Limit OTP requests per phone (5 per hour)
4. **Password Requirements**: Enforce strong passwords (uppercase, lowercase, numbers, symbols)
5. **Multi-factor Authentication**: Add TOTP authenticator option
6. **OTP via Call**: Offer OTP delivery via voice call
7. **Biometric Login**: For mobile app (fingerprint/face ID)
8. **Session Management**: Force logout of all sessions after password change

## Files Modified

1. **Created**:
   - `/src/components/ForgotPassword.js` (320 lines)

2. **Modified**:
   - `/src/frontend/login.js` (Added ForgotPassword import and modal, "Forgot Password?" button)
   - `/functions/main.py` (Added 3 forgot password endpoints, ~250 lines)
   - `/functions/requirements.txt` (Added twilio package)

## References

- **Twilio SMS**: https://www.twilio.com/docs/sms
- **Firebase Security Rules**: https://firebase.google.com/docs/firestore/security/start
- **bcrypt**: https://github.com/pyca/bcrypt
- **JWT**: https://jwt.io/
