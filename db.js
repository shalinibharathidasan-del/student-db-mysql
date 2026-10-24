// Create a MySQL connection using settings from the .env file
const mysql = require('mysql2/promise')

const DB_NAME = process.env.DB_NAME || 'student_db'

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
}

// Connection pool for the web server: reuses connections across requests
const createPool = () => mysql.createPool({ ...config, database: DB_NAME, connectionLimit: 5 })

// useDatabase = false is needed before the database exists (step 1)
async function connect({ useDatabase = true } = {}) {
  try {
    const connection = await mysql.createConnection({
      ...config,
      database: useDatabase ? DB_NAME : undefined,
    })
    console.log(`Connected to MySQL${useDatabase ? ` (database: ${DB_NAME})` : ''}`)
    return connection
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      console.error('Cannot reach MySQL. Is the MySQL80 service running?')
    } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('Wrong MySQL user or password. Check DB_USER / DB_PASSWORD in .env')
    } else if (err.code === 'ER_BAD_DB_ERROR') {
      console.error(`Database "${DB_NAME}" does not exist. Run: npm run create-db`)
    } else {
      console.error('Connection failed:', err.message)
    }
    throw err
  }
}

// Run a step and always close the connection, even if the step fails
async function run(step, options) {
  let connection
  try {
    connection = await connect(options)
    await step(connection)
  } catch (err) {
    if (!err.code?.startsWith('ER_ACCESS') && err.code !== 'ECONNREFUSED') {
      console.error('Error:', err.sqlMessage || err.message)
    }
    process.exitCode = 1
  } finally {
    if (connection) await connection.end()
  }
}

module.exports = { connect, createPool, run, DB_NAME }
