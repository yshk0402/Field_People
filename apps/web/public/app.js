const authViewEl = document.getElementById('auth-view');
const appViewEl = document.getElementById('app-view');
const loginFormEl = document.getElementById('login-form');
const loginErrorEl = document.getElementById('login-error');
const logEl = document.getElementById('log');
const paneTitleEl = document.getElementById('pane-title');
const navItems = Array.from(document.querySelectorAll('.nav-item'));
const panes = Array.from(document.querySelectorAll('.pane'));
const shellEl = document.querySelector('.shell');
const sidebarToggleEl = document.getElementById('sidebar-toggle');
const sidebarBackdropEl = document.getElementById('sidebar-backdrop');
const mobileQuery = window.matchMedia('(max-width: 900px)');

const currentUserNameEl = document.getElementById('current-user-name');
const currentUserRoleEl = document.getElementById('current-user-role');
const currentUserEmailEl = document.getElementById('current-user-email');

const peopleListEl = document.getElementById('people-list');
const projectListEl = document.getElementById('project-list');
const roomListEl = document.getElementById('room-list');
const contractListEl = document.getElementById('contract-list');
const invoiceListEl = document.getElementById('invoice-list');
const dashboardCardsEl = document.getElementById('dashboard-cards');
const inviteResultEl = document.getElementById('invite-result');

const forms = {
  person: document.getElementById('person-form'),
  project: document.getElementById('project-form'),
  room: document.getElementById('room-form'),
  contract: document.getElementById('contract-form'),
  invoice: document.getElementById('invoice-form'),
  profile: document.getElementById('profile-form'),
  notify: document.getElementById('notify-form'),
  password: document.getElementById('password-form'),
  invite: document.getElementById('invite-form')
};
const modalTriggers = Array.from(document.querySelectorAll('[data-form-trigger]'));
const modalCloseButtons = Array.from(document.querySelectorAll('[data-close-modal]'));
const entryModals = {
  person: document.getElementById('person-modal'),
  project: document.getElementById('project-modal'),
  room: document.getElementById('room-modal'),
  contract: document.getElementById('contract-modal'),
  invoice: document.getElementById('invoice-modal')
};

const notifyEmailEl = document.getElementById('notify-email');
const notifyMatrixEl = document.getElementById('notify-matrix');

const paneLabels = {
  'dashboard-pane': 'Dashboard',
  'people-pane': 'People',
  'projects-pane': 'Projects',
  'rooms-pane': 'Rooms',
  'contracts-pane': 'Contracts',
  'invoices-pane': 'Invoices',
  'settings-pane': 'Settings',
  'activity-pane': 'Activity'
};

const ACL = {
  admin: { person: true, project: true, room: true, contract: true, invoice: true, invite: true, invoiceStatus: true, contractStatus: true },
  backoffice: { person: true, project: false, room: true, contract: true, invoice: false, invite: true, invoiceStatus: true, contractStatus: true },
  member: { person: false, project: true, room: true, contract: false, invoice: false, invite: false, invoiceStatus: false, contractStatus: false },
  talent: { person: false, project: false, room: false, contract: false, invoice: true, invite: false, invoiceStatus: false, contractStatus: false }
};

let token = localStorage.getItem('fp:token') || '';
let me = null;

function escapeHTML(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function log(message, error = false) {
  const now = new Date().toLocaleTimeString();
  const color = error ? '#b91c1c' : '#111111';
  logEl.innerHTML = `<div style="color:${color}">[${now}] ${escapeHTML(message)}</div>`;
}

async function api(path, options = {}) {
  const headers = {
    'content-type': 'application/json',
    ...(options.headers || {})
  };
  if (token) headers.authorization = `Bearer ${token}`;

  const res = await fetch(path, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && path !== '/api/v1/auth/login') {
      logout(true);
    }
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data;
}

function setViewAuthed(isAuthed) {
  authViewEl.classList.toggle('hidden', isAuthed);
  appViewEl.classList.toggle('hidden', !isAuthed);
}

function setCurrentUserUI(user) {
  currentUserNameEl.textContent = user.display_name || user.name;
  currentUserRoleEl.textContent = user.role;
  currentUserEmailEl.textContent = user.email;

  document.getElementById('settings-display-name').value = user.display_name || '';
  document.getElementById('settings-timezone').value = user.timezone || '';
  document.getElementById('settings-locale').value = user.locale || '';
  notifyEmailEl.checked = Boolean(user.notify_email);
  notifyMatrixEl.checked = Boolean(user.notify_matrix);
  const invoicePerson = document.getElementById('invoice-person-id');
  if (user.person_id && invoicePerson) invoicePerson.value = user.person_id;
}

function setFormState(form, enabled) {
  if (!form) return;
  form.querySelectorAll('input,select,button,textarea').forEach((el) => {
    el.disabled = !enabled;
  });
}

function setTriggerState(formKey, enabled) {
  document.querySelectorAll(`[data-form-trigger="${formKey}"]`).forEach((trigger) => {
    trigger.disabled = !enabled;
  });
}

function applyRBAC() {
  const role = me?.role || 'talent';
  const caps = ACL[role] || ACL.talent;
  setFormState(forms.person, caps.person);
  setTriggerState('person', caps.person);
  setFormState(forms.project, caps.project);
  setTriggerState('project', caps.project);
  setFormState(forms.room, caps.room);
  setTriggerState('room', caps.room);
  setFormState(forms.contract, caps.contract);
  setTriggerState('contract', caps.contract);
  setFormState(forms.invoice, caps.invoice);
  setTriggerState('invoice', caps.invoice);
  setFormState(forms.invite, caps.invite);
}

function openModal(kind) {
  const modal = entryModals[kind];
  if (!modal) return;
  if (typeof modal.showModal === 'function') {
    modal.showModal();
  }
}

function closeModal(kind) {
  const modal = entryModals[kind];
  if (!modal) return;
  if (modal.open) {
    modal.close();
  }
}

function activatePane(target) {
  navItems.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.target === target);
  });
  panes.forEach((pane) => {
    pane.classList.toggle('is-visible', pane.id === target);
  });
  paneTitleEl.textContent = paneLabels[target] || 'Dashboard';
}

function updateSidebarToggleLabel() {
  const isMobile = mobileQuery.matches;
  const isOpen = shellEl.classList.contains('is-sidebar-open');
  const isCollapsed = shellEl.classList.contains('is-sidebar-collapsed');
  const expanded = isMobile ? isOpen : !isCollapsed;
  sidebarToggleEl.setAttribute('aria-expanded', String(expanded));
  sidebarToggleEl.textContent = expanded ? 'サイドバーを閉じる' : 'サイドバーを開く';
}

function closeMobileSidebar() {
  shellEl.classList.remove('is-sidebar-open');
  updateSidebarToggleLabel();
}

function syncSidebarState() {
  if (mobileQuery.matches) {
    shellEl.classList.remove('is-sidebar-collapsed');
    closeMobileSidebar();
    return;
  }
  shellEl.classList.remove('is-sidebar-open');
  shellEl.classList.toggle('is-sidebar-collapsed', localStorage.getItem('fp:sidebar-collapsed') === '1');
  updateSidebarToggleLabel();
}

function collectCSV(value) {
  return String(value || '').split(',').map((v) => v.trim()).filter(Boolean);
}

async function loadDashboard() {
  const data = await api('/api/v1/dashboard');
  const stats = [
    ['契約更新(30日以内)', data.contracts_expiring_30d],
    ['未提出請求', data.invoices_unsubmitted],
    ['未承認請求', data.invoices_unapproved],
    ['期限タスク(7日以内)', data.tasks_due_7d]
  ];
  dashboardCardsEl.innerHTML = stats
    .map(([k, v]) => `<div class="stat-row"><span class="stat-label">${escapeHTML(k)}</span><strong class="stat-value">${escapeHTML(v)}</strong></div>`)
    .join('');
}

async function loadPeople() {
  const data = await api('/api/v1/people');
  peopleListEl.innerHTML = (data.items || []).map((p) => `
    <li>
      <div class="item-top"><strong>${escapeHTML(p.name)}</strong><span class="badge">${escapeHTML(p.role)}</span></div>
      <div>${escapeHTML(p.email)}</div>
      <div><span class="badge type">${escapeHTML(p.type)}</span> <span class="badge">${escapeHTML(p.status)}</span></div>
      <div class="muted">${escapeHTML((p.skills || []).join(', '))}</div>
    </li>
  `).join('');
}

async function loadProjects() {
  const data = await api('/api/v1/projects');
  projectListEl.innerHTML = (data.items || []).map((p) => `
    <li>
      <div class="item-top"><strong>${escapeHTML(p.name)}</strong><span class="badge type">${escapeHTML(p.status)}</span></div>
      <div>${escapeHTML(p.description || '-')}</div>
      <div>期間: ${escapeHTML(p.start_date || '-')} ~ ${escapeHTML(p.end_date || '-')}</div>
      <div class="muted">members: ${escapeHTML((p.member_person_ids || []).join(', ') || '-')}</div>
    </li>
  `).join('');
}

async function loadRooms() {
  const data = await api('/api/v1/rooms');
  roomListEl.innerHTML = '';
  for (const r of data.items || []) {
    const links = await api(`/api/v1/rooms/${encodeURIComponent(r.room_id)}/links`).catch(() => null);
    const li = document.createElement('li');
    li.innerHTML = `
      <div class="item-top"><strong>${escapeHTML(r.room_id)}</strong><span class="badge type">${escapeHTML(r.type)}</span></div>
      <div>members: ${escapeHTML((r.member_user_ids || []).join(', ') || '-')}</div>
      ${links ? `<div class="links"><a href="${links.links.element_web}" target="_blank" rel="noreferrer">Element Web</a><a href="${links.links.element_mobile}">Element Mobile</a></div>` : ''}
    `;
    roomListEl.appendChild(li);
  }
}

function statusButton(label, kind, id, type) {
  return `<button class="btn ghost js-status-btn" type="button" data-kind="${type}" data-id="${escapeHTML(id)}" data-status="${kind}">${escapeHTML(label)}</button>`;
}

async function loadContracts() {
  const data = await api('/api/v1/contracts');
  const canChange = Boolean(ACL[me.role]?.contractStatus);
  contractListEl.innerHTML = (data.items || []).map((c) => `
    <li>
      <div class="item-top"><strong>${escapeHTML(c.contract_id)}</strong><span class="badge type">${escapeHTML(c.contract_type)}</span></div>
      <div>person_id: ${escapeHTML(c.person_id)}</div>
      <div>rate: ${escapeHTML(c.rate)} ${escapeHTML(c.currency)} / status: <span class="badge">${escapeHTML(c.status)}</span></div>
      <div>term: ${escapeHTML(c.start_date)} ~ ${escapeHTML(c.end_date)}</div>
      ${canChange ? `<div class="links">${statusButton('active', 'active', c.contract_id, 'contract')}${statusButton('ended', 'ended', c.contract_id, 'contract')}${statusButton('cancelled', 'cancelled', c.contract_id, 'contract')}</div>` : ''}
    </li>
  `).join('');
}

async function loadInvoices() {
  const data = await api('/api/v1/invoices');
  const canChange = Boolean(ACL[me.role]?.invoiceStatus);
  invoiceListEl.innerHTML = (data.items || []).map((i) => `
    <li>
      <div class="item-top"><strong>${escapeHTML(i.invoice_id)}</strong><span class="badge type">${escapeHTML(i.status)}</span></div>
      <div>person_id: ${escapeHTML(i.person_id)} / period: ${escapeHTML(i.period)}</div>
      <div>amount: ${escapeHTML(i.amount)} ${escapeHTML(i.currency)}</div>
      ${canChange ? `<div class="links">${statusButton('submitted', 'submitted', i.invoice_id, 'invoice')}${statusButton('approved', 'approved', i.invoice_id, 'invoice')}${statusButton('paid', 'paid', i.invoice_id, 'invoice')}</div>` : ''}
    </li>
  `).join('');
}

async function refreshAll() {
  await Promise.allSettled([
    loadDashboard(),
    loadPeople(),
    loadProjects(),
    loadRooms(),
    loadContracts(),
    loadInvoices()
  ]);
}

async function login(email, password) {
  const res = await api('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  token = res.token;
  localStorage.setItem('fp:token', token);
  me = res.user;
}

async function bootstrapAuthed() {
  const meRes = await api('/api/v1/auth/me');
  me = meRes.user;
  setCurrentUserUI(me);
  applyRBAC();
  setViewAuthed(true);
  activatePane('dashboard-pane');
  await refreshAll();
  log(`ログイン済み: ${me.email} (${me.role})`);
}

function logout(silent = false) {
  token = '';
  me = null;
  localStorage.removeItem('fp:token');
  setViewAuthed(false);
  if (!silent) log('ログアウトしました');
}

loginFormEl.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  loginErrorEl.textContent = '';
  const fd = new FormData(loginFormEl);
  try {
    await login(String(fd.get('email') || ''), String(fd.get('password') || ''));
    await bootstrapAuthed();
  } catch (e) {
    loginErrorEl.textContent = `ログイン失敗: ${e.message}`;
  }
});

document.getElementById('logout-btn').addEventListener('click', async () => {
  try {
    await api('/api/v1/auth/logout', { method: 'POST' });
  } catch {
    // ignore
  }
  logout();
});

document.getElementById('global-reload').addEventListener('click', async () => {
  try {
    await refreshAll();
    log('データを再読込しました');
  } catch (e) {
    log(`再読込に失敗: ${e.message}`, true);
  }
});

forms.person.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const fd = new FormData(forms.person);
  try {
    await api('/api/v1/people', {
      method: 'POST',
      body: JSON.stringify({
        name: fd.get('name'),
        display_name: fd.get('display_name'),
        email: fd.get('email'),
        type: fd.get('type'),
        role: fd.get('role'),
        skills: collectCSV(fd.get('skills'))
      })
    });
    forms.person.reset();
    closeModal('person');
    await loadPeople();
    log('Peopleを追加しました');
  } catch (e) {
    log(`People作成失敗: ${e.message}`, true);
  }
});

forms.project.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const fd = new FormData(forms.project);
  try {
    await api('/api/v1/projects', {
      method: 'POST',
      body: JSON.stringify({
        name: fd.get('name'),
        description: fd.get('description'),
        start_date: fd.get('start_date'),
        end_date: fd.get('end_date'),
        pm: fd.get('pm'),
        member_person_ids: collectCSV(fd.get('member_person_ids'))
      })
    });
    forms.project.reset();
    closeModal('project');
    await loadProjects();
    log('Projectを作成しました');
  } catch (e) {
    log(`Project作成失敗: ${e.message}`, true);
  }
});

forms.room.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const fd = new FormData(forms.room);
  try {
    await api('/api/v1/rooms', {
      method: 'POST',
      body: JSON.stringify({
        type: fd.get('type'),
        room_id: fd.get('room_id'),
        related_person_id: fd.get('related_person_id'),
        related_project_id: fd.get('related_project_id'),
        member_user_ids: collectCSV(fd.get('member_user_ids'))
      })
    });
    forms.room.reset();
    closeModal('room');
    await loadRooms();
    log('Roomを作成しました');
  } catch (e) {
    log(`Room作成失敗: ${e.message}`, true);
  }
});

forms.contract.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const fd = new FormData(forms.contract);
  try {
    await api('/api/v1/contracts', {
      method: 'POST',
      body: JSON.stringify({
        person_id: fd.get('person_id'),
        contract_type: fd.get('contract_type'),
        rate: Number(fd.get('rate')),
        currency: fd.get('currency'),
        start_date: fd.get('start_date'),
        end_date: fd.get('end_date'),
        payment_terms: fd.get('payment_terms'),
        document_url: fd.get('document_url')
      })
    });
    forms.contract.reset();
    closeModal('contract');
    await loadContracts();
    await loadDashboard();
    log('Contractを作成しました');
  } catch (e) {
    log(`Contract作成失敗: ${e.message}`, true);
  }
});

forms.invoice.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const fd = new FormData(forms.invoice);
  try {
    await api('/api/v1/invoices', {
      method: 'POST',
      body: JSON.stringify({
        person_id: fd.get('person_id'),
        period: fd.get('period'),
        amount: Number(fd.get('amount')),
        currency: fd.get('currency'),
        file_url: fd.get('file_url')
      })
    });
    forms.invoice.reset();
    closeModal('invoice');
    if (me?.person_id) document.getElementById('invoice-person-id').value = me.person_id;
    await loadInvoices();
    await loadDashboard();
    log('Invoiceを提出しました');
  } catch (e) {
    log(`Invoice提出失敗: ${e.message}`, true);
  }
});

forms.profile.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const fd = new FormData(forms.profile);
  try {
    const res = await api('/api/v1/settings/profile', {
      method: 'PATCH',
      body: JSON.stringify({
        display_name: fd.get('display_name'),
        timezone: fd.get('timezone'),
        locale: fd.get('locale')
      })
    });
    me = res.user;
    setCurrentUserUI(me);
    log('プロフィール設定を更新しました');
  } catch (e) {
    log(`プロフィール更新失敗: ${e.message}`, true);
  }
});

forms.notify.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  try {
    const res = await api('/api/v1/settings/notifications', {
      method: 'PATCH',
      body: JSON.stringify({
        notify_email: notifyEmailEl.checked,
        notify_matrix: notifyMatrixEl.checked
      })
    });
    me = res.user;
    setCurrentUserUI(me);
    log('通知設定を更新しました');
  } catch (e) {
    log(`通知設定更新失敗: ${e.message}`, true);
  }
});

forms.password.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const fd = new FormData(forms.password);
  try {
    await api('/api/v1/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        old_password: fd.get('old_password'),
        new_password: fd.get('new_password')
      })
    });
    forms.password.reset();
    log('パスワードを変更しました');
  } catch (e) {
    log(`パスワード変更失敗: ${e.message}`, true);
  }
});

forms.invite.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const fd = new FormData(forms.invite);
  inviteResultEl.textContent = '';
  try {
    const res = await api('/api/v1/auth/invite', {
      method: 'POST',
      body: JSON.stringify({
        name: fd.get('name'),
        email: fd.get('email'),
        role: fd.get('role'),
        person_id: fd.get('person_id')
      })
    });
    inviteResultEl.textContent = `招待作成: ${res.user.email} / temp_password: ${res.temp_password}`;
    forms.invite.reset();
    log('ユーザー招待を作成しました');
  } catch (e) {
    log(`招待作成失敗: ${e.message}`, true);
  }
});

document.addEventListener('click', async (ev) => {
  const btn = ev.target.closest('.js-status-btn');
  if (!btn) return;

  const kind = btn.dataset.kind;
  const id = btn.dataset.id;
  const status = btn.dataset.status;
  try {
    if (kind === 'contract') {
      await api(`/api/v1/contracts/${encodeURIComponent(id)}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      await loadContracts();
    }
    if (kind === 'invoice') {
      await api(`/api/v1/invoices/${encodeURIComponent(id)}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      await loadInvoices();
    }
    await loadDashboard();
    log(`ステータス更新: ${kind} ${id} -> ${status}`);
  } catch (e) {
    log(`ステータス更新失敗: ${e.message}`, true);
  }
});

navItems.forEach((btn) => {
  btn.addEventListener('click', () => {
    activatePane(btn.dataset.target);
    if (mobileQuery.matches) closeMobileSidebar();
  });
});

modalTriggers.forEach((trigger) => {
  trigger.addEventListener('click', () => {
    const formKey = trigger.getAttribute('data-form-trigger');
    openModal(formKey);
  });
});

modalCloseButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const formKey = btn.getAttribute('data-close-modal');
    closeModal(formKey);
  });
});

sidebarToggleEl.addEventListener('click', () => {
  if (mobileQuery.matches) {
    shellEl.classList.toggle('is-sidebar-open');
    updateSidebarToggleLabel();
    return;
  }
  const collapsed = !shellEl.classList.contains('is-sidebar-collapsed');
  shellEl.classList.toggle('is-sidebar-collapsed', collapsed);
  localStorage.setItem('fp:sidebar-collapsed', collapsed ? '1' : '0');
  updateSidebarToggleLabel();
});

sidebarBackdropEl.addEventListener('click', closeMobileSidebar);
mobileQuery.addEventListener('change', syncSidebarState);

syncSidebarState();
updateSidebarToggleLabel();
activatePane('dashboard-pane');
setViewAuthed(false);

if (token) {
  bootstrapAuthed().catch(() => {
    logout(true);
    loginErrorEl.textContent = 'セッションが期限切れです。再ログインしてください。';
  });
}
