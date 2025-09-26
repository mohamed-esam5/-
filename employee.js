import { db, doc, getDoc, setDoc, collection, addDoc, getDocs } from "./firebase.js";

// ✅ قراءة بيانات المستخدم من localStorage
const currentUser = JSON.parse(localStorage.getItem("currentUser"));
const role = currentUser?.role;
const employeeName = currentUser?.username;

// ✅ التحقق من الصلاحية
if (!currentUser || role !== "employee") {
  alert("❌ غير مسموح بالدخول إلا للموظفين");
  window.location.href = "index.html";
}

// ✅ عرض اسم الموظف
document.getElementById("employee-name-display").textContent = employeeName;

// تحميل بيانات الموظف
async function loadEmployeeData() {
  const employeeRef = doc(db, "employees", employeeName);
  const employeeSnap = await getDoc(employeeRef);

  if (employeeSnap.exists()) {
    const data = employeeSnap.data();
    document.getElementById("casual-leave").textContent = data.casual;
    document.getElementById("annual-leave").textContent = data.annual;
  } else {
    alert("تعذر تحميل بيانات الموظف");
  }
}

// إرسال طلب إذن
async function submitRequest() {
  const reason = document.getElementById("request-reason").value.trim();
  const type = document.getElementById("leave-type").value;
  const leaveDate = document.getElementById("leave-date").value;
  const createdDate = new Date().toISOString();

  if (!reason || !type || !leaveDate) {
    alert("يرجى إدخال السبب واختيار نوع الإذن وتحديد التاريخ");
    return;
  }

  const leaveValues = {
    "casual": { field: "casual", amount: 1 },
    "annual": { field: "annual", amount: 1 },
    "hour": { field: "annual", amount: 0.125 },
    "half-day": { field: "annual", amount: 0.5 },
    "quarter-morning": { field: "annual", amount: 0.25, maxPerMonth: 4 },
    "quarter-evening": { field: "annual", amount: 0.25 },
    "half-hour": { field: "annual", amount: 0.25, requiresAccumulation: true, maxPerMonth: 4 }
  };

  const config = leaveValues[type];
  if (!config) {
    alert("نوع الإذن غير صالح");
    return;
  }

  const ref = doc(db, "employees", employeeName);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    alert("الموظف غير موجود");
    return;
  }

  const data = snap.data();
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  const snapshot = await getDocs(collection(db, "dailyRequests"));
  const sameTypeCount = snapshot.docs.filter(docSnap => {
    const d = docSnap.data();
    const dDate = new Date(d.createdDate);
    return (
      d.name === employeeName &&
      d.type === type &&
      dDate.getMonth() === month &&
      dDate.getFullYear() === year
    );
  }).length;

  if (config.maxPerMonth && sameTypeCount >= config.maxPerMonth) {
    alert("تم الوصول للحد الأقصى لهذا النوع من الإذن هذا الشهر");
    return;
  }

  // خصم الرصيد
  if (config.requiresAccumulation) {
    if (sameTypeCount === 3) {
      if (data[config.field] >= config.amount) {
        await setDoc(ref, { ...data, [config.field]: data[config.field] - config.amount });
      } else {
        alert("لا يوجد رصيد كافي لخصم ربع يوم");
        return;
      }
    }
  } else {
    if (data[config.field] >= config.amount) {
      await setDoc(ref, { ...data, [config.field]: data[config.field] - config.amount });
    } else {
      alert("لا يوجد رصيد كافي لهذا النوع من الإذن");
      return;
    }
  }

  // تسجيل الطلب
  await addDoc(collection(db, "dailyRequests"), {
    name: employeeName,
    reason,
    type,
    leaveDate,
    createdDate
  });

  alert("✅ تم إرسال الطلب بنجاح");

  // إعادة تعيين النموذج
  document.getElementById("request-reason").value = "";
  document.getElementById("leave-type").value = "";
  document.getElementById("leave-date").value = "";

  loadMyRequests();
  loadCounters();
}

// ✅ عرض الطلبات اليومية فقط
async function loadMyRequests() {
  const container = document.getElementById("requests-list");
  container.innerHTML = "";

  const snapshot = await getDocs(collection(db, "dailyRequests"));
  let found = false;

  const today = new Date().toISOString().split("T")[0]; // yyyy-mm-dd

  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    if (data.name === employeeName && data.leaveDate === today) {
      found = true;
      const item = document.createElement("div");
      item.classList.add("request-item");
      item.innerHTML = `
        <p><strong>نوع الإذن:</strong> ${data.type}</p>
        <p><strong>السبب:</strong> ${data.reason}</p>
        <p><strong>تاريخ القيام بالإذن:</strong> ${data.leaveDate}</p>
        <p><strong>تاريخ الإعداد:</strong> ${new Date(data.createdDate).toLocaleString("ar-EG")}</p>
        <hr>
      `;
      container.appendChild(item);
    }
  });

  if (!found) {
    container.innerHTML = "<p>لا توجد طلبات لليوم.</p>";
  }
}

// ✅ تحميل العدادات الشهرية
async function loadCounters() {
  const snapshot = await getDocs(collection(db, "dailyRequests"));
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  let quarterDay = 0;
  let halfHour = 0;

  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    const dDate = new Date(data.createdDate);
    if (data.name === employeeName && dDate.getMonth() === month && dDate.getFullYear() === year) {
      if (data.type === "quarter-morning") {
        quarterDay++;
      } else if (data.type === "half-hour") {
        halfHour++;
      }
    }
  });

  updateCounter("quarterDayCount", quarterDay, "quarterDayBox", "quarterDayRemaining");
  updateCounter("halfHourCount", halfHour, "halfHourBox", "halfHourRemaining");
}

// ✅ تحديث العدادات
function updateCounter(countId, count, boxId, remainingId) {
  const el = document.getElementById(countId);
  const box = document.getElementById(boxId);
  el.textContent = count;

  box.classList.remove("green", "yellow", "red");
  if (count <= 1) {
    box.classList.add("green");
  } else if (count <= 3) {
    box.classList.add("yellow");
  } else {
    box.classList.add("red");
  }

  const remaining = 4 - count;
  document.getElementById(remainingId).textContent = `متبقي: ${remaining >= 0 ? remaining : 0}`;
}

// تسجيل الخروج
function logout() {
  localStorage.clear();
  window.location.href = "index.html";
}

// تحميل البيانات عند فتح الصفحة
loadEmployeeData();
loadMyRequests();
loadCounters();

// ربط الوظائف بالـ window
window.submitRequest = submitRequest;
window.logout = logout;