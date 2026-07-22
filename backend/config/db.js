import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

let pool = null;

const createUsersTable = `
  CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

const createTasksTable = `
  CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    priority ENUM('Low', 'Medium', 'High') DEFAULT 'Medium',
    status ENUM('Pending', 'In Progress', 'Completed') DEFAULT 'Pending',
    due_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

async function initializeDatabase(connection) {
  try {
    console.log('Verifying users table...');
    await connection.query(createUsersTable);

    console.log('Verifying tasks table...');
    await connection.query(createTasksTable);
  } catch (error) {
    console.error('Error initializing tables:', error);
    throw error;
  }
}

async function seedAdminUser(connection) {
  try {
    const adminEmail = 'admin@test.com';
    const [rows] = await connection.query('SELECT * FROM users WHERE email = ?', [adminEmail]);

    if (rows.length === 0) {
      console.log('Seeding default administrator user...');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('123456', salt);

      await connection.query(
        'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
        ['Administrator', adminEmail, hashedPassword]
      );
      console.log('Default administrator user seeded successfully (admin@test.com / 123456).');
    } else {
      console.log('Administrator user already exists, seed skipped.');
    }
  } catch (error) {
    console.error('Error seeding admin user:', error);
    throw error;
  }
}

export async function connectDB() {
  if (pool) return pool;

  const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  };

  const dbName = process.env.DB_NAME || 'task_manager_db';

  try {
    console.log(`Connecting to MySQL server at ${dbConfig.host}:${dbConfig.port}...`);
    const tempConnection = await mysql.createConnection(dbConfig);
    
    // Create database if not exists
    await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await tempConnection.end();
    console.log(`Verified database \`${dbName}\` exists.`);

    // Create connections pool
    pool = mysql.createPool({
      ...dbConfig,
      database: dbName,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // Run migrations and seed
    const conn = await pool.getConnection();
    try {
      await initializeDatabase(conn);
      await seedAdminUser(conn);
    } finally {
      conn.release();
    }

    return pool;
  } catch (error) {
    console.error('Failed to establish database connection:', error.message);
    throw error;
  }
}

export async function query(sql, params) {
  const dbPool = await connectDB();
  const [results] = await dbPool.query(sql, params);
  return results;
}
