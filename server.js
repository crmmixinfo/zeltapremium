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

// --- Serve Admin Panel ---
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

// --- Fallback to Mini App ---
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- Start ---
async function start() {
  await initDB();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Zelta Premium] Server running on port ${PORT}`);
    console.log(`[Zelta Premium] Mini App: http://localhost:${PORT}`);
    console.log(`[Zelta Premium] Admin Panel: http://localhost:${PORT}/admin`);
  });
}

start().catch(err => {
  console.error('[Zelta] Failed to start:', err);
  process.exit(1);
});
