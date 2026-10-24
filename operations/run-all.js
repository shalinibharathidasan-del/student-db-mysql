// Runs all 7 steps in order on a single connection: npm run all
// Pass --keep to skip the final DROP TABLE:  npm run all -- --keep
const { connect, DB_NAME } = require('../db')

const steps = [
  ['1. Create database', require('./1-create-database')],
  ['2. Create table', require('./2-create-table')],
  ['3. Insert records', require('./3-insert')],
  ['4. Retrieve records', require('./4-select')],
  ['5. Update records', require('./5-update')],
  ['6. Delete records', require('./6-delete')],
  ['7. Drop table', require('./7-drop-table')],
]

async function main() {
  const keep = process.argv.includes('--keep')
  let conn
  try {
    conn = await connect({ useDatabase: false })
    for (const [title, step] of steps) {
      if (keep && title.startsWith('7')) {
        console.log('\n=== 7. Drop table skipped (--keep) ===')
        continue
      }
      console.log(`\n=== ${title} ===`)
      await step(conn)
      if (title.startsWith('1')) await conn.changeUser({ database: DB_NAME })
    }
  } catch (err) {
    console.error('Error:', err.sqlMessage || err.message)
    process.exitCode = 1
  } finally {
    if (conn) await conn.end()
  }
}

main()
