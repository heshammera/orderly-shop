const fs = require('fs');
const path = require('path');

const themesDir = path.join(__dirname, 'src', 'themes');
const themes = ['default', 'technova', 'elegance', 'activeplus', 'cozyhome', 'freshcart', 'glow', 'kidswonder', 'luxe'];

themes.forEach(theme => {
    const filePath = path.join(themesDir, theme, 'sections', 'FeaturedGrid', 'index.tsx');
    if (!fs.existsSync(filePath)) return;

    let content = fs.readFileSync(filePath, 'utf8');

    // Make sure we have useCart imported
    if (!content.includes("useCart")) {
        content = content.replace("import { QuickViewModal } from '@/components/store/QuickViewModal';", "import { QuickViewModal } from '@/components/store/QuickViewModal';\nimport { useCart } from '@/contexts/CartContext';");
    }

    // inject useCart into FeaturedGrid
    if (!content.includes("const { addToCart } = useCart();")) {
        content = content.replace(/(export default function FeaturedGrid\(\{.*?\}\)\s*\{)/s, "$1\n    const { addToCart } = useCart();");
    }

    // Now, let's find the Add to Cart button or Quick View button.
    // In the earlier patch, we might have added QuickView, and the problem user says is "Add to Cart opens Quick View".
    // Let's check if the themes even HAVE an add to cart button.
    // Ah, wait! The user request was "I want to add Add to Cart and Quick View".
    // I added Quick View. Did I add Add to Cart in the themes?
    // Let's look at kidswonder / glow. They only have an Eye icon for Quick View overlay.
    // The StoreProducts page has BOTH. 
    // Wait, the StoreProducts page had BOTH Eye and ShoppingCart.

    // We didn't add Add To Cart button to the themed FeaturedGrids, ONLY Quick View.
    // Let's first log what buttons are inside GridTileImage of default theme to figure it out.
});
