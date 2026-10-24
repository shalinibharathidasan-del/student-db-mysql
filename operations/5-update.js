// Step 5: Update records
const { run } = require('../db')

async function updateRecords(conn) {
  // Update one student
  const [one] = await conn.execute('UPDATE students SET marks = ?, email = ? WHERE usn = ?', [
    79.5,
    'rahul.kumar@example.com',
    '1DS24MC002',
  ])
  console.log(`Updated Rahul's marks and email: ${one.affectedRows} row(s) changed`)

  // Update many students at once
  const [many] = await conn.execute('UPDATE students SET semester = semester + 1 WHERE semester = ?', [1])
  console.log(`Moved semester 1 students to semester 2: ${many.affectedRows} row(s) changed`)

  const [rows] = await conn.query('SELECT usn, name, email, semester, marks FROM students ORDER BY id')
  console.table(rows)
}

module.exports = updateRecords
if (require.main === module) run(updateRecords)
