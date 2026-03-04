import http from 'http';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, 'public');

const PORT = Number(process.env.PORT || 3001);
const DAY = 24 * 60 * 60 * 1000;

function nowISO() {
  return new Date().toISOString();
}

function daysFromNow(days) {
  return new Date(Date.now() + days * DAY).toISOString().slice(0, 10);
}

function json(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) {
        reject(new Error('payload too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('invalid json'));
      }
    });
    req.on('error', reject);
  });
}

function dedupe(values) {
  const seen = new Set();
  const out = [];
  for (const v of Array.isArray(values) ? values : []) {
    const t = String(v || '').trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

function makeID(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

function roomLinks(roomID) {
  const escaped = encodeURIComponent(roomID);
  return {
    element_web: `https://app.element.io/#/room/${escaped}`,
    element_mobile: `element://room/${escaped}`
  };
}

function sanitizeUser(user) {
  return {
    user_id: user.user_id,
    email: user.email,
    role: user.role,
    name: user.name,
    display_name: user.display_name,
    person_id: user.person_id,
    locale: user.locale,
    timezone: user.timezone,
    notify_email: user.notify_email,
    notify_matrix: user.notify_matrix,
    created_at: user.created_at,
    updated_at: user.updated_at
  };
}

const people = [
  {
    person_id: 'person-admin-1',
    name: 'Admin User',
    display_name: 'Admin',
    email: 'admin@field.local',
    type: 'employee',
    role: 'admin',
    skills: ['ops', 'governance'],
    availability: 'full',
    status: 'active',
    created_at: nowISO(),
    updated_at: nowISO()
  },
  {
    person_id: 'person-backoffice-1',
    name: 'Backoffice User',
    display_name: 'BO',
    email: 'backoffice@field.local',
    type: 'employee',
    role: 'backoffice',
    skills: ['invoice', 'finance'],
    availability: 'full',
    status: 'active',
    created_at: nowISO(),
    updated_at: nowISO()
  },
  {
    person_id: 'person-member-1',
    name: 'Member User',
    display_name: 'Member',
    email: 'member@field.local',
    type: 'employee',
    role: 'member',
    skills: ['project'],
    availability: 'full',
    status: 'active',
    created_at: nowISO(),
    updated_at: nowISO()
  },
  {
    person_id: 'person-talent-1',
    name: 'Talent User',
    display_name: 'Talent',
    email: 'talent@field.local',
    type: 'contractor',
    role: 'talent',
    skills: ['react', 'typescript'],
    availability: 'part',
    status: 'active',
    created_at: nowISO(),
    updated_at: nowISO()
  }
];

const users = [
  {
    user_id: 'user-admin-1',
    email: 'admin@field.local',
    password: 'admin123',
    role: 'admin',
    name: 'Admin User',
    display_name: 'Admin',
    person_id: 'person-admin-1',
    locale: 'ja',
    timezone: 'Asia/Tokyo',
    notify_email: true,
    notify_matrix: true,
    created_at: nowISO(),
    updated_at: nowISO()
  },
  {
    user_id: 'user-backoffice-1',
    email: 'backoffice@field.local',
    password: 'backoffice123',
    role: 'backoffice',
    name: 'Backoffice User',
    display_name: 'BO',
    person_id: 'person-backoffice-1',
    locale: 'ja',
    timezone: 'Asia/Tokyo',
    notify_email: true,
    notify_matrix: false,
    created_at: nowISO(),
    updated_at: nowISO()
  },
  {
    user_id: 'user-member-1',
    email: 'member@field.local',
    password: 'member123',
    role: 'member',
    name: 'Member User',
    display_name: 'Member',
    person_id: 'person-member-1',
    locale: 'ja',
    timezone: 'Asia/Tokyo',
    notify_email: true,
    notify_matrix: true,
    created_at: nowISO(),
    updated_at: nowISO()
  },
  {
    user_id: 'user-talent-1',
    email: 'talent@field.local',
    password: 'talent123',
    role: 'talent',
    name: 'Talent User',
    display_name: 'Talent',
    person_id: 'person-talent-1',
    locale: 'ja',
    timezone: 'Asia/Tokyo',
    notify_email: false,
    notify_matrix: true,
    created_at: nowISO(),
    updated_at: nowISO()
  }
];

const projects = [
  {
    project_id: 'project-1',
    name: 'MVP Build',
    description: 'Field People MVP project',
    status: 'active',
    start_date: daysFromNow(-15),
    end_date: daysFromNow(45),
    pm: 'person-member-1',
    member_person_ids: ['person-member-1', 'person-talent-1'],
    created_at: nowISO(),
    updated_at: nowISO()
  }
];

const rooms = [
  {
    room_id: '!project-1:fieldpeople.local',
    type: 'project_room',
    related_person_id: '',
    related_project_id: 'project-1',
    member_user_ids: ['user-member-1', 'user-talent-1'],
    created_at: nowISO(),
    updated_at: nowISO()
  }
];

const contracts = [
  {
    contract_id: 'contract-1',
    person_id: 'person-talent-1',
    contract_type: 'monthly',
    rate: 450000,
    currency: 'JPY',
    start_date: daysFromNow(-20),
    end_date: daysFromNow(20),
    payment_terms: 'net30',
    document_url: '',
    status: 'active',
    created_at: nowISO(),
    updated_at: nowISO()
  }
];

const invoices = [
  {
    invoice_id: 'invoice-1',
    person_id: 'person-talent-1',
    period: '2026-02',
    amount: 450000,
    currency: 'JPY',
    status: 'submitted',
    file_url: '',
    submitted_at: nowISO(),
    approved_at: null,
    paid_at: null,
    created_at: nowISO(),
    updated_at: nowISO()
  }
];

const tasks = [
  {
    task_id: 'task-1',
    title: '請求書レビュー',
    assignee: 'person-backoffice-1',
    project_id: 'project-1',
    due_date: daysFromNow(5),
    status: 'open'
  }
];

const sessions = new Map();

const ACL = {
  admin: ['*'],
  backoffice: [
    'dashboard:read',
    'people:read',
    'people:write',
    'contracts:read',
    'contracts:write',
    'projects:read',
    'rooms:read',
    'rooms:write',
    'invoices:read',
    'invoices:write',
    'settings:read',
    'settings:write',
    'auth:invite'
  ],
  member: [
    'dashboard:read',
    'people:read',
    'contracts:read',
    'projects:read',
    'projects:write',
    'rooms:read',
    'rooms:write',
    'invoices:read',
    'settings:read',
    'settings:write'
  ],
  talent: [
    'dashboard:read',
    'projects:read',
    'rooms:read',
    'contracts:read',
    'invoices:read',
    'invoices:write',
    'settings:read',
    'settings:write'
  ]
};

function can(role, permission) {
  const rules = ACL[role] || [];
  return rules.includes('*') || rules.includes(permission);
}

function parseBearerToken(req) {
  const auth = String(req.headers.authorization || '').trim();
  if (!auth.startsWith('Bearer ')) return '';
  return auth.slice(7).trim();
}

function getAuthUser(req) {
  const token = parseBearerToken(req);
  if (!token) return null;
  const session = sessions.get(token);
  if (!session) return null;
  const user = users.find((u) => u.user_id === session.user_id);
  if (!user) return null;
  return { user, token };
}

function requirePermission(req, permission) {
  const auth = getAuthUser(req);
  if (!auth) return { ok: false, code: 401, message: 'unauthorized' };
  if (!can(auth.user.role, permission)) return { ok: false, code: 403, message: 'forbidden' };
  return { ok: true, user: auth.user, token: auth.token };
}

function assertTalentOwnership(user, personID) {
  if (user.role !== 'talent') return true;
  return user.person_id === personID;
}

function dashboardFor(user) {
  const now = Date.now();
  const end = now + 30 * DAY;
  const personScoped = (personID) => (user.role === 'talent' ? personID === user.person_id : true);

  const contractsExpiring = contracts.filter((c) => {
    if (!personScoped(c.person_id)) return false;
    if (c.status !== 'active') return false;
    const ts = Date.parse(`${c.end_date}T00:00:00Z`);
    return Number.isFinite(ts) && ts >= now && ts <= end;
  }).length;

  const submittedInvoices = invoices.filter((i) => personScoped(i.person_id) && i.status === 'submitted').length;
  const unsubmittedInvoices = invoices.filter((i) => personScoped(i.person_id) && i.status === 'draft').length;

  const dueTasks = tasks.filter((t) => {
    if (t.status === 'done') return false;
    if (user.role === 'talent' && t.assignee !== user.person_id) return false;
    const ts = Date.parse(`${t.due_date}T00:00:00Z`);
    return Number.isFinite(ts) && ts <= now + 7 * DAY;
  }).length;

  return {
    contracts_expiring_30d: contractsExpiring,
    invoices_unsubmitted: unsubmittedInvoices,
    invoices_unapproved: submittedInvoices,
    tasks_due_7d: dueTasks
  };
}

async function serveStatic(req, res, pathname) {
  const target = pathname === '/' ? '/index.html' : pathname;
  const full = path.join(publicDir, target);
  if (!full.startsWith(publicDir)) return json(res, 400, { error: 'invalid path' });

  try {
    const file = await readFile(full);
    const ext = path.extname(full);
    const types = {
      '.html': 'text/html; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.js': 'text/javascript; charset=utf-8',
      '.json': 'application/json; charset=utf-8'
    };
    res.writeHead(200, { 'content-type': types[ext] || 'application/octet-stream' });
    res.end(file);
  } catch {
    json(res, 404, { error: 'not found' });
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host || `localhost:${PORT}`}`);
    const { pathname, searchParams } = url;

    if (req.method === 'GET' && pathname === '/healthz') {
      return json(res, 200, { status: 'ok', time: nowISO() });
    }

    if (req.method === 'POST' && pathname === '/api/v1/auth/login') {
      const body = await parseBody(req);
      const email = String(body.email || '').trim().toLowerCase();
      const password = String(body.password || '');
      const user = users.find((u) => u.email === email && u.password === password);
      if (!user) return json(res, 401, { error: 'invalid credentials' });

      const token = crypto.randomBytes(24).toString('hex');
      sessions.set(token, { user_id: user.user_id, issued_at: nowISO() });
      return json(res, 200, { token, user: sanitizeUser(user) });
    }

    if (req.method === 'POST' && pathname === '/api/v1/auth/logout') {
      const auth = getAuthUser(req);
      if (!auth) return json(res, 200, { ok: true });
      sessions.delete(auth.token);
      return json(res, 200, { ok: true });
    }

    if (req.method === 'GET' && pathname === '/api/v1/auth/me') {
      const auth = requirePermission(req, 'settings:read');
      if (!auth.ok) return json(res, auth.code, { error: auth.message });
      return json(res, 200, { user: sanitizeUser(auth.user) });
    }

    if (req.method === 'POST' && pathname === '/api/v1/auth/invite') {
      const auth = requirePermission(req, 'auth:invite');
      if (!auth.ok) return json(res, auth.code, { error: auth.message });

      const body = await parseBody(req);
      const email = String(body.email || '').trim().toLowerCase();
      const name = String(body.name || '').trim();
      const role = String(body.role || '').trim().toLowerCase();
      const personID = String(body.person_id || '').trim();

      if (!email || !name || !role) return json(res, 400, { error: 'email,name,role are required' });
      if (!['admin', 'backoffice', 'member', 'talent'].includes(role)) return json(res, 400, { error: 'invalid role' });
      if (users.some((u) => u.email === email)) return json(res, 400, { error: 'email already exists' });

      const tempPassword = crypto.randomBytes(6).toString('hex');
      const now = nowISO();
      const created = {
        user_id: makeID('user'),
        email,
        password: tempPassword,
        role,
        name,
        display_name: name,
        person_id: personID,
        locale: 'ja',
        timezone: 'Asia/Tokyo',
        notify_email: true,
        notify_matrix: true,
        created_at: now,
        updated_at: now
      };
      users.push(created);
      return json(res, 201, { user: sanitizeUser(created), temp_password: tempPassword });
    }

    if (req.method === 'POST' && pathname === '/api/v1/auth/reset-password') {
      const auth = requirePermission(req, 'settings:write');
      if (!auth.ok) return json(res, auth.code, { error: auth.message });

      const body = await parseBody(req);
      const oldPassword = String(body.old_password || '');
      const newPassword = String(body.new_password || '');
      if (!oldPassword || !newPassword) return json(res, 400, { error: 'old_password,new_password are required' });
      if (auth.user.password !== oldPassword) return json(res, 400, { error: 'old_password is incorrect' });
      if (newPassword.length < 8) return json(res, 400, { error: 'new_password must be at least 8 chars' });

      auth.user.password = newPassword;
      auth.user.updated_at = nowISO();
      return json(res, 200, { ok: true });
    }

    if (req.method === 'GET' && pathname === '/api/v1/dashboard') {
      const auth = requirePermission(req, 'dashboard:read');
      if (!auth.ok) return json(res, auth.code, { error: auth.message });
      return json(res, 200, dashboardFor(auth.user));
    }

    if (req.method === 'PATCH' && pathname === '/api/v1/settings/profile') {
      const auth = requirePermission(req, 'settings:write');
      if (!auth.ok) return json(res, auth.code, { error: auth.message });

      const body = await parseBody(req);
      auth.user.display_name = String(body.display_name || '').trim() || auth.user.display_name;
      auth.user.timezone = String(body.timezone || '').trim() || auth.user.timezone;
      auth.user.locale = String(body.locale || '').trim() || auth.user.locale;
      auth.user.updated_at = nowISO();
      return json(res, 200, { user: sanitizeUser(auth.user) });
    }

    if (req.method === 'PATCH' && pathname === '/api/v1/settings/notifications') {
      const auth = requirePermission(req, 'settings:write');
      if (!auth.ok) return json(res, auth.code, { error: auth.message });

      const body = await parseBody(req);
      auth.user.notify_email = Boolean(body.notify_email);
      auth.user.notify_matrix = Boolean(body.notify_matrix);
      auth.user.updated_at = nowISO();
      return json(res, 200, { user: sanitizeUser(auth.user) });
    }

    if (req.method === 'GET' && pathname === '/api/v1/people') {
      const auth = requirePermission(req, 'people:read');
      if (!auth.ok) return json(res, auth.code, { error: auth.message });

      const q = String(searchParams.get('q') || '').toLowerCase();
      const type = String(searchParams.get('type') || '').toLowerCase();
      const role = String(searchParams.get('role') || '').toLowerCase();
      const status = String(searchParams.get('status') || '').toLowerCase();

      const items = people.filter((p) => {
        if (type && p.type !== type) return false;
        if (role && p.role !== role) return false;
        if (status && p.status !== status) return false;
        if (!q) return true;
        const hay = `${p.name} ${p.display_name || ''} ${p.email} ${(p.skills || []).join(' ')}`.toLowerCase();
        return hay.includes(q);
      });

      return json(res, 200, { items });
    }

    if (req.method === 'POST' && pathname === '/api/v1/people') {
      const auth = requirePermission(req, 'people:write');
      if (!auth.ok) return json(res, auth.code, { error: auth.message });

      const body = await parseBody(req);
      const name = String(body.name || '').trim();
      const email = String(body.email || '').trim().toLowerCase();
      const type = String(body.type || '').trim().toLowerCase();
      const role = String(body.role || '').trim().toLowerCase();
      const displayName = String(body.display_name || '').trim();
      const skills = dedupe(body.skills);

      if (!name || !email || !type || !role) {
        return json(res, 400, { error: 'name,email,type,role are required' });
      }
      if (!['employee', 'contractor', 'partner'].includes(type)) {
        return json(res, 400, { error: 'type must be employee|contractor|partner' });
      }
      if (!['admin', 'backoffice', 'member', 'talent'].includes(role)) {
        return json(res, 400, { error: 'role must be admin|backoffice|member|talent' });
      }

      const now = nowISO();
      const person = {
        person_id: makeID('person'),
        name,
        display_name: displayName,
        email,
        type,
        role,
        skills,
        availability: 'unknown',
        status: 'active',
        created_at: now,
        updated_at: now
      };
      people.push(person);
      return json(res, 201, person);
    }

    if (req.method === 'GET' && pathname === '/api/v1/projects') {
      const auth = requirePermission(req, 'projects:read');
      if (!auth.ok) return json(res, auth.code, { error: auth.message });

      const items = auth.user.role === 'talent'
        ? projects.filter((p) => p.member_person_ids.includes(auth.user.person_id))
        : projects;
      return json(res, 200, { items });
    }

    if (req.method === 'POST' && pathname === '/api/v1/projects') {
      const auth = requirePermission(req, 'projects:write');
      if (!auth.ok) return json(res, auth.code, { error: auth.message });

      const body = await parseBody(req);
      const name = String(body.name || '').trim();
      const description = String(body.description || '').trim();
      const startDate = String(body.start_date || '').trim();
      const endDate = String(body.end_date || '').trim();
      const pm = String(body.pm || '').trim();
      const members = dedupe(body.member_person_ids);
      if (!name) return json(res, 400, { error: 'name is required' });

      const now = nowISO();
      const project = {
        project_id: makeID('project'),
        name,
        description,
        status: 'active',
        start_date: startDate,
        end_date: endDate,
        pm,
        member_person_ids: members,
        created_at: now,
        updated_at: now
      };
      projects.push(project);
      return json(res, 201, project);
    }

    const projectMemberMatch = pathname.match(/^\/api\/v1\/projects\/([^/]+)\/members$/);
    if (req.method === 'POST' && projectMemberMatch) {
      const auth = requirePermission(req, 'projects:write');
      if (!auth.ok) return json(res, auth.code, { error: auth.message });

      const projectID = decodeURIComponent(projectMemberMatch[1]);
      const project = projects.find((p) => p.project_id === projectID);
      if (!project) return json(res, 404, { error: 'project not found' });

      const body = await parseBody(req);
      project.member_person_ids = dedupe([...(project.member_person_ids || []), ...(Array.isArray(body.member_person_ids) ? body.member_person_ids : [])]);
      project.updated_at = nowISO();
      return json(res, 200, project);
    }

    if (req.method === 'GET' && pathname === '/api/v1/contracts') {
      const auth = requirePermission(req, 'contracts:read');
      if (!auth.ok) return json(res, auth.code, { error: auth.message });

      const personID = String(searchParams.get('person_id') || '').trim();
      const status = String(searchParams.get('status') || '').trim().toLowerCase();
      const q = String(searchParams.get('q') || '').trim().toLowerCase();

      const items = contracts.filter((c) => {
        if (auth.user.role === 'talent' && c.person_id !== auth.user.person_id) return false;
        if (personID && c.person_id !== personID) return false;
        if (status && c.status !== status) return false;
        if (!q) return true;
        const hay = `${c.contract_type} ${c.currency} ${c.payment_terms || ''}`.toLowerCase();
        return hay.includes(q);
      });
      return json(res, 200, { items });
    }

    if (req.method === 'POST' && pathname === '/api/v1/contracts') {
      const auth = requirePermission(req, 'contracts:write');
      if (!auth.ok) return json(res, auth.code, { error: auth.message });

      const body = await parseBody(req);
      const personID = String(body.person_id || '').trim();
      const contractType = String(body.contract_type || '').trim();
      const rate = Number(body.rate);
      const currency = String(body.currency || '').trim().toUpperCase();
      const startDate = String(body.start_date || '').trim();
      const endDate = String(body.end_date || '').trim();
      const paymentTerms = String(body.payment_terms || '').trim();
      const documentURL = String(body.document_url || '').trim();

      if (!personID || !contractType || !Number.isFinite(rate) || !currency || !startDate || !endDate) {
        return json(res, 400, { error: 'person_id,contract_type,rate,currency,start_date,end_date are required' });
      }
      const personExists = people.some((p) => p.person_id === personID);
      if (!personExists) return json(res, 400, { error: 'person_id not found' });

      const now = nowISO();
      const contract = {
        contract_id: makeID('contract'),
        person_id: personID,
        contract_type: contractType,
        rate,
        currency,
        start_date: startDate,
        end_date: endDate,
        payment_terms: paymentTerms,
        document_url: documentURL,
        status: 'active',
        created_at: now,
        updated_at: now
      };
      contracts.push(contract);
      return json(res, 201, contract);
    }

    const contractStatusMatch = pathname.match(/^\/api\/v1\/contracts\/([^/]+)\/status$/);
    if (req.method === 'PATCH' && contractStatusMatch) {
      const auth = requirePermission(req, 'contracts:write');
      if (!auth.ok) return json(res, auth.code, { error: auth.message });

      const contractID = decodeURIComponent(contractStatusMatch[1]);
      const contract = contracts.find((c) => c.contract_id === contractID);
      if (!contract) return json(res, 404, { error: 'contract not found' });

      const body = await parseBody(req);
      const next = String(body.status || '').trim().toLowerCase();
      if (!['active', 'ended', 'cancelled'].includes(next)) {
        return json(res, 400, { error: 'status must be active|ended|cancelled' });
      }

      contract.status = next;
      contract.updated_at = nowISO();
      return json(res, 200, contract);
    }

    if (req.method === 'GET' && pathname === '/api/v1/rooms') {
      const auth = requirePermission(req, 'rooms:read');
      if (!auth.ok) return json(res, auth.code, { error: auth.message });

      const type = String(searchParams.get('type') || '').trim();
      const items = type ? rooms.filter((r) => r.type === type) : rooms;
      return json(res, 200, { items });
    }

    if (req.method === 'POST' && pathname === '/api/v1/rooms') {
      const auth = requirePermission(req, 'rooms:write');
      if (!auth.ok) return json(res, auth.code, { error: auth.message });

      const body = await parseBody(req);
      const type = String(body.type || '').trim();
      if (!['person_room', 'project_room', 'community_room'].includes(type)) {
        return json(res, 400, { error: 'invalid room type' });
      }

      const roomID = String(body.room_id || '').trim() || `!local-${Date.now()}:fieldpeople.local`;
      const relatedPersonID = String(body.related_person_id || '').trim();
      const relatedProjectID = String(body.related_project_id || '').trim();
      const memberUserIDs = dedupe(body.member_user_ids);

      if (type === 'person_room' && !relatedPersonID) {
        return json(res, 400, { error: 'related_person_id is required for person_room' });
      }
      if (type === 'project_room' && !relatedProjectID) {
        return json(res, 400, { error: 'related_project_id is required for project_room' });
      }

      const now = nowISO();
      const room = {
        room_id: roomID,
        type,
        related_person_id: relatedPersonID,
        related_project_id: relatedProjectID,
        member_user_ids: memberUserIDs,
        created_at: now,
        updated_at: now
      };
      rooms.push(room);
      return json(res, 201, room);
    }

    const syncMatch = pathname.match(/^\/api\/v1\/rooms\/([^/]+)\/members\/sync$/);
    if (req.method === 'POST' && syncMatch) {
      const auth = requirePermission(req, 'rooms:write');
      if (!auth.ok) return json(res, auth.code, { error: auth.message });

      const roomID = decodeURIComponent(syncMatch[1]);
      const room = rooms.find((r) => r.room_id === roomID);
      if (!room) return json(res, 404, { error: 'room not found' });

      const body = await parseBody(req);
      room.member_user_ids = dedupe(body.member_user_ids);
      room.updated_at = nowISO();
      return json(res, 200, room);
    }

    const linkMatch = pathname.match(/^\/api\/v1\/rooms\/([^/]+)\/links$/);
    if (req.method === 'GET' && linkMatch) {
      const auth = requirePermission(req, 'rooms:read');
      if (!auth.ok) return json(res, auth.code, { error: auth.message });

      const roomID = decodeURIComponent(linkMatch[1]);
      const room = rooms.find((r) => r.room_id === roomID);
      if (!room) return json(res, 404, { error: 'room not found' });

      return json(res, 200, { room_id: roomID, links: roomLinks(roomID) });
    }

    if (req.method === 'GET' && pathname === '/api/v1/invoices') {
      const auth = requirePermission(req, 'invoices:read');
      if (!auth.ok) return json(res, auth.code, { error: auth.message });

      const status = String(searchParams.get('status') || '').trim().toLowerCase();
      const items = invoices.filter((i) => {
        if (auth.user.role === 'talent' && i.person_id !== auth.user.person_id) return false;
        if (status && i.status !== status) return false;
        return true;
      });
      return json(res, 200, { items });
    }

    if (req.method === 'POST' && pathname === '/api/v1/invoices') {
      const auth = requirePermission(req, 'invoices:write');
      if (!auth.ok) return json(res, auth.code, { error: auth.message });

      const body = await parseBody(req);
      const personID = String(body.person_id || '').trim();
      if (!assertTalentOwnership(auth.user, personID)) {
        return json(res, 403, { error: 'talent can only submit own invoice' });
      }

      const period = String(body.period || '').trim();
      const amount = Number(body.amount);
      const currency = String(body.currency || '').trim().toUpperCase() || 'JPY';
      const fileURL = String(body.file_url || '').trim();

      if (!personID || !period || !Number.isFinite(amount)) {
        return json(res, 400, { error: 'person_id,period,amount are required' });
      }

      const now = nowISO();
      const invoice = {
        invoice_id: makeID('invoice'),
        person_id: personID,
        period,
        amount,
        currency,
        status: 'submitted',
        file_url: fileURL,
        submitted_at: now,
        approved_at: null,
        paid_at: null,
        created_at: now,
        updated_at: now
      };
      invoices.push(invoice);
      return json(res, 201, invoice);
    }

    const invoiceStatusMatch = pathname.match(/^\/api\/v1\/invoices\/([^/]+)\/status$/);
    if (req.method === 'PATCH' && invoiceStatusMatch) {
      const auth = requirePermission(req, 'invoices:write');
      if (!auth.ok) return json(res, auth.code, { error: auth.message });

      const invoiceID = decodeURIComponent(invoiceStatusMatch[1]);
      const invoice = invoices.find((i) => i.invoice_id === invoiceID);
      if (!invoice) return json(res, 404, { error: 'invoice not found' });

      const body = await parseBody(req);
      const next = String(body.status || '').trim().toLowerCase();
      if (!['draft', 'submitted', 'approved', 'paid'].includes(next)) {
        return json(res, 400, { error: 'status must be draft|submitted|approved|paid' });
      }

      invoice.status = next;
      if (next === 'approved') invoice.approved_at = nowISO();
      if (next === 'paid') invoice.paid_at = nowISO();
      invoice.updated_at = nowISO();
      return json(res, 200, invoice);
    }

    return serveStatic(req, res, pathname);
  } catch (err) {
    return json(res, 500, { error: err.message || 'internal error' });
  }
});

server.listen(PORT, () => {
  console.log(`Field People demo app running on http://localhost:${PORT}`);
  console.log('Demo users: admin@field.local/admin123, backoffice@field.local/backoffice123, member@field.local/member123, talent@field.local/talent123');
});
