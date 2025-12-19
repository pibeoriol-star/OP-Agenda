// calendar.js

function getMonthInfo(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  let startWeekday = firstDay.getDay(); // 0 = dg
  if (startWeekday === 0) startWeekday = 7; // dilluns = 1 ... diumenge = 7
  return { year, month, daysInMonth, startWeekday };
}

function generateCalendarDays(year, month) {
  const { daysInMonth, startWeekday } = getMonthInfo(year, month);
  const days = [];

  const prevMonthDate = new Date(year, month, 0);
  const daysInPrevMonth = prevMonthDate.getDate();
  const leading = startWeekday - 1;

  for (let i = leading; i > 0; i--) {
    days.push({
      year: prevMonthDate.getFullYear(),
      month: prevMonthDate.getMonth(),
      day: daysInPrevMonth - i + 1,
      outside: true,
    });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    days.push({ year, month, day: d, outside: false });
  }

  const remainder = days.length % 7;
  if (remainder !== 0) {
    const trailing = 7 - remainder;
    const nextMonthDate = new Date(year, month + 1, 1);
    for (let d = 1; d <= trailing; d++) {
      days.push({
        year: nextMonthDate.getFullYear(),
        month: nextMonthDate.getMonth(),
        day: d,
        outside: true,
      });
    }
  }

  return days;
}

function formatDateKey(year, month, day) {
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

const MONTH_NAMES_CAT = [
  "Gener","Febrer","Març","Abril","Maig","Juny",
  "Juliol","Agost","Setembre","Octubre","Novembre","Desembre"
];

function getMonthName(year, month) {
  return { name: MONTH_NAMES_CAT[month], year };
}

window.OPCalendar = {
  generateCalendarDays,
  formatDateKey,
  getMonthName,
};