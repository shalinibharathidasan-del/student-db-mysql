// Step 4: Retrieve records
const { run } = require('../db')

async function selectRecords(conn) {
  const [all] = await conn.query('SELECT id, usn, name, email, semester, marks FROM students ORDER BY id')
  console.log(`\nAll students (${all.length}):`)
  console.table(all)

  const [sem3] = await conn.execute('SELECT usn, name FROM students WHERE semester = ?', [3])
  console.log('Semester 3 students:')
  console.table(sem3)

  const [search] = await conn.execute('SELECT usn, name FROM students WHERE name LIKE ?', ['%ra%'])
  console.log('Name contains "ra":')
  console.table(search)

  const [top] = await conn.query('SELECT name, marks FROM students ORDER BY marks DESC LIMIT 3')
  console.log('Top 3 by marks:')
  console.table(top)

  const [[stats]] = await conn.query(
    'SELECT COUNT(*) AS total, ROUND(AVG(marks), 2) AS average, MAX(marks) AS highest FROM students',
  )
  console.log('Summary:', stats)
}

module.exports = selectRecords
if (require.main === module) run(selectRecords)
