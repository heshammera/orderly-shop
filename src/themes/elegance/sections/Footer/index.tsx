import React from 'react';
import Link from 'next/link';
import InlineEditableText from '@/components/ThemeEngine/InlineEditableText';

interface FooterProps {
    settings: {
        about_heading?: string;
        about_text?: string;
        links_heading?: string;
        contact_heading?: string;
        contact_email?: string;
        contact_phone?: string;
        copyright?: string;
    };
    sectionId?: string;
}

export default function Footer({ settings, sectionId = 'footer_1' }: FooterProps) {
    return (
        <footer className="bg-white border-t border-gray-200 mt-16 text-gray-800">
            {/* Top part */}
            <div className="container mx-auto px-4 py-10">
                <div className="flex flex-wrap -mx-4">

                    {/* About Section */}
                    <div className="w-full sm:w-1/4 px-4 mb-8">
                        <h3 className="text-lg font-bold mb-4">
                            <InlineEditableText
                                as="span"
                                sectionId={sectionId}
                                settingId="about_heading"
                                value={settings.about_heading || 'About Us'}
                            />
                        </h3>
                        <InlineEditableText
                            as="p"
                            sectionId={sectionId}
                            settingId="about_text"
                            value={settings.about_text || 'Experience the best in fashion with our latest collection of premium clothing and accessories.'}
                            className="text-gray-600 text-sm leading-relaxed"
                        />
                    </div>

                    {/* Links Section */}
                    <div className="w-full sm:w-1/4 px-4 mb-8">
                        <h3 className="text-lg font-bold mb-4">
                            <InlineEditableText
                                as="span"
                                sectionId={sectionId}
                                settingId="links_heading"
                                value={settings.links_heading || 'Quick Links'}
                            />
                        </h3>
                        <ul className="space-y-2">
                            <li><Link href="/" className="hover:text-primary transition-colors text-gray-600 text-sm">Home</Link></li>
                            <li><Link href="/products" className="hover:text-primary transition-colors text-gray-600 text-sm">Shop</Link></li>
                            <li><Link href="/cart" className="hover:text-primary transition-colors text-gray-600 text-sm">Cart</Link></li>
                            <li><Link href="/checkout" className="hover:text-primary transition-colors text-gray-600 text-sm">Checkout</Link></li>
                        </ul>
                    </div>

                    {/* Contact Information */}
                    <div className="w-full sm:w-2/4 px-4 mb-8">
                        <h3 className="text-lg font-bold mb-4">
                            <InlineEditableText
                                as="span"
                                sectionId={sectionId}
                                settingId="contact_heading"
                                value={settings.contact_heading || 'Contact Us'}
                            />
                        </h3>
                        <div className="flex flex-col space-y-3 mt-4 text-gray-600 text-sm">
                            <p className="flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /><rect width="20" height="14" x="2" y="5" rx="2" /></svg>
                                <InlineEditableText as="span" sectionId={sectionId} settingId="contact_email" value={settings.contact_email || 'info@company.com'} />
                            </p>
                            <p className="flex items-center gap-2 font-bold text-gray-900 border-t border-gray-100 pt-3">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                                <span>Phone: <InlineEditableText as="span" sectionId={sectionId} settingId="contact_phone" value={settings.contact_phone || '(123) 456-7890'} /></span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom part / Copyright */}
            <div className="py-6 border-t border-gray-200">
                <div className="container mx-auto px-4 flex flex-wrap justify-between items-center text-sm">
                    <div className="w-full lg:w-3/4 text-center lg:text-left mb-4 lg:mb-0">
                        <InlineEditableText
                            as="p"
                            sectionId={sectionId}
                            settingId="copyright"
                            value={settings.copyright || '© 2026 Your Company. All rights reserved.'}
                            className="font-bold mb-2 text-gray-900"
                        />
                        <ul className="flex justify-center lg:justify-start space-x-4 mb-4 lg:mb-0 rtl:space-x-reverse text-gray-500">
                            <li><Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">FAQ</Link></li>
                        </ul>
                    </div>
                </div>
            </div>
        </footer>
    );
}
