// Smart database client — auto-detects environment
// On Render (cloud): uses Supabase when SUPABASE_URL is set
// Locally: falls back to SQLite

const dotenv = require('dotenv');
dotenv.config();

if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
    // Cloud mode — use Supabase
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
    console.log('Database: Supabase (Cloud)');
    console.log('Supabase URL:', process.env.SUPABASE_URL);
    module.exports = supabase;
} else {
    // Local mode — use SQLite
    const db = require('./db');
    console.log('Database: SQLite (Local)');
    module.exports = db;
}
