const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

// The new migration we want to apply for real
const newMigration = '20260208020000_loyalty_system_schema.sql';

console.log('Repairing migration history...');

for (const file of files) {
    if (file === newMigration) {
        console.log(`Skipping new migration: ${file}`);
        continue;
    }

    const version = file.split('_')[0];
    console.log(`Marking version ${version} as applied...`);
    try {
        execSync(`npx supabase migration repair --status applied ${version}`, { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    } catch (e) {
        console.error(`Failed to repair ${version}:`, e.message);
        // Don't stop, try others? Or stop? usually better to stop if repair fails.
        process.exit(1);
    }
}

console.log('Done.');
