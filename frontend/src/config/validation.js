export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value) {
  const trimmed = value?.trim();
  return !!trimmed && EMAIL_REGEX.test(trimmed);
}

export const emailRules = [
  (value) => !!value?.trim() || "Email is required.",
  (value) => isValidEmail(value) || "Enter a valid email address.",
];

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDueDate(value) {
  if (!value) {
    return true;
  }

  if (!DATE_ONLY_REGEX.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

export const optionalDueDateRules = [
  (value) => !value || isValidDueDate(value) || "Enter a valid due date.",
];

export function formatDueDate(value) {
  if (!value) {
    return "";
  }

  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

export function isTodoOverdue(todo) {
  if (!todo?.dueDate || todo.completed) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [year, month, day] = todo.dueDate.split("-").map(Number);
  const dueDate = new Date(year, month - 1, day);

  return dueDate < today;
}

export function toDateInputValue(value) {
  if (!value) {
    return "";
  }

  return String(value).slice(0, 10);
}
