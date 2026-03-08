"use client";

import { cn } from "@/lib/utils";
import React from "react"; // Added React import for React.ReactNode and React.CSSProperties

interface FeatureCardProps {
    icon: React.ReactNode; // Changed icon type
    title: string;
    description: string;
    className?: string;
    style?: React.CSSProperties; // Added style prop
}

export function FeatureCard({ icon, title, description, className, style }: FeatureCardProps) { // Updated destructuring
    return (
        <div
            className={cn(
                "p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-white/20 transition-all group",
                className
            )}
            style={style} // Added style prop to div
        >
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500">
                {icon} {/* Updated icon usage */}
            </div>
            <h3 className="text-xl font-serif text-white mb-3">{title}</h3>
            <p className="text-white/50 text-sm leading-relaxed">
                {description}
            </p>
        </div>
    );
}
