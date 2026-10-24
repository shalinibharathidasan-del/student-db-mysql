// Student Database Management System - interactive menu (npm start)
const readline = require('readline/promises')
const { connect, DB_NAME } = require('./db')
const createTable = require('./operations/2-create-table')

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const ask = async (q) => (await rl.question(q)).trim()

async function addStudent(conn) {
  const usn = (await ask('USN: ')).toUpperCase()
  const name = await ask('Name: ')
  const email = await ask('Email: ')
  const semester = Number(await ask('Semester (1-8): '))
  const marksText = await ask('Marks (optional): ')
  if (!usn || !name || !email || !(semester >= 1 && semester <= 8)) {
    return console.log('USN, name, email and a semester from 1 to 8 are required.')
  }
  const [r] = await conn.execute(
    'INSERT INTO students (usn, name, email, semester, marks) VALUES (?, ?, ?, ?, ?)',
    [usn, name, email, semester, marksText ? Number(marksText) : null],
  )
  console.log(`Student added with id ${r.insertId}`)
}

async function listStudents(conn) {
  const [rows] = await conn.query('SELECT id, usn, name, email, semester, marks FROM students ORDER BY id')
  rows.length ? console.table(rows) : console.log('No students yet.')
}

async function searchStudents(conn) {
  const term = await ask('Search name or USN: ')
  const [rows] = await conn.execute(
    'SELECT id, usn, name, email, semester, marks FROM students WHERE name LIKE ? OR usn LIKE ?',
    [`%${term}%`, `%${term}%`],
  )
  rows.length ? console.table(rows) : console.log('No match.')
}

async function updateStudent(conn) {
  const usn = (await ask('USN of student to update: ')).toUpperCase()
  const [[student]] = await conn.execute('SELECT * FROM students WHERE usn = ?', [usn])
  if (!student) return console.log('Student not found.')

  console.log('Press Enter to keep the current value.')
  const name = (await ask(`Name [${student.name}]: `)) || student.name
  const email = (await ask(`Email [${student.email}]: `)) || student.email
  const semester = Number((await ask(`Semester [${student.semester}]: `)) || student.semester)
  const marks = (await ask(`Marks [${student.marks ?? ''}]: `)) || student.marks

  await conn.execute('UPDATE students SET name = ?, email = ?, semester = ?, marks = ? WHERE usn = ?', [
    name,
    email,
    semester,
    marks === null ? null : Number(marks),
    usn,
  ])
  console.log('Student updated.')
}

async function deleteStudent(conn) {
  const usn = (await ask('USN of student to delete: ')).toUpperCase()
  const confirm = await ask(`Delete ${usn}? (y/n): `)
  if (confirm.toLowerCase() !== 'y') return console.log('Cancelled.')
  const [r] = await conn.execute('DELETE FROM students WHERE usn = ?', [usn])
  console.log(r.affectedRows ? 'Student deleted.' : 'Student not found.')
}

const MENU = [
  ['Add student', addStudent],
  ['List all students', listStudents],
  ['Search student', searchStudents],
  ['Update student', updateStudent],
  ['Delete student', deleteStudent],
]

async function main() {
  let conn
  try {
    conn = await connect({ useDatabase: false })
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``)
    await conn.changeUser({ database: DB_NAME })
    await createTable(conn)

    while (true) {
      console.log('\n===== Student Database =====')
      MENU.forEach(([label], i) => console.log(`${i + 1}. ${label}`))
      console.log('0. Exit')
      const choice = await ask('Choose: ')
      if (choice === '0') break
      const item = MENU[Number(choice) - 1]
      if (!item) {
        console.log('Invalid choice.')
        continue
      }
      try {
        await item[1](conn)
      } catch (err) {
        // e.g. duplicate USN, invalid semester - show the error and keep the menu running
        console.log('Error:', err.code === 'ER_DUP_ENTRY' ? 'That USN already exists.' : err.sqlMessage || err.message)
      }
    }
  } catch (err) {
    if (!conn) console.error('Could not start. Check .env and that MySQL is running.')
    else console.error('Error:', err.message)
    process.exitCode = 1
  } finally {
    rl.close()
    if (conn) await conn.end()
  }
}

main()
