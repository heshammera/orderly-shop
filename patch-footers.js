const fs = require('fs');
const path = require('path');
const themesDir = path.join(process.cwd(), 'src/themes');
const themes = fs.readdirSync(themesDir).filter(t => fs.statSync(path.join(themesDir, t)).isDirectory());

themes.forEach(theme => {
    const footerPath = path.join(themesDir, theme, 'sections/Footer/index.tsx');
    if (!fs.existsSync(footerPath)) return;

    let content = fs.readFileSync(footerPath, 'utf8');

    // 1. Change grids to 2 columns max
    content = content.replace(/grid-cols-1 md:grid-cols-4/g, 'grid-cols-1 md:grid-cols-2');
    content = content.replace(/grid-cols-2 md:grid-cols-4/g, 'grid-cols-1 md:grid-cols-2');
    content = content.replace(/grid-cols-2 lg:grid-cols-4/g, 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2');
    content = content.replace(/grid-cols-2 lg:grid-cols-3/g, 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2');
    content = content.replace(/grid-cols-1 md:grid-cols-3/g, 'grid-cols-1 md:grid-cols-2');

    // 2. Reduce Vertical Padding
    content = content.replace(/pt-24/g, 'pt-12');
    content = content.replace(/pb-12/g, 'pb-6');
    content = content.replace(/pt-20/g, 'pt-10');
    content = content.replace(/pb-10/g, 'pb-6');
    content = content.replace(/py-24/g, 'py-12');
    content = content.replace(/py-20/g, 'py-10');
    content = content.replace(/mt-16/g, 'mt-8');
    content = content.replace(/pt-16/g, 'pt-8');
    content = content.replace(/pb-16/g, 'pb-8');

    // Default theme specific
    content = content.replace(/mt-8 md:mt-16 pb-4 md:pb-6 pt-8 md:pt-12/g, 'mt-4 md:mt-8 pb-4 pt-6 md:pt-8');

    // 3. Reduce Bottom Margins
    content = content.replace(/mb-24/g, 'mb-10');
    content = content.replace(/mb-20/g, 'mb-8');
    content = content.replace(/mb-16/g, 'mb-8');
    content = content.replace(/mb-12/g, 'mb-6');

    // 4. Reduce element spacing
    content = content.replace(/gap-16/g, 'gap-8');
    content = content.replace(/gap-12/g, 'gap-6');
    content = content.replace(/gap-10/g, 'gap-6');
    content = content.replace(/space-y-8/g, 'space-y-4');
    content = content.replace(/space-y-6/g, 'space-y-3');

    fs.writeFileSync(footerPath, content);
    console.log(`[${theme}] Compressed Footer Layout`);
});
