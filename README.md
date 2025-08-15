# Strength Design - Intelligent Workout Programming Platform

## 📊 Platform Status

| Platform | Version | Status | Last Update |
|----------|---------|--------|-------------|
| **Web App** | v2.5.0 | 🟢 Production | Jan 15, 2025 |
| **Mobile App** | v1.0.0 | 🎉 Feature Complete | Jan 15, 2025 |
| **Firebase Functions** | v1.2.0 | 🟢 Production | Jan 15, 2025 |

> 📱 **Mobile App Ready for Release!** All phases complete with offline support, health integration, glassmorphism design, and native features.

## Overview

Strength Design is a cutting-edge platform that combines exercise science with intuitive software to create personalized strength training programs. Our platform helps trainers, coaches, and fitness enthusiasts deliver science-backed, data-driven workouts tailored to individual goals.

## Key Features

### 🌐 Web Application
- **AI Workout Generation**: Chat with Gemini AI to create personalized workout plans
- **Exercise Library**: 800+ exercises with detailed instructions and images
- **Nutrition Tracking**: USDA database integration for meal logging and macro tracking
- **Movement Analysis**: AI-powered video form checking and feedback
- **Program Search**: Perplexity AI integration for finding popular programs
- **Document Publishing**: Create and share professional workout programs
- **Stripe Payments**: Premium subscriptions and feature monetization

### 📱 Mobile Application (iOS & Android)
- **Glassmorphism Design**: Modern liquid glass UI with dynamic gradients and blur effects
- **Offline Support**: SQLite database with automatic background sync and conflict resolution
- **Active Workout Tracking**: Real-time timers, set/rep tracking, progress logging, and session saving
- **AI Chat Integration**: Real-time workout generation with Gemini 2.5 Flash AI
- **Exercise Search**: Intelligent search with 873+ exercises and natural language understanding
- **Push Notifications**: Smart workout reminders and motivational messages
- **Health Integration**: Apple Health (iOS) and Google Fit (Android) full sync
- **Haptic Feedback**: Rich tactile responses with customization settings
- **Gesture Navigation**: Intuitive swipe controls and pull-to-refresh throughout
- **Biometric Auth**: FaceID/TouchID for secure access with Firebase Auth

## Target Users

- **Coaches & Trainers**: Efficiently manage multiple clients and adapt workouts in real-time
- **Group Fitness & Gyms**: Scale personalized programs across all participants
- **Fitness Enthusiasts**: Access expertly crafted plans tailored to specific goals

## Pricing Plans

### Unlimited Access - $24.99/month
- Unlimited access to science-based workout templates
- Data-driven insights
- Basic progress tracking and analytics
- Perfect for individual enthusiasts

### Personalized Dashboards - $99.99/month
- Individualized member dashboards
- Automated personalized strength programs
- Real-time performance tracking
- Advanced analytics for fitness professionals

## Technology Stack

- **Frontend**: React + TypeScript + Vite
- **Mobile**: React Native + Expo SDK 50+ + TypeScript
- **Styling**: Tailwind CSS (web) + NativeWind (mobile) + Glassmorphism design system
- **UI Components**: shadcn/ui (web) + Custom glassmorphism components (mobile)
- **State Management**: TanStack Query + Zustand + Context API
- **Backend**: Firebase (Auth, Firestore, Storage, Functions) for complete serverless architecture
- **AI Integration**: Gemini 2.5 Flash + Perplexity AI + Firebase Functions
- **Authentication**: Firebase Auth with biometric support and phone auth
- **Database**: Firestore with offline SQLite sync and automatic conflict resolution
- **Navigation**: React Router DOM (web) + React Navigation v6 (mobile)
- **Search**: Intelligent exercise search with 873+ exercises and NLU

## Getting Started

### Web Application

1. Clone the repository
```bash
git clone <repository-url>
cd strength-design
```

2. Install dependencies
```bash
npm install
```

3. Configure environment
```bash
cp .env.example .env.local
# Add your Firebase and API keys
```

4. Start the development server
```bash
npm run dev
# Open http://localhost:5173
```

### Mobile Application

1. Navigate to mobile directory
```bash
cd mobile
```

2. Install dependencies
```bash
npm install
```

3. Configure environment
```bash
# Environment variables are automatically loaded from Firebase config
# Ensure Firebase project is properly configured
```

4. Start Expo development server
```bash
npx expo start
# Use Expo Go app or iOS/Android simulator
# For web testing: npx expo start --web
```

5. Start Firebase emulators (for local development)
```bash
firebase emulators:start --project demo-strength-design
```

### Firebase Functions

1. Navigate to functions directory
```bash
cd functions
```

2. Install dependencies
```bash
npm install
```

3. Start emulator for local development
```bash
npm run serve
```

## 📚 Documentation

- [Documentation Overview](./docs/README.md) - Complete documentation index
- [Claude Development Guide](./CLAUDE.md) - AI assistant instructions and standards
- [Architecture Overview](./docs/architecture/ARCHITECTURE_OVERVIEW.md) - System design and structure
- [Feature Matrix](./docs/features/FEATURE_MATRIX.md) - Complete feature comparison
- [Mobile Development](./docs/platforms/mobile/) - Mobile app documentation
- [Firebase Migration](./docs/infrastructure/FIREBASE_MIGRATION.md) - Migration from Supabase
- [Glassmorphism Implementation](./docs/design/GLASSMORPHISM_IMPLEMENTATION.md) - Design system details
- [Deployment Procedures](./docs/operations/DEPLOYMENT_PROCEDURES.md) - Production deployment guide

## 🚀 Deployment

### Web Deployment (Vercel)
```bash
npm run build
vercel deploy --prod
```

### Mobile Deployment
```bash
# iOS (TestFlight)
cd mobile
eas build --platform ios
eas submit -p ios

# Android (Play Console)
eas build --platform android
eas submit -p android
```

### Firebase Functions
```bash
firebase deploy --only functions
```

## Contributing

We welcome contributions! Please read our contributing guidelines before submitting pull requests.

## Support

For questions or support, please contact our team through the subscription form on our website.

## License

This project is proprietary software. All rights reserved.