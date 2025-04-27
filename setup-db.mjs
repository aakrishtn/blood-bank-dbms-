import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in your environment");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

async function setupDatabase() {
  try {
    console.log("Starting database setup...");
    
    // Read schema.sql
    const schemaFilePath = path.join(__dirname, 'schema.sql');
    const schemaSQL = fs.readFileSync(schemaFilePath, 'utf8');
    
    // Split the SQL into separate statements
    const statements = schemaSQL
      .replace(/--.*$/gm, '') // Remove SQL comments
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        // Use Supabase to execute the SQL directly
        const { error } = await supabase.rpc('exec_sql', { query: statement });
        
        if (error) {
          console.error(`Error executing statement ${i + 1}:`, error);
          // Continue with next statement
        }
      } catch (err) {
        console.error(`Exception executing statement ${i + 1}:`, err);
        // Continue with next statement
      }
    }
    
    console.log("Database setup completed!");
    
  } catch (error) {
    console.error("Error setting up database:", error);
    process.exit(1);
  }
}

// Run the setup
setupDatabase(); 