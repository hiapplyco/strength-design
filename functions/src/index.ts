import * as admin from "firebase-admin";

// Initialize Firebase Admin only if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

// Export functions from different modules
export * from "./stripe";
export * from "./ai";
export * from "./utils";
export * from "./payments";
export * from "./exercises";
export { searchPrograms } from "./programs/searchPrograms";
// export * from "./notifications"; // Temporarily disabled