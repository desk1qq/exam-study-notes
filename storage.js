"use strict";

const PLANNER_STORAGE_KEY = "exam-planner-v1";
const PLANNER_STORAGE_VERSION = 2;

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

  const record = JSON.parse(raw);
  if (record && record.version === PLANNER_STORAGE_VERSION && record.state) {
    return record.state;
  }

  // Поддержка данных, созданных предыдущей версией приложения.
  return record;
}
