// ✅ Firebase core
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";

// ✅ Firestore
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

// ✅ Authentication
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";

// ✅ إعدادات مشروعك (بدون تعديل الاسم)
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

// ✅ تسجيل الدخول
async function login(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    const userDoc = await getDoc(doc(db, "users", uid));
    if (!userDoc.exists()) {
      throw new Error("لا توجد بيانات للمستخدم في Firestore");
    }

    const userData = userDoc.data();
    const roles = Array.isArray(userData.roles)
      ? userData.roles
      : userData.role
      ? [userData.role]
      : [];

    if (roles.length === 0) {
      throw new Error("⚠️ لم يتم تحديد صلاحية المستخدم");
    }

    localStorage.setItem("currentUser", JSON.stringify({
      uid,
      email: userCredential.user.email,
      username: userData.username,
      roles
    }));

    console.log("✅ تم تسجيل الدخول:", userData.username, "-", roles);
    return roles;
  } catch (error) {
    console.error("❌ خطأ في تسجيل الدخول:", error.message);
    throw error;
  }
}

// ✅ تسجيل الخروج
async function logout() {
  await signOut(auth);
  localStorage.removeItem("currentUser");
  console.log("🚪 تم تسجيل الخروج");
}

// ✅ التحقق من الصلاحيات الحالية
async function getCurrentUserRoles() {
  const user = auth.currentUser;
  if (!user) return [];

  const userDoc = await getDoc(doc(db, "users", user.uid));
  const data = userDoc.exists() ? userDoc.data() : {};
  const roles = Array.isArray(data.roles)
    ? data.roles
    : data.role
    ? [data.role]
    : [];

  return roles;
}

// ⚠️ ملاحظة: إنشاء حساب موظف جديد من المدير يفضل يتم عبر signup أو Cloud Function
async function createEmployeeAccount(email, password, name, casual, annual) {
  throw new Error("❌ إنشاء حساب موظف جديد يجب أن يتم عبر صفحة التسجيل أو Cloud Function.");
}

// ✅ التصدير
export {
  app,
  db,
  auth,
  // Firestore
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  // Auth
  login,
  logout,
  getCurrentUserRoles,
  createEmployeeAccount
};