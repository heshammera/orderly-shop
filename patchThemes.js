const fs = require('fs');
const path = require('path');

const themesDir = path.join(__dirname, 'src', 'themes');
const themes = ['activeplus', 'cozyhome', 'freshcart', 'glow', 'kidswonder', 'luxe'];

themes.forEach(theme => {
    const filePath = path.join(themesDir, theme, 'sections', 'FeaturedGrid', 'index.tsx');
    if (!fs.existsSync(filePath)) {
        console.log(`File not found: ${filePath}`);
        return;
    }

    let content = fs.readFileSync(filePath, 'utf8');

    // Skip if already patched
    if (content.includes('QuickViewModal')) {
        console.log(`Theme ${theme} already patched`);
        return;
    }

    // Add imports
    content = content.replace("import InlineEditableText from '@/components/ThemeEngine/InlineEditableText';",
        "import InlineEditableText from '@/components/ThemeEngine/InlineEditableText';\nimport { QuickViewModal } from '@/components/store/QuickViewModal';\nimport { Eye } from 'lucide-react';\nimport React, { useState } from 'react';");

    // Remove old React import
    content = content.replace("import React from 'react';\n", "");

    // Add onQuickView to GridTileImage props
    content = content.replace("function GridTileImage({ src, alt, label }: any) {", "function GridTileImage({ src, alt, label, onQuickView }: any) {");

    // Add overlay to GridTileImage inside the main container
    let overlayHtml = `
            {/* Quick View Button Overlay */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-10">
                <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onQuickView && onQuickView(); }}
                    className="pointer-events-auto bg-white/90 backdrop-blur-md rounded-full w-12 h-12 flex items-center justify-center text-gray-800 shadow-xl hover:bg-primary hover:text-white hover:scale-110 transition-all"
                    title="Quick View"
                >
                    <Eye className="w-6 h-6" />
                </button>
            </div>
`;
    // Find the img tag and insert overlay right after it (works for all themes)
    if (content.includes('<img src={src}')) {
        content = content.replace(/(<img src=\{src\}.*?\/>)/, `$1\n${overlayHtml}`);
    }

    // Add onQuickView to GridItem
    content = content.replace("function GridItem({ item, size }: { item: ProductSnippet, size: 'full' | 'half' }) {", "function GridItem({ item, size, onQuickView }: { item: ProductSnippet, size: 'full' | 'half', onQuickView: () => void }) {");

    // Add onQuickView to GridTileImage invocation
    // activeplus/cozyhome variations
    content = content.replace(/label=\{\{\n.*?title: item.title,\n.*?amount: item.price,\n.*?\}\}/s, (match) => {
        return `${match}\n                    onQuickView={(e: React.MouseEvent) => {\n                        if(e) { e.preventDefault(); e.stopPropagation(); }\n                        onQuickView && onQuickView();\n                    }}`;
    });

    // Add state to FeaturedGrid and modal at the bottom
    content = content.replace("export default function FeaturedGrid({ settings, blocks, storeContext, sectionId = 'featured_grid_1' }: FeaturedGridProps) {", "export default function FeaturedGrid({ settings, blocks, storeContext, sectionId = 'featured_grid_1' }: FeaturedGridProps) {\n    const [quickViewProduct, setQuickViewProduct] = useState<string | null>(null);");

    // Replace GridItem calls to pass onQuickView
    content = content.replace(/<GridItem size="full" item=\{products\[0\]\} \/>/g, '<GridItem size="full" item={products[0]} onQuickView={() => setQuickViewProduct(products[0].id)} />');
    content = content.replace(/<GridItem size="half" item=\{products\[1\]\} \/>/g, '<GridItem size="half" item={products[1]} onQuickView={() => setQuickViewProduct(products[1].id)} />');
    content = content.replace(/<GridItem size="half" item=\{products\[2\]\} \/>/g, '<GridItem size="half" item={products[2]} onQuickView={() => setQuickViewProduct(products[2].id)} />');

    // Ensure we close the section and add the modal
    if (content.includes('</section>\n    );')) {
        content = content.replace('</section>\n    );', `
            {quickViewProduct && (
                <QuickViewModal
                    isOpen={!!quickViewProduct}
                    onOpenChange={(open) => !open && setQuickViewProduct(null)}
                    productId={quickViewProduct}
                    storeId={storeIdentifier}
                />
            )}
        </section>
    );`);
    }

    fs.writeFileSync(filePath, content);
    console.log(`Patched ${theme}`);
});
