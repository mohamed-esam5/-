import {
  db,
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  getDocs,
  auth
} from "./firebase.js";

import { query, where } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

// ✅ تحميل بيانات الموظف
async function loadEmployeeData(uid) {
  const employeeRef = doc(db, "employees", uid);
  const employeeSnap = await getDoc(employeeRef);

  if (employeeSnap.exists()) {
    const data = employeeSnap.data();
    document.getElementById("casual-leave").textContent = data.casual;
    document.getElementById("annual-leave").textContent = data.annual;
  } else {
    alert("تعذر تحميل بيانات الموظف");
  }
}

// ✅ إرسال طلب إذن
async function submitRequest() {
  const user = auth.currentUser;
  const uid = user.uid;

  const userDoc = await getDoc(doc(db, "users", uid));
  const employeeName = userDoc.data().username;

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

  const ref = doc(db, "employees", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    alert("الموظف غير موجود");
    return;
  }

  const data = snap.data();

  // جلب الطلبات الخاصة بالموظف فقط
  const q = query(collection(db, "dailyRequests"), where("uid", "==", uid));
  const snapshot = await getDocs(q);

  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  const sameTypeCount = snapshot.docs.filter(docSnap => {
    const d = docSnap.data();
    const dDate = new Date(d.createdDate);
    return (
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
    uid,
    name: employeeName,
    reason,
    type,
    leaveDate,
    createdDate
  });

  alert("✅ تم إرسال الطلب بنجاح");

  document.getElementById("request-reason").value = "";
  document.getElementById("leave-type").value = "";
  document.getElementById("leave-date").value = "";

  await loadMyRequests(uid);
  await loadCounters(uid);
}

// ✅ عرض الطلبات اليومية فقط
async function loadMyRequests(uid) {
  const container = document.getElementById("requests-list");
  container.innerHTML = "";

  const today = new Date().toISOString().split("T")[0];
  const q = query(collection(db, "dailyRequests"), where("uid", "==", uid));
  const snapshot = await getDocs(q);

  let found = false;
  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    if (data.leaveDate === today) {
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
async function loadCounters(uid) {
  const q = query(collection(db, "dailyRequests"), where("uid", "==", uid));
  const snapshot = await getDocs(q);

  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  let quarterDay = 0;
  let halfHour = 0;

  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    const dDate = new Date(data.createdDate);
    if (dDate.getMonth() === month && dDate.getFullYear() === year) {
      if (data.type === "quarter-morning") quarterDay++;
      else if (data.type === "half-hour") halfHour++;
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
  if (count <= 1) box.classList.add("green");
  else if (count <= 3) box.classList.add("yellow");
  else box.classList.add("red");

  const remaining = 4 - count;
  document.getElementById(remainingId).textContent = `متبقي: ${remaining >= 0 ? remaining : 0}`;
}


// ✅ عرض سجل الإجازات في جدول مع فلاتر وطباعة
async function showLeaveHistory() {
  const user = auth.currentUser;
  if (!user) {
    alert("❌ لم يتم العثور على مستخدم مسجل دخول");
    return;
  }

  const uid = user.uid;
  const tableBody = document.getElementById("leave-table-body");
  if (!tableBody) {
    console.error("⚠️ عنصر leave-table-body مش موجود في الصفحة");
    return;
  }

  // تفريغ الجدول مؤقتًا
  tableBody.innerHTML = "<tr><td colspan='4'>جاري التحميل...</td></tr>";

  // جلب الطلبات الخاصة بالمستخدم
  const q = query(collection(db, "dailyRequests"), where("uid", "==", uid));
  const snapshot = await getDocs(q);

  const allRequests = snapshot.docs.map(docSnap => docSnap.data());

  // دالة لإعادة رسم الجدول حسب الفلاتر
  function renderTable() {
    const typeFilter = document.getElementById("filter-type").value;
    const monthFilter = document.getElementById("filter-month").value;

    tableBody.innerHTML = "";

    const filtered = allRequests
      .filter(r => (!typeFilter || r.type === typeFilter) &&
                   (!monthFilter || new Date(r.leaveDate).getMonth() == monthFilter))
      .sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));

    if (filtered.length === 0) {
      tableBody.innerHTML = "<tr><td colspan='4'>لا توجد بيانات</td></tr>";
      return;
    }

    filtered.forEach(r => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${r.type}</td>
        <td>${r.reason}</td>
        <td>${r.leaveDate}</td>
        <td>${new Date(r.createdDate).toLocaleString("ar-EG")}</td>
      `;
      tableBody.appendChild(tr);
    });
  }

  // ربط الفلاتر وأزرار الطباعة
  document.getElementById("filter-type").addEventListener("change", renderTable);
  document.getElementById("filter-month").addEventListener("change", renderTable);
  document.getElementById("print-table").addEventListener("click", () => window.print());

  // أول رسم للجدول
  renderTable();

  // إظهار القسم
  document.getElementById("leave-history").classList.remove("hidden");
}

// ✅ تصدير الوظائف
export {
  loadEmployeeData,
  loadMyRequests,
  loadCounters,
  submitRequest,
  showLeaveHistory
};
