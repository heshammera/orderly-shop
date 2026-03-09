const fs = require('fs');
const path = require('path');
const themesDir = path.join(process.cwd(), 'src/themes');
const themes = fs.readdirSync(themesDir).filter(t => fs.statSync(path.join(themesDir, t)).isDirectory() && t !== 'default');

themes.forEach(theme => {
    const headerPath = path.join(themesDir, theme, 'sections/Header/index.tsx');
    if (!fs.existsSync(headerPath)) return;

    let content = fs.readFileSync(headerPath, 'utf8');

    if (content.includes('useCart')) {
        return; // Already patched
    }

    // 1. Add imports safely
    content = content.replace("import React from 'react';", "import React, { useState } from 'react';\nimport { useRouter } from 'next/navigation';\nimport { useCart } from '@/contexts/CartContext';\nimport { Search, ShoppingCart, Menu, X } from 'lucide-react';");

    // 2. Add Hooks and Logic
    const hookInjection = `    const router = useRouter();
    const { cartCount, openCart } = useCart();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim() && storeSlug) {
            router.push(\`\${storeContext?.store?.baseUrl ?? \`/s/\${storeSlug}\`}/products?q=\${encodeURIComponent(searchQuery.trim())}\`);
            setIsMobileMenuOpen(false);
        }
    };

    const defaultLinks = [`;

    content = content.replace("    const defaultLinks = [", hookInjection);

    // 3. Patching Desktop Search SVG
    // We look for the <Search /> or <svg> for search, which is usually the FIRST button in the action div
    content = content.replace(
        /<button (className="[^"]+")>\s*<svg[^>]*>[\s\S]*?<\/svg>\s*<\/button>/,
        `<form onSubmit={handleSearch} className="hidden md:flex relative items-center group">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-0 opacity-0 group-hover:w-48 group-hover:opacity-100 transition-all duration-300 bg-transparent border-b border-current text-sm outline-none px-2 mr-2 focus:w-48 focus:opacity-100 placeholder:text-current/50"
                            placeholder={settings.search_placeholder || (language === 'ar' ? 'ابحث...' : 'Search...')}
                        />
                        <button type="submit" $1>
                            <Search className="w-5 h-5" />
                        </button>
                    </form>`
    );

    // 4. Patching Desktop Cart SVG
    content = content.replace(
        /<button (className="[^"]+")>\s*<svg[^>]*>[\s\S]*?<\/svg>\s*<span className="([^"]+)">\s*1\s*<\/span>\s*<\/button>/,
        `<button onClick={openCart} $1>
                        <ShoppingCart className="w-5 h-5" />
                        {cartCount > 0 && (
                            <span className="$2">
                                {cartCount}
                            </span>
                        )}
                    </button>`
    );

    // Fallback for cart buttons that have a relative class AND a 0 badge or different badge structure
    content = content.replace(
        /<button (className="[^"]+")>\s*<svg[^>]*>[\s\S]*?<\/svg>\s*<span className="([^"]+)">\s*0\s*<\/span>\s*<\/button>/,
        `<button onClick={openCart} $1>
                        <ShoppingCart className="w-5 h-5" />
                        {cartCount > 0 && (
                            <span className="$2">
                                {cartCount}
                            </span>
                        )}
                    </button>`
    );

    // 5. Patching Mobile Hamburger Menu
    content = content.replace(
        /<button (className="[^"]+")>\s*<svg[^>]*>[\s\S]*?<\/svg>\s*<\/button>/,
        `<button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} $1>
                        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>`
    );

    // 6. Inject the Mobile Menu Dropdown UI just before the </header>
    const mobileUI = `
            {/* Mobile Menu Dropdown */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-background border-t border-border shadow-lg animate-in slide-in-from-top-2 absolute w-full left-0 z-50">
                    <div className="p-4 space-y-4">
                        <form onSubmit={handleSearch} className="relative mb-4">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full p-2 border border-border bg-muted/50 text-foreground rounded text-sm outline-none focus:border-primary px-4 pr-10"
                                placeholder={settings.search_placeholder || (language === 'ar' ? 'ابحث...' : 'Search...')}
                            />
                            <button type="submit" className="absolute top-1/2 -translate-y-1/2 right-3 text-muted-foreground hover:text-primary">
                                <Search className="w-4 h-4" />
                            </button>
                        </form>
                        <ul className="flex flex-col space-y-4 text-foreground">
                            {displayLinks.map((link, idx) => (
                                <li key={idx}>
                                    <Link
                                        href={link.settings.url || '#'}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="hover:text-primary font-semibold block text-sm"
                                    >
                                        {link.settings.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </header>`;

    content = content.replace("        </header>", mobileUI);

    fs.writeFileSync(headerPath, content);
    console.log(`[${theme}] Patched successfully.`);
});
