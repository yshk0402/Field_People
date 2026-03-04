import http from 'http';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, 'public');

const PORT = Number(process.env.PORT || 3001);

const people = [];
const rooms = [];

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

function requireRole(req, allowed) {
  const role = String(req.headers['x-role'] || '').toLowerCase().trim();
  if (!role) return { ok: false, code: 401, message: 'missing x-role header' };
  if (!allowed.includes(role)) return { ok: false, code: 403, message: 'forbidden' };
  return { ok: true, role };
}

function roomLinks(roomID) {
  const escaped = encodeURIComponent(roomID);
  return {
    element_web: `https://app.element.io/#/room/${escaped}`,
    element_mobile: `element://room/${escaped}`
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
      return json(res, 200, { status: 'ok', time: new Date().toISOString() });
    }

    if (req.method === 'GET' && pathname === '/api/v1/people') {
      const auth = requireRole(req, ['admin', 'backoffice', 'member']);
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
      const auth = requireRole(req, ['admin', 'backoffice']);
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

      const now = new Date().toISOString();
      const person = {
        person_id: makeID('person'),
        name,
        display_name: displayName,
        email,
        type,
        role,
        skills,
        status: 'active',
        created_at: now,
        updated_at: now
      };
      people.push(person);
      return json(res, 201, person);
    }

    if (req.method === 'GET' && pathname === '/api/v1/rooms') {
      const auth = requireRole(req, ['admin', 'backoffice', 'member', 'talent']);
      if (!auth.ok) return json(res, auth.code, { error: auth.message });

      const type = String(searchParams.get('type') || '').trim();
      const items = type ? rooms.filter((r) => r.type === type) : rooms;
      return json(res, 200, { items });
    }

    if (req.method === 'POST' && pathname === '/api/v1/rooms') {
      const auth = requireRole(req, ['admin', 'backoffice', 'member']);
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

      const now = new Date().toISOString();
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
      const auth = requireRole(req, ['admin', 'backoffice', 'member']);
      if (!auth.ok) return json(res, auth.code, { error: auth.message });

      const roomID = decodeURIComponent(syncMatch[1]);
      const room = rooms.find((r) => r.room_id === roomID);
      if (!room) return json(res, 404, { error: 'room not found' });

      const body = await parseBody(req);
      room.member_user_ids = dedupe(body.member_user_ids);
      room.updated_at = new Date().toISOString();
      return json(res, 200, room);
    }

    const linkMatch = pathname.match(/^\/api\/v1\/rooms\/([^/]+)\/links$/);
    if (req.method === 'GET' && linkMatch) {
      const auth = requireRole(req, ['admin', 'backoffice', 'member', 'talent']);
      if (!auth.ok) return json(res, auth.code, { error: auth.message });

      const roomID = decodeURIComponent(linkMatch[1]);
      const room = rooms.find((r) => r.room_id === roomID);
      if (!room) return json(res, 404, { error: 'room not found' });

      return json(res, 200, { room_id: roomID, links: roomLinks(roomID) });
    }

    return serveStatic(req, res, pathname);
  } catch (err) {
    return json(res, 500, { error: err.message || 'internal error' });
  }
});

server.listen(PORT, () => {
  console.log(`Field People demo app running on http://localhost:${PORT}`);
});
