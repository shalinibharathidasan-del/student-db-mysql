// Step 1: Create database
const { run, DB_NAME } = require('../db')

async function createDatabase(conn) {
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``)
  console.log(`Database "${DB_NAME}" created (or already exists)`)

  const [rows] = await conn.query('SHOW DATABASES')
  console.log('Databases:', rows.map((r) => r.Database).join(', '))
}

module.exports = createDatabase
if (require.main === module) run(createDatabase, { useDatabase: false })
