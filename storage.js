"use strict";

const PLANNER_STORAGE_KEY = "exam-planner-v1";
const PLANNER_STORAGE_VERSION = 2;
const PLANNER_CORRUPT_STORAGE_KEY = PLANNER_STORAGE_KEY + "-corrupt";
let plannerStorageWarning = "";

function savePlannerState(state) {
  const record = {
    version: PLANNER_STORAGE_VERSION,
    savedAt: new Date().toISOString(),
    state
  };
  localStorage.setItem(PLANNER_STORAGE_KEY, JSON.stringify(record));
}

function loadPlannerState() {
  const raw = localStorage.getItem(PLANNER_STORAGE_KEY);
  if (!raw) return null;

  let record;
  try {
    record = JSON.parse(raw);
  } catch {
    plannerStorageWarning = "Повреждённые сохранённые данные изолированы. Можно создать новый план.";
    try { localStorage.setItem(PLANNER_CORRUPT_STORAGE_KEY, raw); } catch { /* Резервная копия недоступна. */ }
    try { localStorage.removeItem(PLANNER_STORAGE_KEY); } catch { /* Хранилище недоступно для записи. */ }
    return null;
  }
  if (record && record.version === PLANNER_STORAGE_VERSION && record.state) {
    return record.state;
  }

  // Поддержка данных, созданных предыдущей версией приложения.
  return record;
}
