const STORE_KEY = "bankRoutineTaskLedger.v1";

const cycleLabels = {
  daily: "每日",
  weekly: "每周",
  monthly: "每月",
  quarterly: "每季"
};

const statusLabels = {
  todo: "未开始",
  doing: "进行中",
  waiting: "等待他人",
  done: "已完成",
  deferred: "已延期",
  missed: "未完成"
};

const weekdayLabels = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];

const defaultTemplates = [
  {
    id: "tpl-daily-1",
    title: "日终账务核对",
    cycle: "daily",
    category: "账务核对",
    important: true,
    urgencyRule: "due",
    schedule: { time: "17:00" },
    note: "核对当日账务、现金及重要空白凭证相关数据。",
    active: true
  },
  {
    id: "tpl-daily-2",
    title: "凭证整理与影像检查",
    cycle: "daily",
    category: "凭证管理",
    important: true,
    urgencyRule: "due",
    schedule: { time: "16:30" },
    note: "检查凭证完整性、影像质量和补扫事项。",
    active: true
  },
  {
    id: "tpl-daily-3",
    title: "系统余额与异常提示检查",
    cycle: "daily",
    category: "风险合规",
    important: true,
    urgencyRule: "advance",
    schedule: { time: "09:30" },
    note: "关注系统提示、异常交易、待处理预警。",
    active: true
  },
  {
    id: "tpl-weekly-1",
    title: "问题清单跟踪",
    cycle: "weekly",
    category: "内部管理",
    important: true,
    urgencyRule: "advance",
    schedule: { weekday: 5 },
    note: "跟进本周账务差错、整改事项和未办结问题。",
    active: true
  },
  {
    id: "tpl-weekly-2",
    title: "台账检查",
    cycle: "weekly",
    category: "风险合规",
    important: true,
    urgencyRule: "due",
    schedule: { weekday: 4 },
    note: "检查登记簿、印章、重要物品及相关台账。",
    active: true
  },
  {
    id: "tpl-weekly-3",
    title: "周报数据整理",
    cycle: "weekly",
    category: "报表报送",
    important: false,
    urgencyRule: "due",
    schedule: { weekday: 5 },
    note: "整理本周需上报数据和说明材料。",
    active: true
  },
  {
    id: "tpl-monthly-1",
    title: "月末结账",
    cycle: "monthly",
    category: "账务核对",
    important: true,
    urgencyRule: "advance",
    schedule: { day: "last" },
    note: "月末前完成结账准备、余额核对和差异说明。",
    active: true
  },
  {
    id: "tpl-monthly-2",
    title: "月度报表报送",
    cycle: "monthly",
    category: "报表报送",
    important: true,
    urgencyRule: "advance",
    schedule: { day: "last" },
    note: "核对口径后完成内部及上级要求的月度报表。",
    active: true
  },
  {
    id: "tpl-monthly-3",
    title: "对账与差异说明",
    cycle: "monthly",
    category: "账务核对",
    important: true,
    urgencyRule: "due",
    schedule: { day: 25 },
    note: "检查往来、内部账户及差异事项说明。",
    active: true
  },
  {
    id: "tpl-quarterly-1",
    title: "季度报表资料整理",
    cycle: "quarterly",
    category: "报表报送",
    important: true,
    urgencyRule: "advance",
    schedule: { slot: "end" },
    note: "整理季度报表、说明材料和复核依据。",
    active: true
  },
  {
    id: "tpl-quarterly-2",
    title: "季度风险排查与整改复核",
    cycle: "quarterly",
    category: "风险合规",
    important: true,
    urgencyRule: "advance",
    schedule: { slot: "end" },
    note: "检查风险点、整改台账和历史问题闭环情况。",
    active: true
  },
  {
    id: "tpl-quarterly-3",
    title: "审计检查资料归档",
    cycle: "quarterly",
    category: "内部管理",
    important: false,
    urgencyRule: "display",
    schedule: { slot: "middle" },
    note: "归集本季检查、审计、整改相关资料。",
    active: true
  }
];

let state = loadState();
let activePeriod = "week";
let activeCycleFilter = "all";

const els = {
  todayText: document.getElementById("todayText"),
  periodText: document.getElementById("periodText"),
  todayCount: document.getElementById("todayCount"),
  weekCount: document.getElementById("weekCount"),
  monthCount: document.getElementById("monthCount"),
  quarterCount: document.getElementById("quarterCount"),
  overdueCount: document.getElementById("overdueCount"),
  todayTasks: document.getElementById("todayTasks"),
  overdueTasks: document.getElementById("overdueTasks"),
  periodTasks: document.getElementById("periodTasks"),
  quadrants: document.getElementById("quadrants"),
  templateForm: document.getElementById("templateForm"),
  cycleSelect: document.getElementById("cycleSelect"),
  scheduleFields: document.getElementById("scheduleFields"),
  templateList: document.getElementById("templateList"),
  templateTotal: document.getElementById("templateTotal"),
  archiveList: document.getElementById("archiveList"),
  archiveCount: document.getElementById("archiveCount"),
  archiveDate: document.getElementById("archiveDate"),
  archiveCycle: document.getElementById("archiveCycle"),
  archiveCategory: document.getElementById("archiveCategory"),
  archiveSearch: document.getElementById("archiveSearch")
};

init();

function init() {
  renderScheduleFields();
  generateCurrentTasks();
  bindEvents();
  renderAll();
}

function bindEvents() {
  registerServiceWorker();

  document.querySelectorAll(".nav-item").forEach((button) => {
    button.addEventListener("click", () => switchView(button.dataset.view));
  });

  document.querySelectorAll("[data-jump]").forEach((button) => {
    button.addEventListener("click", () => switchView(button.dataset.jump));
  });

  document.querySelectorAll(".period-tab").forEach((button) => {
    button.addEventListener("click", () => {
      activePeriod = button.dataset.period;
      document.querySelectorAll(".period-tab").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      renderDashboard();
    });
  });

  document.querySelectorAll(".filter-pill").forEach((button) => {
    button.addEventListener("click", () => {
      activeCycleFilter = button.dataset.cycle;
      document.querySelectorAll(".filter-pill").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      renderTemplates();
    });
  });

  els.cycleSelect.addEventListener("change", renderScheduleFields);
  els.templateForm.addEventListener("submit", handleTemplateSubmit);
  document.getElementById("generateBtn").addEventListener("click", () => {
    generateCurrentTasks(true);
    renderAll();
  });
  document.getElementById("resetSeedBtn").addEventListener("click", resetSeed);
  document.getElementById("exportBtn").addEventListener("click", exportArchive);

  [els.archiveDate, els.archiveCycle, els.archiveCategory, els.archiveSearch].forEach((input) => {
    input.addEventListener("input", renderArchive);
  });

  document.querySelectorAll("[data-voice-field]").forEach((button) => {
    button.addEventListener("click", () => startVoiceInput(button));
  });
}

function loadState() {
  const raw = localStorage.getItem(STORE_KEY);
  if (!raw) {
    return {
      templates: structuredClone(defaultTemplates),
      instances: []
    };
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      templates: Array.isArray(parsed.templates) ? parsed.templates : structuredClone(defaultTemplates),
      instances: Array.isArray(parsed.instances) ? parsed.instances : []
    };
  } catch {
    return {
      templates: structuredClone(defaultTemplates),
      instances: []
    };
  }
}

function saveState() {
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

function switchView(viewId) {
  document.querySelectorAll(".view").forEach((view) => view.classList.toggle("active", view.id === viewId));
  document.querySelectorAll(".nav-item").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === viewId);
  });
}

function renderAll() {
  renderDashboard();
  renderTemplates();
  renderArchive();
}

function renderDashboard() {
  const today = new Date();
  const todayIso = toISO(today);
  const weekKey = getWeekKey(today);
  const monthKey = getMonthKey(today);
  const quarterKey = getQuarterKey(today);
  const openItems = state.instances.filter((item) => item.status !== "done");
  const todayItems = openItems.filter((item) => item.dueDate === todayIso).sort(sortByPriority);
  const weekItems = state.instances.filter((item) => item.cycle === "weekly" && item.periodKey === weekKey).sort(sortByPriority);
  const monthItems = state.instances.filter((item) => item.cycle === "monthly" && item.periodKey === monthKey).sort(sortByPriority);
  const quarterItems = state.instances.filter((item) => item.cycle === "quarterly" && item.periodKey === quarterKey).sort(sortByPriority);
  const overdueItems = openItems.filter((item) => item.dueDate < todayIso || item.status === "deferred").sort(sortByPriority);

  els.todayText.textContent = formatDateCN(today);
  els.periodText.textContent = `${getWeekRangeLabel(today)} · ${getQuarterLabel(today)}`;
  els.todayCount.textContent = todayItems.length;
  els.weekCount.textContent = weekItems.length;
  els.monthCount.textContent = monthItems.length;
  els.quarterCount.textContent = quarterItems.length;
  els.overdueCount.textContent = overdueItems.length;

  renderTaskList(els.todayTasks, todayItems, { editable: true, emptyText: "今天没有到期待办。可以查看本周、本月或登记新的周期任务。" });
  renderTaskList(els.overdueTasks, overdueItems, { editable: true, compact: true, emptyText: "暂无逾期或延期事项。" });

  const periodMap = { week: weekItems, month: monthItems, quarter: quarterItems };
  renderTaskList(els.periodTasks, periodMap[activePeriod] || [], {
    editable: true,
    compact: true,
    emptyText: "本周期还没有生成任务。"
  });

  renderQuadrants(openItems.filter((item) => isCurrentPeriodItem(item, today)));
}

function renderTemplates() {
  const templates = activeCycleFilter === "all"
    ? state.templates
    : state.templates.filter((template) => template.cycle === activeCycleFilter);

  els.templateTotal.textContent = `${state.templates.length} 项`;
  els.templateList.innerHTML = "";

  if (!templates.length) {
    els.templateList.appendChild(emptyNode("当前筛选下没有周期任务。"));
    return;
  }

  templates.forEach((template) => {
    const card = document.createElement("article");
    card.className = `template-card${template.active ? "" : " disabled"}`;
    card.innerHTML = `
      <div class="template-head">
        <div>
          <div class="template-title">${escapeHTML(template.title)}</div>
          <div class="meta-row">
            <span class="tag">${cycleLabels[template.cycle]}</span>
            <span class="tag">${escapeHTML(template.category)}</span>
            <span class="tag ${template.important ? "important" : ""}">${template.important ? "重要" : "一般"}</span>
            <span class="tag ${template.urgencyRule === "display" ? "" : "urgent"}">${urgencyLabel(template.urgencyRule)}</span>
            <span class="tag">${scheduleLabel(template)}</span>
            ${template.active ? "" : '<span class="tag deferred">已停用</span>'}
          </div>
        </div>
        <div class="template-actions">
          <button class="small-button" data-action="toggle-template" data-id="${template.id}" type="button">${template.active ? "停用" : "启用"}</button>
          <button class="danger-button" data-action="delete-template" data-id="${template.id}" type="button">删除</button>
        </div>
      </div>
      ${template.note ? `<p class="task-note">${escapeHTML(template.note)}</p>` : ""}
    `;
    els.templateList.appendChild(card);
  });

  els.templateList.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => handleTemplateAction(button.dataset.action, button.dataset.id));
  });
}

function renderArchive() {
  const date = els.archiveDate.value;
  const cycle = els.archiveCycle.value;
  const category = els.archiveCategory.value;
  const search = els.archiveSearch.value.trim().toLowerCase();

  const records = state.instances
    .filter((item) => !date || item.dueDate === date || item.completedAt?.startsWith(date))
    .filter((item) => cycle === "all" || item.cycle === cycle)
    .filter((item) => category === "all" || item.category === category)
    .filter((item) => {
      if (!search) return true;
      return [item.title, item.note, item.workNote, item.reason].filter(Boolean).join(" ").toLowerCase().includes(search);
    })
    .sort((a, b) => b.dueDate.localeCompare(a.dueDate) || a.title.localeCompare(b.title, "zh-Hans-CN"));

  els.archiveCount.textContent = `${records.length} 条`;
  els.archiveList.innerHTML = "";

  if (!records.length) {
    els.archiveList.appendChild(emptyNode("没有符合条件的留档记录。"));
    return;
  }

  records.forEach((item) => {
    const card = document.createElement("article");
    card.className = "archive-card";
    card.innerHTML = `
      <div class="archive-head">
        <div>
          <div class="archive-title">${escapeHTML(item.title)}</div>
          <div class="meta-row">
            <span class="tag">${cycleLabels[item.cycle]}</span>
            <span class="tag">${escapeHTML(item.category)}</span>
            <span class="tag ${statusClass(item.status)}">${statusLabels[item.status]}</span>
            <span class="tag">应办：${item.dueDate}</span>
            ${item.completedAt ? `<span class="tag done">完成：${item.completedAt.slice(0, 16).replace("T", " ")}</span>` : ""}
          </div>
        </div>
      </div>
      ${item.workNote ? `<p class="task-note">备注：${escapeHTML(item.workNote)}</p>` : ""}
      ${item.reason ? `<p class="task-note">未完成原因：${escapeHTML(item.reason)}</p>` : ""}
      ${item.note ? `<p class="task-note">台账说明：${escapeHTML(item.note)}</p>` : ""}
    `;
    els.archiveList.appendChild(card);
  });
}

function renderTaskList(container, items, options = {}) {
  container.innerHTML = "";
  if (!items.length) {
    container.appendChild(emptyNode(options.emptyText || "暂无任务。"));
    return;
  }

  items.forEach((item) => {
    const urgent = isUrgent(item, new Date());
    const card = document.createElement("article");
    card.className = `task-card${item.important && urgent ? " priority-now" : ""}`;
    card.innerHTML = `
      <div class="task-head">
        <div>
          <div class="task-title-row">
            <input type="checkbox" data-action="complete" data-id="${item.id}" ${item.status === "done" ? "checked" : ""} aria-label="标记完成">
            <div class="task-title">${escapeHTML(item.title)}</div>
          </div>
          <div class="meta-row">
            <span class="tag">${cycleLabels[item.cycle]}</span>
            <span class="tag">${escapeHTML(item.category)}</span>
            <span class="tag ${item.important ? "important" : ""}">${item.important ? "重要" : "一般"}</span>
            <span class="tag ${urgent ? "urgent" : ""}">${urgent ? "紧急" : "可安排"}</span>
            <span class="tag ${statusClass(item.status)}">${statusLabels[item.status]}</span>
            <span class="tag">应办：${item.dueDate}${item.dueTime ? ` ${item.dueTime}` : ""}</span>
          </div>
        </div>
      </div>
      ${item.note ? `<p class="task-note">${escapeHTML(item.note)}</p>` : ""}
      ${options.editable ? taskEditMarkup(item) : ""}
    `;
    container.appendChild(card);
  });

  container.querySelectorAll("[data-action='complete']").forEach((input) => {
    input.addEventListener("change", () => toggleComplete(input.dataset.id, input.checked));
  });

  container.querySelectorAll("[data-action='save-instance']").forEach((button) => {
    button.addEventListener("click", () => saveInstanceEdits(button.dataset.id));
  });
}

function taskEditMarkup(item) {
  return `
    <div class="task-edit" data-edit-id="${item.id}">
      <label>
        <span>状态</span>
        <select data-field="status">
          ${Object.entries(statusLabels).map(([value, label]) => `<option value="${value}" ${item.status === value ? "selected" : ""}>${label}</option>`).join("")}
        </select>
      </label>
      <label>
        <span>备注</span>
        <input data-field="workNote" value="${escapeAttr(item.workNote || "")}" placeholder="填写处理说明">
      </label>
      <label>
        <span>未完成原因</span>
        <input data-field="reason" value="${escapeAttr(item.reason || "")}" placeholder="延期或未完成时填写">
      </label>
    </div>
    <div class="save-row">
      <button class="small-button" data-action="save-instance" data-id="${item.id}" type="button">保存记录</button>
    </div>
  `;
}

function renderQuadrants(items) {
  const today = new Date();
  const groups = {
    now: items.filter((item) => item.important && isUrgent(item, today)),
    plan: items.filter((item) => item.important && !isUrgent(item, today)),
    delegate: items.filter((item) => !item.important && isUrgent(item, today)),
    later: items.filter((item) => !item.important && !isUrgent(item, today))
  };

  const content = [
    ["now", "重要且紧急", "立即处理，优先放在今天前面。"],
    ["plan", "重要不紧急", "预约时间，避免被临时事项挤掉。"],
    ["delegate", "不重要但紧急", "尽快处理或协调他人配合。"],
    ["later", "不重要不紧急", "集中处理，必要时简化或取消。"]
  ];

  els.quadrants.innerHTML = content.map(([key, title, desc]) => `
    <article class="quadrant ${key}">
      <h4>${title}</h4>
      <strong>${groups[key].length}</strong>
      <p>${desc}</p>
    </article>
  `).join("");
}

function renderScheduleFields() {
  const cycle = els.cycleSelect.value;
  const fields = {
    daily: `
      <label>
        <span>建议完成时间</span>
        <input name="dailyTime" type="time" value="17:00">
      </label>
      <label>
        <span>生成规则</span>
        <input value="每天自动生成" disabled>
      </label>
    `,
    weekly: `
      <label>
        <span>每周完成日</span>
        <select name="weeklyDay">
          ${weekdayLabels.map((label, index) => `<option value="${index + 1}" ${index === 4 ? "selected" : ""}>${label}</option>`).join("")}
        </select>
      </label>
      <label>
        <span>生成规则</span>
        <input value="每周自动生成" disabled>
      </label>
    `,
    monthly: `
      <label>
        <span>每月完成日</span>
        <select name="monthlyDay">
          <option value="1">月初第一天</option>
          <option value="5">每月5日</option>
          <option value="25">每月25日</option>
          <option value="last" selected>月末最后一天</option>
          <option value="10">每月10日</option>
          <option value="15">每月15日</option>
        </select>
      </label>
      <label>
        <span>生成规则</span>
        <input value="每月自动生成" disabled>
      </label>
    `,
    quarterly: `
      <label>
        <span>每季完成节点</span>
        <select name="quarterSlot">
          <option value="end" selected>季度末</option>
          <option value="middle">季度第二个月15日</option>
          <option value="first">季度第一个月10日</option>
        </select>
      </label>
      <label>
        <span>生成规则</span>
        <input value="每季自动生成" disabled>
      </label>
    `
  };
  els.scheduleFields.innerHTML = fields[cycle];
}

function handleTemplateSubmit(event) {
  event.preventDefault();
  const data = new FormData(els.templateForm);
  const cycle = data.get("cycle");
  const template = {
    id: `tpl-${Date.now()}`,
    title: data.get("title").trim(),
    cycle,
    category: data.get("category"),
    important: data.get("important") === "true",
    urgencyRule: data.get("urgencyRule"),
    schedule: readSchedule(cycle, data),
    note: data.get("note").trim(),
    active: true
  };

  state.templates.unshift(template);
  generateForTemplate(template, new Date(), true);
  saveState();
  els.templateForm.reset();
  renderScheduleFields();
  renderAll();
}

function readSchedule(cycle, data) {
  if (cycle === "daily") return { time: data.get("dailyTime") || "17:00" };
  if (cycle === "weekly") return { weekday: Number(data.get("weeklyDay") || 5) };
  if (cycle === "monthly") return { day: data.get("monthlyDay") || "last" };
  return { slot: data.get("quarterSlot") || "end" };
}

function handleTemplateAction(action, id) {
  const template = state.templates.find((item) => item.id === id);
  if (!template) return;

  if (action === "toggle-template") {
    template.active = !template.active;
  }

  if (action === "delete-template") {
    state.templates = state.templates.filter((item) => item.id !== id);
  }

  saveState();
  renderAll();
}

function toggleComplete(id, checked) {
  const item = state.instances.find((entry) => entry.id === id);
  if (!item) return;
  item.status = checked ? "done" : "todo";
  item.completedAt = checked ? new Date().toISOString() : "";
  if (checked && !item.workNote) item.workNote = "已完成";
  saveState();
  renderAll();
}

function saveInstanceEdits(id) {
  const item = state.instances.find((entry) => entry.id === id);
  const panel = document.querySelector(`[data-edit-id="${id}"]`);
  if (!item || !panel) return;

  item.status = panel.querySelector("[data-field='status']").value;
  item.workNote = panel.querySelector("[data-field='workNote']").value.trim();
  item.reason = panel.querySelector("[data-field='reason']").value.trim();
  item.completedAt = item.status === "done" && !item.completedAt ? new Date().toISOString() : item.completedAt;

  if (item.status !== "done") {
    item.completedAt = "";
  }

  saveState();
  renderAll();
}

function resetSeed() {
  state = {
    templates: structuredClone(defaultTemplates),
    instances: []
  };
  generateCurrentTasks(true);
  saveState();
  renderAll();
}

function generateCurrentTasks(forceSave = false) {
  const today = new Date();
  state.templates.filter((template) => template.active).forEach((template) => generateForTemplate(template, today));
  if (forceSave) saveState();
}

function generateForTemplate(template, referenceDate, save = false) {
  const period = getPeriodForCycle(template.cycle, referenceDate);
  const id = `${template.id}-${period.key}`;
  if (state.instances.some((item) => item.id === id)) return;

  const due = getDueDate(template, referenceDate);
  state.instances.push({
    id,
    templateId: template.id,
    title: template.title,
    cycle: template.cycle,
    category: template.category,
    important: template.important,
    urgencyRule: template.urgencyRule,
    dueDate: toISO(due.date),
    dueTime: due.time || "",
    periodKey: period.key,
    status: "todo",
    note: template.note,
    workNote: "",
    reason: "",
    completedAt: "",
    createdAt: new Date().toISOString()
  });

  if (save) saveState();
}

function getPeriodForCycle(cycle, date) {
  if (cycle === "daily") return { key: toISO(date) };
  if (cycle === "weekly") return { key: getWeekKey(date) };
  if (cycle === "monthly") return { key: getMonthKey(date) };
  return { key: getQuarterKey(date) };
}

function getDueDate(template, referenceDate) {
  const date = new Date(referenceDate);
  if (template.cycle === "daily") {
    return { date, time: template.schedule?.time || "" };
  }

  if (template.cycle === "weekly") {
    const start = startOfWeek(referenceDate);
    const dueDate = addDays(start, Number(template.schedule?.weekday || 5) - 1);
    return { date: dueDate };
  }

  if (template.cycle === "monthly") {
    const year = date.getFullYear();
    const month = date.getMonth();
    const last = new Date(year, month + 1, 0).getDate();
    const day = template.schedule?.day === "last" ? last : Math.min(Number(template.schedule?.day || last), last);
    return { date: new Date(year, month, day) };
  }

  const year = date.getFullYear();
  const quarterStartMonth = Math.floor(date.getMonth() / 3) * 3;
  const slot = template.schedule?.slot || "end";
  if (slot === "first") return { date: new Date(year, quarterStartMonth, 10) };
  if (slot === "middle") return { date: new Date(year, quarterStartMonth + 1, 15) };
  return { date: new Date(year, quarterStartMonth + 3, 0) };
}

function isCurrentPeriodItem(item, date) {
  if (item.cycle === "daily") return item.periodKey === toISO(date);
  if (item.cycle === "weekly") return item.periodKey === getWeekKey(date);
  if (item.cycle === "monthly") return item.periodKey === getMonthKey(date);
  return item.periodKey === getQuarterKey(date);
}

function isUrgent(item, referenceDate) {
  const today = toISO(referenceDate);
  if (item.status === "deferred" || item.dueDate < today) return true;
  if (item.urgencyRule === "display") return false;
  if (item.dueDate <= today) return true;
  if (item.urgencyRule === "advance") {
    return daysBetween(today, item.dueDate) <= 2;
  }
  return false;
}

function sortByPriority(a, b) {
  const now = new Date();
  const score = (item) => {
    let value = 0;
    if (item.important) value += 20;
    if (isUrgent(item, now)) value += 30;
    if (item.status === "deferred" || item.status === "missed") value += 10;
    if (item.status === "done") value -= 40;
    return value;
  };
  return score(b) - score(a) || a.dueDate.localeCompare(b.dueDate) || a.title.localeCompare(b.title, "zh-Hans-CN");
}

function urgencyLabel(rule) {
  if (rule === "advance") return "提前提醒";
  if (rule === "display") return "仅展示";
  return "到期紧急";
}

function scheduleLabel(template) {
  if (template.cycle === "daily") return `每日 ${template.schedule?.time || "未设时间"}`;
  if (template.cycle === "weekly") return weekdayLabels[Number(template.schedule?.weekday || 5) - 1];
  if (template.cycle === "monthly") return template.schedule?.day === "last" ? "月末" : `每月${template.schedule?.day}日`;
  if (template.schedule?.slot === "first") return "季度首月10日";
  if (template.schedule?.slot === "middle") return "季度第二个月15日";
  return "季度末";
}

function statusClass(status) {
  if (status === "done") return "done";
  if (status === "waiting") return "waiting";
  if (status === "deferred" || status === "missed") return "deferred";
  return "";
}

function emptyNode(text) {
  const template = document.getElementById("emptyTemplate").content.cloneNode(true);
  template.querySelector("span").textContent = text;
  return template;
}

function exportArchive() {
  const rows = [
    ["任务名称", "周期", "类别", "应办日期", "状态", "完成时间", "备注", "未完成原因"],
    ...state.instances.map((item) => [
      item.title,
      cycleLabels[item.cycle],
      item.category,
      item.dueDate,
      statusLabels[item.status],
      item.completedAt ? item.completedAt.slice(0, 16).replace("T", " ") : "",
      item.workNote || item.note || "",
      item.reason || ""
    ])
  ];
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
  const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `工作留档记录-${toISO(new Date())}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function startVoiceInput(button) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const fieldName = button.dataset.voiceField;
  const field = els.templateForm.elements[fieldName];

  if (!field) return;

  if (!SpeechRecognition) {
    alert("当前浏览器不支持网页语音识别。可以点输入框后使用手机键盘自带的麦克风听写。");
    field.focus();
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "zh-CN";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  const originalText = button.textContent;
  button.textContent = "正在听";
  button.classList.add("listening");
  button.disabled = true;

  recognition.onresult = (event) => {
    const text = event.results?.[0]?.[0]?.transcript?.trim();
    if (!text) return;
    const separator = field.value && field.tagName === "TEXTAREA" ? "\n" : "";
    field.value = field.value ? `${field.value}${separator}${text}` : text;
    field.dispatchEvent(new Event("input", { bubbles: true }));
    field.focus();
  };

  recognition.onerror = () => {
    alert("没有识别到语音。请确认浏览器允许麦克风权限，或使用手机键盘自带语音输入。");
  };

  recognition.onend = () => {
    button.textContent = originalText;
    button.classList.remove("listening");
    button.disabled = false;
  };

  recognition.start();
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  if (location.protocol === "file:") return;
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}

function startOfWeek(date) {
  const current = new Date(date);
  const day = current.getDay() || 7;
  current.setDate(current.getDate() - day + 1);
  current.setHours(0, 0, 0, 0);
  return current;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function getWeekKey(date) {
  return toISO(startOfWeek(date));
}

function getMonthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getQuarterKey(date) {
  return `${date.getFullYear()}-Q${Math.floor(date.getMonth() / 3) + 1}`;
}

function getQuarterLabel(date) {
  return `${date.getFullYear()}年第${Math.floor(date.getMonth() / 3) + 1}季度`;
}

function getWeekRangeLabel(date) {
  const start = startOfWeek(date);
  const end = addDays(start, 6);
  return `${toShortDate(start)} - ${toShortDate(end)}`;
}

function toISO(date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function toShortDate(date) {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function formatDateCN(date) {
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

function daysBetween(startIso, endIso) {
  const start = new Date(`${startIso}T00:00:00`);
  const end = new Date(`${endIso}T00:00:00`);
  return Math.round((end - start) / 86400000);
}

function escapeHTML(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHTML(value).replaceAll("\n", " ");
}
