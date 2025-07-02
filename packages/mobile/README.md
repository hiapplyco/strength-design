# Strength.Design Mobile App

React Native mobile application for iOS and Android using Expo SDK 53.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
# Add your Supabase credentials
```

3. Start development:
```bash
npm run dev
# or
npx expo start
```

## Development

- **iOS**: Press `i` in terminal or use Expo Go app
- **Android**: Press `a` in terminal or use Expo Go app
- **Web**: Press `w` in terminal (limited functionality)

## Architecture

- **Framework**: React Native with Expo
- **Navigation**: React Navigation v6
- **State Management**: TanStack Query + Zustand
- **Styling**: NativeWind (Tailwind for React Native)
- **Authentication**: Supabase Auth with Secure Store
- **Backend**: Shared Supabase instance

## Project Structure

```
src/
├── components/     # Reusable UI components
├── contexts/       # React contexts (Auth, etc.)
├── hooks/          # Custom React hooks
├── navigation/     # Navigation configuration
├── screens/        # Screen components
├── services/       # API and external services
├── store/          # Zustand stores
├── styles/         # Global styles
├── types/          # TypeScript types
└── utils/          # Utility functions
```

## Key Features

- Email/password authentication
- Social authentication (Google, Apple)
- Biometric authentication
- Workout generation
- Exercise library
- Offline support (coming soon)
- Push notifications (coming soon)

## Building for Production

```bash
# iOS
npx eas build --platform ios

# Android
npx eas build --platform android

# Both platforms
npx eas build --platform all
```

## Testing

```bash
npm run typecheck
npm run lint
npm test
```