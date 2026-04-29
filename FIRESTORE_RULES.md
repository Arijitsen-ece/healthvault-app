# Firestore Security Rules

Paste this into Firebase Console → Firestore → Rules tab.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // USERS: owner-only read/write of full doc.
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }

    // PUBLIC EMERGENCY MIRROR — readable by anyone, writable only by owner.
    match /publicEmergency/{uid} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == uid;
    }

    // RECORDS — owner-only list/create/update/delete.
    // Single-doc public reads are allowed so token-based shares can resolve
    // the underlying record after a /shares lookup.
    match /records/{recordId} {
      allow get: if true;
      allow list: if request.auth != null
                  && resource.data.ownerId == request.auth.uid;
      allow create: if request.auth != null
                    && request.resource.data.ownerId == request.auth.uid;
      allow update, delete: if request.auth != null
                            && resource.data.ownerId == request.auth.uid;
    }

    // SHARES — token-based public share links.
    // - Anyone can `list` shares (only used to look up by token).
    // - Owner can create/delete their own shares.
    match /shares/{shareId} {
      allow get, list: if true;
      allow create: if request.auth != null
                    && request.resource.data.ownerId == request.auth.uid;
      allow update, delete: if request.auth != null
                            && resource.data.ownerId == request.auth.uid;
    }
  }
}
```

## Required setup in Firebase Console

1. **Authentication → Sign-in method**: enable **Email/Password** and **Google**.
2. **Authentication → Settings → Authorized domains**: add your Lovable preview domain (`*.lovable.app`) and any custom domain.
3. **Firestore → Create database** in production mode, then paste the rules above.
4. **Cloudinary**: confirm `healthvault_upload` preset is set to **Unsigned**.
