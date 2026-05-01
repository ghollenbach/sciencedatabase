# Science Department Inventory System

A comprehensive inventory management system for science departments, featuring secure Google authentication and real-time inventory tracking.

## Features

- **Secure Authentication**: Google sign-in with support for multiple identity providers
- **Real-time Inventory**: Track Current, Want, Ordered items with live updates
- **Collaborative**: Multiple users can manage inventory simultaneously  
- **Smart Reports**: Export detailed CSV reports for budget planning
- **Activity Logging**: Complete audit trail of all inventory actions
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- pnpm package manager
- Firebase project with Firestore and Authentication enabled

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd sciencedatabase
```

2. Install dependencies:
```bash
pnpm install
```

3. Configure Firebase:
   - Copy `.env.example` to `.env` (if it exists) or use the provided `.env` file
   - Update Firebase configuration values with your project settings
   - See [Firebase Setup](#firebase-setup) section for detailed instructions

4. Start the development server:
```bash
pnpm run dev
```

5. Open [http://localhost:5173](http://localhost:5173) in your browser

## Firebase Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project or use an existing one
3. Enable Firestore Database in test mode
4. Enable Authentication and configure Google as a sign-in provider

### 2. Configure Authentication

1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Enable **Google** as a sign-in provider
3. Add your domain to **Authorized domains** (e.g., `localhost`, `your-domain.com`)

### 3. Get Configuration Values

1. In Firebase Console, go to **Project Settings** → **General**
2. Scroll down to "Your apps" section
3. Click the web app icon `</>` to create a web app or view existing config
4. Copy the configuration values to your `.env` file

### 4. Update Environment Variables

Update `.env` file with your Firebase project configuration:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 5. Firestore Security Rules

Ensure your Firestore rules allow authenticated users to read/write:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Adding Additional Identity Providers

The system is designed to easily support multiple authentication providers:

### 1. Update Configuration

Edit `config/auth.js` to enable additional providers:

```javascript
// Example: Enable Facebook authentication
facebook: {
  id: 'facebook',
  name: 'Facebook',
  type: 'oauth',
  enabled: true, // Change to true
  scopes: ['email', 'public_profile'],
  // ... rest of configuration
}
```

### 2. Install Provider Dependencies

```bash
# Example for Facebook
pnpm add firebase/auth
```

### 3. Update AuthContext

Add provider logic in `src/contexts/AuthContext.jsx`:

```javascript
case 'facebook':
  provider = new FacebookAuthProvider()
  // Add configuration...
  break
```

### 4. Enable in Firebase Console

1. Go to Authentication → Sign-in method
2. Enable the desired provider (Facebook, GitHub, etc.)
3. Configure OAuth credentials as required

## Available Scripts

- `pnpm run dev` - Start development server
- `pnpm run build` - Build for production
- `pnpm run preview` - Preview production build
- `pnpm run lint` - Run ESLint

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── auth/           # Authentication components
│   └── profile/        # User profile components
├── contexts/           # React contexts
├── pages/              # Page components
├── firebase.js         # Firebase configuration
└── App.jsx            # Main app with routing

config/
└── auth.js            # Identity provider configuration
```

## Usage

### Authentication Flow

1. **Landing Page**: Unauthenticated users see a landing page with Google sign-in
2. **Login**: Click "Continue with Google" to authenticate
3. **Dashboard**: Authenticated users are redirected to the inventory dashboard
4. **Profile**: User avatar and name displayed in header with logout option

### Inventory Management

1. **Tabs**: Switch between Current, Want, Ordered, and Receipts
2. **Add Items**: Click "+ Add Item" to create new inventory entries
3. **Search & Filter**: Use search bar and dropdown filters to find items
4. **Actions**: Request more, mark as ordered, confirm pickup, delete items
5. **Export**: Generate CSV reports for budget planning and audits

### Activity Tracking

- All actions are logged in the Receipts tab
- Complete audit trail with timestamps and user information
- Restock requests automatically link to original items

## Deployment

### Environment Variables

For production deployment, ensure all environment variables are properly set:

- Update Firebase configuration for production environment
- Set `NODE_ENV=production`
- Configure your hosting provider with environment variables

### Build and Deploy

```bash
# Build for production
pnpm run build

# Deploy to your hosting provider
# (Netlify, Vercel, Firebase Hosting, etc.)
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and test thoroughly
4. Commit your changes: `git commit -am 'Add feature'`
5. Push to the branch: `git push origin feature-name`
6. Submit a pull request

## Security Considerations

- Environment variables are used for all Firebase configuration
- Authentication is required for all inventory operations
- Firestore security rules should be configured properly for production
- Never commit sensitive API keys to version control

## Troubleshooting

### Common Issues

**Authentication not working:**
- Verify Google provider is enabled in Firebase Console
- Check that your domain is in authorized domains
- Ensure environment variables are correctly set

**Firestore permission denied:**
- Verify Firestore security rules allow authenticated users
- Check that user is properly authenticated before Firestore operations

**Build errors:**
- Clear node_modules and reinstall: `rm -rf node_modules && pnpm install`
- Check that all environment variables are properly prefixed with `VITE_`

**Development server issues:**
- Check that port 5173 is not in use by another process
- Restart the development server: `pnpm run dev`

For additional support, check the Firebase documentation or create an issue in this repository.
