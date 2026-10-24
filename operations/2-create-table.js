// Step 2: Create table
const { run } = require('../db')

async function createTable(conn) {
  await conn.query(`
    CREATE TABLE IF NOT EXISTS students (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      usn        VARCHAR(15)  NOT NULL UNIQUE,
      name       VARCHAR(100) NOT NULL,
      email      VARCHAR(100) NOT NULL,
      course     VARCHAR(50)  NOT NULL DEFAULT 'MCA',
      semester   TINYINT      NOT NULL CHECK (semester BETWEEN 1 AND 8),
      marks      DECIMAL(5,2) DEFAULT NULL,
      created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
    )
  `)
  console.log('Table "students" created (or already exists)')

  const [columns] = await conn.query('DESCRIBE students')
  console.table(columns.map(({ Field, Type, Null, Key }) => ({ Field, Type, Null, Key })))
}

module.exports = createTable
if (require.main === module) run(createTable)
