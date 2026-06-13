const STORAGE_KEY = "pilates-coach-agent-v1";
const IMAGE_GENERATION_ENDPOINT = "https://xiaoji.baziapi.site/v1/images/generations";
const POSTURE_OPTIONS = ["头前引", "圆肩", "骨盆前倾", "骨盆后倾", "脊柱侧弯", "长短腿", "X型腿", "O型腿", "高足弓", "扁平足"];
const TRAINING_MODULES = ["核心", "呼吸", "肩颈", "上肢", "脊柱", "髋", "下肢", "足踝", "平衡", "柔韧"];
const DIFFICULTY_LABELS = ["", "轻量", "基础", "中等", "进阶", "挑战"];
const BODY_CAPACITY_DIMENSIONS = ["核心稳定性", "呼吸能力", "平衡能力", "柔韧性", "髋稳定", "肩稳定", "胸椎灵活度", "臀激活能力", "本体感觉"];
const ACTION_LIBRARY = [
  {
    name: "90/90 呼吸",
    equipment: "垫上",
    difficulty: 1,
    modules: ["呼吸", "核心"],
    problems: ["肋骨外翻", "腰痛", "压力偏高", "呼吸模式异常"],
    reason: "帮助会员找到肋骨回收与腹内压，适合作为低风险热身和疼痛期回归动作。"
  },
  {
    name: "Dead Bug",
    equipment: "垫上",
    difficulty: 2,
    modules: ["核心", "脊柱"],
    problems: ["核心薄弱", "骨盆前倾", "腰痛"],
    reason: "训练抗伸展控制，减少腰椎代偿，适合建立骨盆中立位下的核心稳定。"
  },
  {
    name: "肩桥",
    equipment: "垫上",
    difficulty: 2,
    modules: ["髋", "核心", "脊柱"],
    problems: ["臀部无力", "骨盆前倾", "腰痛"],
    reason: "唤醒臀大肌与后侧链，帮助会员把腰部压力转移到髋伸展能力上。"
  },
  {
    name: "Reformer Footwork",
    equipment: "核心床",
    difficulty: 2,
    modules: ["下肢", "髋", "足踝"],
    problems: ["膝盖不适", "X型腿", "O型腿", "足弓问题"],
    reason: "在可控阻力下建立下肢对线，适合观察足弓、膝轨迹与左右侧差异。"
  },
  {
    name: "Mermaid",
    equipment: "核心床",
    difficulty: 3,
    modules: ["脊柱", "柔韧", "呼吸"],
    problems: ["脊柱侧弯", "肩颈酸痛", "久坐"],
    reason: "改善侧向呼吸与脊柱侧屈活动度，适合久坐型会员释放躯干张力。"
  },
  {
    name: "Roll Down Bar",
    equipment: "凯迪拉克",
    difficulty: 3,
    modules: ["脊柱", "核心", "肩颈"],
    problems: ["驼背", "圆肩", "头前引"],
    reason: "通过弹簧辅助建立脊柱逐节卷动，但颈部代偿明显者需降低幅度。"
  },
  {
    name: "Side Lying Leg Series",
    equipment: "垫上",
    difficulty: 3,
    modules: ["髋", "平衡", "下肢"],
    problems: ["假胯宽", "臀部无力", "骨盆侧倾"],
    reason: "强化臀中肌与骨盆侧向稳定，有助于改善站姿和单腿控制。"
  },
  {
    name: "Swan Prep",
    equipment: "垫上",
    difficulty: 3,
    modules: ["脊柱", "上肢", "肩颈"],
    problems: ["圆肩", "驼背", "胸椎灵活度不足"],
    reason: "促进胸椎伸展和肩胛稳定，但腰椎敏感者要控制幅度。"
  },
  {
    name: "Standing Scooter",
    equipment: "核心床",
    difficulty: 4,
    modules: ["髋", "平衡", "下肢"],
    problems: ["臀部无力", "单腿稳定差", "体态塑形"],
    reason: "训练动态髋稳定和单腿控制，适合作为中后期进阶动作。"
  },
  {
    name: "Long Stretch",
    equipment: "核心床",
    difficulty: 5,
    modules: ["核心", "肩稳定", "上肢"],
    problems: ["核心薄弱", "肩稳定不足", "提升气质"],
    reason: "对核心、肩胛和全身张力要求高，适合控制力稳定后的挑战。"
  }
];
const IMAGE_SIZE_OPTIONS = ["1024x1024", "1024x1536", "1536x1024", "512x512"];
const IMAGE_STYLE_PRESETS = [
  "专业普拉提会员体态分析图，干净明亮的工作室背景，真实自然，适合教练端分享",
  "温暖柔和的康复训练插画，强调呼吸、核心稳定与身体觉察，简洁高级",
  "普拉提动作教学海报，清晰姿势、留白构图、专业但不营销"
];

const state = loadState();
let currentView = "dashboard";

const els = {
  pageTitle: document.getElementById("pageTitle"),
  memberSelect: document.getElementById("memberSelect"),
  newMemberBtn: document.getElementById("newMemberBtn"),
  toast: document.getElementById("toast"),
  modal: document.getElementById("modal"),
  modalTitle: document.getElementById("modalTitle"),
  modalBody: document.getElementById("modalBody")
};

document.querySelectorAll(".nav-btn").forEach((button) => {
  button.addEventListener("click", () => switchView(button.dataset.view));
});

document.querySelectorAll("[data-close-modal]").forEach((button) => {
  button.addEventListener("click", closeModal);
});

els.memberSelect.addEventListener("change", () => {
  state.activeMemberId = els.memberSelect.value || null;
  saveState();
  renderAll();
});

els.newMemberBtn.addEventListener("click", () => {
  state.activeMemberId = null;
  saveState();
  switchView("members");
});

renderAll();

function loadState() {
  const fallback = {
    version: 1,
    activeMemberId: null,
    activeSessionId: null,
    imageSettings: createDefaultImageSettings(),
    members: [],
    sessions: [],
    images: []
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return {
      ...fallback,
      ...parsed,
      members: Array.isArray(parsed.members) ? parsed.members : [],
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      images: Array.isArray(parsed.images) ? parsed.images : [],
      imageSettings: {
        ...createDefaultImageSettings(),
        ...(parsed.imageSettings || {})
      }
    };
  } catch {
    return fallback;
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function renderAll() {
  normalizeActiveMember();
  renderMemberSelect();
  renderDashboard();
  renderMemberForm();
  renderSessionForm();
  renderSummaryView();
  renderReportsView();
  renderAnalysisView();
  renderLibraryView();
  renderImagesView();
  renderDataView();
}

function normalizeActiveMember() {
  if (state.activeMemberId && getMember(state.activeMemberId)) return;
  state.activeMemberId = state.members[0]?.id || null;
}

function renderMemberSelect() {
  els.memberSelect.innerHTML = "";

  if (!state.members.length) {
    els.memberSelect.innerHTML = '<option value="">暂无会员</option>';
    return;
  }

  state.members.forEach((member) => {
    const option = document.createElement("option");
    option.value = member.id;
    option.textContent = member.basic.name || "未命名会员";
    option.selected = member.id === state.activeMemberId;
    els.memberSelect.appendChild(option);
  });
}

function switchView(view) {
  currentView = view;
  const titleMap = {
    dashboard: "总览",
    members: "会员档案",
    sessions: "课程记录",
    summary: "智能总结",
    reports: "进度报告",
    analysis: "AI分析中心",
    library: "动作库",
    images: "画图",
    data: "数据管理"
  };

  document.querySelectorAll(".nav-btn").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === view);
  });
  document.querySelectorAll(".view").forEach((section) => {
    section.classList.toggle("active", section.id === `view-${view}`);
  });
  els.pageTitle.textContent = titleMap[view] || "总览";
  renderAll();
}

function renderDashboard() {
  const root = document.getElementById("view-dashboard");
  const member = getActiveMember();
  const sessions = member ? getMemberSessions(member.id) : [];
  const monthSessions = state.sessions.filter((session) => daysBetween(session.date, todayISO()) <= 30).length;
  const painAlerts = state.members.reduce((count, item) => count + buildPainAlerts(item).length, 0);
  const coverage = member ? buildCoverageReminder(member.id) : [];

  root.innerHTML = `
    <section class="panel workspace-hero">
      <div>
        <p class="eyebrow">AI Body Management CRM</p>
        <h2>AI普拉提会员成长系统</h2>
        <p>持续记录身体状态、训练逻辑与会员反馈，把每一次私教课沉淀成可复盘、可沟通、可续课的专业资产。</p>
      </div>
      <div class="tag-row">
        <span class="tag">身体数据记忆</span>
        <span class="tag">训练去重复</span>
        <span class="tag">风险识别</span>
        <span class="tag">会员轻奢反馈</span>
      </div>
    </section>
    <div class="grid three">
      ${metric("会员数", state.members.length, "本地档案")}
      ${metric("近30天课程", monthSessions, "全部会员")}
      ${metric("疼痛预警", painAlerts, "需持续关注")}
    </div>
    <div class="grid two" style="margin-top:16px;">
      <section class="panel">
        <h2>当前会员</h2>
        ${member ? renderMemberSnapshot(member, sessions) : emptyState("先建立一位会员档案")}
      </section>
      <section class="panel">
        <h2>训练提醒</h2>
        ${member ? renderDashboardWarnings(member, coverage) : emptyState("选择会员后显示提醒")}
      </section>
    </div>
    <section class="panel" style="margin-top:16px;">
      <h2>最近课程</h2>
      ${renderRecentSessions(member ? sessions : state.sessions)}
    </section>
  `;
}

function metric(label, value, subtext) {
  return `
    <div class="metric">
      <span>${escapeHTML(label)}</span>
      <strong>${escapeHTML(String(value))}</strong>
      <small>${escapeHTML(subtext)}</small>
    </div>
  `;
}

function renderMemberSnapshot(member, sessions) {
  const pain = formatPain(member.health.currentPain);
  const goals = [
    ...member.goals.shortTermGoals.slice(0, 2),
    ...member.goals.longTermGoals.slice(0, 1)
  ];

  return `
    <div class="stack">
      <div class="tag-row">
        <span class="tag">${escapeHTML(member.basic.gender || "未填性别")}</span>
        <span class="tag">${escapeHTML(member.basic.age ? `${member.basic.age}岁` : "年龄未填")}</span>
        <span class="tag">${escapeHTML(member.goals.weeklyFrequency ? `每周${member.goals.weeklyFrequency}次` : "频率未填")}</span>
      </div>
      <p><strong>${escapeHTML(member.basic.name || "未命名会员")}</strong></p>
      <p>主诉：${escapeHTML(member.goals.chiefComplaint || "未填写")}</p>
      <p>当前疼痛：${escapeHTML(pain || "未记录")}</p>
      <p>已记录课程：${sessions.length} 次</p>
      <div class="tag-row">${goals.length ? goals.map((goal) => `<span class="tag">${escapeHTML(goal)}</span>`).join("") : '<span class="tag">目标未填写</span>'}</div>
    </div>
  `;
}

function renderDashboardWarnings(member, coverage) {
  const painAlerts = buildPainAlerts(member);
  const contraindications = member.health.contraindications;
  const notices = [];

  if (painAlerts.length) {
    notices.push(`<div class="notice danger">${painAlerts.map(escapeHTML).join("<br>")}</div>`);
  }
  if (coverage.length) {
    notices.push(`<div class="notice warn">近4次较少覆盖：${coverage.map(escapeHTML).join("、")}</div>`);
  }
  if (contraindications.length) {
    notices.push(`<div class="notice warn">禁忌动作：${contraindications.map(escapeHTML).join("、")}</div>`);
  }
  if (!notices.length) {
    notices.push('<div class="notice good">当前没有高风险提醒</div>');
  }

  return notices.join("");
}

function renderRecentSessions(sessions) {
  const recent = [...sessions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
  if (!recent.length) return emptyState("暂无课程记录");

  return `
    <div class="stack">
      ${recent.map((session) => {
        const member = getMember(session.memberId);
        return `
          <article class="list-item">
            <header>
              <strong>${escapeHTML(session.date)} · 第${escapeHTML(String(session.sessionNo || "-"))}次课</strong>
              <span>${escapeHTML(member?.basic.name || "未知会员")}</span>
            </header>
            <p>${escapeHTML(session.actions.map((action) => action.name).filter(Boolean).join("、") || "未填写动作")}</p>
            <div class="tag-row">
              <span class="tag">完成度 ${escapeHTML(session.feedback.completion || "未填")}</span>
              <span class="tag">吃力 ${escapeHTML(String(session.feedback.effort || "-"))}/10</span>
              <span class="tag">疼痛 ${escapeHTML(session.feedback.painScore ? `${session.feedback.painArea || "未标注"} ${session.feedback.painScore}/10` : "无记录")}</span>
            </div>
          </article>
        `;
      }).join("")}
    </div>
  `;
}

function renderMemberForm() {
  const root = document.getElementById("view-members");
  const member = getActiveMember();
  const formData = member || createEmptyMember();

  root.innerHTML = `
    <form id="memberForm">
      <input type="hidden" name="id" value="${escapeAttr(member?.id || "")}" />
      <fieldset class="form-section">
        <legend>基本信息</legend>
        <div class="form-grid">
          ${field("姓名", "name", formData.basic.name)}
          ${selectField("性别", "gender", formData.basic.gender, ["", "女", "男", "其他"])}
          ${field("年龄", "age", formData.basic.age, "number")}
          ${field("身高 cm", "height", formData.basic.height, "number")}
          ${field("体重 kg", "weight", formData.basic.weight, "number")}
          ${field("联系方式", "contact", formData.basic.contact)}
          ${field("建档日期", "archiveDate", formData.basic.archiveDate || todayISO(), "date")}
          ${field("职业/作息特点", "occupationPattern", formData.basic.occupationPattern, "text", "full")}
        </div>
      </fieldset>

      <fieldset class="form-section">
        <legend>健康与体态评估</legend>
        <div class="form-grid">
          ${textareaField("既往病史", "medicalHistory", formData.health.medicalHistory, "half")}
          ${textareaField("手术史", "surgeryHistory", formData.health.surgeryHistory, "half")}
          ${textareaField("慢性疼痛部位", "chronicPainAreas", formData.health.chronicPainAreas.join("、"), "half")}
          ${textareaField("当前疼痛/不适", "currentPain", serializePain(formData.health.currentPain), "half")}
          ${checkboxes("体态评估", "postureFlags", POSTURE_OPTIONS, formData.health.postureFlags)}
          ${field("产后时间（月）", "postpartumMonths", formData.health.postpartum.months, "number", "half")}
          ${selectField("分娩方式", "deliveryMethod", formData.health.postpartum.deliveryMethod, ["", "顺产", "剖宫产", "其他"], "half")}
          <label class="check-pill field half">
            <input type="checkbox" name="postpartumEnabled" ${formData.health.postpartum.enabled ? "checked" : ""} />
            是否产后
          </label>
          ${textareaField("关节活动度限制", "mobilityLimits", formData.health.mobilityLimits.join("、"), "half")}
          ${textareaField("肌力薄弱部位", "weakMuscles", formData.health.weakMuscles.join("、"), "half")}
          ${textareaField("运动禁忌动作", "contraindications", formData.health.contraindications.join("、"), "half")}
          ${textareaField("慎做动作", "cautiousActions", formData.health.cautiousActions.join("、"), "half")}
        </div>
      </fieldset>

      <fieldset class="form-section">
        <legend>训练目标</legend>
        <div class="form-grid">
          ${textareaField("主诉问题", "chiefComplaint", formData.goals.chiefComplaint, "full")}
          ${textareaField("短期目标 1-3个月", "shortTermGoals", formData.goals.shortTermGoals.join("\\n"), "half")}
          ${textareaField("长期目标 3-12个月", "longTermGoals", formData.goals.longTermGoals.join("\\n"), "half")}
          ${textareaField("运动经验背景", "exerciseBackground", formData.goals.exerciseBackground, "half")}
          ${field("训练频率 每周次数", "weeklyFrequency", formData.goals.weeklyFrequency, "number", "half")}
        </div>
      </fieldset>

      <fieldset class="form-section">
        <legend>特殊注意事项</legend>
        <div class="form-grid">
          ${textareaField("心理偏好/沟通方式偏好", "communicationStyle", formData.preferences.communicationStyle, "half")}
          ${textareaField("特殊时期标记", "specialPeriod", formData.preferences.specialPeriod, "half")}
        </div>
      </fieldset>

      <div class="actions">
        <button class="primary-btn" type="submit">${member ? "保存档案" : "创建档案"}</button>
        ${member ? '<button class="danger-btn" type="button" id="deleteMemberBtn">删除会员</button>' : ""}
      </div>
    </form>
  `;

  document.getElementById("memberForm").addEventListener("submit", saveMemberFromForm);
  document.getElementById("deleteMemberBtn")?.addEventListener("click", deleteActiveMember);
}

function saveMemberFromForm(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const id = data.get("id") || makeId("member");
  const existing = getMember(id);
  const now = new Date().toISOString();

  const member = {
    id,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    basic: {
      name: clean(data.get("name")),
      gender: clean(data.get("gender")),
      age: numberOrNull(data.get("age")),
      height: numberOrNull(data.get("height")),
      weight: numberOrNull(data.get("weight")),
      contact: clean(data.get("contact")),
      archiveDate: clean(data.get("archiveDate")) || todayISO(),
      occupationPattern: clean(data.get("occupationPattern"))
    },
    health: {
      medicalHistory: clean(data.get("medicalHistory")),
      surgeryHistory: clean(data.get("surgeryHistory")),
      chronicPainAreas: parseList(data.get("chronicPainAreas")),
      postpartum: {
        enabled: data.get("postpartumEnabled") === "on",
        months: numberOrNull(data.get("postpartumMonths")),
        deliveryMethod: clean(data.get("deliveryMethod"))
      },
      postureFlags: data.getAll("postureFlags"),
      mobilityLimits: parseList(data.get("mobilityLimits")),
      weakMuscles: parseList(data.get("weakMuscles")),
      currentPain: parsePain(data.get("currentPain")),
      contraindications: parseList(data.get("contraindications")),
      cautiousActions: parseList(data.get("cautiousActions"))
    },
    goals: {
      chiefComplaint: clean(data.get("chiefComplaint")),
      shortTermGoals: parseLines(data.get("shortTermGoals")),
      longTermGoals: parseLines(data.get("longTermGoals")),
      exerciseBackground: clean(data.get("exerciseBackground")),
      weeklyFrequency: numberOrNull(data.get("weeklyFrequency"))
    },
    preferences: {
      communicationStyle: clean(data.get("communicationStyle")),
      specialPeriod: clean(data.get("specialPeriod"))
    }
  };

  if (!member.basic.name) {
    showModal("档案未保存", "请先填写会员姓名。");
    return;
  }

  const index = state.members.findIndex((item) => item.id === id);
  if (index >= 0) state.members[index] = member;
  else state.members.push(member);

  state.activeMemberId = id;
  saveState();
  renderAll();
  showToast("会员档案已保存");
}

function deleteActiveMember() {
  const member = getActiveMember();
  if (!member) return;
  const ok = window.confirm(`确认删除 ${member.basic.name || "该会员"} 的档案和课程记录？`);
  if (!ok) return;

  state.members = state.members.filter((item) => item.id !== member.id);
  state.sessions = state.sessions.filter((session) => session.memberId !== member.id);
  state.activeMemberId = state.members[0]?.id || null;
  state.activeSessionId = null;
  saveState();
  renderAll();
  showToast("会员已删除");
}

function renderSessionForm() {
  const root = document.getElementById("view-sessions");
  const member = getActiveMember();

  if (!member) {
    root.innerHTML = emptyState("请先建立会员档案");
    return;
  }

  const nextNo = getMemberSessions(member.id).length + 1;
  root.innerHTML = `
    <form id="sessionForm">
      <section id="riskPanel"></section>
      <fieldset class="form-section">
        <legend>课程信息</legend>
        <div class="form-grid">
          ${field("课程日期", "date", todayISO(), "date", "half")}
          ${field("第几次课", "sessionNo", nextNo, "number", "half")}
        </div>
      </fieldset>

      <fieldset class="form-section">
        <legend>训练动作清单</legend>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>动作名称</th>
                <th>组数</th>
                <th>次数/时长</th>
                <th>器械</th>
                <th>难度</th>
                <th>模块</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody id="actionRows"></tbody>
          </table>
        </div>
        <div class="actions">
          <button class="secondary-btn" type="button" id="addActionBtn">添加动作</button>
          <button class="plain-btn" type="button" id="checkRiskBtn">检查风险</button>
        </div>
      </fieldset>

      <fieldset class="form-section">
        <legend>会员反馈</legend>
        <div class="form-grid">
          ${selectField("完成度", "completion", "", ["", "轻松完成", "良好", "勉强完成", "未完成"], "half")}
          ${field("吃力程度 1-10", "effort", "", "number", "half")}
          ${field("疼痛/不适部位", "painArea", "", "text", "half")}
          ${field("疼痛程度 1-10", "painScore", "", "number", "half")}
          ${selectField("情绪状态", "emotion", "", ["", "稳定", "积极", "紧张", "疲惫", "抗拒"], "half")}
          ${textareaField("自由文本备注", "feedbackNotes", "", "half")}
        </div>
      </fieldset>

      <fieldset class="form-section">
        <legend>教练观察</legend>
        <div class="form-grid">
          ${textareaField("动作完成质量", "quality", "", "half")}
          ${textareaField("代偿模式", "compensation", "", "half")}
          ${textareaField("进步迹象", "progress", "", "full")}
        </div>
      </fieldset>

      <div class="actions">
        <button class="primary-btn" type="submit">保存课程并生成总结</button>
      </div>
    </form>
  `;

  document.getElementById("addActionBtn").addEventListener("click", () => addActionRow());
  document.getElementById("checkRiskBtn").addEventListener("click", () => renderRiskPanel(true));
  document.getElementById("sessionForm").addEventListener("submit", saveSessionFromForm);
  addActionRow();
  renderRiskPanel(false);
}

function addActionRow(action = {}) {
  const tbody = document.getElementById("actionRows");
  if (!tbody) return;
  const row = document.createElement("tr");
  row.innerHTML = `
    <td><input data-action-field="name" value="${escapeAttr(action.name || "")}" placeholder="如 肩桥" /></td>
    <td><input class="small-input" data-action-field="sets" type="number" value="${escapeAttr(action.sets || "")}" /></td>
    <td><input data-action-field="reps" value="${escapeAttr(action.reps || "")}" placeholder="12 / 45秒" /></td>
    <td><input data-action-field="equipment" value="${escapeAttr(action.equipment || "")}" placeholder="垫上/核心床" /></td>
    <td>
      <select data-action-field="difficulty">
        ${[1, 2, 3, 4, 5].map((level) => `<option value="${level}" ${Number(action.difficulty || 3) === level ? "selected" : ""}>${level} ${DIFFICULTY_LABELS[level]}</option>`).join("")}
      </select>
    </td>
    <td><input data-action-field="targets" value="${escapeAttr((action.targets || []).join("、"))}" placeholder="核心、髋" /></td>
    <td><button class="plain-btn" type="button" data-remove-row>删除</button></td>
  `;
  row.querySelector("[data-remove-row]").addEventListener("click", () => {
    row.remove();
    renderRiskPanel(false);
  });
  row.querySelectorAll("input, select").forEach((input) => {
    input.addEventListener("input", () => renderRiskPanel(false));
  });
  tbody.appendChild(row);
}

function saveSessionFromForm(event) {
  event.preventDefault();
  const member = getActiveMember();
  if (!member) return;

  const form = event.currentTarget;
  const data = new FormData(form);
  const actions = collectActionRows();
  if (!actions.length) {
    showModal("课程未保存", "请至少填写一个训练动作。");
    return;
  }

  const draftSession = {
    id: makeId("session"),
    memberId: member.id,
    date: clean(data.get("date")) || todayISO(),
    sessionNo: numberOrNull(data.get("sessionNo")) || getMemberSessions(member.id).length + 1,
    actions,
    feedback: {
      completion: clean(data.get("completion")),
      effort: clamp(numberOrNull(data.get("effort")), 1, 10),
      painArea: clean(data.get("painArea")),
      painScore: clamp(numberOrNull(data.get("painScore")), 0, 10),
      emotion: clean(data.get("emotion")),
      notes: clean(data.get("feedbackNotes"))
    },
    observation: {
      quality: clean(data.get("quality")),
      compensation: clean(data.get("compensation")),
      progress: clean(data.get("progress"))
    },
    summary: "",
    createdAt: new Date().toISOString()
  };

  const advisories = analyzeSession(member, draftSession);
  if (advisories.blockers.length) {
    showModal("禁忌动作已拦截", advisories.blockers.join("<br>"));
    return;
  }

  draftSession.summary = buildSingleSummary(member, draftSession, advisories);
  state.sessions.push(draftSession);
  state.activeSessionId = draftSession.id;
  saveState();
  renderAll();
  switchView("summary");
  showToast("课程已保存，总结已生成");
}

function collectActionRows() {
  return [...document.querySelectorAll("#actionRows tr")]
    .map((row) => {
      const read = (name) => row.querySelector(`[data-action-field="${name}"]`)?.value || "";
      return {
        name: clean(read("name")),
        sets: numberOrNull(read("sets")),
        reps: clean(read("reps")),
        equipment: clean(read("equipment")),
        difficulty: Number(read("difficulty")) || 3,
        targets: parseList(read("targets"))
      };
    })
    .filter((action) => action.name);
}

function renderRiskPanel(showCleanMessage) {
  const member = getActiveMember();
  const panel = document.getElementById("riskPanel");
  if (!member || !panel) return;

  const form = document.getElementById("sessionForm");
  const data = form ? new FormData(form) : new FormData();
  const session = {
    memberId: member.id,
    date: clean(data.get("date")) || todayISO(),
    actions: collectActionRows(),
    feedback: {
      painArea: clean(data.get("painArea")),
      painScore: clamp(numberOrNull(data.get("painScore")), 0, 10)
    }
  };
  const advisories = analyzeSession(member, session);
  const chunks = [];

  advisories.blockers.forEach((text) => chunks.push(`<div class="notice danger">${escapeHTML(text)}</div>`));
  advisories.warnings.forEach((text) => chunks.push(`<div class="notice warn">${escapeHTML(text)}</div>`));
  advisories.tips.forEach((text) => chunks.push(`<div class="notice good">${escapeHTML(text)}</div>`));
  if (!chunks.length && showCleanMessage) chunks.push('<div class="notice good">当前动作未触发风险规则</div>');
  panel.innerHTML = chunks.join("");
}

function renderSummaryView() {
  const root = document.getElementById("view-summary");
  const member = getActiveMember();

  if (!member) {
    root.innerHTML = emptyState("请先建立会员档案");
    return;
  }

  const sessions = getMemberSessions(member.id);
  const active = sessions.find((session) => session.id === state.activeSessionId) || sessions.at(-1);

  if (!active) {
    root.innerHTML = emptyState("保存课程后生成单课总结");
    return;
  }
  const summaryText = active.summary && active.summary.includes("Output 1")
    ? active.summary
    : buildSingleSummary(member, active, analyzeSession(member, active));

  root.innerHTML = `
    <div class="grid two">
      <section class="panel">
        <h2>课程选择</h2>
        <label class="field">
          <span>课程</span>
          <select id="summarySessionSelect">
            ${sessions.map((session) => `<option value="${escapeAttr(session.id)}" ${session.id === active.id ? "selected" : ""}>${escapeHTML(session.date)} · 第${escapeHTML(String(session.sessionNo))}次课</option>`).join("")}
          </select>
        </label>
        <div class="actions">
          <button class="secondary-btn" type="button" id="copySummaryBtn">复制总结</button>
          <button class="plain-btn" type="button" id="exportSummaryBtn">导出文本</button>
        </div>
      </section>
      <section class="panel">
        <h2>课程快照</h2>
        <p>会员：${escapeHTML(member.basic.name)}</p>
        <p>动作：${escapeHTML(active.actions.map((action) => action.name).join("、"))}</p>
        <p>反馈：${escapeHTML(active.feedback.completion || "未填")}，吃力 ${escapeHTML(String(active.feedback.effort || "-"))}/10</p>
      </section>
    </div>
    <section class="panel" style="margin-top:16px;">
      <h2>单课总结</h2>
      <div class="summary-box" id="summaryText">${escapeHTML(summaryText)}</div>
    </section>
  `;

  document.getElementById("summarySessionSelect").addEventListener("change", (event) => {
    state.activeSessionId = event.target.value;
    saveState();
    renderSummaryView();
  });
  document.getElementById("copySummaryBtn").addEventListener("click", () => copyText(getText("summaryText")));
  document.getElementById("exportSummaryBtn").addEventListener("click", () => exportText(`${member.basic.name || "会员"}-单课总结.txt`, getText("summaryText")));
}

function renderReportsView() {
  const root = document.getElementById("view-reports");
  const member = getActiveMember();

  if (!member) {
    root.innerHTML = emptyState("请先建立会员档案");
    return;
  }

  const end = todayISO();
  const start = shiftDate(end, -30);
  const report = buildProgressReport(member, start, end);
  const sessions = filterSessionsByRange(getMemberSessions(member.id), start, end);

  root.innerHTML = `
    <section class="panel">
      <h2>周期设置</h2>
      <div class="form-grid">
        ${field("开始日期", "reportStart", start, "date", "half")}
        ${field("结束日期", "reportEnd", end, "date", "half")}
      </div>
      <div class="actions">
        <button class="primary-btn" type="button" id="generateReportBtn">生成报告</button>
        <button class="secondary-btn" type="button" id="copyReportBtn">复制报告</button>
        <button class="plain-btn" type="button" id="exportReportBtn">导出文本</button>
      </div>
    </section>
    <div class="grid two" style="margin-top:16px;">
      <section class="panel">
        <h2>训练强度变化</h2>
        ${renderIntensityChart(sessions)}
      </section>
      <section class="panel">
        <h2>覆盖模块</h2>
        ${renderModuleCoverage(sessions)}
      </section>
    </div>
    <section class="panel" style="margin-top:16px;">
      <h2>累积进度总结</h2>
      <div class="report-box" id="reportText">${escapeHTML(report)}</div>
    </section>
    <section class="panel" style="margin-top:16px;">
      <h2>会员成长/续课沟通版</h2>
      <div class="report-box compact" id="renewalReportText">${escapeHTML(buildRenewalSummary(member, sessions))}</div>
      <div class="actions">
        <button class="secondary-btn" type="button" id="copyRenewalReportBtn">复制续课版</button>
      </div>
    </section>
  `;

  document.getElementById("generateReportBtn").addEventListener("click", () => {
    const startValue = document.querySelector('[name="reportStart"]').value;
    const endValue = document.querySelector('[name="reportEnd"]').value;
    document.getElementById("reportText").textContent = buildProgressReport(member, startValue, endValue);
  });
  document.getElementById("copyReportBtn").addEventListener("click", () => copyText(getText("reportText")));
  document.getElementById("exportReportBtn").addEventListener("click", () => exportText(`${member.basic.name || "会员"}-进度报告.txt`, getText("reportText")));
  document.getElementById("copyRenewalReportBtn").addEventListener("click", () => copyText(getText("renewalReportText")));
}

function renderAnalysisView() {
  const root = document.getElementById("view-analysis");
  const member = getActiveMember();

  if (!member) {
    root.innerHTML = emptyState("请先建立会员档案");
    return;
  }

  const sessions = getMemberSessions(member.id);
  const analysis = buildMemberAnalysis(member, sessions);
  const renewalText = buildRenewalSummary(member, sessions);
  const timeline = buildTimelineItems(member, sessions);

  root.innerHTML = `
    <div class="grid three">
      ${metric("已记录课程", sessions.length, "长期成长资产")}
      ${metric("高频动作", analysis.repeatedActions.length, "需留意重复")}
      ${metric("风险提醒", analysis.riskAlerts.length, "课前重点查看")}
    </div>
    <div class="grid two" style="margin-top:16px;">
      <section class="panel">
        <h2>智能提醒</h2>
        ${renderAnalysisNotices(analysis)}
      </section>
      <section class="panel">
        <h2>4周训练方向</h2>
        <div class="summary-box compact">${escapeHTML(buildFourWeekPlan(member, sessions, analysis))}</div>
      </section>
    </div>
    <div class="grid two" style="margin-top:16px;">
      <section class="panel">
        <h2>体态变化时间轴</h2>
        ${renderTimeline(timeline)}
      </section>
      <section class="panel">
        <h2>续课沟通素材</h2>
        <div class="summary-box compact" id="renewalText">${escapeHTML(renewalText)}</div>
        <div class="actions">
          <button class="secondary-btn" type="button" id="copyRenewalBtn">复制续课总结</button>
        </div>
      </section>
    </div>
  `;

  document.getElementById("copyRenewalBtn").addEventListener("click", () => copyText(getText("renewalText")));
}

function renderLibraryView() {
  const root = document.getElementById("view-library");
  const member = getActiveMember();
  const sessions = member ? getMemberSessions(member.id) : [];
  const suggested = member ? recommendActions(member, sessions) : ACTION_LIBRARY;

  root.innerHTML = `
    <section class="panel">
      <h2>动作库智能推荐</h2>
      ${member ? `<p>根据 ${escapeHTML(member.basic.name || "当前会员")} 的主诉、体态标签、薄弱部位与训练历史推荐。</p>` : "<p>选择会员后会按档案和训练历史自动排序推荐。</p>"}
      <div class="actions">
        <button class="plain-btn" type="button" data-library-filter="all">全部</button>
        <button class="plain-btn" type="button" data-library-filter="核心">核心</button>
        <button class="plain-btn" type="button" data-library-filter="肩颈">肩颈</button>
        <button class="plain-btn" type="button" data-library-filter="髋">髋</button>
        <button class="plain-btn" type="button" data-library-filter="脊柱">脊柱</button>
      </div>
    </section>
    <section class="panel" style="margin-top:16px;">
      <div id="libraryGrid" class="library-grid">
        ${renderActionCards(suggested)}
      </div>
    </section>
  `;

  document.querySelectorAll("[data-library-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.libraryFilter;
      const items = filter === "all" ? suggested : suggested.filter((item) => item.modules.includes(filter));
      document.getElementById("libraryGrid").innerHTML = renderActionCards(items);
    });
  });
}

function renderImagesView() {
  const root = document.getElementById("view-images");
  const member = getActiveMember();
  const settings = state.imageSettings || createDefaultImageSettings();
  const memberPrompt = member ? buildMemberImagePrompt(member) : "";
  const recentImages = [...(state.images || [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 12);

  root.innerHTML = `
    <div class="grid two">
      <section class="panel">
        <h2>生成图片</h2>
        <form id="imageForm" class="stack">
          <label class="field">
            <span>提示词</span>
            <textarea name="prompt" id="imagePrompt" placeholder="例如：普拉提肩颈放松动作教学图，明亮工作室，专业温暖">${escapeHTML(memberPrompt)}</textarea>
          </label>
          <div class="actions">
            <button class="plain-btn" type="button" data-preset-index="0">体态图</button>
            <button class="plain-btn" type="button" data-preset-index="1">康复插画</button>
            <button class="plain-btn" type="button" data-preset-index="2">动作海报</button>
          </div>
          <div class="form-grid">
            ${field("模型", "imageModel", settings.model, "text", "half")}
            ${selectField("尺寸", "imageSize", settings.size, IMAGE_SIZE_OPTIONS, "half")}
            ${field("数量", "imageCount", settings.count || 1, "number", "half")}
            ${field("API Key", "imageApiKey", settings.apiKey, "password", "half")}
            ${field("接口地址", "imageEndpoint", settings.endpoint || IMAGE_GENERATION_ENDPOINT, "url", "full")}
          </div>
          <label class="check-pill">
            <input type="checkbox" name="useProxy" ${settings.useProxy ? "checked" : ""} />
            使用本地代理请求接口
          </label>
          <div class="notice warn">如果直接打开文件时生成失败，请用项目内的 <code>server.js</code> 启动本地服务后勾选本地代理。</div>
          <div class="actions">
            <button class="primary-btn" type="submit" id="generateImageBtn">生成图片</button>
            <button class="secondary-btn" type="button" id="saveImageSettingsBtn">保存配置</button>
          </div>
        </form>
      </section>
      <section class="panel">
        <h2>生成结果</h2>
        <div id="imageStatus" class="notice good">输入提示词后点击生成。</div>
        <div id="imageResult" class="image-result">${emptyState("暂无图片")}</div>
      </section>
    </div>
    <section class="panel" style="margin-top:16px;">
      <h2>图片历史</h2>
      <div id="imageHistory">
        ${renderImageHistory(recentImages)}
      </div>
    </section>
  `;

  document.querySelectorAll("[data-preset-index]").forEach((button) => {
    button.addEventListener("click", () => {
      const prompt = document.getElementById("imagePrompt");
      const preset = IMAGE_STYLE_PRESETS[Number(button.dataset.presetIndex)] || "";
      prompt.value = [prompt.value.trim(), preset].filter(Boolean).join("\n");
    });
  });
  document.getElementById("imageForm").addEventListener("submit", generateImageFromForm);
  document.getElementById("saveImageSettingsBtn").addEventListener("click", () => {
    saveImageSettings(new FormData(document.getElementById("imageForm")));
    showToast("画图配置已保存");
  });
  bindImageCardActions();
}

function bindImageCardActions() {
  document.querySelectorAll("[data-copy-prompt]").forEach((button) => {
    button.addEventListener("click", () => copyText(button.dataset.copyPrompt || ""));
  });
  document.querySelectorAll("[data-delete-image]").forEach((button) => {
    button.addEventListener("click", () => deleteImageRecord(button.dataset.deleteImage));
  });
}

function renderDataView() {
  const root = document.getElementById("view-data");
  root.innerHTML = `
    <div class="grid two">
      <section class="panel">
        <h2>导出数据</h2>
        <p>会员档案与课程记录会一起导出为 JSON 文件。</p>
        <button class="primary-btn" type="button" id="exportJsonBtn">导出 JSON</button>
      </section>
      <section class="panel">
        <h2>导入数据</h2>
        <input class="file-input" id="importJsonInput" type="file" accept="application/json,.json" />
      </section>
    </div>
    <section class="panel" style="margin-top:16px;">
      <h2>清空本地数据</h2>
      <button class="danger-btn" type="button" id="clearDataBtn">清空数据</button>
    </section>
  `;

  document.getElementById("exportJsonBtn").addEventListener("click", exportJSON);
  document.getElementById("importJsonInput").addEventListener("change", importJSON);
  document.getElementById("clearDataBtn").addEventListener("click", clearData);
}

async function generateImageFromForm(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const prompt = clean(data.get("prompt"));
  const status = document.getElementById("imageStatus");
  const result = document.getElementById("imageResult");
  const button = document.getElementById("generateImageBtn");

  if (!prompt) {
    showModal("无法生成", "请先填写图片提示词。");
    return;
  }

  saveImageSettings(data);
  status.className = "notice warn";
  status.textContent = "正在生成图片，请稍等...";
  result.innerHTML = '<div class="empty-state">生成中...</div>';
  button.disabled = true;

  try {
    const response = await requestImageGeneration(prompt, state.imageSettings);
    const images = normalizeImageResponse(response, prompt);
    if (!images.length) {
      throw new Error("接口没有返回图片 URL 或 b64_json。");
    }

    const displayRecords = images.map((image) => ({
      id: makeId("image"),
      memberId: state.activeMemberId,
      prompt,
      revisedPrompt: image.revisedPrompt || "",
      url: image.url,
      b64Json: image.b64Json,
      size: state.imageSettings.size,
      model: state.imageSettings.model,
      createdAt: new Date().toISOString()
    }));
    const records = displayRecords.map((record) => ({
      ...record,
      b64Json: record.b64Json && record.b64Json.length <= 1200000 ? record.b64Json : ""
    })).filter((record) => record.url || record.b64Json);
    const skippedHistoryCount = displayRecords.length - records.length;

    state.images = [...records, ...(state.images || [])].slice(0, 60);
    saveState();
    status.className = "notice good";
    status.textContent = skippedHistoryCount
      ? `已生成 ${displayRecords.length} 张图片。图片数据较大，请先下载，历史只保存可持久化记录。`
      : `已生成 ${displayRecords.length} 张图片。`;
    result.innerHTML = renderGeneratedImages(displayRecords);
    document.getElementById("imageHistory").innerHTML = renderImageHistory([...state.images].slice(0, 12));
    bindImageCardActions();
    showToast("图片已生成");
  } catch (error) {
    status.className = "notice danger";
    status.textContent = `生成失败：${error.message || "请检查接口、API Key 或网络状态。"}`;
    result.innerHTML = emptyState("未生成图片");
  } finally {
    button.disabled = false;
  }
}

function saveImageSettings(data) {
  state.imageSettings = {
    endpoint: clean(data.get("imageEndpoint")) || IMAGE_GENERATION_ENDPOINT,
    apiKey: clean(data.get("imageApiKey")),
    model: clean(data.get("imageModel")) || "gpt-image-1",
    size: clean(data.get("imageSize")) || "1024x1024",
    count: clamp(numberOrNull(data.get("imageCount")) || 1, 1, 4),
    useProxy: data.get("useProxy") === "on"
  };
  saveState();
}

async function requestImageGeneration(prompt, settings) {
  const endpoint = settings.useProxy ? "/api/images/generations" : settings.endpoint;
  const headers = {
    "Content-Type": "application/json"
  };
  if (settings.apiKey) {
    headers.Authorization = `Bearer ${settings.apiKey}`;
  }

  const body = {
    model: settings.model,
    prompt,
    n: settings.count,
    size: settings.size
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });

  const text = await response.text();
  const payload = parseJSON(text);

  if (!response.ok) {
    const message = payload?.error?.message || payload?.message || text || `HTTP ${response.status}`;
    throw new Error(message);
  }

  return payload;
}

function normalizeImageResponse(payload, prompt) {
  const data = Array.isArray(payload?.data) ? payload.data : [];
  return data.map((item) => ({
    url: item.url || "",
    b64Json: item.b64_json || "",
    revisedPrompt: item.revised_prompt || payload.revised_prompt || prompt
  })).filter((item) => item.url || item.b64Json);
}

function renderGeneratedImages(records) {
  return `
    <div class="image-grid">
      ${records.map(renderImageCard).join("")}
    </div>
  `;
}

function renderImageHistory(records) {
  if (!records.length) return emptyState("暂无图片历史");
  return `<div class="image-grid">${records.map(renderImageCard).join("")}</div>`;
}

function renderImageCard(record) {
  const src = record.url || `data:image/png;base64,${record.b64Json}`;
  const date = new Date(record.createdAt).toLocaleString("zh-CN", { hour12: false });
  return `
    <article class="image-card">
      <a href="${escapeAttr(src)}" target="_blank" rel="noreferrer">
        <img src="${escapeAttr(src)}" alt="${escapeAttr(record.prompt)}" loading="lazy" />
      </a>
      <div class="image-card-body">
        <strong>${escapeHTML(record.model || "image")}</strong>
        <p>${escapeHTML(record.prompt)}</p>
        ${record.revisedPrompt && record.revisedPrompt !== record.prompt ? `<p class="muted">优化提示词：${escapeHTML(record.revisedPrompt)}</p>` : ""}
        <div class="tag-row">
          <span class="tag">${escapeHTML(record.size || "")}</span>
          <span class="tag">${escapeHTML(date)}</span>
        </div>
        <div class="actions">
          <button class="plain-btn" type="button" data-copy-prompt="${escapeAttr(record.prompt)}">复制提示词</button>
          <a class="secondary-link" href="${escapeAttr(src)}" download="pilates-image-${escapeAttr(record.id)}.png">下载</a>
          <button class="danger-btn" type="button" data-delete-image="${escapeAttr(record.id)}">删除</button>
        </div>
      </div>
    </article>
  `;
}

function deleteImageRecord(id) {
  state.images = (state.images || []).filter((record) => record.id !== id);
  saveState();
  renderImagesView();
  showToast("图片记录已删除");
}

function buildMemberImagePrompt(member) {
  const goals = [
    member.goals.chiefComplaint,
    ...member.goals.shortTermGoals.slice(0, 2)
  ].filter(Boolean).join("，");
  const posture = member.health.postureFlags.join("、");
  if (!goals && !posture) return "";
  return [
    "为普拉提会员生成一张专业、温暖、干净的训练辅助图片。",
    goals ? `会员目标：${goals}。` : "",
    posture ? `体态关注：${posture}。` : "",
    "画面避免医疗诊断感，适合教练课后分享。"
  ].filter(Boolean).join("\n");
}

function createDefaultImageSettings() {
  return {
    endpoint: IMAGE_GENERATION_ENDPOINT,
    apiKey: "",
    model: "gpt-image-1",
    size: "1024x1024",
    count: 1,
    useProxy: false
  };
}

function buildMemberAnalysis(member, sessions) {
  const actionCounts = countActions(sessions);
  const moduleCounts = countModules(sessions);
  const repeatedActions = Object.entries(actionCounts)
    .filter(([, count]) => count >= 3)
    .sort((a, b) => b[1] - a[1]);
  const missingModules = TRAINING_MODULES.filter((module) => !moduleCounts[module]).slice(0, 6);
  const riskAlerts = buildPainAlerts(member);
  const emotionAlerts = buildEmotionAlerts(sessions);
  const compensationMap = countCompensations(sessions);
  const recurringCompensations = Object.entries(compensationMap).filter(([, count]) => count >= 2);

  if (recurringCompensations.length) {
    riskAlerts.push(`代偿模式反复出现：${recurringCompensations.map(([name, count]) => `${name} ${count}次`).join("、")}。`);
  }

  return {
    actionCounts,
    moduleCounts,
    repeatedActions,
    missingModules,
    riskAlerts: unique(riskAlerts),
    emotionAlerts,
    recurringCompensations
  };
}

function renderAnalysisNotices(analysis) {
  const notices = [];
  analysis.riskAlerts.forEach((item) => notices.push(`<div class="notice danger">${escapeHTML(item)}</div>`));
  analysis.emotionAlerts.forEach((item) => notices.push(`<div class="notice warn">${escapeHTML(item)}</div>`));
  analysis.repeatedActions.slice(0, 4).forEach(([name, count]) => {
    notices.push(`<div class="notice warn">${escapeHTML(name)} 已出现 ${escapeHTML(String(count))} 次，下节课建议退阶、进阶或更换刺激角度。</div>`);
  });
  if (analysis.missingModules.length) {
    notices.push(`<div class="notice good">近期缺失模块：${analysis.missingModules.map(escapeHTML).join("、")}。</div>`);
  }
  return notices.length ? notices.join("") : '<div class="notice good">当前没有明显风险或重复提醒。</div>';
}

function buildFourWeekPlan(member, sessions, analysis) {
  const target = member.goals.chiefComplaint || member.goals.shortTermGoals[0] || "体态与身体能力提升";
  const missing = analysis.missingModules.slice(0, 3).join("、") || "呼吸、核心、脊柱";
  const recommended = recommendActions(member, sessions).slice(0, 4).map((item) => item.name).join("、");
  return `目标主线：围绕「${target}」建立可持续的身体管理节奏。

第1周：降低风险与找回身体觉察，优先安排呼吸、骨盆中立位和低负荷核心控制。
第2周：补足近期缺失模块（${missing}），避免只围绕熟悉动作重复训练。
第3周：根据疼痛反馈和完成质量做小幅进阶，加入左右侧差异与单腿稳定观察。
第4周：复测核心、髋稳定、肩颈放松和主诉变化，整理可用于续课沟通的成长证据。

推荐动作方向：${recommended || "先补充会员档案与课程记录后自动推荐"}。`;
}

function buildRenewalSummary(member, sessions) {
  const recent = sessions.slice(-8);
  const coverage = countModules(recent);
  const painTrend = describePainTrend(member, recent);
  const progress = recent.map((session) => session.observation.progress).filter(Boolean).at(-1);
  const posture = member.health.postureFlags.join("、") || "体态控制";
  return `${member.basic.name || "会员"} 阶段成长总结

这阶段我们围绕「${member.goals.chiefComplaint || "身体状态改善"}」持续推进，重点覆盖 ${formatTopCounts(coverage) || "基础呼吸、核心与体态控制"}。

已经看到的变化：
- ${painTrend.memberFacing}
- ${progress || `围绕 ${posture} 的身体觉察正在建立，动作控制比初期更稳定。`}
- 训练记录已累计 ${sessions.length} 次，身体变化有了可追踪的依据。

下阶段建议继续从「稳定控制」进入「更自然的姿态表达」，让训练效果从课堂延伸到站姿、久坐、行走和日常疲劳管理里。`;
}

function buildTimelineItems(member, sessions) {
  const items = [{
    title: "建档评估",
    date: member.basic.archiveDate || member.createdAt?.slice(0, 10) || todayISO(),
    text: [
      member.goals.chiefComplaint ? `主诉：${member.goals.chiefComplaint}` : "",
      member.health.postureFlags.length ? `体态关注：${member.health.postureFlags.join("、")}` : "",
      formatPain(member.health.currentPain) ? `疼痛：${formatPain(member.health.currentPain)}` : ""
    ].filter(Boolean).join("；") || "已建立初始身体档案。"
  }];

  [4, 10, 20].forEach((sessionNo) => {
    const session = sessions.find((item) => Number(item.sessionNo) >= sessionNo);
    if (session) {
      items.push({
        title: `第${sessionNo}节课节点`,
        date: session.date,
        text: session.observation.progress || session.summary?.slice(0, 90) || "进入阶段复盘节点。"
      });
    }
  });

  const latest = sessions.at(-1);
  if (latest && !items.some((item) => item.date === latest.date && item.title.includes("最近"))) {
    items.push({
      title: "最近课程",
      date: latest.date,
      text: latest.observation.progress || latest.feedback.notes || "最近一次课程已记录。"
    });
  }

  return items;
}

function renderTimeline(items) {
  return `
    <div class="timeline">
      ${items.map((item) => `
        <article class="timeline-item">
          <span>${escapeHTML(item.date)}</span>
          <strong>${escapeHTML(item.title)}</strong>
          <p>${escapeHTML(item.text)}</p>
        </article>
      `).join("")}
    </div>
  `;
}

function recommendActions(member, sessions) {
  const keywords = [
    member.goals.chiefComplaint,
    ...member.goals.shortTermGoals,
    ...member.health.postureFlags,
    ...member.health.weakMuscles,
    ...member.health.chronicPainAreas
  ].join(" ");
  const actionCounts = countActions(sessions);
  return ACTION_LIBRARY
    .map((item) => {
      const matchScore = item.problems.reduce((score, problem) => score + (keywords.includes(problem) ? 3 : 0), 0)
        + item.modules.reduce((score, module) => score + (keywords.includes(module) ? 1 : 0), 0);
      const repeatPenalty = actionCounts[item.name] ? Math.min(actionCounts[item.name], 4) : 0;
      return {
        ...item,
        score: matchScore - repeatPenalty,
        repeatCount: actionCounts[item.name] || 0
      };
    })
    .sort((a, b) => b.score - a.score || a.difficulty - b.difficulty);
}

function renderActionCards(items) {
  if (!items.length) return emptyState("暂无匹配动作");
  return items.map((item) => `
    <article class="action-card">
      <header>
        <strong>${escapeHTML(item.name)}</strong>
        <span>难度 ${escapeHTML(String(item.difficulty))}</span>
      </header>
      <p>${escapeHTML(item.reason)}</p>
      <div class="tag-row">
        <span class="tag">${escapeHTML(item.equipment)}</span>
        ${item.modules.map((module) => `<span class="tag">${escapeHTML(module)}</span>`).join("")}
        ${item.repeatCount ? `<span class="tag warn">已练 ${escapeHTML(String(item.repeatCount))} 次</span>` : ""}
      </div>
    </article>
  `).join("");
}

function buildEmotionAlerts(sessions) {
  const recent = sessions.slice(-4);
  const alerts = [];
  const tired = recent.filter((session) => ["疲惫", "抗拒", "紧张"].includes(session.feedback.emotion)).length;
  const highEffort = recent.filter((session) => Number(session.feedback.effort) >= 8).length;
  const notes = recent.map((session) => `${session.feedback.notes} ${session.observation.quality}`).join(" ");
  if (tired >= 2) alerts.push("近几次情绪/状态偏低，建议降低训练密度并增加身体觉察型反馈。");
  if (highEffort >= 2) alerts.push("近几次吃力程度偏高，建议避免连续加难度。");
  if (/睡眠|失眠|压力|焦虑|累|疲劳/.test(notes)) alerts.push("记录中出现睡眠、压力或疲劳信号，可加入低强度呼吸和恢复策略。");
  return alerts;
}

function countCompensations(sessions) {
  return sessions.reduce((acc, session) => {
    parseList(session.observation.compensation).forEach((item) => {
      acc[item] = (acc[item] || 0) + 1;
    });
    return acc;
  }, {});
}

function analyzeSession(member, session) {
  const blockers = [];
  const warnings = [];
  const tips = [];
  const actions = session.actions || [];
  const recentSessions = getMemberSessions(member.id)
    .filter((item) => item.id !== session.id)
    .filter((item) => daysBetween(item.date, session.date || todayISO()) <= 45);

  actions.forEach((action) => {
    const name = normalize(action.name);
    member.health.contraindications.forEach((item) => {
      const term = normalize(item);
      if (term && name.includes(term)) {
        blockers.push(`动作「${action.name}」命中禁忌动作「${item}」，请移除或改为安全替代动作。`);
      }
    });
    member.health.cautiousActions.forEach((item) => {
      const term = normalize(item);
      if (term && name.includes(term)) {
        warnings.push(`动作「${action.name}」属于慎做范围「${item}」，建议降低幅度、减少负荷并观察反馈。`);
      }
    });

    const repeated = recentSessions.filter((record) => {
      return record.actions.some((past) => normalize(past.name) === name);
    }).length;
    if (name && repeated >= 2) {
      warnings.push(`「${action.name}」近45天已练过 ${repeated + 1} 次，可考虑改变器械、角度或训练目标。`);
    }
  });

  const missing = buildCoverageReminder(member.id, actions);
  if (missing.length) {
    tips.push(`近期较少覆盖：${missing.join("、")}。下节课可按目标选择补足。`);
  }

  const painAlerts = buildPainAlerts(member, session);
  painAlerts.forEach((alert) => warnings.push(alert));

  return {
    blockers: unique(blockers),
    warnings: unique(warnings),
    tips: unique(tips)
  };
}

function buildCoverageReminder(memberId, draftActions = []) {
  const recent = getMemberSessions(memberId).slice(-4);
  const covered = new Set();
  [...recent.flatMap((session) => session.actions), ...draftActions].forEach((action) => {
    action.targets.forEach((target) => covered.add(target));
  });
  return TRAINING_MODULES.filter((module) => !covered.has(module)).slice(0, 5);
}

function buildPainAlerts(member, draftSession = null) {
  const alerts = [];
  const sessions = getMemberSessions(member.id).slice(-3);
  const painRecords = sessions
    .map((session) => session.feedback)
    .filter((feedback) => feedback.painArea && Number(feedback.painScore) >= 4);

  if (draftSession?.feedback?.painArea && Number(draftSession.feedback.painScore) >= 4) {
    painRecords.push(draftSession.feedback);
  }

  const grouped = painRecords.reduce((acc, feedback) => {
    const key = feedback.painArea;
    acc[key] = acc[key] || [];
    acc[key].push(Number(feedback.painScore));
    return acc;
  }, {});

  Object.entries(grouped).forEach(([area, scores]) => {
    if (scores.length >= 2) {
      alerts.push(`${area} 近几次持续反馈不适，建议降低相关负荷并记录诱发动作。`);
    }
    if (Math.max(...scores) >= 7) {
      alerts.push(`${area} 疼痛达到高分值，建议暂停刺激动作并必要时转介专业评估。`);
    }
  });

  return unique(alerts);
}

function buildSingleSummary(member, session, advisories) {
  const actionLines = session.actions.map((action, index) => {
    const parts = [
      action.sets ? `${action.sets}组` : "",
      action.reps ? `${action.reps}` : "",
      action.equipment ? action.equipment : "",
      `难度${action.difficulty}`,
      action.targets.length ? action.targets.join("/") : ""
    ].filter(Boolean).join("，");
    return `${index + 1}. ${action.name}${parts ? `（${parts}）` : ""}`;
  }).join("\n");

  const sessions = getMemberSessions(member.id);
  const previousSessions = sessions.filter((item) => item.id !== session.id);
  const analysis = buildMemberAnalysis(member, [...previousSessions, session]);
  const trainingLogic = inferTrainingLogic(member, session);
  const strongActions = session.actions.filter((action) => Number(action.difficulty) <= 3).map((action) => action.name);
  const compensationActions = session.observation.compensation
    ? session.actions.map((action) => action.name).slice(0, 3)
    : [];
  const painText = session.feedback.painScore
    ? `${session.feedback.painArea || "未标注部位"} ${session.feedback.painScore}/10`
    : "本节未记录明显疼痛";
  const warnings = [...advisories.blockers, ...advisories.warnings];
  const nextAdvice = buildNextAdvice(member, session, advisories);
  const memberCopy = buildMemberFacingCopy(member, session, painText);

  return `${member.basic.name} 第${session.sessionNo}次课 AI课后输出

Output 1｜【教练端】本节课复盘与科学总结

1. 本课训练逻辑
${trainingLogic}

2. 动作序列复盘
${actionLines || "本节课动作未填写完整。"}

完成度较高的动作：${strongActions.join("、") || "需结合教练观察继续记录"}。
代偿明显的动作/环节：${compensationActions.join("、") || session.observation.compensation || "本节未记录明显代偿"}。

3. 会员表现与反馈
完成度：${session.feedback.completion || "未填写"}。
吃力程度：${session.feedback.effort || "-"} / 10。
疼痛反馈：${painText}。
情绪状态：${session.feedback.emotion || "未填写"}。
备注：${session.feedback.notes || "无额外备注"}。

4. 教练观察
动作质量：${session.observation.quality || "待补充"}。
代偿模式：${session.observation.compensation || "未观察到明显代偿或未记录"}。
进步迹象：${session.observation.progress || "待继续观察"}。

5. 下节课规避与衔接建议
${nextAdvice}

Output 2｜【教练端】多课时累积趋势分析

1. 动作重合度预警
${analysis.repeatedActions.length ? analysis.repeatedActions.slice(0, 5).map(([name, count]) => `- ${name} 已累计 ${count} 次，建议下节课做退阶/进阶/器械变化。`).join("\n") : "- 暂无高频重复动作。"}

2. 阶段性趋势
- 核心与控制：${describeCapacity(analysis.moduleCounts)}
- 训练覆盖缺口：${analysis.missingModules.length ? analysis.missingModules.join("、") : "近期覆盖较完整"}
- 反复代偿：${analysis.recurringCompensations.length ? analysis.recurringCompensations.map(([name, count]) => `${name} ${count}次`).join("、") : "暂无重复代偿记录"}

3. 风险与疼痛预警
${warnings.length ? warnings.map((item) => `- ${item}`).join("\n") : "本节课未触发高风险预警。"}

Output 3｜【会员端】专属轻奢风课后文案

${memberCopy}`;
}

function buildNextAdvice(member, session, advisories) {
  const advice = [];
  if (session.feedback.painScore >= 4) {
    advice.push(`围绕「${session.feedback.painArea || "不适部位"}」降低直接刺激，优先安排呼吸、温和活动度和低负荷稳定训练。`);
  }
  if (session.observation.compensation) {
    advice.push(`继续观察「${session.observation.compensation}」，在动作前加入更清晰的定位和慢速控制。`);
  }
  if (advisories.tips.length) {
    advice.push(advisories.tips[0]);
  }
  if (member.goals.shortTermGoals.length) {
    advice.push(`保持与短期目标「${member.goals.shortTermGoals[0]}」一致，下一节课控制难度递进，不急于加量。`);
  }
  if (!advice.length) {
    advice.push("下节课可在当前动作质量稳定的基础上小幅提高控制要求，并继续记录疼痛与完成度变化。");
  }
  return advice.map((item) => `- ${item}`).join("\n");
}

function inferTrainingLogic(member, session) {
  const targets = unique(session.actions.flatMap((action) => action.targets));
  const complaint = member.goals.chiefComplaint || "当前主诉";
  const bodyState = [
    member.health.postureFlags.includes("骨盆前倾") ? "骨盆中立位" : "",
    member.health.postureFlags.includes("圆肩") || member.health.postureFlags.includes("头前引") ? "肩颈与胸椎排列" : "",
    member.health.weakMuscles.includes("核心") ? "深层核心激活" : ""
  ].filter(Boolean).join("、");

  return `本节课围绕「${complaint}」展开，以 ${targets.join("、") || "基础控制"} 为主要训练模块，重点观察 ${bodyState || "呼吸、核心与关节对线"}。课程逻辑不是单纯消耗体能，而是让会员在可控强度下建立更稳定的身体排列和动作觉察。`;
}

function buildMemberFacingCopy(member, session, painText) {
  const name = member.basic.name || "你";
  const occupation = member.basic.occupationPattern || member.basic.occupation || "";
  const progress = session.observation.progress || "身体控制比刚开始更清晰";
  const target = member.goals.chiefComplaint || member.goals.shortTermGoals[0] || "身体状态改善";
  const lifestyle = buildLifestyleTip(member, session);

  return `今日蜕变｜You Did It
${name}，今天你完成的不只是动作，而是在${occupation ? `「${occupation}」带来的身体惯性里，` : ""}重新找回身体的主动控制感。${progress}，这是很值得被看见的进步。

身体正向反馈｜Body Awareness
今天围绕「${target}」做的训练，核心价值在于让身体从“用力硬撑”回到“有支撑地放松”。${painText === "本节未记录明显疼痛" ? "课后没有明显疼痛记录，说明本节强度处在较好的可接受范围内。" : `你记录到的 ${painText} 会作为下一次课调整强度和动作角度的重要依据。`}当核心、呼吸和关节排列更协调时，身体会更容易出现“变轻、变高、腰背压力下降”的感觉。

生活方式处方｜Daily Tips
${lifestyle}`;
}

function buildLifestyleTip(member, session) {
  const occupation = member.basic.occupationPattern || "";
  const posture = member.health.postureFlags.join(" ");
  if (/久坐|办公|电脑|高管/.test(occupation)) {
    return "办公室每坐45分钟，把坐骨轻轻滑到椅子前侧，双脚踩稳，做3次慢呼吸，找回今天课上练过的骨盆中立位。";
  }
  if (/带娃|抱娃|产后/.test(occupation) || member.health.postpartum.enabled) {
    return "抱娃或提物前先轻轻呼气，让下腹部有一点向内收的支撑，再移动身体，避免腰部先替你用力。";
  }
  if (/圆肩|头前引|肩颈/.test(posture) || session.feedback.painArea?.includes("肩")) {
    return "每天选一个固定时刻，把锁骨向两侧轻轻展开，后脑勺向上延伸，保持3次慢呼吸，不追求挺胸，只找轻盈的延展。";
  }
  return "今天睡前做3次慢呼吸：吸气感受肋骨向两侧打开，呼气让身体自然变沉，帮助训练效果从课堂延伸到日常。";
}

function buildProgressReport(member, start, end) {
  const sessions = filterSessionsByRange(getMemberSessions(member.id), start, end);
  const actionCounts = countActions(sessions);
  const coverage = countModules(sessions);
  const painTrend = describePainTrend(member, sessions);
  const adherence = describeAdherence(member, sessions, start, end);
  const capacity = describeCapacity(coverage);
  const goals = describeGoalMatch(member, painTrend, coverage);
  const encouragement = buildEncouragement(member, sessions);
  const nextStage = buildNextStage(member, coverage, painTrend);

  return `${member.basic.name} ${start} 至 ${end} 进度总结

一、训练动作历史汇总
共记录 ${sessions.length} 次课程。
高频动作：${formatTopCounts(actionCounts) || "暂无足够动作数据"}。
训练覆盖：${formatTopCounts(coverage) || "暂无模块数据"}。

二、体态/疼痛改善趋势
建档疼痛：${formatPain(member.health.currentPain) || "未记录"}。
周期反馈：${painTrend.text}

三、目标达成进度评估
主诉问题：${member.goals.chiefComplaint || "未填写"}。
短期目标：${member.goals.shortTermGoals.join("、") || "未填写"}。
目标匹配度：${goals}

四、训练强度变化
${describeIntensity(sessions)}

五、会员关心维度
体态变化对比：${describePosture(member, coverage)}
疼痛缓解程度变化：${painTrend.memberFacing}
身体能力提升：${capacity}
训练打卡/坚持度：${adherence}
与训练目标的匹配度：${goals}
阶段性小结：${encouragement}
下阶段训练方向：${nextStage}`;
}

function countActions(sessions) {
  return sessions.reduce((acc, session) => {
    session.actions.forEach((action) => {
      if (!action.name) return;
      acc[action.name] = (acc[action.name] || 0) + 1;
    });
    return acc;
  }, {});
}

function countModules(sessions) {
  return sessions.reduce((acc, session) => {
    session.actions.forEach((action) => {
      action.targets.forEach((target) => {
        acc[target] = (acc[target] || 0) + 1;
      });
    });
    return acc;
  }, {});
}

function describePainTrend(member, sessions) {
  const initial = member.health.currentPain;
  const painSessions = sessions.filter((session) => session.feedback.painArea && Number(session.feedback.painScore) > 0);
  if (!painSessions.length) {
    return {
      text: "周期内未记录疼痛分数，建议后续每次课固定记录。",
      memberFacing: "本周期疼痛数据不足，后续会用每次课反馈追踪变化。"
    };
  }

  const latest = painSessions.at(-1).feedback;
  const matchingInitial = initial.find((item) => item.area === latest.painArea);
  const delta = matchingInitial ? Number(matchingInitial.score) - Number(latest.painScore) : null;
  const trend = delta === null
    ? `${latest.painArea} 最新反馈 ${latest.painScore}/10。`
    : `${latest.painArea} 从建档 ${matchingInitial.score}/10 到最新 ${latest.painScore}/10，变化 ${delta >= 0 ? "下降" : "上升"} ${Math.abs(delta)} 分。`;

  return {
    text: trend,
    memberFacing: delta === null
      ? `目前最新疼痛记录为 ${latest.painArea} ${latest.painScore}/10，会继续观察趋势。`
      : delta > 0
        ? `疼痛分数已有下降，说明训练方向与恢复管理正在产生正向变化。`
        : delta === 0
          ? `疼痛分数整体持平，下一阶段会更细致地追踪诱发动作。`
          : `疼痛分数有上升信号，下一阶段会优先降低刺激并调整动作选择。`
  };
}

function describeAdherence(member, sessions, start, end) {
  const weekly = Number(member.goals.weeklyFrequency) || 1;
  const weeks = Math.max(1, Math.ceil((daysBetween(start, end) + 1) / 7));
  const expected = weekly * weeks;
  const ratio = Math.round((sessions.length / expected) * 100);
  return `本周期完成 ${sessions.length}/${expected} 次，达成率约 ${ratio}%。`;
}

function describeCapacity(coverage) {
  const core = coverage["核心"] || 0;
  const flex = (coverage["柔韧"] || 0) + (coverage["脊柱"] || 0) + (coverage["髋"] || 0);
  const balance = coverage["平衡"] || 0;
  return `核心力量${levelText(core)}，柔韧与活动度${levelText(flex)}，平衡控制${levelText(balance)}。`;
}

function levelText(count) {
  if (count >= 6) return "有明显积累";
  if (count >= 3) return "正在建立";
  if (count >= 1) return "已有触达";
  return "仍需补足";
}

function describeGoalMatch(member, painTrend, coverage) {
  const complaint = member.goals.chiefComplaint || "当前目标";
  const matched = [];
  if ((coverage["肩颈"] || 0) || (coverage["脊柱"] || 0)) matched.push("体态与脊柱控制");
  if (coverage["核心"] || 0) matched.push("核心稳定");
  if (coverage["髋"] || coverage["下肢"]) matched.push("下肢与骨盆控制");
  return `围绕「${complaint}」，本周期主要覆盖 ${matched.join("、") || "基础训练"}，${painTrend.memberFacing}`;
}

function buildEncouragement(member, sessions) {
  const style = member.preferences.communicationStyle || "";
  const progress = sessions.map((session) => session.observation.progress).filter(Boolean).at(-1);
  if (style.includes("直接")) {
    return progress ? `本阶段进步点明确：${progress}。继续保持记录和稳定出勤。` : "本阶段已完成基础记录，下一阶段重点看稳定性和疼痛趋势。";
  }
  return progress
    ? `你已经能看到很具体的变化：${progress}。继续按节奏来，比一次练很多更重要。`
    : "这个阶段的价值在于建立身体觉察和训练节奏，稳定完成本身就是进步。";
}

function buildNextStage(member, coverage, painTrend) {
  const missing = TRAINING_MODULES.filter((module) => !coverage[module]).slice(0, 3);
  const target = member.goals.shortTermGoals[0] || member.goals.chiefComplaint || "当前主要目标";
  const missingText = missing.length ? `补足 ${missing.join("、")}，` : "";
  return `继续围绕「${target}」推进，${missingText}并根据疼痛反馈逐步调整强度。`;
}

function describeIntensity(sessions) {
  if (!sessions.length) return "暂无课程数据。";
  return sessions.map((session) => {
    const avg = average(session.actions.map((action) => action.difficulty));
    return `${session.date} 第${session.sessionNo}次课：平均难度 ${avg.toFixed(1)}/5`;
  }).join("\n");
}

function describePosture(member, coverage) {
  const flags = member.health.postureFlags;
  if (!flags.length) return "建档时未记录明确体态标签，建议下次复评时补充照片或文字对比。";
  const related = [];
  if (coverage["肩颈"] || coverage["上肢"]) related.push("肩颈与肩胛控制");
  if (coverage["核心"] || coverage["髋"]) related.push("骨盆与核心稳定");
  if (coverage["足踝"] || coverage["下肢"]) related.push("下肢力线");
  return `建档关注 ${flags.join("、")}；本周期已通过 ${related.join("、") || "基础控制训练"} 进行干预。`;
}

function renderIntensityChart(sessions) {
  if (!sessions.length) return emptyState("暂无周期课程");
  return `
    <div class="chart">
      ${sessions.map((session) => {
        const avg = average(session.actions.map((action) => action.difficulty));
        const height = Math.max(10, (avg / 5) * 100);
        return `<div class="bar" style="height:${height}%;" title="${escapeAttr(session.date)} 平均难度 ${avg.toFixed(1)}"><span>${escapeHTML(String(session.sessionNo))}</span></div>`;
      }).join("")}
    </div>
  `;
}

function renderModuleCoverage(sessions) {
  const counts = countModules(sessions);
  if (!Object.keys(counts).length) return emptyState("暂无模块数据");
  return `
    <div class="tag-row">
      ${Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .map(([module, count]) => `<span class="tag">${escapeHTML(module)} ${escapeHTML(String(count))}</span>`)
        .join("")}
    </div>
  `;
}

function createEmptyMember() {
  return {
    id: "",
    createdAt: "",
    updatedAt: "",
    basic: {
      name: "",
      gender: "",
      age: "",
      height: "",
      weight: "",
      contact: "",
      archiveDate: todayISO(),
      occupationPattern: ""
    },
    health: {
      medicalHistory: "",
      surgeryHistory: "",
      chronicPainAreas: [],
      postpartum: {
        enabled: false,
        months: "",
        deliveryMethod: ""
      },
      postureFlags: [],
      mobilityLimits: [],
      weakMuscles: [],
      currentPain: [],
      contraindications: [],
      cautiousActions: []
    },
    goals: {
      chiefComplaint: "",
      shortTermGoals: [],
      longTermGoals: [],
      exerciseBackground: "",
      weeklyFrequency: ""
    },
    preferences: {
      communicationStyle: "",
      specialPeriod: ""
    }
  };
}

function field(label, name, value = "", type = "text", size = "") {
  return `
    <label class="field ${size}">
      <span>${escapeHTML(label)}</span>
      <input type="${escapeAttr(type)}" name="${escapeAttr(name)}" value="${escapeAttr(value ?? "")}" />
    </label>
  `;
}

function textareaField(label, name, value = "", size = "") {
  return `
    <label class="field ${size}">
      <span>${escapeHTML(label)}</span>
      <textarea name="${escapeAttr(name)}">${escapeHTML(value ?? "")}</textarea>
    </label>
  `;
}

function selectField(label, name, value, options, size = "") {
  return `
    <label class="field ${size}">
      <span>${escapeHTML(label)}</span>
      <select name="${escapeAttr(name)}">
        ${options.map((option) => `<option value="${escapeAttr(option)}" ${option === value ? "selected" : ""}>${escapeHTML(option || "请选择")}</option>`).join("")}
      </select>
    </label>
  `;
}

function checkboxes(label, name, options, selected) {
  return `
    <fieldset class="field full checkbox-group">
      <legend>${escapeHTML(label)}</legend>
      <div class="checkbox-grid">
        ${options.map((option) => `
          <label class="check-pill">
            <input type="checkbox" name="${escapeAttr(name)}" value="${escapeAttr(option)}" ${selected.includes(option) ? "checked" : ""} />
            ${escapeHTML(option)}
          </label>
        `).join("")}
      </div>
    </fieldset>
  `;
}

function emptyState(text) {
  return `<div class="empty-state">${escapeHTML(text)}</div>`;
}

function getMember(id) {
  return state.members.find((member) => member.id === id);
}

function getActiveMember() {
  return getMember(state.activeMemberId);
}

function getMemberSessions(memberId) {
  return state.sessions
    .filter((session) => session.memberId === memberId)
    .sort((a, b) => a.date.localeCompare(b.date) || Number(a.sessionNo) - Number(b.sessionNo));
}

function filterSessionsByRange(sessions, start, end) {
  return sessions.filter((session) => session.date >= start && session.date <= end);
}

function parseList(value) {
  return unique(String(value || "")
    .split(/[\n,，、;；]/)
    .map(clean)
    .filter(Boolean));
}

function parseLines(value) {
  return unique(String(value || "")
    .split(/\n/)
    .map(clean)
    .filter(Boolean));
}

function parsePain(value) {
  return String(value || "")
    .split(/[\n；;]/)
    .map(clean)
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(/[:：,，、\s]+/).filter(Boolean);
      return {
        area: clean(parts[0]),
        score: clamp(numberOrNull(parts[1]), 0, 10)
      };
    })
    .filter((item) => item.area);
}

function serializePain(items) {
  return (items || []).map((item) => `${item.area}:${item.score ?? ""}`).join("\n");
}

function formatPain(items) {
  return (items || [])
    .filter((item) => item.area)
    .map((item) => `${item.area} ${item.score ?? "-"} /10`)
    .join("、");
}

function clean(value) {
  return String(value || "").trim();
}

function numberOrNull(value) {
  const text = clean(value);
  if (!text) return null;
  const number = Number(text);
  return Number.isFinite(number) ? number : null;
}

function clamp(value, min, max) {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  return Math.min(max, Math.max(min, Number(value)));
}

function normalize(value) {
  return clean(value).toLowerCase().replace(/\s+/g, "");
}

function unique(values) {
  return [...new Set(values)];
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function shiftDate(dateString, days) {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function daysBetween(a, b) {
  const start = new Date(`${a}T00:00:00`);
  const end = new Date(`${b}T00:00:00`);
  return Math.abs(Math.round((end - start) / 86400000));
}

function makeId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
}

function average(values) {
  const numbers = values.map(Number).filter((value) => Number.isFinite(value));
  if (!numbers.length) return 0;
  return numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
}

function formatTopCounts(counts) {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => `${name} ${count}次`)
    .join("、");
}

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHTML(value);
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => els.toast.classList.remove("show"), 2200);
}

function showModal(title, html) {
  els.modalTitle.textContent = title;
  els.modalBody.innerHTML = html;
  els.modal.hidden = false;
}

function closeModal() {
  els.modal.hidden = true;
}

function getText(id) {
  return document.getElementById(id)?.textContent || "";
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast("内容已复制");
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
    showToast("内容已复制");
  }
}

function exportText(filename, text) {
  downloadBlob(filename, text, "text/plain;charset=utf-8");
}

function exportJSON() {
  const payload = JSON.stringify(state, null, 2);
  downloadBlob(`pilates-coach-data-${todayISO()}.json`, payload, "application/json;charset=utf-8");
}

function importJSON(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      if (!Array.isArray(parsed.members) || !Array.isArray(parsed.sessions)) {
        throw new Error("invalid shape");
      }
      state.members = parsed.members;
      state.sessions = parsed.sessions;
      state.images = Array.isArray(parsed.images) ? parsed.images : [];
      state.imageSettings = {
        ...createDefaultImageSettings(),
        ...(parsed.imageSettings || {})
      };
      state.activeMemberId = parsed.activeMemberId || parsed.members[0]?.id || null;
      state.activeSessionId = parsed.activeSessionId || null;
      saveState();
      renderAll();
      showToast("数据已导入");
    } catch {
      showModal("导入失败", "文件格式不符合当前系统的数据结构。");
    }
  };
  reader.readAsText(file);
}

function clearData() {
  const ok = window.confirm("确认清空本地所有会员档案、课程记录和图片历史？");
  if (!ok) return;
  state.members = [];
  state.sessions = [];
  state.images = [];
  state.imageSettings = createDefaultImageSettings();
  state.activeMemberId = null;
  state.activeSessionId = null;
  saveState();
  renderAll();
  showToast("本地数据已清空");
}

function downloadBlob(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function parseJSON(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
