const locale = 'ja';
const I18N = {
  ja: {
    subtitle: '業務管理 + Element連携',
    roleLabel: '現在ロール',
    navPeople: 'People',
    navRooms: 'Rooms',
    navContracts: 'Contracts',
    navActivity: 'Activity',
    peopleTitle: 'People',
    roomsTitle: 'Rooms',
    contractsTitle: 'Contracts',
    reload: '再読込',
    createPerson: '人材を追加',
    createRoom: 'Roomを作成',
    detailTitle: 'Detail',
    detailBody: 'People / Rooms の選択項目を将来ここに表示します。',
    i18nNote: '日本語完全対応は次フェーズで辞書を拡張して対応予定です。',
    openSidebar: 'サイドバーを開く',
    closeSidebar: 'サイドバーを閉じる',
    modalPersonTitle: '人材を追加しました',
    modalRoomTitle: 'Roomを作成しました',
    modalClose: '閉じる',
    modalViewPeople: 'Peopleを確認',
    modalViewRooms: 'Roomsを確認',
    modalAddAnother: '続けて追加',
    modalOpenElementWeb: 'Element Webを開く',
    modalOpenElementMobile: 'Element Mobileを開く',
    personName: '氏名',
    personDisplayName: '表示名',
    personEmail: 'メールアドレス',
    personSkills: 'スキル（カンマ区切り）',
    roomIdOptional: 'room_id（任意）',
    relatedPersonId: 'related_person_id',
    relatedProjectId: 'related_project_id',
    roomMembers: 'メンバー user_id（カンマ区切り）',
    logPeopleLoaded: 'People読み込み件数',
    logPeopleLoadFailed: 'People読み込み失敗',
    logRoomsLoaded: 'Rooms読み込み件数',
    logRoomsLoadFailed: 'Rooms読み込み失敗',
    logPersonCreated: '人材を作成',
    logPersonCreateFailed: '人材作成失敗',
    logRoomCreated: 'Roomを作成',
    logRoomCreateFailed: 'Room作成失敗',
    logContractsLoaded: 'Contracts読み込み件数',
    logContractsLoadFailed: 'Contracts読み込み失敗',
    logContractCreated: 'Contractを作成',
    logContractCreateFailed: 'Contract作成失敗',
    logContractStatusUpdated: 'Contractステータス更新',
    logContractStatusUpdateFailed: 'Contractステータス更新失敗',
    members: 'メンバー',
    createContract: '契約を追加',
    contractPersonId: 'person_id',
    contractType: 'contract_type',
    contractRate: 'rate',
    contractCurrency: 'currency',
    contractStartDate: 'start_date',
    contractEndDate: 'end_date',
    contractPaymentTerms: 'payment_terms',
    contractDocumentUrl: 'document_url',
    status: 'status'
  }
};

const t = (k) => I18N[locale][k] || k;

const roleEl = document.getElementById('role');
const shellEl = document.querySelector('.shell');
const mainTitleEl = document.querySelector('.main-head h2');
const personForm = document.getElementById('person-form');
const roomForm = document.getElementById('room-form');
const contractForm = document.getElementById('contract-form');
const peopleList = document.getElementById('people-list');
const roomList = document.getElementById('room-list');
const contractList = document.getElementById('contract-list');
const logEl = document.getElementById('log');
const sidebarToggleEl = document.getElementById('sidebar-toggle');
const sidebarBackdropEl = document.getElementById('sidebar-backdrop');
const modalLayerEl = document.getElementById('app-modal');
const modalTitleEl = document.getElementById('modal-title');
const modalBodyEl = document.getElementById('modal-body');
const modalActionsEl = document.getElementById('modal-actions');
const modalCloseEl = document.getElementById('modal-close');
const navItems = Array.from(document.querySelectorAll('.nav-item'));
const panes = Array.from(document.querySelectorAll('.pane'));
const mobileQuery = window.matchMedia('(max-width: 900px)');
let lastFocusedEl = null;

function applyI18n() {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
}

function log(message, error = false) {
  const now = new Date().toLocaleTimeString();
  const color = error ? '#b91c1c' : '#111111';
  logEl.innerHTML = `<div style="color:${color}">[${now}] ${message}</div>`;
}

async function api(path, options = {}) {
  const headers = {
    'content-type': 'application/json',
    'x-role': roleEl.value,
    'x-user-id': 'demo-user',
    ...(options.headers || {})
  };

  const res = await fetch(path, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

function activatePane(target) {
  navItems.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.target === target);
  });
  panes.forEach((pane) => {
    pane.classList.toggle('is-visible', pane.id === target);
  });
  const titleMap = {
    'people-pane': 'peopleTitle',
    'rooms-pane': 'roomsTitle',
    'contracts-pane': 'contractsTitle',
    'activity-pane': 'navActivity'
  };
  mainTitleEl.textContent = t(titleMap[target] || 'peopleTitle');
}

function escapeHTML(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function closeModal() {
  modalLayerEl.hidden = true;
  document.body.classList.remove('modal-open');
  modalBodyEl.textContent = '';
  modalActionsEl.innerHTML = '';
  if (lastFocusedEl && typeof lastFocusedEl.focus === 'function') {
    lastFocusedEl.focus();
  }
}

function openModal({ title, bodyHTML, actions = [] }) {
  lastFocusedEl = document.activeElement;
  modalTitleEl.textContent = title;
  modalBodyEl.innerHTML = bodyHTML;
  modalActionsEl.innerHTML = '';

  for (const action of actions) {
    const node = action.href ? document.createElement('a') : document.createElement('button');
    node.textContent = action.label;
    node.className = action.variant === 'secondary' ? 'btn secondary' : 'btn';
    if (action.href) {
      node.href = action.href;
      node.target = action.target || '_blank';
      node.rel = action.rel || 'noreferrer';
    } else {
      node.type = 'button';
      node.addEventListener('click', () => {
        if (typeof action.onClick === 'function') action.onClick();
      });
    }
    if (action.closeOnClick !== false) {
      node.addEventListener('click', closeModal);
    }
    modalActionsEl.appendChild(node);
  }

  if (!actions.length) {
    const fallback = document.createElement('button');
    fallback.type = 'button';
    fallback.className = 'btn';
    fallback.textContent = t('modalClose');
    fallback.addEventListener('click', closeModal);
    modalActionsEl.appendChild(fallback);
  }

  modalLayerEl.hidden = false;
  document.body.classList.add('modal-open');
  modalCloseEl.focus();
}

function updateSidebarToggleLabel() {
  const isMobile = mobileQuery.matches;
  const isOpen = shellEl.classList.contains('is-sidebar-open');
  const isCollapsed = shellEl.classList.contains('is-sidebar-collapsed');
  const expanded = isMobile ? isOpen : !isCollapsed;
  sidebarToggleEl.setAttribute('aria-expanded', String(expanded));
  sidebarToggleEl.textContent = t(expanded ? 'closeSidebar' : 'openSidebar');
}

function setDesktopSidebarCollapsed(collapsed) {
  shellEl.classList.toggle('is-sidebar-collapsed', collapsed);
  localStorage.setItem('fp:sidebar-collapsed', collapsed ? '1' : '0');
  updateSidebarToggleLabel();
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
  setDesktopSidebarCollapsed(localStorage.getItem('fp:sidebar-collapsed') === '1');
}

async function loadPeople() {
  try {
    const data = await api('/api/v1/people');
    peopleList.innerHTML = '';
    for (const p of data.items || []) {
      const li = document.createElement('li');
      li.innerHTML = `
        <div class="item-top">
          <strong>${p.name}</strong>
          <span class="badge">${p.role}</span>
        </div>
        <div>${p.email}</div>
        <div style="margin-top:6px">
          <span class="badge type">${p.type}</span>
          <span class="badge">${p.status}</span>
        </div>
      `;
      peopleList.appendChild(li);
    }
    log(`${t('logPeopleLoaded')}: ${data.items?.length || 0}`);
  } catch (e) {
    log(`${t('logPeopleLoadFailed')}: ${e.message}`, true);
  }
}

async function loadRooms() {
  try {
    const data = await api('/api/v1/rooms');
    roomList.innerHTML = '';
    for (const r of data.items || []) {
      const links = await api(`/api/v1/rooms/${encodeURIComponent(r.room_id)}/links`).catch(() => null);
      const li = document.createElement('li');
      li.innerHTML = `
        <div class="item-top">
          <strong>${r.room_id}</strong>
          <span class="badge type">${r.type}</span>
        </div>
        <div>${t('members')}: ${(r.member_user_ids || []).join(', ') || '-'}</div>
        ${links ? `<div class="links"><a href="${links.links.element_web}" target="_blank" rel="noreferrer">Element Web</a><a href="${links.links.element_mobile}">Element Mobile</a></div>` : ''}
      `;
      roomList.appendChild(li);
    }
    log(`${t('logRoomsLoaded')}: ${data.items?.length || 0}`);
  } catch (e) {
    log(`${t('logRoomsLoadFailed')}: ${e.message}`, true);
  }
}

async function loadContracts() {
  try {
    const data = await api('/api/v1/contracts');
    contractList.innerHTML = '';
    for (const c of data.items || []) {
      const li = document.createElement('li');
      li.innerHTML = `
        <div class="item-top">
          <strong>${c.contract_id}</strong>
          <span class="badge type">${c.contract_type}</span>
        </div>
        <div>person_id: ${c.person_id}</div>
        <div>rate: ${c.rate} ${c.currency} / status: <span class="badge">${c.status}</span></div>
        <div>term: ${c.start_date} ~ ${c.end_date}</div>
        <div class="links">
          <button class="btn ghost contract-status-btn" type="button" data-contract-id="${c.contract_id}" data-status="active">active</button>
          <button class="btn ghost contract-status-btn" type="button" data-contract-id="${c.contract_id}" data-status="ended">ended</button>
          <button class="btn ghost contract-status-btn" type="button" data-contract-id="${c.contract_id}" data-status="cancelled">cancelled</button>
        </div>
      `;
      contractList.appendChild(li);
    }
    contractList.querySelectorAll('.contract-status-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        try {
          await api(`/api/v1/contracts/${encodeURIComponent(btn.dataset.contractId)}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status: btn.dataset.status })
          });
          log(`${t('logContractStatusUpdated')}: ${btn.dataset.contractId} -> ${btn.dataset.status}`);
          await loadContracts();
        } catch (e) {
          log(`${t('logContractStatusUpdateFailed')}: ${e.message}`, true);
        }
      });
    });
    log(`${t('logContractsLoaded')}: ${data.items?.length || 0}`);
  } catch (e) {
    log(`${t('logContractsLoadFailed')}: ${e.message}`, true);
  }
}

personForm.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const fd = new FormData(personForm);
  const body = {
    name: fd.get('name'),
    display_name: fd.get('display_name'),
    email: fd.get('email'),
    type: fd.get('type'),
    role: fd.get('role'),
    skills: String(fd.get('skills') || '').split(',').map((v) => v.trim()).filter(Boolean)
  };
  try {
    const created = await api('/api/v1/people', { method: 'POST', body: JSON.stringify(body) });
    log(`${t('logPersonCreated')}: ${created.person_id}`);
    personForm.reset();
    await loadPeople();
    openModal({
      title: t('modalPersonTitle'),
      bodyHTML: `<p><strong>${escapeHTML(created.name || body.name)}</strong> (${escapeHTML(created.role)})</p><p>ID: ${escapeHTML(created.person_id)}</p>`,
      actions: [
        {
          label: t('modalAddAnother'),
          variant: 'secondary',
          onClick: () => personForm.querySelector('input[name=\"name\"]')?.focus()
        },
        {
          label: t('modalViewPeople'),
          onClick: () => activatePane('people-pane')
        }
      ]
    });
  } catch (e) {
    log(`${t('logPersonCreateFailed')}: ${e.message}`, true);
  }
});

roomForm.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const fd = new FormData(roomForm);
  const body = {
    type: fd.get('type'),
    room_id: fd.get('room_id'),
    related_person_id: fd.get('related_person_id'),
    related_project_id: fd.get('related_project_id'),
    member_user_ids: String(fd.get('member_user_ids') || '').split(',').map((v) => v.trim()).filter(Boolean)
  };
  try {
    const created = await api('/api/v1/rooms', { method: 'POST', body: JSON.stringify(body) });
    log(`${t('logRoomCreated')}: ${created.room_id}`);
    roomForm.reset();
    await loadRooms();
    const links = await api(`/api/v1/rooms/${encodeURIComponent(created.room_id)}/links`).catch(() => null);
    const actions = [
      {
        label: t('modalViewRooms'),
        variant: 'secondary',
        onClick: () => activatePane('rooms-pane')
      }
    ];
    if (links?.links?.element_web) {
      actions.push({
        label: t('modalOpenElementWeb'),
        href: links.links.element_web
      });
    }
    if (links?.links?.element_mobile) {
      actions.push({
        label: t('modalOpenElementMobile'),
        href: links.links.element_mobile,
        target: '_self',
        rel: ''
      });
    }
    openModal({
      title: t('modalRoomTitle'),
      bodyHTML: `<p><strong>${escapeHTML(created.room_id)}</strong></p><p>${t('members')}: ${escapeHTML((created.member_user_ids || []).join(', ') || '-')}</p>`,
      actions
    });
  } catch (e) {
    log(`${t('logRoomCreateFailed')}: ${e.message}`, true);
  }
});

contractForm.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const fd = new FormData(contractForm);
  const body = {
    person_id: fd.get('person_id'),
    contract_type: fd.get('contract_type'),
    rate: Number(fd.get('rate')),
    currency: fd.get('currency'),
    start_date: fd.get('start_date'),
    end_date: fd.get('end_date'),
    payment_terms: fd.get('payment_terms'),
    document_url: fd.get('document_url')
  };
  try {
    const created = await api('/api/v1/contracts', { method: 'POST', body: JSON.stringify(body) });
    log(`${t('logContractCreated')}: ${created.contract_id}`);
    contractForm.reset();
    await loadContracts();
    activatePane('contracts-pane');
  } catch (e) {
    log(`${t('logContractCreateFailed')}: ${e.message}`, true);
  }
});

document.getElementById('reload-people').addEventListener('click', loadPeople);
document.getElementById('reload-rooms').addEventListener('click', loadRooms);
document.getElementById('reload-contracts').addEventListener('click', loadContracts);
roleEl.addEventListener('change', async () => {
  await loadPeople();
  await loadRooms();
  await loadContracts();
});

navItems.forEach((btn) => {
  btn.addEventListener('click', () => {
    activatePane(btn.dataset.target);
    if (mobileQuery.matches) closeMobileSidebar();
  });
});

sidebarToggleEl.addEventListener('click', () => {
  if (mobileQuery.matches) {
    shellEl.classList.toggle('is-sidebar-open');
    updateSidebarToggleLabel();
    return;
  }
  setDesktopSidebarCollapsed(!shellEl.classList.contains('is-sidebar-collapsed'));
});

sidebarBackdropEl.addEventListener('click', closeMobileSidebar);
mobileQuery.addEventListener('change', syncSidebarState);
modalCloseEl.addEventListener('click', closeModal);
modalLayerEl.addEventListener('click', (ev) => {
  if (ev.target?.dataset?.closeModal === 'true') closeModal();
});
document.addEventListener('keydown', (ev) => {
  if (ev.key === 'Escape' && !modalLayerEl.hidden) closeModal();
});

applyI18n();
syncSidebarState();
updateSidebarToggleLabel();
activatePane('people-pane');
await loadPeople();
await loadRooms();
await loadContracts();
