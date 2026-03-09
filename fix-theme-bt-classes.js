const fs = require('fs');
const path = require('path');
const themesDir = path.join(process.cwd(), 'src/themes');
const themes = fs.readdirSync(themesDir).filter(t => fs.statSync(path.join(themesDir, t)).isDirectory() && t !== 'default');

themes.forEach(theme => {
    const headerPath = path.join(themesDir, theme, 'sections/Header/index.tsx');
    if (!fs.existsSync(headerPath)) return;

    let content = fs.readFileSync(headerPath, 'utf8');

    // Extract the buttonClasses from the search button right above it
    const searchBtnMatch = content.match(/<button type="submit" className="([^"]+)">/);
    if (searchBtnMatch) {
        let actualClasses = searchBtnMatch[1];

        // Clean up any stray string interpolations
        content = content.replace(/className=\{\`\$\{buttonClasses\} relative p-1\`\}/g, `className="${actualClasses} relative p-1"`);

        fs.writeFileSync(headerPath, content);
        console.log(`Fixed button classes in ${theme}`);
    } else {
        console.log(`Could not find searchBtnMatch in ${theme}`);
    }
});
