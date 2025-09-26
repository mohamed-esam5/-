import { db, doc, getDoc, setDoc, collection, getDocs } from "./firebase.js";

// إظهار نموذج تسجيل دخول المدير
function showManagerLogin() {
  document.getElementById("manager-login").classList.remove("hidden");
  document.getElementById("employee-login").classList.add("hidden");
}

// إظهار نموذج تسجيل دخول الموظف
function showEmployeeLogin() {
  document.getElementById("employee-login").classList.remove("hidden");
  document.getElementById("manager-login").classList.add("hidden");
}

// تسجيل دخول المدير
function loginManager() {
  const password = document.getElementById("manager-password").value;
  if (password === "0510") {
    localStorage.setItem("role", "manager");
    window.location.href = "manager.html";
  } else {
    alert("رقم سري غير صحيح");
  }
}

// تسجيل دخول الموظف
async function loginEmployee() {
  const name = document.getElementById("employee-name").value;
  const password = document.getElementById("employee-password").value;

  if (!name || !password) {
    alert("يرجى إدخال الاسم والرقم السري");
    return;
  }

  const employeeRef = doc(db, "employees", name);
  const employeeSnap = await getDoc(employeeRef);

  if (employeeSnap.exists()) {
    const data = employeeSnap.data();
    if (data.password === password) {
      localStorage.setItem("role", "employee");
      localStorage.setItem("employeeName", name);
      window.location.href = "employee.html";
    } else {
      alert("الرقم السري غير صحيح");
    }
  } else {
    alert("الموظف غير موجود");
  }
}

// إظهار نموذج إضافة موظف
function showAddForm() {
  document.getElementById("add-employee-form").classList.toggle("hidden");
}

// التنقل إلى التقارير
function showReport(type) {
  if (type === "monthly") {
    window.location.href = "monthly-report.html";
  } else {
    window.location.href = "yearly-report.html";
  }
}

// عرض الأرصدة
function showBalances() {
  window.location.href = "balance.html";
}

// الرجوع للصفحة الرئيسية
function goBack() {
  window.location.href = "index.html";
}

// تسجيل الخروج
function logout() {
  localStorage.clear();
  window.location.href = "index.html";
}

// إضافة موظف جديد
async function addEmployee() {
  const name = document.getElementById("emp-name").value.trim();
  const password = document.getElementById("emp-password").value.trim();
  const email = document.getElementById("emp-email").value.trim();
  const casual = parseInt(document.getElementById("emp-casual").value);
  const annual = parseInt(document.getElementById("emp-annual").value);

  if (!name || !password || !email || isNaN(casual) || isNaN(annual)) {
    alert("يرجى إدخال جميع البيانات بشكل صحيح");
    return;
  }

  if (!email.includes("@")) {
    alert("يرجى إدخال بريد إلكتروني صحيح");
    return;
  }

  const existing = await getDoc(doc(db, "employees", name));
  if (existing.exists()) {
    alert("هذا الموظف موجود بالفعل");
    return;
  }

  await setDoc(doc(db, "employees", name), {
    password,
    email,
    casual,
    annual
  });

  alert("تم إضافة الموظف بنجاح");

  // تنظيف النموذج
  document.getElementById("emp-name").value = "";
  document.getElementById("emp-password").value = "";
  document.getElementById("emp-email").value = "";
  document.getElementById("emp-casual").value = "";
  document.getElementById("emp-annual").value = "";

  // إخفاء النموذج
  document.getElementById("add-employee-form").classList.add("hidden");
}
async function populateEmployeeNames() {
  const select = document.getElementById("employee-name");
  const snapshot = await getDocs(collection(db, "employees"));

  snapshot.forEach(doc => {
    const option = document.createElement("option");
    option.value = doc.id;
    option.textContent = doc.id;
    select.appendChild(option);
  });
}

// شغّل الوظيفة عند تحميل الصفحة
populateEmployeeNames();

// ✅ ربط الوظائف بالـ window علشان تشتغل في HTML
window.showManagerLogin = showManagerLogin;
window.showEmployeeLogin = showEmployeeLogin;
window.loginManager = loginManager;
window.loginEmployee = loginEmployee;
window.showAddForm = showAddForm;
window.showReport = showReport;
window.showBalances = showBalances;
window.goBack = goBack;
window.logout = logout;
window.addEmployee = addEmployee;