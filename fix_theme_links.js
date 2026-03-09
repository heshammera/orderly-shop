const fs = require('fs');
const path = require('path');

const themesDir = path.join(__dirname, 'src', 'themes');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function (file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk(themesDir);

let changedFiles = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // 1. Replace `/s/${storeSlug}` with empty string when used in baseUrl or routing
    // e.g., `${storeContext?.store?.baseUrl ?? \`/s/${storeSlug}\`}` -> `${storeContext?.store?.baseUrl ?? ''}`
    content = content.replace(/`\/s\/\$\{storeSlug\}`/g, "''");

    // 2. Replace href={storeSlug ? `/s/${storeSlug}` : '/'} with href="/"
    content = content.replace(/href=\{storeSlug \? `\/s\/\$\{storeSlug\}` : '\/'}/g, 'href="/"');

    // 3. Replace const baseUrl = storeIdentifier ? `/s/${storeIdentifier}/p` : '/product';
    content = content.replace(
        /const baseUrl = storeIdentifier \? `\/s\/\$\{storeIdentifier\}\/p` : '\/product';/g,
        "const baseUrl = '';"
    );

    // 4. Sometimes it might be storeSlug instead of storeIdentifier
    content = content.replace(
        /const baseUrl = storeSlug \? `\/s\/\$\{storeSlug\}\/p` : '\/product';/g,
        "const baseUrl = '';"
    );

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        changedFiles++;
        console.log(`Updated ${file}`);
    }
});

console.log(`Done. Updated ${changedFiles} files.`);
