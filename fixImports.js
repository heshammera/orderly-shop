const fs = require('fs');
const path = require('path');

const themesDir = path.join(__dirname, 'src', 'themes');
const themes = ['activeplus', 'cozyhome', 'freshcart', 'glow', 'kidswonder', 'luxe'];

themes.forEach(theme => {
    const filePath = path.join(themesDir, theme, 'sections', 'FeaturedGrid', 'index.tsx');
    if (!fs.existsSync(filePath)) return;

    let content = fs.readFileSync(filePath, 'utf8');

    // Remove the very first `import React from 'react';` or with carriage return
    const lines = content.split('\n');
    if (lines[0].includes("import React from 'react';")) {
        lines.shift(); // Remove the first line
        fs.writeFileSync(filePath, lines.join('\n'));
        console.log(`Fixed imports in ${theme}`);
    } else {
        console.log(`No duplicate import found to fix in ${theme}`);
    }
});
