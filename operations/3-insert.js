// Step 3: Insert records
const { run } = require('../db')

const students = [
  ['1DS24MC001', 'Ananya Rao', 'ananya@example.com', 'MCA', 3, 88.5],
  ['1DS24MC002', 'Rahul Kumar', 'rahul@example.com', 'MCA', 3, 74.0],
  ['1DS24MC003', 'Priya Sharma', 'priya@example.com', 'MCA', 3, 91.25],
  ['1DS25MC001', 'Sneha Patil', 'sneha@example.com', 'MCA', 1, 67.0],
  ['1DS25MC002', 'Arjun Mehta', 'arjun@example.com', 'MCA', 1, 82.75],
]

async function insertRecords(conn) {
  // Insert one record with placeholders (?) - prevents SQL injection
  const [one] = await conn.execute(
    'INSERT IGNORE INTO students (usn, name, email, course, semester, marks) VALUES (?, ?, ?, ?, ?, ?)',
    students[0],
  )
  console.log(`Single insert: ${one.affectedRows} row inserted${one.insertId ? `, id ${one.insertId}` : ' (already existed)'}`)

  // Insert many records in one query
  const [many] = await conn.query(
    'INSERT IGNORE INTO students (usn, name, email, course, semester, marks) VALUES ?',
    [students.slice(1)],
  )
  console.log(`Bulk insert: ${many.affectedRows} rows inserted (existing USNs are skipped)`)
}

module.exports = insertRecords
if (require.main === module) run(insertRecords)
