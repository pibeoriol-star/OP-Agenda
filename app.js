// app.js

const db = {
  events: {},
  categories: [],
};

const DEFAULT_CATEGORIES = [
  { id: "studies",  name: "Estudis",    color: "#4f8cff" },
  { id: "training", name: "Entrenaments", color: "#4ade80" },
  { id: "projects", name: "Projectes",  color: "#f97316" },
  { id: "personal", name: "Personal",   color: "#e5e5e5" },
];

let currentYear, currentMonth;
let selectedDateKey;

let calendarEl, monthNameEl, yearLabelEl;
let selectedDateEl, eventListEl, noEventsMsgEl, eventPanelEl;
let addEventBtn, splashEl, appEl;
let todayBtn, prevMonthBtn, nextMonthBtn, closePanelBtn;
let settingsEl, openSettingsBtn, closeSettingsBtn, categoryListEl, addCategoryBtn;
let eventModalEl, eventForm, eventTitleInput, eventDescriptionInput,
    eventTimeInput, eventCategorySelect, eventAllDayCheckbox, eventRepeatSelect,
    cancelEventBtn, modalTitleEl;

function init() {
  calendarEl = document.getElementById("calendar");
  monthNameEl = document.getElementById("monthName");
  yearLabelEl = document.getElementById("yearLabel");
  selectedDateEl = document.getElementById("selectedDate");
  eventListEl = document.getElementById("eventList");
  noEventsMsgEl = document.getElementById("noEventsMsg");
  eventPanelEl = document.getElementById("eventPanel");

  addEventBtn = document.getElementById("addEvent");
  splashEl = document.getElementById("splash");
  appEl = document.getElementById("app");
  todayBtn = document.getElementById("todayBtn");
  prevMonthBtn = document.getElementById("prevMonth");
  nextMonthBtn = document.getElementById("nextMonth");
  closePanelBtn = document.getElementById("closePanel");

  settingsEl = document.getElementById("settings");
  openSettingsBtn = document.getElementById("openSettings");
  closeSettingsBtn = document.getElementById("closeSettings");
  categoryListEl = document.getElementById("categoryList");
  addCategoryBtn = document.getElementById("addCategory");

  eventModalEl = document.getElementById("eventModal");
  eventForm = document.getElementById("eventForm");
  eventTitleInput = document.getElementById("eventTitle");
  eventDescriptionInput = document.getElementById("eventDescription");
  eventTimeInput = document.getElementById("eventTime");
  eventCategorySelect = document.getElementById("eventCategory");
  eventAllDayCheckbox = document.getElementById("eventAllDay");
  eventRepeatSelect = document.getElementById("eventRepeat");
  cancelEventBtn = document.getElementById("cancelEvent");
  modalTitleEl = document.getElementById("modalTitle");

  const today = new Date();
  currentYear = today.getFullYear();
  currentMonth = today.getMonth();
  selectedDateKey = OPCalendar.formatDateKey(currentYear, currentMonth, today.getDate());

  loadFromStorage();

  renderCalendar();
  updateSelectedDateLabel();
  renderEventList();
  renderCategories();
  populateCategorySelect();

  setTimeout(() => {
    splashEl.classList.add("hidden");
    appEl.classList.remove("hidden");
  }, 900);

  attachEventListeners();

 if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/service-worker.js");
}

}

function loadFromStorage() {
  try {
    const storedCategories = localStorage.getItem("opAgendaCategories");
    const storedEvents = localStorage.getItem("opAgendaEvents");

    db.categories = storedCategories ? JSON.parse(storedCategories) : DEFAULT_CATEGORIES;
    db.events = storedEvents ? JSON.parse(storedEvents) : {};

    saveCategories();
    saveEvents();
  } catch (e) {
    db.categories = DEFAULT_CATEGORIES;
    db.events = {};
  }
}

function saveCategories() {
  localStorage.setItem("opAgendaCategories", JSON.stringify(db.categories));
}
function saveEvents() {
  localStorage.setItem("opAgendaEvents", JSON.stringify(db.events));
}

function renderCalendar() {
  const days = OPCalendar.generateCalendarDays(currentYear, currentMonth);
  const { name, year } = OPCalendar.getMonthName(currentYear, currentMonth);

  monthNameEl.textContent = name;
  yearLabelEl.textContent = year;
  calendarEl.innerHTML = "";

  const today = new Date();
  const todayKey = OPCalendar.formatDateKey(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  days.forEach((d) => {
    const dateKey = OPCalendar.formatDateKey(d.year, d.month, d.day);
    const cell = document.createElement("div");
    cell.className = "day-cell";

    if (d.outside) cell.classList.add("day-outside");
    if (dateKey === todayKey) cell.classList.add("today");
    if (dateKey === selectedDateKey) cell.classList.add("selected-day");

    const numberSpan = document.createElement("span");
    numberSpan.className = "day-number";
    numberSpan.textContent = d.day;
    cell.appendChild(numberSpan);

    const eventsForDay = db.events[dateKey] || [];
    if (eventsForDay.length > 0) {
      const row = document.createElement("div");
      row.className = "event-dot-row";
      eventsForDay.slice(0, 3).forEach((ev) => {
        const dot = document.createElement("div");
        dot.className = "event-dot";
        const cat = db.categories.find((c) => c.id === ev.categoryId);
        const color = cat ? cat.color : "#ffffff";
        dot.style.setProperty("--color", color);
        row.appendChild(dot);
      });
      cell.appendChild(row);
    }

    cell.addEventListener("click", () => {
      selectedDateKey = dateKey;
      updateSelectedDateLabel();
      renderEventList();
      renderCalendar();
      eventPanelEl.classList.remove("hidden");
    });

    calendarEl.appendChild(cell);
  });
}

function updateSelectedDateLabel() {
  if (!selectedDateKey) return;
  const [y, m, d] = selectedDateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const formatter = new Intl.DateTimeFormat("ca-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  selectedDateEl.textContent = formatter.format(date);
}

function renderEventList() {
  const events = db.events[selectedDateKey] || [];
  eventListEl.innerHTML = "";

  if (events.length === 0) {
    noEventsMsgEl.style.display = "block";
    return;
  }
  noEventsMsgEl.style.display = "none";

  events.forEach((ev, index) => {
    const li = document.createElement("li");
    li.className = "event-item";

    const colorBar = document.createElement("div");
    colorBar.className = "event-color";
    const cat = db.categories.find((c) => c.id === ev.categoryId);
    colorBar.style.backgroundColor = cat ? cat.color : "#fff";

    const main = document.createElement("div");
    main.className = "event-main";
    const titleEl = document.createElement("div");
    titleEl.className = "event-title";
    titleEl.textContent = ev.title;

    const metaEl = document.createElement("div");
    metaEl.className = "event-meta";
    const bits = [];
    if (!ev.allDay && ev.time) bits.push(ev.time);
    else bits.push("Tot el dia");
    if (cat) bits.push(cat.name);
    if (ev.repeat && ev.repeat !== "none") {
      const map = { daily: "Diari", weekly: "Setmanal", monthly: "Mensual" };
      bits.push(map[ev.repeat] || "Repetitiu");
    }
    metaEl.textContent = bits.join(" · ");

    main.appendChild(titleEl);
    main.appendChild(metaEl);

    const actions = document.createElement("div");
    actions.className = "event-actions";
    const delBtn = document.createElement("button");
    delBtn.className = "ghost-btn";
    delBtn.style.fontSize = "0.7rem";
    delBtn.textContent = "Eliminar";
    delBtn.addEventListener("click", () =>
      deleteEvent(selectedDateKey, index)
    );
    actions.appendChild(delBtn);

    li.appendChild(colorBar);
    li.appendChild(main);
    li.appendChild(actions);
    eventListEl.appendChild(li);
  });
}

function renderCategories() {
  categoryListEl.innerHTML = "";
  db.categories.forEach((cat) => {
    const li = document.createElement("li");
    li.className = "category-item";

    const left = document.createElement("div");
    left.className = "category-left";

    const colorDot = document.createElement("div");
    colorDot.className = "category-color";
    colorDot.style.backgroundColor = cat.color;

    const nameEl = document.createElement("span");
    nameEl.className = "category-name";
    nameEl.textContent = cat.name;

    left.appendChild(colorDot);
    left.appendChild(nameEl);

    const removeBtn = document.createElement("button");
    removeBtn.className = "ghost-btn";
    removeBtn.style.fontSize = "0.7rem";
    removeBtn.textContent = "Eliminar";
    removeBtn.addEventListener("click", () => removeCategory(cat.id));

    li.appendChild(left);
    li.appendChild(removeBtn);
    categoryListEl.appendChild(li);
  });
}

function populateCategorySelect() {
  eventCategorySelect.innerHTML = "";
  db.categories.forEach((cat) => {
    const option = document.createElement("option");
    option.value = cat.id;
    option.textContent = cat.name;
    eventCategorySelect.appendChild(option);
  });
}

function addCategory() {
  const name = prompt("Nom de la nova categoria:");
  if (!name || !name.trim()) return;
  const color =
    prompt("Color en format HEX (ex: #4f8cff):", "#ffffff") || "#ffffff";
  const id =
    name.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now().toString(36);

  db.categories.push({ id, name: name.trim(), color: color.trim() });
  saveCategories();
  renderCategories();
  populateCategorySelect();
}

function removeCategory(id) {
  const used = Object.values(db.events).some((list) =>
    list.some((ev) => ev.categoryId === id)
  );
  if (used) {
    alert("Aquesta categoria té esdeveniments associats i no es pot eliminar.");
    return;
  }
  db.categories = db.categories.filter((c) => c.id !== id);
  saveCategories();
  renderCategories();
  populateCategorySelect();
}

function openEventModal() {
  if (!selectedDateKey) {
    const t = new Date();
    selectedDateKey = OPCalendar.formatDateKey(
      t.getFullYear(),
      t.getMonth(),
      t.getDate()
    );
  }

  modalTitleEl.textContent = "Nou esdeveniment";
  eventTitleInput.value = "";
  eventDescriptionInput.value = "";
  eventTimeInput.value = "";
  eventAllDayCheckbox.checked = true;
  eventRepeatSelect.value = "none";

  if (db.categories.length > 0) {
    eventCategorySelect.value = db.categories[0].id;
  }

  eventModalEl.classList.remove("hidden");
  eventModalEl.setAttribute("aria-hidden", "false");
}

function closeEventModal() {
  eventModalEl.classList.add("hidden");
  eventModalEl.setAttribute("aria-hidden", "true");
}

function handleEventFormSubmit(e) {
  e.preventDefault();
  const title = eventTitleInput.value.trim();
  if (!title) return;

  const description = eventDescriptionInput.value.trim();
  const time = eventAllDayCheckbox.checked ? "" : eventTimeInput.value;
  const categoryId = eventCategorySelect.value;
  const allDay = eventAllDayCheckbox.checked;
  const repeat = eventRepeatSelect.value;

  const newEvent = { title, description, time, categoryId, allDay, repeat };

  if (!db.events[selectedDateKey]) db.events[selectedDateKey] = [];
  db.events[selectedDateKey].push(newEvent);
  saveEvents();

  closeEventModal();
  renderEventList();
  renderCalendar();
}

function deleteEvent(dateKey, index) {
  const events = db.events[dateKey];
  if (!events) return;
  events.splice(index, 1);
  if (events.length === 0) delete db.events[dateKey];
  saveEvents();
  renderEventList();
  renderCalendar();
}

function showSettings() {
  settingsEl.classList.remove("hidden");
  settingsEl.setAttribute("aria-hidden", "false");
}
function hideSettings() {
  settingsEl.classList.add("hidden");
  settingsEl.setAttribute("aria-hidden", "true");
}

function goToToday() {
  const t = new Date();
  currentYear = t.getFullYear();
  currentMonth = t.getMonth();
  selectedDateKey = OPCalendar.formatDateKey(
    currentYear,
    currentMonth,
    t.getDate()
  );
  renderCalendar();
  updateSelectedDateLabel();
  renderEventList();
}
function goToNextMonth() {
  currentMonth++;
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  renderCalendar();
}
function goToPrevMonth() {
  currentMonth--;
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }
  renderCalendar();
}

function attachEventListeners() {
  addEventBtn.addEventListener("click", openEventModal);
  cancelEventBtn.addEventListener("click", closeEventModal);
  eventForm.addEventListener("submit", handleEventFormSubmit);

  todayBtn.addEventListener("click", goToToday);
  nextMonthBtn.addEventListener("click", goToNextMonth);
  prevMonthBtn.addEventListener("click", goToPrevMonth);

  openSettingsBtn.addEventListener("click", showSettings);
  closeSettingsBtn.addEventListener("click", hideSettings);
  addCategoryBtn.addEventListener("click", addCategory);

  closePanelBtn.addEventListener("click", () => {
    eventPanelEl.classList.toggle("hidden");
  });
  selectedDateEl.addEventListener("click", () => {
    eventPanelEl.classList.remove("hidden");
  });
}

window.addEventListener("DOMContentLoaded", init);

// Instal·lació PWA
let deferredPrompt;
const installBtn = document.getElementById("installAppBtn");

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.classList.remove("hidden");
});

installBtn.addEventListener("click", async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const result = await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBtn.classList.add("hidden");
});