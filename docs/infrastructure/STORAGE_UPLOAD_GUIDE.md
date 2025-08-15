# Uploading Images to Firebase Storage

## Testimonial Images

To upload the testimonial images to Firebase Storage:

### Method 1: Firebase Console (Recommended)
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `strength-design`
3. Navigate to Storage in the left sidebar
4. Create a folder called `testimonials`
5. Upload your images with these exact names:
   - `bodybuilding.png` - for Hart's testimonial
   - `swimming.png` - for Christine's testimonial
   - `yogi.png` - for Georgia's testimonial
   - `crossfit.png` - for Chad's testimonial

### Method 2: Firebase CLI
```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Upload files
firebase storage:upload bodybuilding.png --project=strength-design --path=/testimonials/bodybuilding.png
firebase storage:upload swimming.png --project=strength-design --path=/testimonials/swimming.png
firebase storage:upload yogi.png --project=strength-design --path=/testimonials/yogi.png
firebase storage:upload crossfit.png --project=strength-design --path=/testimonials/crossfit.png
```

### Method 3: Programmatically (from your app)
```typescript
import { storage } from '@/lib/firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

async function uploadTestimonialImage(file: File, name: string) {
  const storageRef = ref(storage, `testimonials/${name}.png`);
  const snapshot = await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);
  return downloadURL;
}
```

## Expected URLs

Once uploaded, the images will be available at:
- `https://firebasestorage.googleapis.com/v0/b/strength-design.firebasestorage.app/o/testimonials%2Fbodybuilding.png?alt=media`
- `https://firebasestorage.googleapis.com/v0/b/strength-design.firebasestorage.app/o/testimonials%2Fswimming.png?alt=media`
- `https://firebasestorage.googleapis.com/v0/b/strength-design.firebasestorage.app/o/testimonials%2Fyogi.png?alt=media`
- `https://firebasestorage.googleapis.com/v0/b/strength-design.firebasestorage.app/o/testimonials%2Fcrossfit.png?alt=media`

## Updating the Code

Once images are uploaded, update `/src/components/landing/TestimonialsCarousel.tsx` to use the Firebase Storage URLs instead of the temporary Unsplash URLs.

## Storage Rules

Make sure your Firebase Storage rules allow public read access for testimonial images:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow public read access to testimonials
    match /testimonials/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Other rules...
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```