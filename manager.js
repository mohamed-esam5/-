import { db, doc, getDoc, setDoc, deleteDoc, getDocs, collection } from './firebase.js';

// ➕ إضافة موظف جديد
export async function addEmployee() {
  const name = document.getElementById("emp-name").value.trim();
  const password = document.getElementById("emp-password").value.trim();
  const email = document.getElementById("emp-email").value.trim();
  const casual = parseInt(document.getElementById("emp-casual").value);
  const annual = parseInt(document.getElementById("emp-annual").value);

  if (!name || !password || !email || isNaN(casual) || isNaN(annual)) {
    alert("يرجى إدخال جميع البيانات بشكل صحيح");
    return;
  }

  // تحقق إذا كان المستخدم موجود بالفعل
  const existingUser = await getDoc(doc(db, "users", name));
  if (existingUser.exists()) {
    alert("هذا المستخدم موجود بالفعل");
    return;
  }

  // 1. إضافة بيانات تسجيل الدخول في users
  await setDoc(doc(db, "users", name), {
    username: name,
    password: password, // ⚠️ للتجربة فقط
    role: "employee",
    email: email
  });

  // 2. إضافة بيانات الإجازات في employees
  await setDoc(doc(db, "employees", name), {
    email,
    casual,
    annual
  });

  alert("✅ تم حفظ الموظف بنجاح");
  hideAddForm();
  loadEmployees();
}

// 📋 تحميل الموظفين
export async function loadEmployees() {
  const container = document.getElementById("employees-container");
  container.innerHTML = "";

  const snapshot = await getDocs(collection(db, "employees"));
  snapshot.forEach(docSnap => {
    const emp = docSnap.data();
    const name = docSnap.id;

    const item = document.createElement("div");
    item.classList.add("employee-item");
    item.innerHTML = `
      <p><strong>الاسم:</strong> ${name}</p>
      <p><strong>الإيميل:</strong> ${emp.email}</p>
      <p><strong>الإجازات العارضة:</strong> ${emp.casual}</p>
      <p><strong>الإجازات الاعتيادية:</strong> ${emp.annual}</p>
      <button onclick="editEmployee('${name}')">✏️ تعديل</button>
      <button onclick="deleteEmployee('${name}')">🗑️ حذف</button>
      <hr>
    `;
    container.appendChild(item);
  });
}

// ✏️ تعديل موظف
export async function editEmployee(name) {
  const ref = doc(db, "employees", name);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const data = snap.data();
  document.getElementById("edit-name").value = name;
  document.getElementById("edit-password").value = ""; // ما نعرضش الباسورد القديم
  document.getElementById("edit-email").value = data.email;
  document.getElementById("edit-casual").value = data.casual;
  document.getElementById("edit-annual").value = data.annual;

  document.getElementById("edit-employee-form").classList.remove("hidden");
}

// 💾 حفظ التعديلات
export async function saveEmployeeEdits() {
  const name = document.getElementById("edit-name").value;
  const password = document.getElementById("edit-password").value.trim();
  const email = document.getElementById("edit-email").value.trim();
  const casual = parseInt(document.getElementById("edit-casual").value);
  const annual = parseInt(document.getElementById("edit-annual").value);

  if (!email || isNaN(casual) || isNaN(annual)) {
    alert("يرجى إدخال جميع البيانات بشكل صحيح");
    return;
  }

  // تحديث users
  const userRef = doc(db, "users", name);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    const userData = userSnap.data();
    await setDoc(userRef, {
      username: name,
      password: password || userData.password, // لو ما دخلش باسورد جديد نخلي القديم
      role: "employee",
      email: email
    });
  }

  // تحديث employees
  await setDoc(doc(db, "employees", name), { email, casual, annual });

  alert("✅ تم تعديل بيانات الموظف بنجاح");
  hideEditForm();
  loadEmployees();
}

// 🗑️ حذف موظف
export async function deleteEmployee(name) {
  if (!confirm(`هل أنت متأكد أنك تريد حذف الموظف ${name}؟ سيتم حذف جميع بياناته!`)) return;

  // حذف من users
  await deleteDoc(doc(db, "users", name));

  // حذف من employees
  await deleteDoc(doc(db, "employees", name));

  // حذف طلباته من dailyRequests
  const snapshot = await getDocs(collection(db, "dailyRequests"));
  const deletions = snapshot.docs
    .filter(doc => doc.data().name === name)
    .map(doc => deleteDoc(doc.ref));
  await Promise.all(deletions);

  alert(`✅ تم حذف الموظف ${name}`);
  loadEmployees();
}

// 📋 تحميل الطلبات اليومية
export async function loadRequests() {
  const container = document.getElementById("requests-list");
  container.innerHTML = "";

  const snapshot = await getDocs(collection(db, "dailyRequests"));
  snapshot.forEach(doc => {
    const data = doc.data();
    const item = document.createElement("div");
    item.classList.add("request-item");
    item.innerHTML = `
      <p><strong>الموظف:</strong> ${data.name}</p>
      <p><strong>نوع الإذن:</strong> ${data.type}</p>
      <p><strong>السبب:</strong> ${data.reason}</p>
      <p><strong>تاريخ الإذن:</strong> ${data.leaveDate}</p>
      <p><strong>تاريخ الإنشاء:</strong> ${new Date(data.createdDate).toLocaleString("ar-EG")}</p>
      <hr>
    `;
    container.appendChild(item);
  });
}

// وظائف إضافية
export function showAddForm() {
  document.getElementById("add-employee-form").classList.remove("hidden");
}
export function hideAddForm() {
  document.getElementById("add-employee-form").classList.add("hidden");
}
export function hideEditForm() {
  document.getElementById("edit-employee-form").classList.add("hidden");
}
export function showReport(type) {
  window.location.href = type === "monthly" ? "monthly-report.html" : "yearly-report.html";
}
export function showBalances() {
  window.location.href = "balances.html";
}
export function goBack() {
  window.location.href = "index.html";
}
export function logout() {
  localStorage.clear();
  window.location.href = "index.html";
}