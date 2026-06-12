# Drug Authentication System

A comprehensive cross-platform mobile application for authenticating pharmaceutical drugs through barcode and QR code scanning. The system provides real-time verification of drug authenticity, batch information, and expiration status while incorporating advanced fraud detection and forensic analysis capabilities.

## Table of Contents

- [Project Overview](#project-overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Components & Roles](#components--roles)
- [Installation & Setup](#installation--setup)
- [Running the Application](#running-the-application)
- [Testing](#testing)
- [API Documentation](#api-documentation)

---

## Project Overview

The Drug Authentication System is a two-tier architecture consisting of:

- **Backend**: A Node.js/Express server that handles drug verification logic, database queries, and fraud detection
- **Frontend**: A React Native/Expo mobile application providing real-time drug scanning and verification interface

The system allows users to scan drug barcodes/QR codes or manually enter drug details (GTIN, serial number, batch number) to verify:
- Drug authenticity
- Batch validity and expiration dates
- Product information (manufacturer, ingredients, dosage)
- Suspicious patterns and potential counterfeit activity

---

## Key Features

### Backend Features
- **Multi-mode Drug Verification**: Supports barcode, QR code, and manual component-based verification
- **GS1 Data Matrix Parsing**: Automatic decomposition of GS1-encoded barcode data
- **Expiration Tracking**: Validates drug expiry dates against current date
- **Forensic Analysis**: Detects suspicious patterns including:
  - Rapid sequential scans
  - Geographic anomalies
  - Repeated code patterns
  - Inventory status changes
- **Abuse Detection**: Rate limiting and progressive throttling to prevent API abuse
- **Security Hardening**: Helmet.js headers, CORS configuration, input validation, payload sanitization
- **Comprehensive Logging**: Request tracking, error logging, and forensic event recording

### Frontend Features
- **Real-time Camera Scanning**: Live barcode/QR code detection with visual guides
- **Multi-input Modes**: 
  - Raw code scanning (single barcode/QR)
  - Batch verification (batch number only)
  - Triplet entry (GTIN + Serial + Batch)
- **Manual Verification Sheet**: Fallback modal for manual code entry
- **Torch Control**: Flashlight toggle for low-light scanning
- **Multi-language Support**: Context-based i18n with dynamic language switching
- **Theme Support**: Dark/light theme with context-based styling
- **Responsive Design**: Adaptive UI for various screen sizes and orientations
- **Telemetry Integration**: Optional usage tracking and location/status telemetry
- **Error Handling**: Visual error banners and contextual user feedback

---

## Technology Stack

### Backend
| Category | Technology |
|----------|-----------|
| **Runtime** | Node.js (CommonJS) |
| **Framework** | Express.js 5.2+ |
| **Database** | PostgreSQL with Knex.js ORM |
| **Validation** | Joi schema validation |
| **Security** | Helmet.js, CORS, Express rate-limit |
| **Environment** | dotenv |
| **Development** | Nodemon (auto-reload) |
| **Testing** | Node native test runner |

### Frontend
| Category | Technology |
|----------|-----------|
| **Framework** | React 19.2 |
| **Mobile Runtime** | React Native 0.85 + Expo 56 |
| **Routing** | Expo Router (file-based routing) |
| **Camera** | react-native-camera-kit |
| **Language** | TypeScript 6.0 |
| **Animations** | React Native Reanimated |
| **Icons** | Lucide React Native |
| **Storage** | AsyncStorage |
| **Navigation** | React Native Screens, Gesture Handler |
| **Development** | Expo CLI |

---

## Architecture

### Database Schema

The system uses 10 core database tables:

| Table | Purpose |
|-------|---------|
| `drug_manufacturers` | Manufacturer information and details |
| `drug_brands` | Brand identities linked to manufacturers |
| `drug_active_ingredients` | Active pharmaceutical ingredients catalog |
| `drug_products` | Product definitions with form/dosage/quantity |
| `drug_product_active_ingredients` | M2M linking products to ingredients |
| `drug_product_codes` | GTIN and SKU codes for product-level verification |
| `drug_batches` | Batch records with expiry dates and manufacturing info |
| `drug_items` | Individual item instances within batches |
| `drug_item_codes` | Serial codes for item-level verification |
| `drug_scan_logs` | Audit trail of all verification attempts |

### Verification Pipeline

```
User Input (Scan/Manual)
        ↓
Payload Normalization
        ↓
GS1 Parsing (if applicable)
        ↓
[Raw Code Path]              [Component Path]
     ↓                              ↓
Direct Lookup          GTIN + Serial + Batch Lookup
        ↓                              ↓
        └──────────→ Metadata Retrieval
                            ↓
                    Expiration Check
                            ↓
                    Forensic Analysis
                            ↓
                    Abuse Detection
                            ↓
                    Response Generation
                            ↓
                    Scan Log Recording
```

---

## Components & Roles

### Backend Components

#### Controllers
- **`verification.controller.js`**: HTTP request handler for `/verify` endpoint
  - Delegates business logic to VerificationService
  - Attaches request context (ID, IP, user agent)
  - Triggers abuse detection recording

#### Services

- **`verification.service.js`**: Core business logic for drug verification
  - Normalizes incoming payloads
  - Executes GS1 parsing
  - Routes to appropriate verification pipeline (raw vs. component-based)
  - Manages expiration validation
  - Orchestrates forensic and abuse detection checks
  - Generates verification responses

- **`forensicDetection.service.js`**: Fraud pattern analysis
  - Detects rapid sequential scans (within seconds)
  - Calculates geographic anomalies (Haversine distance between locations)
  - Tracks repeated code patterns across time windows
  - Monitors inventory status changes
  - Returns security flags for suspicious activity

- **`abuseDetection.service.js`**: Client-level abuse tracking
  - Maintains in-memory client state per IP/user-agent
  - Tracks failed attempts and repeated scans
  - Implements progressive throttling (exponential backoff)
  - Records verification attempt metadata for analytics

- **`health.service.js`**: System health checks
  - Database connectivity verification
  - Response time metrics

#### Repositories
- **`drugVerification.repository.js`**: Data access for drug lookups
  - `findProductCodeByValue()`: Search by GTIN/SKU
  - `findItemCodeByValue()`: Search by serial number
  - `findBatchByNumber()`: Search by batch ID
  - `getProductMetadata()`: Comprehensive product/batch details

- **`scanLog.repository.js`**: Audit trail management
  - `create()`: Record verification attempt
  - `findRecentLogsByScannedValueHash()`: Retrieve recent scans of same code
  - `countRecentLogsByMatchedProductId()`: Count recent scans per product

#### Middleware

| Middleware | Function |
|-----------|----------|
| `asyncHandler` | Wraps async controllers to catch errors |
| `errorHandler` | Global error formatting and response |
| `notFoundHandler` | 404 response for unknown routes |
| `requestContext` | Generates unique request ID |
| `requestLogger` | HTTP access logging |
| `sanitizePayload` | Input sanitization (SQL injection prevention) |
| `securityHeaders` | Custom security headers |
| `validateRequest` | Schema validation using Joi |
| `progressiveThrottling` | Rate limiting with exponential backoff |
| `rateLimiters` | Global and verification-specific rate limits |

#### Utilities

| Utility | Purpose |
|---------|---------|
| `AppError.js` | Custom error class hierarchy |
| `date.js` | Date utilities (expiry validation, formatting) |
| `gs1.js` | GS1/DataMatrix parsing and decomposition |
| `hash.js` | SHA256 hashing for forensics |
| `logger.js` | Structured JSON logging |

### Frontend Components

#### Screens
- **`app/index.tsx`**: Root screen loading UnifiedScannerScreen
- **`app/settings.tsx`**: Settings management (language, theme, telemetry)

#### Components

- **`UnifiedScannerScreen.tsx`**: Main scanning interface
  - Camera viewfinder with live barcode detection
  - Form modes: raw code, batch number, triplet (GTIN+serial+batch)
  - Torch control, loading states, error handling
  - Manual entry modal trigger
  - Integrates with verification hook

- **`ManualVerificationSheet.tsx`**: Modal form for manual entry
  - Three input modes with context-specific fields
  - Form validation and error display
  - Keyboard management and responsive sizing

- **`CameraViewfinderOverlay.tsx`**: Visual scanning guide
  - Animated scan box overlay
  - Text labels for scanning instructions

- **`CameraErrorBanner.tsx`**: Error notification UI
  - Permission errors, camera initialization failures
  - Dismissable alert display

#### Hooks

- **`useVerificationRequest.ts`**: Verification API integration
  - Makes POST request to backend `/verify` endpoint
  - Handles response parsing
  - Error state management
  - Optional telemetry attachment (location, device status)

- **`useCameraPermissions.ts`**: Camera permission management
  - Requests camera access on Android/iOS
  - Permission state tracking

- **`useAppSettings.ts`**: Settings persistence
  - AsyncStorage integration
  - Reads/writes telemetry, language, theme preferences

#### Contexts (State Management)

- **`LanguageContext.tsx`**: Internationalization
  - Current language tracking
  - Translation function (`t()`)
  - Supported languages: English, French, Arabic, Spanish

- **`ThemeContext.tsx`**: Theming system
  - Dark/light mode toggle
  - Color palette management
  - System appearance sync

- **`SettingsContext.tsx`**: Global settings
  - Telemetry enabled/disabled flag
  - Theme preference
  - Language selection

#### Utilities

- **`layout.ts`**: Responsive design utilities
  - `scale()`: Scales UI elements based on screen width
  - `verticalScale()`: Scales based on screen height
  - `responsiveFont()`: Dynamic font sizing

---

## Installation & Setup

### Prerequisites
- **Node.js**: v18+ (LTS recommended)
- **npm**: v9+ or yarn
- **Database**: PostgreSQL 12+ running and accessible
- **Mobile Testing**: Android SDK/emulator or iOS simulator (for Expo)
- **Git**: For version control

### Backend Setup

1. **Install dependencies**:
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment**:
   Create a `.env` file in the `backend` directory:
   ```env
   NODE_ENV=development
   PORT=3000
   DATABASE_URL=postgresql://user:password@localhost:5432/drug_auth_db
   
   # Security
   CORS_ORIGIN=http://localhost:8081
   
   # Rate Limiting
   GLOBAL_RATE_LIMIT_WINDOW_MS=900000
   GLOBAL_RATE_LIMIT_MAX_REQUESTS=100
   
   # Abuse Detection
   ABUSE_DETECTION_ENABLED=true
   ABUSE_MAX_TRACKED_CLIENTS=10000
   
   # Forensics
   FORENSICS_WINDOW_MS=86400000
   FORENSICS_RAPID_SCAN_WINDOW_MS=5000
   FORENSICS_GEO_SCAN_WINDOW_MS=3600000
   ```

3. **Setup database**:
   ```bash
   # Create database
   createdb drug_auth_db
   
   # Run migrations
   npm run migrate
   
   # Seed initial data
   npm run seed
   ```

### Frontend Setup

1. **Install dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Configure environment** (optional):
   Create an `.env` file in the `frontend` directory:
   ```env
   EXPO_PUBLIC_API_URL=http://localhost:3000
   EXPO_PUBLIC_ENABLE_TELEMETRY=true
   ```

3. **Install Expo CLI** (if not already installed):
   ```bash
   npm install -g expo-cli
   ```

---

## Running the Application

### Backend

**Development mode with auto-reload**:
```bash
cd backend
npm run dev
```
Server starts on `http://localhost:3000`

**Production mode**:
```bash
cd backend
npm start
```

### Frontend

**Web browser**:
```bash
cd frontend
npm run web
```
Opens on `http://localhost:19006`

**Android emulator**:
```bash
cd frontend
npm run android
```

**iOS simulator** (macOS only):
```bash
cd frontend
npm run ios
```

**Physical device (Android)**:
```bash
# Build development APK
npm run build:android:dev

# Install on connected device
npm run install:android
```

**Start with clean cache**:
```bash
npm run start:clean
```

---

## Testing

### Backend Testing

#### Unit Tests (Verification Service)

Run all tests:
```bash
cd backend
npm test
```

The test suite (`test/verification.service.test.js`) uses Node's native test runner and covers:

- **Payload normalization**: Ensures consistent input formats
- **GS1 parsing**: Tests barcode decomposition logic
- **Expiration validation**: Checks date comparison logic
- **Verification outcomes**: Tests success/failure response formats
- **Component matching**: Tests GTIN/serial/batch lookups
- **Ambiguous match handling**: Tests when multiple products match
- **Mocked repositories**: Isolates service logic from database

Example test run output:
```
✓ verifies raw code successfully
✓ handles malformed GS1 codes
✓ detects expired products
✓ returns not_found for unknown codes
✓ detects component mismatches
```

#### Manual API Testing (Bruno)

The project includes a Bruno API testing collection (`backend/test/Bruno/`):

**Available requests**:
- `Verify Drug Code.yml`: Test the `/verify` endpoint

**Running Bruno tests**:
```bash
cd backend/test/Bruno
# Open with Bruno CLI or GUI
```

**Testing via cURL**:

```bash
# Test with raw code
curl -X POST http://localhost:3000/api/verify \
  -H "Content-Type: application/json" \
  -d '{"code":"8711200670033"}'

# Test with components
curl -X POST http://localhost:3000/api/verify \
  -H "Content-Type: application/json" \
  -d '{
    "gtin":"5901234123457",
    "serial_number":"SN123456",
    "batch_number":"BATCH001"
  }'

# Test health check
curl http://localhost:3000/api/health
```

**Expected responses**:

Success:
```json
{
  "valid": true,
  "data": {
    "product_id": 1,
    "brand": "Efferalgan",
    "manufacturer": "UPSA",
    "form": "Effervescent tablet",
    "expiry_date": "2099-05-31",
    "status": "authentic"
  },
  "security_flags": []
}
```

Failure:
```json
{
  "valid": false,
  "reason": "not_found",
  "message": "Drug code not found in database",
  "suspicious": false
}
```

### Frontend Testing

#### Component Testing in App

1. **Camera Scanning**:
   - Open the app and focus on the scanner screen
   - Point camera at various barcode/QR codes
   - Verify successful scan detection and verification request
   - Test torch toggle in low-light scenarios

2. **Manual Entry**:
   - Tap "Enter Manually" button
   - Switch between form modes (Raw / Batch / GTIN+Serial+Batch)
   - Enter test values and verify submission

3. **Settings**:
   - Navigate to Settings screen
   - Test language switching (English, French, Arabic, Spanish)
   - Toggle theme between light/dark
   - Toggle telemetry on/off

4. **Error Scenarios**:
   - Test with invalid codes
   - Test with expired products
   - Observe error banners and messages
   - Verify UI recovery after errors

#### Testing Telemetry Integration

When telemetry is enabled, verify that location and status data are captured:
```javascript
// Optional telemetry payload attached
{
  client_telemetry: {
    location: { latitude, longitude },
    status: "app_running" | "app_paused"
  }
}
```

#### Testing on Physical Devices

**Android**:
```bash
# Build and install APK
cd frontend
npm run build:android:dev
npm run install:android

# View logs
adb logcat *:E
```

**iOS** (requires macOS):
```bash
cd frontend
npm run ios
```

### Testing Abuse Detection & Rate Limiting

**Progressive Throttling Test**:
```bash
# Simulate rapid repeated requests
for i in {1..50}; do
  curl -X POST http://localhost:3000/api/verify \
    -H "Content-Type: application/json" \
    -d '{"code":"8711200670033"}' &
done
wait

# Observe:
# - First requests succeed quickly
# - Subsequent requests get slower (exponential backoff)
# - Client eventually blocked with 429 Too Many Requests
```

**Forensic Detection Test**:

The forensic service flags suspicious patterns such as:
- **Rapid scans**: Same code scanned multiple times within 5 seconds
- **Geographic anomalies**: Scan locations >100km apart within an hour
- **Status changes**: Inventory status changes detected for same batch

Check scan logs for forensic flags:
```bash
# Query scan logs from database
SELECT * FROM drug_scan_logs 
WHERE security_flags IS NOT NULL 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## API Documentation

### Verification Endpoint

**POST** `/api/verify`

**Request** (raw code):
```json
{
  "code": "8711200670033",
  "scan_medium": "Bar"
}
```

**Request** (components):
```json
{
  "gtin": "5901234123457",
  "serial_number": "SN123456",
  "batch_number": "BATCH001",
  "scan_medium": "Manual"
}
```

**Response** (success):
```json
{
  "valid": true,
  "verification_level": "item",
  "data": {
    "product_id": 1,
    "brand": "Efferalgan",
    "manufacturer": "UPSA",
    "manufacturer_website": "https://www.upsa.com/",
    "form": "Effervescent tablet",
    "dosage_unit": 500,
    "active_ingredients": [
      {
        "name": "Paracetamol",
        "dosage_per_unit": "500 mg"
      }
    ],
    "batch_number": "B0250",
    "expiry_date": "2099-05-31",
    "leaflet_url": "https://example.com/leaflet"
  },
  "suspicious": false,
  "security_flags": []
}
```

**Response** (failure):
```json
{
  "valid": false,
  "reason": "not_found|expired|malformed_gs1|component_mismatch|ambiguous_match",
  "message": "Descriptive error message",
  "suspicious": false
}
```

**Status Codes**:
- `200 OK`: Request processed
- `400 Bad Request`: Invalid payload
- `429 Too Many Requests`: Rate limited or abused
- `500 Internal Server Error`: Server error

### Push Notification Endpoints

The backend supports device push token registration and a testing endpoint to simulate alerts.

1. Register a device push token

POST `/api/v1/push/register`

Request JSON:
```json
{ "token": "ExponentPushToken[xxxxxxxxxxxx]", "metadata": { "device": "android" } }
```

Response:
```json
{ "ok": true, "token": "ExponentPushToken[xxxxxxxxxxxx]" }
```

2. Simulate push to previous scanners (testing)

POST `/api/v1/push/simulate`

Request JSON:
```json
{ "scannedValue": "8711200670033" }
```

This endpoint triggers the same internal push flow used when a suspicious verification occurs: the server looks up recent scan logs for the provided scanned value, maps them to stored device push tokens (by hashed client IP), and sends Expo push messages to those tokens.

Notes on production behavior:
- When a suspicious verification is detected during the normal `/api/v1/verify` flow, the backend will call the push notification service automatically to notify previous scanners of the same code.
- To avoid notifying the scanning device that triggered the suspicious detection, include `client_push_token` in the `/verify` request; the server will exclude that token from notifications.

### Testing scripts (backend)

Two helper scripts are included in `backend/scripts`:

- `register_token.sh <EXPO_PUSH_TOKEN>` — POSTs to `/api/v1/push/register` to register a token
- `simulate_alert.sh <SCANNED_VALUE>` — POSTs to `/api/v1/push/simulate` to trigger a simulated alert

Example:
```bash
cd backend
./scripts/register_token.sh "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxxxx]"
./scripts/simulate_alert.sh "8711200670033"
```

These scripts rely on the backend running at `http://localhost:3000` and `jq` available for JSON pretty-printing.

---

## Troubleshooting

### Backend
- **Port already in use**: Change `PORT` in `.env`
- **Database connection fails**: Verify PostgreSQL is running and `DATABASE_URL` is correct
- **Migrations fail**: Run `npm run migrate:rollback` then retry migrations

### Frontend
- **Camera permissions denied**: Check device settings and app permissions
- **API unreachable**: Verify backend is running and `EXPO_PUBLIC_API_URL` is correct
- **Expo start fails**: Run `npm run reset-project` to clear cache

---

## License

ISC (see LICENSE file)
