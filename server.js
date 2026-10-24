// Web page for the student database: npm run web  ->  http://localhost:3001
const http = require('http')
const querystring = require('querystring')
const { connect, createPool, DB_NAME } = require('./db')
const createTable = require('./operations/2-create-table')

const PORT = Number(process.env.PORT) || 3001
let pool

// ---------- helpers ----------

const escapeHtml = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

function readForm(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => resolve(querystring.parse(Buffer.concat(chunks).toString())))
    req.on('error', reject)
  })
}

function send(res, status, html) {
  res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8' })
  res.end(html)
}

function redirect(res, params) {
  res.writeHead(303, { Location: '/?' + querystring.stringify(params) })
  res.end()
}

// Check and tidy form input before it goes to MySQL
function cleanStudent(form) {
  const s = {
    usn: (form.usn || '').trim().toUpperCase(),
    name: (form.name || '').trim(),
    email: (form.email || '').trim(),
    course: (form.course || 'MCA').trim(),
    semester: Number(form.semester),
    marks: form.marks === '' || form.marks === undefined ? null : Number(form.marks),
  }
  if (!s.usn || !s.name) throw new Error('USN and name are required')
  if (!/^\S+@\S+\.\S+$/.test(s.email)) throw new Error('Enter a valid email')
  if (!(s.semester >= 1 && s.semester <= 8)) throw new Error('Semester must be 1-8')
  if (s.marks !== null && !(s.marks >= 0 && s.marks <= 100)) throw new Error('Marks must be 0-100')
  return s
}

function sqlErrorMessage(err) {
  if (err.code === 'ER_DUP_ENTRY') return 'That USN already exists'
  return err.sqlMessage || err.message
}

// ---------- HTML ----------

function layout(content) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Student Database</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; background: #f3f4f6; color: #111827; }
    header { background: #0f766e; color: #fff; padding: 16px; }
    header h1 { margin: 0; font-size: 22px; }
    header p { margin: 4px 0 0; font-size: 13px; opacity: .85; }
    main { max-width: 1000px; margin: 0 auto; padding: 16px; }
    .card { background: #fff; border-radius: 10px; padding: 16px; margin-bottom: 16px; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-bottom: 16px; }
    .stat { background: #fff; border-radius: 10px; padding: 14px; text-align: center; }
    .stat b { display: block; font-size: 26px; color: #0f766e; }
    form.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; align-items: end; }
    label { display: block; font-size: 13px; color: #374151; }
    input { width: 100%; box-sizing: border-box; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; }
    button, .btn { background: #0f766e; color: #fff; border: 0; border-radius: 6px; padding: 9px 14px; cursor: pointer; font-size: 14px; text-decoration: none; display: inline-block; }
    .btn-light { background: #e5e7eb; color: #111827; }
    .btn-danger { background: #dc2626; }
    .table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 8px; border-bottom: 1px solid #e5e7eb; font-size: 14px; white-space: nowrap; }
    .actions { display: flex; gap: 6px; }
    .msg { padding: 10px; border-radius: 6px; margin-bottom: 16px; }
    .ok { background: #dcfce7; color: #166534; }
    .err { background: #fee2e2; color: #991b1b; }
    .search { display: flex; gap: 8px; margin-bottom: 12px; }
  </style>
</head>
<body>
  <header><h1>Student Database</h1><p>Node.js + MySQL &middot; database: ${escapeHtml(DB_NAME)}</p></header>
  <main>${content}</main>
</body>
</html>`
}

function fields(s = {}) {
  return `
    <div><label>USN<input name="usn" value="${escapeHtml(s.usn)}" required></label></div>
    <div><label>Name<input name="name" value="${escapeHtml(s.name)}" required></label></div>
    <div><label>Email<input name="email" type="email" value="${escapeHtml(s.email)}" required></label></div>
    <div><label>Course<input name="course" value="${escapeHtml(s.course || 'MCA')}"></label></div>
    <div><label>Semester<input name="semester" type="number" min="1" max="8" value="${escapeHtml(s.semester || 1)}" required></label></div>
    <div><label>Marks<input name="marks" type="number" min="0" max="100" step="0.01" value="${escapeHtml(s.marks)}"></label></div>`
}

function homePage(students, stats, { search = '', msg = '', error = '' }) {
  const rows = students
    .map(
      (s) => `
      <tr>
        <td>${s.id}</td>
        <td>${escapeHtml(s.usn)}</td>
        <td>${escapeHtml(s.name)}</td>
        <td>${escapeHtml(s.email)}</td>
        <td>${escapeHtml(s.course)}</td>
        <td>${s.semester}</td>
        <td>${s.marks ?? '-'}</td>
        <td class="actions">
          <a class="btn btn-light" href="/edit?id=${s.id}">Edit</a>
          <form method="post" action="/delete" onsubmit="return confirm('Delete ${escapeHtml(s.name)}?')">
            <input type="hidden" name="id" value="${s.id}">
            <button class="btn-danger">Delete</button>
          </form>
        </td>
      </tr>`,
    )
    .join('')

  return layout(`
    ${msg ? `<div class="msg ok">${escapeHtml(msg)}</div>` : ''}
    ${error ? `<div class="msg err">${escapeHtml(error)}</div>` : ''}

    <div class="stats">
      <div class="stat"><b>${stats.total}</b>Students</div>
      <div class="stat"><b>${stats.average ?? '-'}</b>Average marks</div>
      <div class="stat"><b>${stats.highest ?? '-'}</b>Highest marks</div>
    </div>

    <div class="card">
      <h2>Add Student</h2>
      <form class="grid" method="post" action="/add">
        ${fields()}
        <div><button type="submit">Add</button></div>
      </form>
    </div>

    <div class="card">
      <h2>Students</h2>
      <form class="search" method="get" action="/">
        <input name="search" placeholder="Search by name or USN" value="${escapeHtml(search)}">
        <button type="submit">Search</button>
        ${search ? '<a class="btn btn-light" href="/">Clear</a>' : ''}
      </form>
      <div class="table-wrap">
        <table>
          <thead><tr><th>ID</th><th>USN</th><th>Name</th><th>Email</th><th>Course</th><th>Sem</th><th>Marks</th><th></th></tr></thead>
          <tbody>${rows || '<tr><td colspan="8">No students found.</td></tr>'}</tbody>
        </table>
      </div>
    </div>`)
}

function editPage(s, error = '') {
  return layout(`
    ${error ? `<div class="msg err">${escapeHtml(error)}</div>` : ''}
    <div class="card">
      <h2>Edit Student</h2>
      <form class="grid" method="post" action="/update">
        <input type="hidden" name="id" value="${escapeHtml(s.id)}">
        ${fields(s)}
        <div class="actions"><button type="submit">Save</button><a class="btn btn-light" href="/">Cancel</a></div>
      </form>
    </div>`)
}

const notFound = (text) => layout(`<div class="card"><h2>${escapeHtml(text)}</h2><a href="/">Back</a></div>`)

// ---------- routes ----------

async function handle(req, res) {
  const url = new URL(req.url, 'http://localhost')
  const query = querystring.parse(url.search.slice(1))

  if (req.method === 'GET' && url.pathname === '/') {
    const term = `%${query.search || ''}%`
    const [students] = await pool.execute(
      'SELECT * FROM students WHERE name LIKE ? OR usn LIKE ? ORDER BY id',
      [term, term],
    )
    const [[stats]] = await pool.query(
      'SELECT COUNT(*) AS total, ROUND(AVG(marks), 2) AS average, MAX(marks) AS highest FROM students',
    )
    return send(res, 200, homePage(students, stats, query))
  }

  if (req.method === 'GET' && url.pathname === '/edit') {
    const [[student]] = await pool.execute('SELECT * FROM students WHERE id = ?', [Number(query.id)])
    if (!student) return send(res, 404, notFound('Student not found'))
    return send(res, 200, editPage(student))
  }

  if (req.method === 'POST' && url.pathname === '/add') {
    const form = await readForm(req)
    try {
      const s = cleanStudent(form)
      await pool.execute(
        'INSERT INTO students (usn, name, email, course, semester, marks) VALUES (?, ?, ?, ?, ?, ?)',
        [s.usn, s.name, s.email, s.course, s.semester, s.marks],
      )
      return redirect(res, { msg: `Added ${s.name}` })
    } catch (err) {
      return redirect(res, { error: sqlErrorMessage(err) })
    }
  }

  if (req.method === 'POST' && url.pathname === '/update') {
    const form = await readForm(req)
    try {
      const s = cleanStudent(form)
      const [r] = await pool.execute(
        'UPDATE students SET usn = ?, name = ?, email = ?, course = ?, semester = ?, marks = ? WHERE id = ?',
        [s.usn, s.name, s.email, s.course, s.semester, s.marks, Number(form.id)],
      )
      if (!r.affectedRows) return send(res, 404, notFound('Student not found'))
      return redirect(res, { msg: `Updated ${s.name}` })
    } catch (err) {
      return send(res, 400, editPage(form, sqlErrorMessage(err)))
    }
  }

  if (req.method === 'POST' && url.pathname === '/delete') {
    const form = await readForm(req)
    const [r] = await pool.execute('DELETE FROM students WHERE id = ?', [Number(form.id)])
    return redirect(res, r.affectedRows ? { msg: 'Student deleted' } : { error: 'Student not found' })
  }

  send(res, 404, notFound('Page not found'))
}

// ---------- start ----------

async function start() {
  // Make sure the database and table exist before serving pages
  const conn = await connect({ useDatabase: false })
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``)
  await conn.changeUser({ database: DB_NAME })
  await createTable(conn)
  await conn.end()

  pool = createPool()

  http
    .createServer((req, res) => {
      handle(req, res).catch((err) => {
        console.error(err)
        send(res, 500, notFound('Database error: ' + sqlErrorMessage(err)))
      })
    })
    .listen(PORT, () => console.log(`\nOpen http://localhost:${PORT}`))
}

start().catch(() => {
  console.error('Could not start the web server. Check .env and that MySQL is running.')
  process.exit(1)
})
