'use client';
import Link from 'next/link';
import {useLanguage} from '@/contexts/LanguageContext';
import styles from './marketing.module.css';
export function MarketingFooter(){const {language}=useLanguage();const ar=language==='ar';return <footer className={styles.footer}><div className={styles.footerInner}><div><Link href="/"><strong>Orderly</strong></Link><p>{ar?'شركة أوردرلي للتسويق وإدارة الأعمال':'Orderly Marketing and Business Management Company'}</p></div><nav aria-label={ar?'روابط أسفل الصفحة':'Footer navigation'}>{[['/demo','جرّب المتجر','Try the demo'],['/about','عن أوردرلي','About'],['/contact','تواصل معنا','Contact'],['/privacy','الخصوصية','Privacy'],['/terms','الشروط والاسترداد','Terms & refunds']].map(([href,a,e])=><Link href={href} key={href}>{ar?a:e}</Link>)}</nav></div><p className={styles.copyright}>© {new Date().getFullYear()} Orderly. {ar?'جميع الحقوق محفوظة.':'All rights reserved.'}</p></footer>}
