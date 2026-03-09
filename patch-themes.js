const fs = require('fs');
const path = require('path');

const themesDir = path.join(process.cwd(), 'src/themes');
const themes = fs.readdirSync(themesDir).filter(t => fs.statSync(path.join(themesDir, t)).isDirectory() && t !== 'default');

themes.forEach(theme => {
    const headerPath = path.join(themesDir, theme, 'sections/Header/index.tsx');
    if (!fs.existsSync(headerPath)) return;

    let content = fs.readFileSync(headerPath, 'utf8');

    // Skip if already done
    if (content.includes('useCart')) {
        console.log(`[${theme}] Already has useCart`);
        return;
    }

    console.log(`[${theme}] Processing...`);

    // 1. Add imports
    content = content.replace("import React from 'react';", "import React, { useState } from 'react';\nimport { useRouter } from 'next/navigation';\nimport { useCart } from '@/contexts/CartContext';\nimport { Search, ShoppingCart, Menu, X } from 'lucide-react';");

    // 2. Add Hooks and State
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

    // 3. Find the action container and mobile menu injection point
    // Usually it starts around `{/* Search & Cart Actions */}` or `{/* Actions */}`
    // and ends with `</div>\n            </div>\n        </header>`

    // Because each theme has custom CSS for the buttons, we want to extract the CSS.
    // Let's do a simple replacement of the whole action block and append the mobile menu.
    // Instead of parsing strictly, I will supply a generic action block that uses the theme's colors
    // by finding the classes from the actual file.

    const actionMatch = content.match(/<div className="flex items-center gap-[^"]+" shrink-0">[.\s\S]*?<\/header>/) ||
        content.match(/<div className="flex items-center gap-[^"]+ shrink-0">[.\s\S]*?<\/header>/) ||
        content.match(/{\/\* (?:Search & Cart )?Actions \*\/}\s*<div className="flex items-center[^>]*>[\s\S]*?<\/header>/);

    if (actionMatch) {
        // Build a universal action block that fits most themes
        const wrapperClassesMatch = actionMatch[0].match(/<div className="([^"]+)"/);
        const wrapperClasses = wrapperClassesMatch ? wrapperClassesMatch[1] : 'flex items-center gap-4 shrink-0';

        // Find primary colors used in the old buttons
        const buttonClassesMatch = actionMatch[0].match(/<button className="([^"]+hover:[^"]+)"/);
        const buttonClasses = buttonClassesMatch ? buttonClassesMatch[1] : 'text-stone-400 hover:text-stone-800 transition-colors';

        const badgeClassesMatch = actionMatch[0].match(/<span className="([^"]+bg-[^"]+text-[^"]+)"/);
        const badgeClasses = badgeClassesMatch ? badgeClassesMatch[1] : 'absolute -top-2 -right-2 h-4 w-4 bg-primary text-white text-[9px] font-bold flex items-center justify-center rounded-full';

        const replacement = `{/* Search & Cart Actions */}
                <div className="${wrapperClasses}">
                    <form onSubmit={handleSearch} className="hidden md:flex relative items-center group">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-0 opacity-0 group-hover:w-48 group-hover:opacity-100 transition-all duration-300 bg-transparent border-b border-current text-sm outline-none px-2 mr-2 focus:w-48 focus:opacity-100"
                            placeholder={settings.search_placeholder || (language === 'ar' ? 'ابحث...' : 'Search...')}
                        />
                        <button type="submit" className="${buttonClasses}">
                            <Search className="w-5 h-5" />
                        </button>
                    </form>

                    <button onClick={openCart} className={\`\${buttonClasses} relative p-1\`}>
                        <ShoppingCart className="w-5 h-5" />
                        {cartCount > 0 && (
                            <span className="${badgeClasses}">
                                {cartCount}
                            </span>
                        )}
                    </button>

                    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-1 text-current opacity-70 hover:opacity-100">
                        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

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
                                placeholder={settings.search_placeholder || (language === 'ar' ? 'ابحث عن إشراقتك...' : 'Search your glow...')}
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

        content = content.replace(actionMatch[0], replacement);
        fs.writeFileSync(headerPath, content);
        console.log(`[${theme}] Updated successfully.`);
    } else {
        console.log(`[${theme}] Could not match action block!`);
    }

});
