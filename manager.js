import { db } from "./firebase.js";
import { doc, updateDoc, deleteDoc, getDocs, collection } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

// ✏️ تعديل بيانات موظف
export async function editEmployee(uid, newData) {
  try {
    await updateDoc(doc(db, "employees", uid), newData);
    alert("✅ تم تعديل بيانات الموظف بنجاح");
  } catch (error) {
    alert("❌ خطأ أثناء تعديل الموظف: " + error.message);
  }
}

// 💾 حفظ التعديلات
export async function saveEmployeeEdits(uid, newData) {
  try {
    await updateDoc(doc(db, "employees", uid), newData);
    alert("✅ تم حفظ التعديلات");
  } catch (error) {
    alert("❌ خطأ أثناء الحفظ: " + error.message);
  }
}

// 🗑️ حذف موظف
export async function deleteEmployee(uid) {
  if (!confirm("⚠️ هل أنت متأكد من حذف هذا الموظف؟")) return;
  try {
    await deleteDoc(doc(db, "employees", uid));
    alert("✅ تم حذف الموظف");
  } catch (error) {
    alert("❌ خطأ أثناء الحذف: " + error.message);
  }
}

// 📊 عرض التقارير
export function showReport(type) {
  if (type === "monthly") {
    alert("📅 عرض التقرير الشهري (هنا تضع الكود الخاص بالتقرير)");
  } else if (type === "yearly") {
    alert("📆 عرض التقرير السنوي (هنا تضع الكود الخاص بالتقرير)");
  }
}

// 🔙 رجوع
export function goBack() {
  window.history.back();
}

// 🚪 تسجيل خروج
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
export function logout() {
  const auth = getAuth();
  signOut(auth).then(() => {
    window.location.href = "index.html";
  }).catch((error) => {
    alert("❌ خطأ أثناء تسجيل الخروج: " + error.message);
  });
}