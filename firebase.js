// // Import the functions you need from the SDKs you need
// import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
// // TODO: Add SDKs for Firebase products that you want to use
// // https://firebase.google.com/docs/web/setup#available-libraries

// // Your web app's Firebase configuration
// // For Firebase JS SDK v7.20.0 and later, measurementId is optional
// const firebaseConfig = {
//   apiKey: "AIzaSyAEgtELHL1Odu-Yffqu4fuet5fdT1pnQLM",
//   authDomain: "shree-rmd.firebaseapp.com",
//   projectId: "shree-rmd",
//   storageBucket: "shree-rmd.firebasestorage.app",
//   messagingSenderId: "311232718745",
//   appId: "1:311232718745:web:01dcc6ce8c57a5426d1508",
//   measurementId: "G-QQD9200XB1"
// };

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";  // ← ADD THIS IMPORT
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAEgtELHL1Odu-Yffqu4fuet5fdT1pnQLM",
  authDomain: "shree-rmd.firebaseapp.com",
  projectId: "shree-rmd",
  storageBucket: "shree-rmd.firebasestorage.app",
  messagingSenderId: "311232718745",
  appId: "1:311232718745:web:01dcc6ce8c57a5426d1508",
  measurementId: "G-QQD9200XB1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);  // ← ADD THIS
export default app;