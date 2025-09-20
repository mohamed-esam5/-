import { db, doc, getDoc, setDoc, collection, addDoc, getDocs } from "./firebase.js";

// التحقق من صلاحية الدخول
const role = localStorage.getItem("role");
const employeeName = localStorage.getItem("employeeName");

if (role !== "employee" || !employeeName) {
  window.location.href = "index.html";
}

// عرض اسم الموظف
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
    alert("يرجى إدخال السبب واختيار نوع الإذن وتحديد تاريخ القيام بالإذن");
    return;
  }

  const leaveValues = {
    "casual": { field: "casual", amount: 1 },
    "annual": { field: "annual", amount: 1 },
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
  const month = new Date().getMonth();

  const snapshot = await getDocs(collection(db, "dailyRequests"));
  const sameTypeCount = snapshot.docs.filter(doc => {
    const d = doc.data();
    return d.name === employeeName && d.type === type && new Date(d.createdDate).getMonth() === month;
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

  console.log("✅ تم تسجيل الإذن:", {
    name: employeeName,
    reason,
    type,
    leaveDate,
    createdDate
  });

  alert("تم إرسال الطلب بنجاح");

  // إعادة تعيين النموذج
  document.getElementById("request-reason").value = "";
  document.getElementById("leave-type").value = "";
  document.getElementById("leave-date").value = "";

  loadMyRequests();
}

// عرض الطلبات السابقة
async function loadMyRequests() {
  const container = document.getElementById("requests-list");
  container.innerHTML = "";

  const snapshot = await getDocs(collection(db, "dailyRequests"));
  let found = false;

  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.name === employeeName) {
      found = true;
      const item = document.createElement("div");
      item.classList.add("request-item");
      item.innerHTML = `
        <p><strong>نوع الإذن:</strong> ${data.type}</p>
        <p><strong>السبب:</strong> ${data.reason}</p>
        <p><strong>تاريخ القيام بالإذن:</strong> ${data.leaveDate}</p>
        <p><strong>تاريخ إعداد الإذن:</strong> ${new Date(data.createdDate).toLocaleString("ar-EG")}</p>
        <hr>
      `;
      container.appendChild(item);
    }
  });

  if (!found) {
    container.innerHTML = "<p>لا توجد طلبات حتى الآن.</p>";
  }
}

// تسجيل الخروج
function logout() {
  localStorage.clear();
  window.location.href = "index.html";
}

// تحميل البيانات عند فتح الصفحة
loadEmployeeData();
loadMyRequests();

// ربط الوظائف بالـ window
window.submitRequest = submitRequest;
window.logout = logout;