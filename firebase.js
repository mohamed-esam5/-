import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  getDocs,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyBl646iQqwZL3PxzUrAQu7VdYjtYMueE8w",
  authDomain: "empolyee-leaves-app.firebaseapp.com",
  projectId: "empolyee-leaves-app",
  storageBucket: "empolyee-leaves-app.firebasestorage.app",
  messagingSenderId: "405523937016",
  appId: "1:405523937016:web:45b7c0d5bfff85a398ed0d",
  measurementId: "G-8JVYKVZMQW"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const analytics = getAnalytics(app); // احذف لو مش محتاجه
window.db = db;
// ✅ التصدير الصحيح
export { db, doc, getDoc, setDoc, collection, addDoc, getDocs, deleteDoc };
