"use strict";

const DAY_MS = 86400000;

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

function parseStudyTasks(value) {
  return value.split(/\r?\n/).map(task => task.trim()).filter(Boolean);
}

function validateStudyFields({ name, examDate, tasksText, minimumDay, dateError }) {
  const normalizedName = name.trim();
  const tasks = parseStudyTasks(tasksText);
  if (!normalizedName) return { error: { field: "name", text: "Введите название экзамена." } };

  const examDay = calendarDay(examDate);
  if (!Number.isFinite(examDay) || examDay <= minimumDay) {
    return { error: { field: "date", text: dateError } };
  }
  if (!tasks.length) return { error: { field: "tasks", text: "Добавьте хотя бы одну учебную задачу." } };

  return { value: { name: normalizedName, examDate, examDay, tasks } };
}
