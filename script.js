"use strict";

const DAY_MS = 86400000;
const form = document.getElementById("planner-form");
const nameInput = document.getElementById("exam-name");
const dateInput = document.getElementById("exam-date");
const tasksInput = document.getElementById("tasks");
const message = document.getElementById("message");
const storageMessage = document.getElementById("storage-message");
const planContainer = document.getElementById("plan");
const summary = document.getElementById("plan-summary");
let savedPlans = [];

// UTC используется только как шкала календарных дней, а не местного времени.
function calendarDay(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return NaN;
  const date = new Date(value + "T00:00:00.000Z");
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) return NaN;
  return date.getTime() / DAY_MS;
}

function todayDay() {
  const now = new Date();
  const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return calendarDay(localDate);
}

function dateString(day) {
  return new Date(day * DAY_MS).toISOString().slice(0, 10);
}

dateInput.min = dateString(todayDay() + 1);

function distribute(tasks, start, end) {
  const days = end - start;
  const base = Math.floor(tasks.length / days);
  const extra = tasks.length % days;
  let offset = 0;
  return Array.from({ length: Math.min(days, tasks.length) }, (_, index) => {
    const count = base + (index < extra ? 1 : 0);
    const entry = { date: dateString(start + index), tasks: tasks.slice(offset, offset + count) };
    offset += count;
    return entry;
  });
}

function persist() {
  try {
    savePlannerState({
      name: nameInput.value, date: dateInput.value, tasks: tasksInput.value, plans: savedPlans
    });
    storageMessage.textContent = "Данные сохранены в этом браузере.";
  } catch {
    storageMessage.textContent = "Браузер не разрешил сохранение. План работает, но после закрытия страницы данные могут потеряться.";
  }
}

function renderPlan() {
  closeNotePanel();
  planContainer.replaceChildren();
  renderNoteCollection();
  checkReminders();
}

function formatDate(value) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric", month: "long", year: "numeric", timeZone: "UTC"
  }).format(new Date(calendarDay(value) * DAY_MS));
}

form.addEventListener("input", (event) => {
  event.target.removeAttribute("aria-invalid");
  message.textContent = "";
  message.className = "";
  persist();
});

function validatePlannerForm(tasks) {
  if (!nameInput.value.trim()) {
    return { text: "Введите название экзамена.", input: nameInput };
  }
  const examDay = calendarDay(dateInput.value);
  if (!Number.isFinite(examDay) || examDay <= todayDay()) {
    return { text: "Укажите дату экзамена позднее сегодняшнего дня.", input: dateInput };
  }
  if (!tasks.length) {
    return { text: "Добавьте хотя бы одну учебную задачу.", input: tasksInput };
  }
  return null;
}

function showFormError(error) {
  message.className = "error";
  message.textContent = error.text;
  error.input.setAttribute("aria-invalid", "true");
  error.input.focus();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const tasks = tasksInput.value.split(/\r?\n/).map(task => task.trim()).filter(Boolean);
  const start = todayDay();
  const end = calendarDay(dateInput.value);
  const error = validatePlannerForm(tasks);
  if (error) {
    showFormError(error);
    return;
  }
  savedPlans.push({ name: nameInput.value.trim(), examDate: dateInput.value, days: distribute(tasks, start, end) });
  form.reset();
  for (const input of form.querySelectorAll("[aria-invalid]")) input.removeAttribute("aria-invalid");
  document.getElementById("search").value = "";
  currentNotesView = "active";
  renderPlan();
  persist();
  message.textContent = "Задачи добавлены. Можно создать следующий план.";
  nameInput.focus();
});

document.getElementById("new-exam").addEventListener("click", () => {
  switchNotesView("active");
  form.scrollIntoView({ behavior: "auto", block: "center" });
  nameInput.focus({ preventScroll: true });
  message.className = "";
  message.textContent = "Введите экзамен и задачи для нового плана.";
});

function validPlan(plan) {
  return plan && typeof plan.name === "string" && Number.isFinite(calendarDay(plan.examDate)) &&
    Array.isArray(plan.days) && plan.days.every(day => day &&
      Number.isFinite(calendarDay(day.date)) && Array.isArray(day.tasks) && day.tasks.every(task => typeof task === "string"));
}

function restore() {
  try {
    const data = loadPlannerState();
    if (!data) return;
    if (!data || ![data.name, data.date, data.tasks].every(value => typeof value === "string")) throw new Error("Invalid data");
    nameInput.value = data.name;
    dateInput.value = data.date;
    tasksInput.value = data.tasks;
    const plans = Array.isArray(data.plans) ? data.plans : data.plan ? [data.plan] : [];
    savedPlans = plans.filter(validPlan)
      .map(plan => ({ ...plan, days: plan.days.filter(day => day.tasks.length > 0) }))
      .filter(plan => plan.days.length > 0);
    // Старый готовый план переносим в коллекцию, освобождая форму.
    if (!Array.isArray(data.plans) && savedPlans.length) form.reset();
    renderPlan();
    storageMessage.textContent = "Сохранённые планы и черновик восстановлены.";
  } catch {
    storageMessage.textContent = "Не удалось прочитать сохранённые данные. Можно составить новый план.";
  }
}

restore();
renderPlan();
