// ============================================
// ZELTA PREMIUM - Backend Server
// Express + sql.js + File Upload
// ============================================

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const initSqlJs = require('sql.js');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Paths ---
const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'zelta.db');
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');

// Ensure directories exist
fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

let db = null;

// --- Save DB to disk periodically ---
function saveDB() {
  if (!db) return;
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  } catch(e) {
    console.error('[Zelta] DB save error:', e);
  }
}

// Auto-save every 10 seconds
setInterval(saveDB, 10000);

// --- Init Database ---
async function initDB() {
  const SQL = await initSqlJs();
  
  // Load existing DB or create new
  try {
    if (fs.existsSync(DB_PATH)) {
      const fileBuffer = fs.readFileSync(DB_PATH);
      db = new SQL.Database(fileBuffer);
      console.log('[Zelta] Loaded existing database');
    } else {
      db = new SQL.Database();
      console.log('[Zelta] Created new database');
    }
  } catch(e) {
    db = new SQL.Database();
    console.log('[Zelta] Created fresh database (load failed)');
  }

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS leads (
      lead_id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      telegram_user_id TEXT,
      telegram_username TEXT,
      full_name TEXT,
      selected_language TEXT DEFAULT 'uz',
      photo_1 TEXT,
      photo_2 TEXT,
      photo_3 TEXT,
      phone_number TEXT,
      furniture_interest TEXT,
      room_type TEXT,
      current_status TEXT DEFAULT 'new',
      source TEXT DEFAULT 'telegram_mini_app',
      session_metadata TEXT,
      submitted_at TEXT,
      manager_assigned TEXT,
      first_contact_at TEXT,
      notes TEXT,
      sla_deadline TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS analytics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      telegram_user_id TEXT,
      screen_number INTEGER,
      language TEXT,
      timestamp TEXT NOT NULL,
      session_id TEXT,
      metadata TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS lead_status_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id TEXT NOT NULL,
      old_status TEXT,
      new_status TEXT NOT NULL,
      changed_at TEXT NOT NULL,
      changed_by TEXT
    )
  `);

  saveDB();
}

// --- Middleware ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// --- File Upload Config ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dateDir = new Date().toISOString().split('T')[0];
    const uploadDir = path.join(UPLOADS_DIR, dateDir);
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// --- Helper: query DB ---
function dbAll(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    if (params.length) stmt.bind(params);
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  } catch(e) {
    console.error('[Zelta] DB query error:', e);
    return [];
  }
}

function dbGet(sql, params = []) {
  const results = dbAll(sql, params);
  return results.length > 0 ? results[0] : null;
}

function dbRun(sql, params = []) {
  try {
    db.run(sql, params);
  } catch(e) {
    console.error('[Zelta] DB run error:', e);
  }
}

// --- API: Track Analytics Event ---
app.post('/api/analytics', (req, res) => {
  try {
    const { event_type, telegram_user_id, screen_number, language, session_id, metadata } = req.body;
    const now = new Date().toISOString();
    dbRun(
      'INSERT INTO analytics (event_type, telegram_user_id, screen_number, language, timestamp, session_id, metadata) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [event_type || 'unknown', telegram_user_id || null, screen_number || null, language || null, now, session_id || null, metadata ? JSON.stringify(metadata) : null]
    );
    saveDB();
    res.json({ success: true });
  } catch(e) {
    console.error('[Zelta] Analytics error:', e);
    res.status(500).json({ error: 'Analytics error' });
  }
});

// --- API: Get Funnel Analytics ---
app.get('/api/analytics/funnel', (req, res) => {
  try {
    const screenViews = dbAll(`
      SELECT screen_number, COUNT(DISTINCT COALESCE(telegram_user_id, session_id)) as unique_users
      FROM analytics
      WHERE event_type = 'screen_view'
      GROUP BY screen_number
      ORDER BY screen_number
    `);

    const totalStarts = dbGet("SELECT COUNT(DISTINCT COALESCE(telegram_user_id, session_id)) as count FROM analytics WHERE event_type = 'screen_view' AND screen_number = 1");
    const totalCompleted = dbGet("SELECT COUNT(*) as count FROM leads");
    const todayStarts = dbGet("SELECT COUNT(DISTINCT COALESCE(telegram_user_id, session_id)) as count FROM analytics WHERE event_type = 'screen_view' AND screen_number = 1 AND date(timestamp) = date('now')");
    const todayCompleted = dbGet("SELECT COUNT(*) as count FROM leads WHERE date(created_at) = date('now')");

    // Counter: 50 - completed leads
    const completedCount = totalCompleted ? totalCompleted.count : 0;
    const remainingSlots = Math.max(0, 50 - completedCount);
    const currentPosition = Math.min(completedCount + 1, 50);

    res.json({
      funnel: screenViews.reduce((acc, r) => { acc['screen_' + r.screen_number] = r.unique_users; return acc; }, {}),
      total_starts: totalStarts ? totalStarts.count : 0,
      total_completed: completedCount,
      today_starts: todayStarts ? todayStarts.count : 0,
      today_completed: todayCompleted ? todayCompleted.count : 0,
      remaining_slots: remainingSlots,
      current_position: currentPosition
    });
  } catch(e) {
    console.error('[Zelta] Funnel analytics error:', e);
    res.status(500).json({ error: 'Analytics error' });
  }
});

// --- API: Get Counter for Mini App ---
app.get('/api/counter', (req, res) => {
  try {
    const totalCompleted = dbGet("SELECT COUNT(*) as count FROM leads");
    const completedCount = totalCompleted ? totalCompleted.count : 0;
    const position = Math.min(completedCount + 1, 50);
    const remaining = Math.max(0, 50 - completedCount);
    res.json({ position, remaining, total: 50, completed: completedCount });
  } catch(e) {
    res.json({ position: 36, remaining: 14, total: 50, completed: 36 });
  }
});

// --- API: Submit Lead ---
app.post('/api/leads', upload.fields([
  { name: 'photo_1', maxCount: 1 },
  { name: 'photo_2', maxCount: 1 },
  { name: 'photo_3', maxCount: 1 }
]), (req, res) => {
  try {
    let leadInfo = {};
    try {
      leadInfo = JSON.parse(req.body.lead_data || '{}');
    } catch(e) {
      leadInfo = req.body;
    }

    const leadId = 'ZP-' + Date.now().toString(36).toUpperCase() + '-' + crypto.randomBytes(3).toString('hex').toUpperCase();
    const now = new Date().toISOString();
    const slaDeadline = new Date(Date.now() + 20 * 60 * 1000).toISOString();

    // Get photo paths
    const getPhotoPath = (key) => {
      if (req.files && req.files[key] && req.files[key][0]) {
        const fullPath = req.files[key][0].path;
        const idx = fullPath.indexOf('uploads');
        return '/' + fullPath.substring(idx).replace(/\\/g, '/');
      }
      return null;
    };

    const photo1 = getPhotoPath('photo_1');
    const photo2 = getPhotoPath('photo_2');
    const photo3 = getPhotoPath('photo_3');

    dbRun(`
      INSERT INTO leads (
        lead_id, created_at, telegram_user_id, telegram_username, full_name,
        selected_language, photo_1, photo_2, photo_3, phone_number,
        furniture_interest, room_type, current_status, source,
        session_metadata, submitted_at, sla_deadline
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?, ?, ?)
    `, [
      leadId,
      now,
      leadInfo.telegram_user_id || null,
      leadInfo.telegram_username || null,
      leadInfo.full_name || null,
      leadInfo.selected_language || 'uz',
      photo1,
      photo2,
      photo3,
      leadInfo.phone_number || null,
      leadInfo.furniture_interest || null,
      leadInfo.room_type || null,
      leadInfo.source || 'telegram_mini_app',
      JSON.stringify(leadInfo),
      leadInfo.submitted_at || now,
      slaDeadline
    ]);

    // Log status
    dbRun('INSERT INTO lead_status_log (lead_id, new_status, changed_at) VALUES (?, ?, ?)', [leadId, 'new', now]);

    saveDB();

    // Notify admin
    notifyAdmin(leadId, leadInfo);

    res.json({ success: true, lead_id: leadId });

  } catch (err) {
    console.error('[Zelta] Lead submission error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// --- API: Get Leads (Admin) ---
app.get('/api/leads', (req, res) => {
  try {
    const { status, limit = 50, offset = 0, search } = req.query;
    
    let query = 'SELECT * FROM leads';
    let params = [];
    let conditions = [];

    if (status && status !== 'all') {
      conditions.push('current_status = ?');
      params.push(status);
    }

    if (search) {
      conditions.push("(phone_number LIKE ? OR full_name LIKE ? OR telegram_username LIKE ? OR lead_id LIKE ?)");
      const searchTerm = '%' + search + '%';
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const leads = dbAll(query, params);
    
    const counts = dbAll('SELECT current_status, COUNT(*) as count FROM leads GROUP BY current_status');
    const total = dbGet('SELECT COUNT(*) as total FROM leads');

    res.json({
      leads,
      counts: counts.reduce((acc, c) => { acc[c.current_status] = c.count; return acc; }, {}),
      total: total ? total.total : 0
    });

  } catch (err) {
    console.error('[Zelta] Get leads error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- API: Get Single Lead ---
app.get('/api/leads/:id', (req, res) => {
  try {
    const lead = dbGet('SELECT * FROM leads WHERE lead_id = ?', [req.params.id]);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const statusLog = dbAll('SELECT * FROM lead_status_log WHERE lead_id = ? ORDER BY changed_at DESC', [req.params.id]);
    
    res.json({ lead, status_log: statusLog });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- API: Update Lead Status ---
app.patch('/api/leads/:id', (req, res) => {
  try {
    const { status, notes, manager_assigned, mark_contacted } = req.body;
    const lead = dbGet('SELECT * FROM leads WHERE lead_id = ?', [req.params.id]);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const now = new Date().toISOString();

    if (status && status !== lead.current_status) {
      dbRun('UPDATE leads SET current_status = ? WHERE lead_id = ?', [status, req.params.id]);
      dbRun('INSERT INTO lead_status_log (lead_id, old_status, new_status, changed_at, changed_by) VALUES (?, ?, ?, ?, ?)',
        [req.params.id, lead.current_status, status, now, manager_assigned || 'admin']);
    }

    // Mark as contacted
    if (mark_contacted && !lead.first_contact_at) {
      dbRun('UPDATE leads SET first_contact_at = ? WHERE lead_id = ?', [now, req.params.id]);
    }

    if (notes !== undefined) {
      dbRun('UPDATE leads SET notes = ? WHERE lead_id = ?', [notes, req.params.id]);
    }

    if (manager_assigned !== undefined) {
      dbRun('UPDATE leads SET manager_assigned = ? WHERE lead_id = ?', [manager_assigned, req.params.id]);
    }

    saveDB();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- API: Delete Lead ---
app.delete('/api/leads/:id', (req, res) => {
  try {
    const lead = dbGet('SELECT * FROM leads WHERE lead_id = ?', [req.params.id]);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    // Delete photos from disk
    [lead.photo_1, lead.photo_2, lead.photo_3].forEach(p => {
      if (p) {
        const filePath = path.join(__dirname, 'public', p);
        try { fs.unlinkSync(filePath); } catch(e) {}
      }
    });

    dbRun('DELETE FROM lead_status_log WHERE lead_id = ?', [req.params.id]);
    dbRun('DELETE FROM leads WHERE lead_id = ?', [req.params.id]);
    saveDB();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- API: Export Leads CSV ---
app.get('/api/export/csv', (req, res) => {
  try {
    const leads = dbAll('SELECT * FROM leads ORDER BY created_at DESC');
    
    const headers = ['lead_id', 'created_at', 'telegram_user_id', 'telegram_username', 'full_name', 
      'selected_language', 'phone_number', 'furniture_interest', 'room_type', 'current_status',
      'submitted_at', 'manager_assigned', 'first_contact_at', 'notes'];
    
    let csv = headers.join(',') + '\n';
    leads.forEach(lead => {
      csv += headers.map(h => {
        const val = lead[h] || '';
        return '"' + String(val).replace(/"/g, '""') + '"';
      }).join(',') + '\n';
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=zelta_leads_' + new Date().toISOString().split('T')[0] + '.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: 'Export failed' });
  }
});

// --- API: Dashboard Stats ---
app.get('/api/stats', (req, res) => {
  try {
    const total = dbGet('SELECT COUNT(*) as count FROM leads');
    const today = dbGet("SELECT COUNT(*) as count FROM leads WHERE date(created_at) = date('now')");
    const byStatus = dbAll('SELECT current_status, COUNT(*) as count FROM leads GROUP BY current_status');
    
    const slaCompliant = dbGet(`
      SELECT COUNT(*) as count FROM leads 
      WHERE first_contact_at IS NOT NULL 
      AND (julianday(first_contact_at) - julianday(submitted_at)) * 1440 <= 20
    `);

    const slaTotal = dbGet('SELECT COUNT(*) as count FROM leads WHERE first_contact_at IS NOT NULL');

    res.json({
      total: total ? total.count : 0,
      today: today ? today.count : 0,
      by_status: byStatus.reduce((acc, c) => { acc[c.current_status] = c.count; return acc; }, {}),
      sla_compliance: (slaTotal && slaTotal.count > 0) ? Math.round(((slaCompliant ? slaCompliant.count : 0) / slaTotal.count) * 100) : 100
    });
  } catch (err) {
    res.status(500).json({ error: 'Stats error' });
  }
});

// --- Admin Notification ---
function notifyAdmin(leadId, leadInfo) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const adminChatId = process.env.ADMIN_CHAT_ID;
  
  if (!botToken || !adminChatId) {
    console.log('[Zelta] Admin notification skipped (no bot token/chat ID configured)');
    return;
  }

  const message = `🔔 *Yangi so'rov!*\n\n` +
    `📋 ID: \`${leadId}\`\n` +
    `📞 Tel: ${leadInfo.phone_number || 'N/A'}\n` +
    `👤 ${leadInfo.full_name || leadInfo.telegram_username || 'N/A'}\n` +
    `🌐 Til: ${leadInfo.selected_language === 'ru' ? 'Русский' : "O'zbek"}\n` +
    `🪑 Mebel: ${leadInfo.furniture_interest || 'N/A'}\n` +
    `⏰ SLA: 20 daqiqa ichida bog'laning!`;

  fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: adminChatId,
      text: message,
      parse_mode: 'Markdown'
    })
  }).catch(err => console.log('[Zelta] Notification error:', err));
}

// ===== HR DATABASE & ROUTES =====
let hrDb = null;
const HR_DB_PATH = path.join(DATA_DIR, 'hr.db');

async function initHRDB() {
  const SQL = await initSqlJs();
  try {
    if (fs.existsSync(HR_DB_PATH)) {
      const buf = fs.readFileSync(HR_DB_PATH);
      hrDb = new SQL.Database(buf);
    } else {
      hrDb = new SQL.Database();
    }
  } catch(e) {
    hrDb = new SQL.Database();
  }

  hrDb.run(`CREATE TABLE IF NOT EXISTS candidates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    candidate_id TEXT UNIQUE,
    created_at TEXT DEFAULT (datetime('now')),
    telegram_user_id TEXT,
    telegram_username TEXT,
    full_name TEXT,
    birth_year INTEGER,
    age INTEGER,
    phone TEXT,
    location TEXT,
    photo_url TEXT,
    voice_url TEXT,
    voice_duration INTEGER,
    russian_level TEXT,
    status TEXT DEFAULT 'new',
    hr_notes TEXT DEFAULT '',
    hr_assigned TEXT DEFAULT '',
    contacted_at TEXT,
    interview_date TEXT,
    rejection_reason TEXT,
    source TEXT DEFAULT 'telegram',
    submitted_at TEXT DEFAULT (datetime('now'))
  )`);
  saveHRDB();
  console.log('[HR DB] Initialized');
}

function saveHRDB() {
  if (!hrDb) return;
  try {
    const data = hrDb.export();
    fs.writeFileSync(HR_DB_PATH, Buffer.from(data));
  } catch(e) { console.error('[HR DB] Save error:', e.message); }
}

setInterval(saveHRDB, 10000);

function hrDbAll(sql, params = []) {
  try {
    const stmt = hrDb.prepare(sql);
    if (params.length) stmt.bind(params);
    const results = [];
    while (stmt.step()) results.push(stmt.getAsObject());
    stmt.free();
    return results;
  } catch(e) { return []; }
}

function hrDbGet(sql, params = []) {
  const r = hrDbAll(sql, params);
  return r.length > 0 ? r[0] : null;
}

function hrDbRun(sql, params = []) {
  try { hrDb.run(sql, params); } catch(e) { console.error('[HR] Run error:', e); }
}

// HR Upload config
const hrStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, 'public', 'hr-uploads');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || (file.mimetype.includes('image') ? '.jpg' : '.ogg');
    cb(null, `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`);
  }
});
const hrUpload = multer({ storage: hrStorage, limits: { fileSize: 20 * 1024 * 1024 } });

// HR API: Submit candidate
app.post('/api/candidates', (req, res) => {
  try {
    const d = req.body;
    const candidateId = 'ZHR-' + Date.now().toString(36).toUpperCase();
    hrDbRun(`INSERT INTO candidates (candidate_id, telegram_user_id, telegram_username, full_name, birth_year, age, phone, location, photo_url, voice_url, voice_duration, russian_level, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
      candidateId, d.telegram_user_id||'', d.telegram_username||'', d.full_name||'', d.birth_year||null, d.age||null, d.phone||'', d.location||'', d.photo_url||'', d.voice_url||'', d.voice_duration||null, d.russian_level||'', d.source||'telegram'
    ]);
    saveHRDB();
    res.json({ success: true, candidate_id: candidateId });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// HR API: Upload file
app.post('/api/hr-upload', hrUpload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  res.json({ success: true, url: `/hr-uploads/${req.file.filename}` });
});

// HR API: Get all candidates
app.get('/api/candidates', (req, res) => {
  try {
    const rows = hrDbAll('SELECT * FROM candidates ORDER BY created_at DESC');
    res.json(rows);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// HR API: Get single candidate
app.get('/api/candidates/:id', (req, res) => {
  try {
    const c = hrDbGet('SELECT * FROM candidates WHERE candidate_id = ?', [req.params.id]);
    if (!c) return res.status(404).json({ error: 'Not found' });
    res.json(c);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// HR API: Update candidate
app.patch('/api/candidates/:id', (req, res) => {
  try {
    const d = req.body;
    if (d.status) hrDbRun('UPDATE candidates SET status = ? WHERE candidate_id = ?', [d.status, req.params.id]);
    if (d.hr_notes !== undefined) hrDbRun('UPDATE candidates SET hr_notes = ? WHERE candidate_id = ?', [d.hr_notes, req.params.id]);
    if (d.hr_assigned) hrDbRun('UPDATE candidates SET hr_assigned = ? WHERE candidate_id = ?', [d.hr_assigned, req.params.id]);
    if (d.mark_contacted) hrDbRun("UPDATE candidates SET contacted_at = datetime('now'), status = CASE WHEN status = 'new' THEN 'contacted' ELSE status END WHERE candidate_id = ?", [req.params.id]);
    if (d.interview_date) hrDbRun('UPDATE candidates SET interview_date = ? WHERE candidate_id = ?', [d.interview_date, req.params.id]);
    if (d.rejection_reason) hrDbRun('UPDATE candidates SET rejection_reason = ? WHERE candidate_id = ?', [d.rejection_reason, req.params.id]);
    saveHRDB();
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// HR API: Delete candidate
app.delete('/api/candidates/:id', (req, res) => {
  try {
    hrDbRun('DELETE FROM candidates WHERE candidate_id = ?', [req.params.id]);
    saveHRDB();
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// HR API: Stats
app.get('/api/hr-stats', (req, res) => {
  try {
    const total = hrDbGet('SELECT COUNT(*) as count FROM candidates');
    const today = hrDbGet("SELECT COUNT(*) as count FROM candidates WHERE date(created_at) = date('now')");
    const newC = hrDbGet("SELECT COUNT(*) as count FROM candidates WHERE status = 'new'");
    const contacted = hrDbGet("SELECT COUNT(*) as count FROM candidates WHERE status = 'contacted'");
    const interview = hrDbGet("SELECT COUNT(*) as count FROM candidates WHERE status = 'interview'");
    const hired = hrDbGet("SELECT COUNT(*) as count FROM candidates WHERE status = 'hired'");
    const rejected = hrDbGet("SELECT COUNT(*) as count FROM candidates WHERE status = 'rejected'");
    res.json({ total: total?.count||0, today: today?.count||0, new: newC?.count||0, contacted: contacted?.count||0, interview: interview?.count||0, hired: hired?.count||0, rejected: rejected?.count||0 });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// HR API: CSV Export
app.get('/api/hr-export/csv', (req, res) => {
  try {
    const rows = hrDbAll('SELECT * FROM candidates ORDER BY created_at DESC');
    if (!rows.length) return res.send('No data');
    const cols = Object.keys(rows[0]);
    let csv = cols.join(',') + '\n';
    rows.forEach(r => { csv += cols.map(c => `"${(r[c]||'').toString().replace(/"/g,'""')}"`).join(',') + '\n'; });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=zelta-hr-candidates.csv');
    res.send(csv);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// --- Serve Admin Panel ---
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

// --- Bot Health Check ---
let botRunning = false;
app.get('/api/bot-status', (req, res) => {
  res.json({ bot_running: botRunning, token_set: !!BOT_TOKEN, mini_app_url: MINI_APP_URL });
});

// ===== TELEGRAM BOT (WEBHOOK MODE) =====
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8740837198:AAHBkd6R_Q8pVLpLdpbyd72lTJ1m-yAzgvU';
const MINI_APP_URL = process.env.MINI_APP_URL || 'https://zeltapremium-production.up.railway.app';
const ADMIN_CHAT_ID_BOT = process.env.ADMIN_CHAT_ID;
const WEBHOOK_PATH = `/bot${BOT_TOKEN}`;

const BEFORE_IMG_URL = MINI_APP_URL + '/images/before.jpg';
const AFTER_IMG_URL = MINI_APP_URL + '/images/after.jpg';

// Telegram API helper
async function tgApi(method, body) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!data.ok) console.error(`[Bot] API error ${method}:`, data.description);
    return data;
  } catch (err) {
    console.error(`[Bot] API fetch error ${method}:`, err.message);
    return { ok: false };
  }
}

// Handle /start
async function handleStart(msg) {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name || '';
  const lang = msg.from.language_code;
  const isRussian = lang && lang.startsWith('ru');

  try {
    await tgApi('sendPhoto', {
      chat_id: chatId,
      photo: BEFORE_IMG_URL,
      caption: isRussian ? '\ud83d\udcf7 \u0414\u043e \u2014 \u043f\u0443\u0441\u0442\u0430\u044f \u043a\u043e\u043c\u043d\u0430\u0442\u0430' : '\ud83d\udcf7 Oldin \u2014 bo\'sh xona'
    });
    await tgApi('sendPhoto', {
      chat_id: chatId,
      photo: AFTER_IMG_URL,
      caption: isRussian ? '\u2728 \u041f\u043e\u0441\u043b\u0435 \u2014 \u043c\u0435\u0431\u0435\u043b\u044c \u0440\u0430\u0441\u0441\u0442\u0430\u0432\u043b\u0435\u043d\u0430 \u0432 3D' : '\u2728 Keyin \u2014 mebel 3D da joylashtirildi'
    });

    const textUz = `Assalomu alaykum${firstName ? ', ' + firstName : ''}!\n\nYuqoridagi rasmlarni ko'rdingizmi?\nBo'sh xonaga mebelni *virtual joylashtirib ko'rsatamiz* \u2014 aynan shunday natija olasiz!\n\n\ud83c\udf81 *Birinchi 50 ta mijoz uchun bu xizmat BEPUL!*\n\nFaqat 3 ta narsa kerak:\n\ud83d\udcf8 Xonangiz rasmini yuboring\n\ud83d\udcf1 Telefon raqamingizni qoldiring\n\u23f0 20 daqiqada menejer aloqaga chiqadi\n\n\ud83d\udc47 *Hoziroq boshlang:*`;
    const textRu = `\u0417\u0434\u0440\u0430\u0432\u0441\u0442\u0432\u0443\u0439\u0442\u0435${firstName ? ', ' + firstName : ''}!\n\n\u0412\u0438\u0434\u0435\u043b\u0438 \u0444\u043e\u0442\u043e \u0432\u044b\u0448\u0435?\n\u041c\u044b *\u0432\u0438\u0440\u0442\u0443\u0430\u043b\u044c\u043d\u043e \u0440\u0430\u0441\u0441\u0442\u0430\u0432\u0438\u043c \u043c\u0435\u0431\u0435\u043b\u044c* \u0432 \u0432\u0430\u0448\u0435\u0439 \u043a\u043e\u043c\u043d\u0430\u0442\u0435 \u2014 \u0438\u043c\u0435\u043d\u043d\u043e \u0442\u0430\u043a\u043e\u0439 \u0440\u0435\u0437\u0443\u043b\u044c\u0442\u0430\u0442 \u0432\u044b \u043f\u043e\u043b\u0443\u0447\u0438\u0442\u0435!\n\n\ud83c\udf81 *\u0414\u043b\u044f \u043f\u0435\u0440\u0432\u044b\u0445 50 \u043a\u043b\u0438\u0435\u043d\u0442\u043e\u0432 \u044d\u0442\u0430 \u0443\u0441\u043b\u0443\u0433\u0430 \u0411\u0415\u0421\u041f\u041b\u0410\u0422\u041d\u0410!*\n\n\u041d\u0443\u0436\u043d\u043e \u0432\u0441\u0435\u0433\u043e 3 \u0432\u0435\u0449\u0438:\n\ud83d\udcf8 \u041e\u0442\u043f\u0440\u0430\u0432\u044c\u0442\u0435 \u0444\u043e\u0442\u043e \u043a\u043e\u043c\u043d\u0430\u0442\u044b\n\ud83d\udcf1 \u041e\u0441\u0442\u0430\u0432\u044c\u0442\u0435 \u043d\u043e\u043c\u0435\u0440 \u0442\u0435\u043b\u0435\u0444\u043e\u043d\u0430\n\u23f0 \u041c\u0435\u043d\u0435\u0434\u0436\u0435\u0440 \u0441\u0432\u044f\u0436\u0435\u0442\u0441\u044f \u0437\u0430 20 \u043c\u0438\u043d\u0443\u0442\n\n\ud83d\udc47 *\u041d\u0430\u0447\u043d\u0438\u0442\u0435 \u043f\u0440\u044f\u043c\u043e \u0441\u0435\u0439\u0447\u0430\u0441:*`;

    await tgApi('sendMessage', {
      chat_id: chatId,
      text: isRussian ? textRu : textUz,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: isRussian ? '\ud83c\udfe0 \u041f\u043e\u043b\u0443\u0447\u0438\u0442\u044c \u0431\u0435\u0441\u043f\u043b\u0430\u0442\u043d\u0443\u044e 3D-\u0432\u0438\u0437\u0443\u0430\u043b\u0438\u0437\u0430\u0446\u0438\u044e' : '\ud83c\udfe0 Bepul 3D-vizualizatsiya olish', web_app: { url: MINI_APP_URL } }],
          [{ text: isRussian ? '\ud83d\udcde \u041f\u043e\u0437\u0432\u043e\u043d\u0438\u0442\u044c \u043e\u043f\u0435\u0440\u0430\u0442\u043e\u0440\u0443' : '\ud83d\udcde Operator bilan bog\'lanish', url: 'https://t.me/zeltacallcenter' }]
        ]
      }
    });
  } catch (err) {
    console.error('[Bot] Start handler error:', err.message);
    await tgApi('sendMessage', { chat_id: chatId, text: `Assalomu alaykum! Bepul 3D-vizualizatsiya: ${MINI_APP_URL}` });
  }
}

// Handle /help
async function handleHelp(msg) {
  const chatId = msg.chat.id;
  const isRussian = msg.from.language_code && msg.from.language_code.startsWith('ru');
  const text = isRussian
    ? '*\u041f\u043e\u043c\u043e\u0449\u044c Zelta Premium*\n\n\ud83d\udcf1 \u041d\u0430\u0447\u0430\u0442\u044c: /start\n\ud83d\udcde \u041e\u043f\u0435\u0440\u0430\u0442\u043e\u0440: +99855 520 9595\n\ud83d\udcac Telegram: @zeltacallcenter\n\ud83d\udcf8 Instagram: @zeltapremium.uz'
    : '*Zelta Premium yordam*\n\n\ud83d\udcf1 Boshlash: /start\n\ud83d\udcde Operator: +99855 520 9595\n\ud83d\udcac Telegram: @zeltacallcenter\n\ud83d\udcf8 Instagram: @zeltapremium.uz';
  await tgApi('sendMessage', { chat_id: chatId, text, parse_mode: 'Markdown' });
}

// Handle /operator
async function handleOperator(msg) {
  const chatId = msg.chat.id;
  const isRussian = msg.from.language_code && msg.from.language_code.startsWith('ru');
  const text = isRussian ? '\ud83d\udcde \u041f\u043e\u0437\u0432\u043e\u043d\u0438\u0442\u0435: +99855 520 9595\n\ud83d\udcac \u0418\u043b\u0438 \u043d\u0430\u043f\u0438\u0448\u0438\u0442\u0435:' : '\ud83d\udcde Qo\'ng\'iroq qiling: +99855 520 9595\n\ud83d\udcac Yoki yozing:';
  await tgApi('sendMessage', { chat_id: chatId, text, reply_markup: { inline_keyboard: [[{ text: '\ud83d\udcac @zeltacallcenter', url: 'https://t.me/zeltacallcenter' }]] } });
}

// Handle auto-replies
async function handleAutoReply(msg) {
  if (!msg.text) return;
  if (msg.text.startsWith('/')) return;

  const chatId = msg.chat.id;
  const isRussian = msg.from.language_code && msg.from.language_code.startsWith('ru');
  const text = msg.text.toLowerCase().trim();

  const greetings = ['salom', 'assalom', 'hayrli', '\u043f\u0440\u0438\u0432\u0435\u0442', '\u0437\u0434\u0440\u0430\u0432\u0441\u0442\u0432\u0443\u0439\u0442\u0435', '\u0441\u0430\u043b\u043e\u043c'];
  const priceWords = ['narx', 'qancha', 'baho', '\u0446\u0435\u043d\u0430', '\u0441\u043a\u043e\u043b\u044c\u043a\u043e', '\u0441\u0442\u043e\u0438\u043c\u043e\u0441\u0442\u044c', '\u043f\u0440\u0430\u0439\u0441'];
  const furnitureWords = ['mebel', 'divan', 'krovat', 'shkaf', 'stol', 'stul', 'karavot', 'yotoq', '\u043c\u0435\u0431\u0435\u043b\u044c', '\u0434\u0438\u0432\u0430\u043d', '\u043a\u0440\u043e\u0432\u0430\u0442\u044c', '\u0448\u043a\u0430\u0444', '\u0441\u0442\u043e\u043b', '\u043a\u0443\u0445\u043d\u044f'];

  let reply;
  if (greetings.some(g => text.includes(g))) {
    reply = isRussian
      ? '\u0417\u0434\u0440\u0430\u0432\u0441\u0442\u0432\u0443\u0439\u0442\u0435! \ud83d\ude0a\n\n\u041c\u044b \u2014 *Zelta Premium*, \u043f\u0440\u0435\u043c\u0438\u0430\u043b\u044c\u043d\u044b\u0439 \u043c\u0435\u0431\u0435\u043b\u044c\u043d\u044b\u0439 \u0431\u0440\u0435\u043d\u0434.\n\n\u0421\u0435\u0439\u0447\u0430\u0441 \u0430\u043a\u0446\u0438\u044f: *\u0431\u0435\u0441\u043f\u043b\u0430\u0442\u043d\u0430\u044f 3D-\u0432\u0438\u0437\u0443\u0430\u043b\u0438\u0437\u0430\u0446\u0438\u044f* \u0434\u043b\u044f \u043f\u0435\u0440\u0432\u044b\u0445 50 \u043a\u043b\u0438\u0435\u043d\u0442\u043e\u0432!\n\n\u041e\u0442\u043f\u0440\u0430\u0432\u044c\u0442\u0435 \u0444\u043e\u0442\u043e \u043a\u043e\u043c\u043d\u0430\u0442\u044b \u2014 \u043f\u043e\u043a\u0430\u0436\u0435\u043c, \u043a\u0430\u043a \u0431\u0443\u0434\u0435\u0442 \u0432\u044b\u0433\u043b\u044f\u0434\u0435\u0442\u044c \u043c\u0435\u0431\u0435\u043b\u044c \ud83d\udc47'
      : 'Assalomu alaykum! \ud83d\ude0a\n\nBiz \u2014 *Zelta Premium*, premium mebel brendi.\n\nHozir aksiya: birinchi 50 ta mijozga *bepul 3D-vizualizatsiya*!\n\nXonangiz rasmini yuboring \u2014 mebelni qanday ko\'rinishini ko\'rsatamiz \ud83d\udc47';
  } else if (priceWords.some(p => text.includes(p))) {
    reply = isRussian
      ? '\u0426\u0435\u043d\u044b \u0437\u0430\u0432\u0438\u0441\u044f\u0442 \u043e\u0442 \u043c\u043e\u0434\u0435\u043b\u0438 \u0438 \u043c\u0430\u0442\u0435\u0440\u0438\u0430\u043b\u0430.\n\n\u041d\u043e \u0441\u0435\u0439\u0447\u0430\u0441 *\u0431\u0435\u0441\u043f\u043b\u0430\u0442\u043d\u0430\u044f \u0443\u0441\u043b\u0443\u0433\u0430*: \u0440\u0430\u0441\u0441\u0442\u0430\u0432\u0438\u043c \u043c\u0435\u0431\u0435\u043b\u044c \u0432 \u0432\u0430\u0448\u0435\u0439 \u043a\u043e\u043c\u043d\u0430\u0442\u0435 \u0432 3D!\n\n\u041e\u0442\u043f\u0440\u0430\u0432\u044c\u0442\u0435 \u0444\u043e\u0442\u043e \u2014 \u043c\u0435\u043d\u0435\u0434\u0436\u0435\u0440 \u043f\u043e\u0434\u0431\u0435\u0440\u0451\u0442 \u0432\u0430\u0440\u0438\u0430\u043d\u0442\u044b \u0438 \u0446\u0435\u043d\u044b \ud83d\udc47'
      : 'Narxlar model va materialga qarab farq qiladi.\n\nLekin hozir *bepul xizmat* bor: xonangizga mebelni 3D da joylashtirib ko\'rsatamiz!\n\nXonangiz rasmini yuboring \u2014 menejer variant va narxlarni taklif qiladi \ud83d\udc47';
  } else if (furnitureWords.some(f => text.includes(f))) {
    reply = isRussian
      ? '\u041e\u0442\u043b\u0438\u0447\u043d\u044b\u0439 \u0432\u044b\u0431\u043e\u0440! \u0423 \u043d\u0430\u0441 \u0448\u0438\u0440\u043e\u043a\u0438\u0439 \u0430\u0441\u0441\u043e\u0440\u0442\u0438\u043c\u0435\u043d\u0442 \u043f\u0440\u0435\u043c\u0438\u0430\u043b\u044c\u043d\u043e\u0439 \u043c\u0435\u0431\u0435\u043b\u0438.\n\n*\u0411\u0435\u0441\u043f\u043b\u0430\u0442\u043d\u043e* \u043f\u043e\u043a\u0430\u0436\u0435\u043c, \u043a\u0430\u043a \u043c\u0435\u0431\u0435\u043b\u044c \u0431\u0443\u0434\u0435\u0442 \u0441\u043c\u043e\u0442\u0440\u0435\u0442\u044c\u0441\u044f \u0432 \u0432\u0430\u0448\u0435\u0439 \u043a\u043e\u043c\u043d\u0430\u0442\u0435! \ud83d\udc47'
      : 'Ajoyib tanlov! Bizda premium mebellarning keng assortimenti bor.\n\nMebelni xonangizda qanday ko\'rinishini *bepul* ko\'rsatamiz! \ud83d\udc47';
  } else {
    reply = isRussian
      ? '\u0421\u043f\u0430\u0441\u0438\u0431\u043e \u0437\u0430 \u0441\u043e\u043e\u0431\u0449\u0435\u043d\u0438\u0435!\n\n\u041c\u044b \u043f\u0440\u0435\u0434\u043b\u0430\u0433\u0430\u0435\u043c *\u0431\u0435\u0441\u043f\u043b\u0430\u0442\u043d\u0443\u044e 3D-\u0432\u0438\u0437\u0443\u0430\u043b\u0438\u0437\u0430\u0446\u0438\u044e* \u043c\u0435\u0431\u0435\u043b\u0438 \u0432 \u0432\u0430\u0448\u0435\u0439 \u043a\u043e\u043c\u043d\u0430\u0442\u0435.\n\n\u041d\u0430\u0436\u043c\u0438\u0442\u0435 \u043a\u043d\u043e\u043f\u043a\u0443 \u043d\u0438\u0436\u0435 \ud83d\udc47'
      : 'Xabaringiz uchun rahmat!\n\nBiz xonangizga mebelni *bepul 3D-vizualizatsiya* qilib ko\'rsatamiz.\n\nQuyidagi tugmani bosing \ud83d\udc47';
  }

  await tgApi('sendMessage', {
    chat_id: chatId,
    text: reply,
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: isRussian ? '\ud83c\udfe0 \u0411\u0435\u0441\u043f\u043b\u0430\u0442\u043d\u0430\u044f 3D-\u0432\u0438\u0437\u0443\u0430\u043b\u0438\u0437\u0430\u0446\u0438\u044f' : '\ud83c\udfe0 Bepul 3D-vizualizatsiya', web_app: { url: MINI_APP_URL } }],
        [{ text: isRussian ? '\ud83d\udcde \u0421\u0432\u044f\u0437\u0430\u0442\u044c\u0441\u044f \u0441 \u043e\u043f\u0435\u0440\u0430\u0442\u043e\u0440\u043e\u043c' : '\ud83d\udcde Operator bilan bog\'lanish', url: 'https://t.me/zeltacallcenter' }]
      ]
    }
  });
}

// Handle web_app_data
async function handleWebAppData(msg) {
  const chatId = msg.chat.id;
  try {
    const data = JSON.parse(msg.web_app_data.data);
    if (data.type === 'lead_submitted') {
      const isRussian = data.language === 'ru';
      await tgApi('sendMessage', { chat_id: chatId, text: isRussian ? '\u2705 \u0412\u0430\u0448\u0430 \u0437\u0430\u044f\u0432\u043a\u0430 \u043f\u0440\u0438\u043d\u044f\u0442\u0430! \u0421\u043f\u0435\u0446\u0438\u0430\u043b\u0438\u0441\u0442 \u0441\u0432\u044f\u0436\u0435\u0442\u0441\u044f \u0432 \u0442\u0435\u0447\u0435\u043d\u0438\u0435 20 \u043c\u0438\u043d\u0443\u0442.' : '\u2705 So\'rovingiz qabul qilindi! 20 daqiqa ichida bog\'lanamiz.' });
      if (ADMIN_CHAT_ID_BOT) {
        await tgApi('sendMessage', { chat_id: ADMIN_CHAT_ID_BOT, text: `\ud83d\udd14 *Yangi lead!*\n\ud83d\udcde ${data.phone || 'N/A'}\n\u23f0 20 daqiqa SLA!`, parse_mode: 'Markdown' });
      }
    }
  } catch (err) { console.error('[Bot] web_app_data error:', err); }
}

// Process incoming update from webhook
function processUpdate(update) {
  try {
    if (update.message) {
      const msg = update.message;
      if (msg.web_app_data) {
        handleWebAppData(msg);
      } else if (msg.text) {
        if (msg.text === '/start' || msg.text.startsWith('/start ')) {
          handleStart(msg);
        } else if (msg.text === '/help') {
          handleHelp(msg);
        } else if (msg.text === '/operator') {
          handleOperator(msg);
        } else {
          handleAutoReply(msg);
        }
      }
    }
  } catch (err) {
    console.error('[Bot] processUpdate error:', err.message);
  }
}

// Webhook endpoint - receives updates from Telegram
app.post(WEBHOOK_PATH, express.json(), (req, res) => {
  processUpdate(req.body);
  res.sendStatus(200);
});

// --- Fallback to Mini App ---
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- Start ---
async function start() {
  await initDB();
  await initHRDB();
  app.listen(PORT, '0.0.0.0', async () => {
    console.log(`[Zelta Premium] Server running on port ${PORT}`);
    console.log(`[Zelta Premium] Mini App: http://localhost:${PORT}`);
    console.log(`[Zelta Premium] Admin Panel: http://localhost:${PORT}/admin`);

    // Set webhook
    const webhookUrl = `${MINI_APP_URL}${WEBHOOK_PATH}`;
    console.log(`[Zelta Bot] Setting webhook to: ${webhookUrl}`);
    const result = await tgApi('setWebhook', { url: webhookUrl, drop_pending_updates: false });
    if (result.ok) {
      botRunning = true;
      console.log('[Zelta Bot] Webhook set successfully!');
    } else {
      console.error('[Zelta Bot] Failed to set webhook:', result.description);
    }
  });
}

start().catch(err => {
  console.error('[Zelta] Failed to start:', err);
  process.exit(1);
});
