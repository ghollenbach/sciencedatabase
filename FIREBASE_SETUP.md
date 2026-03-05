# Firebase Setup Guide

## Inventory Item Status Flow

The application uses three status values in Firestore:
- **Current**: Items currently in inventory
- **Want**: Items the department wants to add
- **Ordered**: Items that have been requested/ordered

## Firestore Collection Structure

### Collection: `inventoryItems`

Each document represents an inventory item with the following fields:

```javascript
{
  itemName: string,           // Name of the item
  itemCount: number,          // Quantity
  category: string,           // Glassware, Chemicals, Equipment, Consumables, Other
  cost: number,               // Price in dollars
  status: string,             // Current, Want, Ordered
  
  // Tracking who did what
  requestedBy: string,        // Name of person who requested the item
  orderedBy: string,          // Name of person who ordered the item
  pickupConfirmedBy: string,  // Name of person who confirmed pickup
  
  // Timestamps
  requestDate: timestamp,     // When item was requested
  orderDate: timestamp,       // When item was ordered
  pickupDate: timestamp,      // When item was picked up
  createdAt: timestamp,       // When item was created in system
  
  notes: string               // Optional notes about the item
}
```

## Firestore Rules

Deploy the rules in `firestore.rules` to your Firebase Console:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `science-inventory-1bea5`
3. Go to **Firestore Database** → **Rules**
4. Copy the rules from `firestore.rules`
5. Click **Publish**

For production, update rules to authenticate users:

```
match /inventoryItems/{document=**} {
  allow read, write: if request.auth != null;
}
```

## Status Workflow

1. **Add to Want** → Item appears in "Want" tab
2. **Move to Ordered** (in Want tab) → Item moves to "Ordered" tab
3. **Confirm Pickup** (in Ordered tab) → Item returns to "Current" tab

## Environment Variables

Optional: Set Firebase config via `.env.local` file:

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=science-inventory-1bea5
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

The app will fall back to hardcoded values in `src/firebase.js` if env vars are not set.
