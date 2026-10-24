// Step 7: Drop table (removes the table and all its data)
const { run } = require('../db')

async function dropTable(conn) {
  await conn.query('DROP TABLE IF EXISTS students')
  console.log('Table "students" dropped')

  const [tables] = await conn.query('SHOW TABLES')
  console.log(`Tables left in database: ${tables.length}`)
}

module.exports = dropTable
if (require.main === module) run(dropTable)
