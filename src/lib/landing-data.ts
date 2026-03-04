import { LandingData } from '@/types/landing';

export const landingDataAr: LandingData = {
    hero: {
        badge: 'منصة التجارة الإلكترونية العصرية',
        titleHeadline: 'أنشئ متجرك الإلكتروني',
        titleHighlight: 'في دقائق وبلا كود',
        subtitle: 'كل ما تحتاجه لإطلاق وإدارة وتنمية مبيعات متجرك الإلكتروني في مكان واحد. بوابات دفع، شبكة شحن متكاملة، وحلول تسويقية ذكية.',
        primaryCta: 'ابدأ مجاناً الآن',
        secondaryCta: 'استكشف المنصة',
        trustText: 'بدون بطاقة ائتمانية • إعداد في 5 دقائق',
    },
    socialProof: {
        stats: [
            { id: '1', value: '10', suffix: 'K+', label: 'متجر نشط' },
            { id: '2', value: '500', suffix: 'K+', label: 'طلب شهرياً' },
            { id: '3', value: '50', suffix: 'M+', label: 'مبيعات (دولار)' },
            { id: '4', value: '99', suffix: '.9%', label: 'وقت التشغيل' },
        ],
        testimonialsTitle: 'ماذا يقول تُجارنا؟',
        testimonials: [
            {
                id: '1',
                name: 'أحمد محمد',
                role: 'مؤسس ستورتك',
                content: 'أوردرلي غيرت طريقة إدارتي للمبيعات تماماً. سهولة الاستخدام والدعم الفني السريع هما السبب الرئيسي لنمو مبيعاتنا 300% في شهرين.',
                rating: 5,
            },
            {
                id: '2',
                name: 'سارة خالد',
                role: 'صاحبة متجر أزياء',
                content: 'كنت أجد صعوبة في ربط بوابات الدفع والشحن. مع أوردرلي، كل شيء جاهز بضغطة زر. أفضل قرار اتخذته لعملي.',
                rating: 5,
            },
            {
                id: '3',
                name: 'محمود السيد',
                role: 'مدير تسويق',
                content: 'أدوات التسويق المدمجة وإدارة الحملات سهلت علينا استهداف العملاء بشكل دقيق. المنصة مثالية لنمو الأعمال.',
                rating: 5,
            },
            {
                id: '4',
                name: 'فاطمة علي',
                role: 'صاحبة متجر إلكترونيات',
                content: 'واجهة التحكم بسيطة جداً وتطبيق الهاتف جعل من السهل متابعة الطلبات أينما كنت. أنصح بها بشدة.',
                rating: 5,
            }
        ],
    },
    features: {
        badge: 'المميزات الرئيسية',
        title: 'كل ما تحتاجه للنجاح في مكان واحد',
        subtitle: 'صممنا أوردرلي لتوفر لك أفضل الأدوات التقنية لتنمية متجرك وزيادة أرباحك ببساطة.',
        items: [
            {
                id: 'f1',
                iconName: 'store',
                title: 'إدارة متكاملة للمتاجر',
                description: 'تحكم في منتجاتك، مخزونك، وتصنيفاتك من لوحة تحكم واحدة بسيطة واحترافية.'
            },
            {
                id: 'f2',
                iconName: 'creditCard',
                title: 'بوابات دفع جاهزة',
                description: 'اربط متجرك بأشهر بوابات الدفع (فيزا، مدى، أبل باي) واستقبل أموالك بأمان.'
            },
            {
                id: 'f3',
                iconName: 'truck',
                title: 'شبكة شحن واسعة',
                description: 'أسطول متكامل وتكامل سلس مع أفضل شركات الشحن لتوصيل الطلبات بسرعة.'
            },
            {
                id: 'f4',
                iconName: 'layout',
                title: 'تصاميم جذابة وقابلة للتخصيص',
                description: 'اختر من مجموعة قوالب احترافية تعكس هوية علامتك التجارية وتزيد من التحويلات.'
            },
            {
                id: 'f5',
                iconName: 'barChart',
                title: 'تقارير ذكية للنمو',
                description: 'راقب أداء المبيعات وسلوك العملاء بتقارير دقيقة ومؤشرات أداء قابلة للقراءة.'
            },
            {
                id: 'f6',
                iconName: 'smartphone',
                title: 'متوافق مع الهواتف الذكية',
                description: 'تجربة تسوق مثالية لعملائك عبر الجوال وإدارة متجرك بالكامل من تطبيقك الخاص.'
            },
            {
                id: 'f7',
                iconName: 'megaphone',
                title: 'أدوات تسويق وترويج مدمجة',
                description: 'أنشئ كوبونات الخصم وعروض التسويق بسهولة لزيادة ولاء العملاء ورفع المبيعات.'
            },
            {
                id: 'f8',
                iconName: 'globe',
                title: 'بيع محلي وعالمي',
                description: 'استهدف العملاء حول العالم بدعم تعدد اللغات والعملات تلقائياً.'
            },
            {
                id: 'f9',
                iconName: 'headset',
                title: 'دعم فني استثنائي',
                description: 'فريق دعم يتحدث لغتك جاهز لمساعدتك وحل أي مشكلة على مدار الساعة.'
            }
        ],
    },
    platformDemo: {
        badge: 'لوحة تحكم ذكية',
        title: 'أنت المتحكم.. من مكان واحد',
        subtitle: 'نظام متكامل صُمم ليكون بديهياً ويمنحك سيطرة كاملة على كل زاوية من زوايا تجارتك.',
        modules: [
            { id: 'm1', name: 'إدارة المبيعات', description: 'تتبع المبيعات اليومية لحظة بلحظة', iconName: 'activity' },
            { id: 'm2', name: 'إدارة الطلبات', description: 'تحديث حالات الطلب وإشعار العملاء بالنظام', iconName: 'package' },
            { id: 'm3', name: 'التسويق السريع', description: 'إرسال كوبونات وعروض ترويجية', iconName: 'tag' },
            { id: 'm4', name: 'التحليلات والمتابعة', description: 'احصائيات شاملة للأرباح والزوار', iconName: 'pieChart' },
        ]
    },
    howItWorks: {
        badge: 'خطوات بسيطة',
        title: 'كيف تبدأ البيع؟',
        subtitle: 'عملية الإطلاق سهلة ومبسطة، مصممة لتبدأ تجارتك في وقت قياسي بدون تعقيدات فنية.',
        steps: [
            {
                id: 's1',
                number: '01',
                title: 'أنشئ حسابك',
                description: 'سجل مجاناً وأدخل بياناتك الأساسية للبدء.',
                iconName: 'userPlus'
            },
            {
                id: 's2',
                number: '02',
                title: 'خصص متجرك',
                description: 'اختر القالب الأنسب وارفع شعارك لتحديد هويتك.',
                iconName: 'paintbrush'
            },
            {
                id: 's3',
                number: '03',
                title: 'أضف منتجاتك',
                description: 'ارفع المنتجات بسهولة مع الأسعار والخيارات المتعددة.',
                iconName: 'box'
            },
            {
                id: 's4',
                number: '04',
                title: 'ابدأ البيع واستقبل الأرباح',
                description: 'أطلق متجرك للجمهور واستقبل المدفوعات من أول يوم.',
                iconName: 'rocket'
            }
        ]
    },
    capabilities: {
        badge: 'قدرات تقنية',
        title: 'بنية تحتية مرنة وقابلة للتوسع الحقيقي',
        subtitle: 'لا تقلق على أداء متجرك في أوقات الذروة، المنصة مبنية لتتحمل النمو والتطور المستمر لعملك.',
        items: [
            {
                id: 'c1',
                title: 'بنية متعددة المستأجرين (Multi-Tenant)',
                description: 'بيئة آمنة ومعزولة تضمن الأداء الأقصى مع سهولة الإدارة المركزية وتحديثات مستمرة دون توقف.',
                iconName: 'layers'
            },
            {
                id: 'c2',
                title: 'أداء فائق السرعة',
                description: 'متجرك يعمل بسرعات قياسية مع تحسينات (CDN) وتكنولوجيا حديثة لضمان تجربة تسوق سلسة.',
                iconName: 'zap'
            },
            {
                id: 'c3',
                title: 'مجهز لمتطلبات محركات البحث (SEO)',
                description: 'بنية برمجية مبنية لتحسين الظهور في محركات البحث وجذب الزيارات العضوية وتكوين روابط صديقة.',
                iconName: 'search'
            },
            {
                id: 'c4',
                title: 'أتمتة العمليات',
                description: 'قلل الجهد البشري عبر إعداد شروط وأوامر تلقائية للطلبيات، التنبيهات وإصدار الفواتير.',
                iconName: 'cpu'
            }
        ]
    },
    faq: {
        title: 'الأسئلة الشائعة',
        subtitle: 'إجابات شاملة لأهم التساؤلات قبل إطلاق متجرك.',
        items: [
            {
                id: 'faq1',
                question: 'هل أحتاج أي خبرة برمجية لإنشاء متجر على أوردرلي؟',
                answer: 'إطلاقاً! منصة أوردرلي مصممة لتكون سهلة الاستخدام بمتناول الجميع. يمكنك إعداد متجرك، اختيار التصميم، والبدء في رفع وتخصيص منتجاتك دون كتابة سطر كود واحد.'
            },
            {
                id: 'faq2',
                question: 'ما هي طرق الدفع المدعومة؟',
                answer: 'نحن ندعم جميع طرق الدفع الشائعة بما في ذلك بطاقات الائتمان (فيزا ومساردارد)، الدفع عن طريق أبل باي، خيارات مدى، بالإضافة إلى خيار "الدفع عند الاستلام".'
            },
            {
                id: 'faq3',
                question: 'هل يمكنني الترقية أو إلغاء اشتراكي لاحقاً؟',
                answer: 'بالتأكيد. يمكنك الترقية إلى باقة أعلى في أي وقت لتلائم نمو عملك. وإذا رغبت في الإلغاء، العملية سلسة ولا تتضمن رسوم خفية.'
            },
            {
                id: 'faq4',
                question: 'هل المتجر متوافق مع الموبايل؟',
                answer: 'نعم بنسبة 100%. أثبتت الدراسات أن أغلب الزيارات تتم عبر الهواتف، لذلك قمنا بتصميم القوالب وتجربة المستخدم لتكون مثالية وسهلة للاستخدام على الأجهزة المحمولة.'
            },
            {
                id: 'faq5',
                question: 'هل توفرون دومين (نطاق) مخصص لمتجري؟',
                answer: 'نعم، في الباقات المتقدمة يمكنك ربط اسم نطاق (دومين) خاص بك بكل بساطة. يمكنك أيضاً شراء نطاق جديد وتوصيله بمتجرك مباشرة من خلال المنصة.'
            },
            {
                id: 'faq6',
                question: 'هل يتوفر دعم فني؟',
                answer: 'نعم، نوفر دعم فني متميز باللغتين العربية والإنجليزية. فريقنا متاح للرد على أي استفسارات تقنية أو تجارية عبر البريد الإلكتروني أو المحادثة المباشرة لضمان تجربة مستخدم سلسة.'
            }
        ]
    },
    cta: {
        title: 'جاهز لإطلاق متجرك؟',
        subtitle: 'انضم لآلاف المتاجر الناجحة التي تعتمد على أوردرلي في تحقيق مبيعات واستدامة النمو.',
        buttonText: 'ابدأ مجاناً وبدون بطاقة ائتمانية'
    }
};

export const landingDataEn: LandingData = {
    hero: {
        badge: 'Modern E-Commerce Platform',
        titleHeadline: 'Create Your Online Store',
        titleHighlight: 'in Minutes, No Code',
        subtitle: 'Everything you need to launch, manage, and scale your online business in one place. Payment gateways, shipping networks, and smart marketing solutions.',
        primaryCta: 'Start for Free Now',
        secondaryCta: 'Explore the Platform',
        trustText: 'No credit card required • 5-minute setup',
    },
    socialProof: {
        stats: [
            { id: '1', value: '10', suffix: 'K+', label: 'Active Stores' },
            { id: '2', value: '500', suffix: 'K+', label: 'Orders/Month' },
            { id: '3', value: '50', suffix: 'M+', label: 'Sales ($)' },
            { id: '4', value: '99', suffix: '.9%', label: 'Uptime' },
        ],
        testimonialsTitle: 'What Our Merchants Say',
        testimonials: [
            {
                id: '1',
                name: 'Ahmed Mohamed',
                role: 'Founder, StoreTech',
                content: 'Orderly completely changed how I manage sales. The ease of use and fast tech support are the main reasons our sales grew by 300% in two months.',
                rating: 5,
            },
            {
                id: '2',
                name: 'Sarah Khaled',
                role: 'Fashion Boutique Owner',
                content: 'I used to struggle with integrating payments and shipping. With Orderly, everything is ready with a click. Best decision for my business.',
                rating: 5,
            },
            {
                id: '3',
                name: 'Mahmoud Elsayed',
                role: 'Marketing Manager',
                content: 'The built-in marketing tools and campaign management made it so easy to target customers. The platform is perfect for business growth.',
                rating: 5,
            },
            {
                id: '4',
                name: 'Fatma Ali',
                role: 'Electronics Store Owner',
                content: 'The dashboard is super simple and the mobile app makes it easy to track orders anywhere. Highly recommend it.',
                rating: 5,
            }
        ],
    },
    features: {
        badge: 'Key Features',
        title: 'Everything You Need to Succeed',
        subtitle: 'We designed Orderly to provide you with the best technical tools to grow your store and profits simply.',
        items: [
            {
                id: 'f1',
                iconName: 'store',
                title: 'Integrated Store Management',
                description: 'Control your products, inventory, and categories from one simple, professional dashboard.'
            },
            {
                id: 'f2',
                iconName: 'creditCard',
                title: 'Ready Payment Gateways',
                description: 'Connect your store with top payment gateways securely.'
            },
            {
                id: 'f3',
                iconName: 'truck',
                title: 'Vast Shipping Network',
                description: 'Integrated fleet and seamless connection with top shipping companies.'
            },
            {
                id: 'f4',
                iconName: 'layout',
                title: 'Attractive Customizable Designs',
                description: 'Choose from professional templates that reflect your brand identity.'
            },
            {
                id: 'f5',
                iconName: 'barChart',
                title: 'Smart Growth Reports',
                description: 'Monitor sales performance and customer behavior with accurate reports.'
            },
            {
                id: 'f6',
                iconName: 'smartphone',
                title: 'Mobile Friendly',
                description: 'Perfect shopping experience for customers on mobile, and manage your store via app.'
            },
            {
                id: 'f7',
                iconName: 'megaphone',
                title: 'Built-in Marketing Tools',
                description: 'Create discount coupons and marketing offers easily to increase loyalty.'
            },
            {
                id: 'f8',
                iconName: 'globe',
                title: 'Local & Global Sales',
                description: 'Target customers worldwide with multi-language and currency support.'
            },
            {
                id: 'f9',
                iconName: 'headset',
                title: 'Exceptional Tech Support',
                description: 'A support team ready to assist you 24/7.'
            }
        ],
    },
    platformDemo: {
        badge: 'Smart Dashboard',
        title: 'You Are in Control.. From One Place',
        subtitle: 'An integrated system designed to be intuitive and give you full control over every corner of your business.',
        modules: [
            { id: 'm1', name: 'Sales Management', description: 'Track daily sales moment by moment', iconName: 'activity' },
            { id: 'm2', name: 'Order Management', description: 'Update order status and notify customers', iconName: 'package' },
            { id: 'm3', name: 'Fast Marketing', description: 'Send coupons and promotional offers', iconName: 'tag' },
            { id: 'm4', name: 'Analytics & Tracking', description: 'Comprehensive stats for profits and visitors', iconName: 'pieChart' },
        ]
    },
    howItWorks: {
        badge: 'Simple Steps',
        title: 'How to Start Selling?',
        subtitle: 'The launch process is easy and simplified, designed to start your business in record time without technical complications.',
        steps: [
            {
                id: 's1',
                number: '01',
                title: 'Create Your Account',
                description: 'Sign up for free and enter your basic details to start.',
                iconName: 'userPlus'
            },
            {
                id: 's2',
                number: '02',
                title: 'Customize Your Store',
                description: 'Choose the best template and upload your logo.',
                iconName: 'paintbrush'
            },
            {
                id: 's3',
                number: '03',
                title: 'Add Your Products',
                description: 'Easily upload products with prices and multiple options.',
                iconName: 'box'
            },
            {
                id: 's4',
                number: '04',
                title: 'Start Selling & Earning',
                description: 'Launch your store to the public and receive payments from day one.',
                iconName: 'rocket'
            }
        ]
    },
    capabilities: {
        badge: 'Technical Capabilities',
        title: 'Flexible & Truly Scalable Infrastructure',
        subtitle: 'Don\'t worry about your store\'s performance during peak times, the platform is built to handle the continuous growth of your business.',
        items: [
            {
                id: 'c1',
                title: 'Multi-Tenant Architecture',
                description: 'Secure and isolated environment ensuring maximum performance with centralized management.',
                iconName: 'layers'
            },
            {
                id: 'c2',
                title: 'Ultra-Fast Performance',
                description: 'Your store runs at record speeds with CDN optimizations ensuring a seamless experience.',
                iconName: 'zap'
            },
            {
                id: 'c3',
                title: 'SEO Ready',
                description: 'Software architecture built to improve search engine visibility and attract organic traffic.',
                iconName: 'search'
            },
            {
                id: 'c4',
                title: 'Process Automation',
                description: 'Reduce human effort by setting automated conditions for orders and invoicing.',
                iconName: 'cpu'
            }
        ]
    },
    faq: {
        title: 'Frequently Asked Questions',
        subtitle: 'Comprehensive answers before launching your store.',
        items: [
            {
                id: 'faq1',
                question: 'Do I need coding experience to create a store on Orderly?',
                answer: 'Not at all! Orderly is designed to be accessible to everyone. You can set up your store, choose a design, and start selling without writing a single line of code.'
            },
            {
                id: 'faq2',
                question: 'What payment methods are supported?',
                answer: 'We support all popular payment methods including credit cards, Apple Pay, Mada, and Cash on Delivery (COD).'
            },
            {
                id: 'faq3',
                question: 'Can I upgrade or cancel my subscription later?',
                answer: 'Absolutely. You can upgrade to a higher plan anytime as your business grows. If you wish to cancel, the process is seamless with no hidden fees.'
            },
            {
                id: 'faq4',
                question: 'Is the store mobile-friendly?',
                answer: 'Yes, 100%. Our templates are fully responsive, ensuring a perfect shopping experience on smartphones and tablets.'
            },
            {
                id: 'faq5',
                question: 'Do you provide a custom domain for my store?',
                answer: 'Yes, on advanced plans you can easily connect your own custom domain, or purchase a new one directly through the platform.'
            },
            {
                id: 'faq6',
                question: 'Is technical support available?',
                answer: 'We provide excellent technical support in both Arabic and English, available 24/7 via email or live chat.'
            }
        ]
    },
    cta: {
        title: 'Ready to Launch Your Store?',
        subtitle: 'Join thousands of successful stores relying on Orderly for sales and growth.',
        buttonText: 'Start for Free, No Credit Card Required'
    }
};
