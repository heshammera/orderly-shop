const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, 'src', 'components', 'store');

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

const files = walk(componentsDir);
let changedFiles = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // 1. `${store.baseUrl ?? \`/s/${store.slug}\`}/${product.sku || product.id}` -> `/${product.sku || product.id}`
    content = content.replace(/\$\{store\.baseUrl \?\? `\/s\/\$\{store\.slug\}`\}\//g, '');

    // 2. `${store.baseUrl ?? \`/s/${store.slug}\`}` -> `""` 
    // Wait, if it's used as an href for Home, it should be `/`
    content = content.replace(/href=\{`\$\{store\.baseUrl \?\? `\/s\/\$\{store\.slug\}`\}`\}/g, 'href="/"');

    // 3. `/s/${store.slug}/checkout` -> `/checkout`
    content = content.replace(/`\/s\/\$\{store\.slug\}\/checkout`/g, '`/checkout`');
    content = content.replace(/`\/s\/\$\{storeSlug\}\/checkout`/g, '`/checkout`');
    content = content.replace(/`\/s\/\$\{storeId\}\/checkout`/g, '`/checkout`');

    // 4. `href={\`/s/${storeSlug}\`}` -> `href="/"`
    content = content.replace(/href=\{`\/s\/\$\{storeSlug\}`\}/g, 'href="/"');

    // 5. `/s/${store.slug}/cart` -> `/cart`
    content = content.replace(/`\/s\/\$\{store\.slug\}\/cart`/g, '`/cart`');

    // 6. `/s/${storeSlug}/...` -> `/...`
    content = content.replace(/`\/s\/\$\{storeSlug\}\//g, '`/');
    content = content.replace(/`\/s\/\$\{store\.slug\}\//g, '`/');
    content = content.replace(/`\/s\/\$\{storeId\}\//g, '`/');
    content = content.replace(/`\/s\/\$\{storeSlug \|\| storeId\}\//g, '`/');

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        changedFiles++;
        console.log(`Updated ${file}`);
    }
});

console.log(`Done. Updated ${changedFiles} files in components/store.`);
