import * as admin from "firebase-admin";

// Initialize Firebase Admin
admin.initializeApp();

// Export functions from different modules
export * from "./stripe";
export * from "./ai";
export * from "./utils";
export * from "./payments";