"use strict";

const STORAGE_KEY = "exam-planner-v1";
const DAY_MS = 86400000;
const form = document.getElementById("planner-form");
const nameInput = document.getElementById("exam-name");
const dateInput = document.getElementById("exam-date");
const tasksInput = document.getElementById("tasks");
const message = document.getElementById("message");
const storageMessage = document.getElementById("storage-message");
const planContainer = document.getElementById("plan");
const summary = document.getElementById("plan-summary");
let savedPlan = null;

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

function distribute(tasks, start, end) {
  const days = end - start;
  const base = Math.floor(tasks.length / days);
  const extra = tasks.length % days;
  let offset = 0;
  return Array.from({ length: days }, (_, index) => {
    const count = base + (index < extra ? 1 : 0);
    const entry = { date: dateString(start + index), tasks: tasks.slice(offset, offset + count) };
    offset += count;
    return entry;
  });
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      name: nameInput.value, date: dateInput.value, tasks: tasksInput.value, plan: savedPlan
    }));
    storageMessage.textContent = "Данные сохранены в этом браузере.";
  } catch {
    storageMessage.textContent = "Браузер не разрешил сохранение. План работает, но после закрытия страницы данные могут потеряться.";
  }
}

function renderPlan() {
  planContainer.replaceChildren();
  if (!savedPlan) {
    summary.textContent = "Заполните данные и нажмите «Составить план».";
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "Здесь появятся задачи на каждый день.";
    planContainer.append(empty);
    return;
  }
  summary.textContent = `${savedPlan.name} · Экзамен: ${formatDate(savedPlan.examDate)} · Дней подготовки: ${savedPlan.days.length}`;
  const fragment = document.createDocumentFragment();
  for (const day of savedPlan.days) {
    const section = document.createElement("article");
    section.className = "day";
    const heading = document.createElement("h3");
    heading.textContent = formatDate(day.date);
    section.append(heading);
    const list = document.createElement("ol");
    for (const task of day.tasks) {
      const item = document.createElement("li");
      item.textContent = task;
      list.append(item);
    }
    if (day.tasks.length) {
      section.append(list);
    } else {
      const free = document.createElement("p");
      free.className = "hint";
      free.textContent = "Свободный день — можно отдохнуть или повторить материал.";
      section.append(free);
    }
    fragment.append(section);
  }
  planContainer.append(fragment);
}

function formatDate(value) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric", month: "long", year: "numeric", timeZone: "UTC"
  }).format(new Date(calendarDay(value) * DAY_MS));
}

form.addEventListener("input", () => {
  savedPlan = null;
  message.textContent = "Данные изменены. Нажмите «Составить план».";
  message.className = "";
  renderPlan();
  persist();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const tasks = tasksInput.value.split(/\r?\n/).map(task => task.trim()).filter(Boolean);
  const start = todayDay();
  const end = calendarDay(dateInput.value);
  let error = "";
  let invalidInput = null;
  if (!nameInput.value.trim()) {
    error = "Введите название экзамена."; invalidInput = nameInput;
  } else if (!Number.isFinite(end) || end <= start) {
    error = "Укажите дату экзамена позднее сегодняшнего дня."; invalidInput = dateInput;
  } else if (!tasks.length) {
    error = "Добавьте хотя бы одну учебную задачу."; invalidInput = tasksInput;
  }
  message.className = error ? "error" : "";
  if (error) {
    message.textContent = error;
    invalidInput.focus();
    return;
  }
  savedPlan = { name: nameInput.value.trim(), examDate: dateInput.value, days: distribute(tasks, start, end) };
  renderPlan();
  persist();
  message.textContent = "План составлен. Удачной подготовки!";
});

function restore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (!data || ![data.name, data.date, data.tasks].every(value => typeof value === "string")) throw new Error("Invalid data");
    nameInput.value = data.name;
    dateInput.value = data.date;
    tasksInput.value = data.tasks;
    const plan = data.plan;
    if (plan && typeof plan.name === "string" && Number.isFinite(calendarDay(plan.examDate)) &&
        Array.isArray(plan.days) && plan.days.length && plan.days.every(day => day &&
          Number.isFinite(calendarDay(day.date)) && Array.isArray(day.tasks) && day.tasks.every(task => typeof task === "string"))) {
      savedPlan = plan;
    }
    renderPlan();
    storageMessage.textContent = "Сохранённые данные восстановлены. Для расчёта от сегодняшнего дня составьте план заново.";
  } catch {
    storageMessage.textContent = "Не удалось прочитать сохранённые данные. Можно составить новый план.";
  }
}

restore();
