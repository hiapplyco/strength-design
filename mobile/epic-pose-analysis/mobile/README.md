# Strength.Design Mobile App

## 🎯 Overview
Production-ready mobile fitness app with AI-powered workout generation, comprehensive exercise library, and nutrition tracking.

## ✨ Features
- **AI Workout Generation** - Real Gemini 2.5 Flash integration for personalized workouts
- **Unified Search** - Natural language search for exercises and nutrition
- **Exercise Library** - 873+ exercises with detailed instructions
- **Nutrition Database** - USDA integration with comprehensive food data
- **Health Integration** - Apple Health (iOS) and Google Fit (Android)
- **Offline Support** - Local database with background sync
- **Firebase Backend** - Real-time sync, authentication, and cloud functions

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Java (for Firebase emulators)
- Expo CLI (`npm install -g expo-cli`)

### Installation
```bash
# Clone the repository
cd strength-design/mobile

# Install dependencies
npm install

# Start development
npm run web  # Web version at localhost:8081
```

### Firebase Emulators
```bash
# In a separate terminal
firebase emulators:start --project demo-strength-design

# Emulator UI available at: http://localhost:4001
```

## 📱 Development

### Available Scripts
- `npm run web` - Start web development server
- `npm run ios` - Start iOS simulator
- `npm run android` - Start Android emulator
- `npm run test` - Run tests
- `npm run lint` - Run linter

### Project Structure
```
/mobile/
├── App.js                      # Main app entry
├── screens/                    # All screens
│   ├── UnifiedSearchScreen.js  # Unified search with NLU
│   ├── ContextAwareGeneratorScreen.js # AI chat
│   └── ...
├── services/                   # Business logic
│   ├── searchService.js        # Exercise search
│   ├── NutritionService.js     # Nutrition API
│   └── ...
├── components/                 # Reusable UI components
├── functions/                  # Firebase Cloud Functions
│   └── index.js               # Gemini AI endpoints
├── assets/                     # Images, data files
└── docs/                       # Documentation
```

## 🔥 Firebase Configuration

### Services Used
- **Authentication** - Email/password, biometric
- **Firestore** - User data, workouts, exercises
- **Cloud Functions** - AI chat, workout generation
- **Storage** - Images and media files

### Environment Variables
Create `.env` file:
```env
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
```

## 🤖 AI Integration

### Gemini 2.5 Flash
The app uses Google's latest Gemini 2.5 Flash model for:
- Workout generation
- Exercise recommendations
- Nutrition advice
- Form corrections

### Natural Language Understanding
The unified search understands queries like:
- "chest exercises for building muscle"
- "high protein breakfast ideas"
- "30-minute HIIT workout"
- "calories in chicken breast"

## 📊 Key Features

### 1. Unified Search
- Natural language processing
- Combined exercise + nutrition results
- Smart filtering and suggestions
- Context-aware recommendations

### 2. AI Workout Generator
- Real-time streaming responses
- Personalized based on user profile
- Structured workout plans
- Exercise substitutions

### 3. Exercise Library
- 873+ exercises
- Detailed instructions
- Equipment requirements
- Muscle group targeting

### 4. Nutrition Tracking
- USDA database integration
- Barcode scanning (coming soon)
- Meal planning
- Macro tracking

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- --testNamePattern="SearchService"

# Run with coverage
npm test -- --coverage
```

## 📦 Building for Production

### Web Build
```bash
expo build:web
```

### iOS Build
```bash
expo build:ios
```

### Android Build
```bash
expo build:android
```

## 🔒 Security
- All API keys stored in environment variables
- Firebase security rules enforced
- Authentication required for user data
- Rate limiting on API calls

## 📝 Documentation
Additional documentation available in `/docs/`:
- `DESIGN_SYSTEM_2025.md` - UI/UX guidelines
- `NUTRITION_SERVICE_USAGE.md` - Nutrition API guide
- `IMPLEMENTATION_SUMMARY.md` - Technical details

## 🤝 Contributing
1. Create feature branch
2. Make changes
3. Run tests
4. Submit pull request

## 📄 License
Private - All rights reserved

## 🆘 Support
For issues or questions, create an issue in the repository.

---

**Last Updated**: January 14, 2025
**Version**: 1.0.0
**Status**: Active Development