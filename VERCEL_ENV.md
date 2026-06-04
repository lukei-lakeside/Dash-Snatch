# Vercel Environment Variables

Add these in Vercel under Project Settings -> Environment Variables:

```env
VITE_FIREBASE_API_KEY=AIzaSyD8rvykoAv_sJjt1H_bngBTgODgSK-sr3g
VITE_FIREBASE_AUTH_DOMAIN=dashsnatch-2236b.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=dashsnatch-2236b
VITE_FIREBASE_STORAGE_BUCKET=dashsnatch-2236b.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=832718130284
VITE_FIREBASE_APP_ID=1:832718130284:web:179e27abcd3ad6d03fdc49
VITE_FIREBASE_MEASUREMENT_ID=G-JJPRBD07MX
```

The app reads them through Vite's `import.meta.env`.
