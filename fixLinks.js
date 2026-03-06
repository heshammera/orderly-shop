const fs = require('fs');
const path = require('path');

const themesDir = path.join(__dirname, 'src', 'themes');
const themes = ['default', 'technova', 'elegance', 'activeplus', 'cozyhome', 'freshcart', 'glow', 'kidswonder', 'luxe'];

themes.forEach(theme => {
    const filePath = path.join(themesDir, theme, 'sections', 'FeaturedGrid', 'index.tsx');
    if (!fs.existsSync(filePath)) return;

    let content = fs.readFileSync(filePath, 'utf8');

    // Make sure we have useRouter
    if (!content.includes("useRouter")) {
        content = content.replace("import Link from 'next/link';", "import Link from 'next/link';\nimport { useRouter } from 'next/navigation';");
    }

    // inject useRouter into GridItem
    if (!content.includes("const router = useRouter();")) {
        content = content.replace(/(function GridItem\(\{.*?\}\)\s*\{)/s, "$1\n    const router = useRouter();");
    }

    // Since regex failed because of nested braces in href={...}, we can just match anything up to `prefetch={true}`
    // Format is always:
    // <Link
    //     className="<CLASSES>"
    //     href={<HREF>}
    //     prefetch={true}
    // >
    // We can extract CLASSES by matching `className="(.*?)"`
    // We can extract HREF by matching `href=\{(.*?)\}\s+prefetch=\{true\}` 
    // This allows nested braces if .*? is not greedy and we match until `prefetch={true}`

    const regex = /<Link\s+className="([^"]+)"\s+href=\{(.*?)\}\s+prefetch=\{true\}\s*>/gs;

    let modified = false;
    content = content.replace(regex, (match, className, href) => {
        modified = true;
        return `<div\n                className="${className} cursor-pointer"\n                onClick={(e) => { e.preventDefault(); router.push(${href}); }}\n            >\n                <Link href={${href}} className="sr-only" prefetch={true} aria-hidden="true">{item.title}</Link>`;
    });

    if (modified) {
        content = content.replace(/(<\/(?:GridTileImage)>|\/>)\s*<\/Link>/g, "$1\n            </div>");
    }

    fs.writeFileSync(filePath, content);
    console.log(`Fixed links for ${theme}`);
});
