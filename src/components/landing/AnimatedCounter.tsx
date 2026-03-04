"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform, animate, useInView } from "framer-motion";

export function AnimatedCounter({
    value,
    prefix = "",
    suffix = "",
    duration = 2
}: {
    value: number;
    prefix?: string;
    suffix?: string;
    duration?: number;
}) {
    const count = useMotionValue(0);
    const rounded = useTransform(count, (latest) => Math.round(latest));
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-50px" });

    useEffect(() => {
        if (isInView) {
            const controls = animate(count, value, {
                duration: duration,
                ease: "easeOut"
            });
            return controls.stop;
        }
    }, [count, value, duration, isInView]);

    return (
        <span ref={ref} className="inline-flex items-center">
            {prefix && <span>{prefix}</span>}
            <motion.span>{rounded}</motion.span>
            {suffix && <span>{suffix}</span>}
        </span>
    );
}
