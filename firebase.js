// Firebase core
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";

// Firestore
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

// Authentication
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";

// Analytics (اختياري)
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-analytics.js";

// ✅ إعدادات مشروعك
const firebaseConfig = {
  apiKey: "AIzaSyBl646iQqwZL3PxzUrAQu7VdYjtYMueE8w",
  authDomain: "empolyee-leaves-app.firebaseapp.com",
  projectId: "empolyee-leaves-app",
  storageBucket: "empolyee-leaves-app.firebasestorage.app",
  messagingSenderId: "405523937016",
  appId: "1:405523937016:web:45b7c0d5bfff85a398ed0d",
  measurementId: "G-8JVYKVZMQW"
};

// ✅ تهيئة Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const analytics = getAnalytics(app); // احذف لو مش محتاجه

// ✅ متابعة حالة المستخدم
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("مستخدم مسجل دخول:", user.uid);
  } else {
    console.log("مفيش مستخدم مسجل دخول");
  }
});

// ✅ تسجيل الدخول (مثال)
async function login(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("تم تسجيل الدخول:", userCredential.user.uid);
  } catch (error) {
    console.error("خطأ في تسجيل الدخول:", error.message);
  }
}

// ✅ تسجيل الخروج
async function logout() {
  await signOut(auth);
  console.log("تم تسجيل الخروج");
}

// ✅ التصدير
export {
  db,
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  auth,
  login,
  logout
};