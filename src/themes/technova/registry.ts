import FeaturedGrid from './sections/FeaturedGrid';
import HeroBanner from './sections/HeroBanner';
import CategorySlider from './sections/CategorySlider';
import Footer from './sections/Footer';
import Header from './sections/Header';
import Newsletter from './sections/Newsletter';
import MainProduct from '@/components/ThemeEngine/Sections/MainProduct';
import MainCheckout from '@/components/ThemeEngine/Sections/MainCheckout';
import MainProducts from '@/components/ThemeEngine/Sections/MainProducts';

export const sectionsRegistry = {
    hero_banner: HeroBanner,
    featured_grid: FeaturedGrid,
    category_slider: CategorySlider,
    footer: Footer,
    header: Header,
    newsletter: Newsletter,
    main_product: MainProduct,
    main_checkout: MainCheckout,
    main_products: MainProducts,
};
