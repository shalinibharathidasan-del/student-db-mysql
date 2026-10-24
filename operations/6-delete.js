// Step 6: Delete records
const { run } = require('../db')

async function deleteRecords(conn) {
  const [result] = await conn.execute('DELETE FROM students WHERE usn = ?', ['1DS25MC002'])
  console.log(`Deleted student 1DS25MC002: ${result.affectedRows} row(s) removed`)

  const [[{ total }]] = await conn.query('SELECT COUNT(*) AS total FROM students')
  console.log(`Students remaining: ${total}`)
}

module.exports = deleteRecords
if (require.main === module) run(deleteRecords)
