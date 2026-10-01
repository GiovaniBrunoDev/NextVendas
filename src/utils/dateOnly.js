const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})(?:$|T)/;

function validDateKey(year, month, day) {
  const date = new Date(year, month - 1, day, 12);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export function dateOnlyKey(value) {
  if (!value) return "";

  if (typeof value === "string") {
    const match = value.match(DATE_ONLY_PATTERN);
    if (match) {
      const year = Number(match[1]);
      const month = Number(match[2]);
      const day = Number(match[3]);
      return validDateKey(year, month, day) ? `${match[1]}-${match[2]}-${match[3]}` : "";
    }
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDateOnly(value, options, fallback = "-") {
  const key = dateOnlyKey(value);
  if (!key) return fallback;

  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day, 12).toLocaleDateString("pt-BR", options);
}
