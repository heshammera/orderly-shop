export interface Feature {
    id: string;
    iconName: string;
    title: string;
    description: string;
}

export interface Step {
    id: string;
    number: string;
    title: string;
    description: string;
    iconName: string;
}

export interface FAQ {
    id: string;
    question: string;
    answer: string;
}

export interface Testimonial {
    id: string;
    name: string;
    role: string;
    content: string;
    rating: number;
}

export interface Stat {
    id: string;
    value: string;
    label: string;
    suffix?: string;
    prefix?: string;
}

export interface Capability {
    id: string;
    title: string;
    description: string;
    iconName: string;
}

export interface LandingData {
    hero: {
        badge: string;
        titleHeadline: string;
        titleHighlight: string;
        subtitle: string;
        primaryCta: string;
        secondaryCta: string;
        trustText: string;
    };
    socialProof: {
        stats: Stat[];
        testimonialsTitle: string;
        testimonials: Testimonial[];
    };
    features: {
        badge: string;
        title: string;
        subtitle: string;
        items: Feature[];
    };
    platformDemo: {
        badge: string;
        title: string;
        subtitle: string;
        modules: { id: string; name: string; description: string; iconName: string }[];
    };
    howItWorks: {
        badge: string;
        title: string;
        subtitle: string;
        steps: Step[];
    };
    capabilities: {
        badge: string;
        title: string;
        subtitle: string;
        items: Capability[];
    };
    faq: {
        title: string;
        subtitle: string;
        items: FAQ[];
    };
    cta: {
        title: string;
        subtitle: string;
        buttonText: string;
    };
}
