
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Load env vars manually to avoid dotenv dependency issues in this context
const envPath = path.resolve(process.cwd(), '.env')
const envContent = fs.readFileSync(envPath, 'utf-8')
const env = {}
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=')
  if (key && value) {
    env[key.trim()] = value.trim()
  }
})

const supabaseUrl = env.VITE_SUPABASE_URL
const supabaseKey = env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function exportAndLog() {
  console.log('Fetching attendance_logs...')
  const { data, error } = await supabase
    .from('attendance_logs')
    .select('*')
    .order('id', { ascending: true })

  if (error) {
    console.error('Error fetching data:', error)
    return
  }

  console.log(`Fetched ${data.length} rows.`)

  if (data.length === 0) {
    console.log('No data found.')
    return
  }

  // Generate CSV
  const headers = Object.keys(data[0]).join(',')
  const rows = data.map(row => Object.values(row).map(v => `"${v}"`).join(',')).join('\n')
  const csv = `${headers}\n${rows}`

  fs.writeFileSync('attendance_logs_rows.csv', csv)
  console.log('Exported to attendance_logs_rows.csv')

  // Also log the first row to console for immediate inspection
  console.log('First row structure:', data[0])
}

exportAndLog()
