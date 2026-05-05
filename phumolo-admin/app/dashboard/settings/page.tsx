'use client'

export default function SettingsPage() {
  const integrationSnippet = `// ============================================================
// PHUMOLO MARATHON — Frontend Registration Form Integration
// Paste this in your existing form submit handler
// ============================================================

const SUPABASE_URL = 'https://lqttzudtwarkwyxcnssd.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_UYNtiM0r3GfdtYpIdR-AeQ_oH2ivH7p'

async function submitRegistration(formData) {
  const payload = {
    first_name:              formData.first_name,
    last_name:               formData.last_name,
    email:                   formData.email,
    phone:                   formData.phone,
    gender:                  formData.gender,          // 'Male' | 'Female' | 'Other'
    age:                     parseInt(formData.age),
    id_number:               formData.id_number,
    race_category:           formData.race_category,   // '5KM' | '10KM' | '21KM' | '42KM'
    shirt_size:              formData.shirt_size,       // 'XS'|'S'|'M'|'L'|'XL'|'XXL'
    shirt_color:             formData.shirt_color,
    emergency_contact_name:  formData.emergency_contact_name,
    emergency_contact_phone: formData.emergency_contact_phone,
    payment_status:          'Pending',                // Always start as Pending
    // bib_number is AUTO-ASSIGNED by the database trigger — do NOT send it
  }

  const response = await fetch(
    \`\${SUPABASE_URL}/rest/v1/registrations\`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': \`Bearer \${SUPABASE_ANON_KEY}\`,
        'Prefer': 'return=representation', // Returns the inserted row with BIB number
      },
      body: JSON.stringify(payload),
    }
  )

  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.message || 'Registration failed')
  }

  const [inserted] = await response.json()
  console.log('Registration successful! BIB Number:', inserted.bib_number)
  return inserted  // Contains bib_number, id, submitted_at, etc.
}

// Usage in your form:
// document.getElementById('reg-form').addEventListener('submit', async (e) => {
//   e.preventDefault()
//   try {
//     const result = await submitRegistration({
//       first_name: 'Jane', last_name: 'Doe', email: 'jane@example.com',
//       phone: '0712345678', gender: 'Female', age: 28,
//       id_number: '12345678', race_category: '10KM',
//       shirt_size: 'M', shirt_color: 'Orange',
//       emergency_contact_name: 'John Doe',
//       emergency_contact_phone: '0798765432'
//     })
//     alert('Registered! Your BIB number is: ' + result.bib_number)
//   } catch (err) {
//     alert('Error: ' + err.message)
//   }
// })`

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-white">Settings</h1>
        <p className="text-zinc-400 text-sm mt-1">Configuration, API keys, and integration guide</p>
      </div>

      {/* Credentials */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-white font-bold">Supabase Configuration</h2>
        <ConfigRow label="Project URL" value="https://lqttzudtwarkwyxcnssd.supabase.co" />
        <ConfigRow label="Anon (Public) Key" value="sb_publishable_***" />
        <ConfigRow label="Service Role Key" value="sb_secret_*** (server only)" redacted />
      </div>

      {/* Integration snippet */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-bold">Frontend Form Integration Code</h2>
          <button
            onClick={() => navigator.clipboard.writeText(integrationSnippet)}
            className="text-xs bg-zinc-700 hover:bg-zinc-600 text-white px-3 py-1.5 rounded-lg transition"
          >
            📋 Copy
          </button>
        </div>
        <p className="text-zinc-400 text-sm mb-4">
          Drop this snippet into your <code className="text-orange-400 bg-zinc-800 px-1 py-0.5 rounded">phumolomarathon.co.ke</code> registration form's submit handler.
          BIB numbers are automatically assigned by the database — no extra code needed.
        </p>
        <pre className="bg-black rounded-xl p-4 overflow-x-auto text-xs text-green-400 leading-relaxed whitespace-pre-wrap">
          {integrationSnippet}
        </pre>
      </div>

      {/* Database setup */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <h2 className="text-white font-bold mb-2">Database Setup</h2>
        <p className="text-zinc-400 text-sm mb-4">
          If you haven't set up the database yet, run the schema file in your Supabase SQL Editor:
        </p>
        <div className="bg-black rounded-xl p-4 text-orange-400 text-sm font-mono">
          📁 phumolo-admin/supabase-schema.sql
        </div>
        <ol className="mt-4 space-y-2 text-sm text-zinc-400">
          <li>1. Go to <span className="text-orange-400">supabase.com/dashboard</span> → your project</li>
          <li>2. Click <strong className="text-white">SQL Editor</strong></li>
          <li>3. Paste the entire contents of <code className="text-orange-400">supabase-schema.sql</code></li>
          <li>4. Click <strong className="text-white">Run</strong></li>
        </ol>
      </div>

      {/* Admin user */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <h2 className="text-white font-bold mb-2">Create Admin User</h2>
        <p className="text-zinc-400 text-sm">
          Go to <span className="text-orange-400">Supabase → Authentication → Users → Add User</span> to create your admin login credentials.
          Then use those credentials on the login page at <code className="text-orange-400">/login</code>.
        </p>
      </div>
    </div>
  )
}

function ConfigRow({ label, value, redacted }: { label: string; value: string; redacted?: boolean }) {
  return (
    <div className="flex items-center justify-between p-3 bg-zinc-800 rounded-xl">
      <span className="text-zinc-400 text-sm">{label}</span>
      <code className={`text-xs font-mono ${redacted ? 'text-red-400' : 'text-green-400'}`}>{value}</code>
    </div>
  )
}
