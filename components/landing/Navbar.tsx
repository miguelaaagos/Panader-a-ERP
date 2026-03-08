"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Suspense } from "react";

interface NavItemProps {
    href: string;
    label: string;
    activeId: string;
}

function NavItem({ href, label, activeId }: NavItemProps) {
    const isActive = activeId === href.replace("#", "");

    return (
        <a
            href={href}
            className={cn(
                "relative py-2 px-1 text-sm font-medium transition-all duration-300",
                isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
            )}
        >
            {label}
            {isActive && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-full animate-in fade-in zoom-in duration-300" />
            )}
        </a>
    );
}

export function Navbar({ children }: { children: React.ReactNode }) {
    const [activeSection, setActiveSection] = useState("");
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };

        const observerOptions = {
            root: null,
            rootMargin: "-20% 0px -70% 0px",
            threshold: 0,
        };

        const observerCallback = (entries: IntersectionObserverEntry[]) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    setActiveSection(entry.target.id);
                }
            });
        };

        const observer = new IntersectionObserver(observerCallback, observerOptions);

        // Observar secciones
        const sections = ["features", "benefits", "pricing", "contact"];
        sections.forEach((id) => {
            const el = document.getElementById(id);
            if (el) observer.observe(el);
        });

        window.addEventListener("scroll", handleScroll);
        return () => {
            window.removeEventListener("scroll", handleScroll);
            observer.disconnect();
        };
    }, []);

    return (
        <nav className={cn(
            "fixed top-0 w-full z-50 transition-all duration-500 border-b",
            isScrolled
                ? "h-16 border-border bg-background/80 backdrop-blur-xl shadow-sm"
                : "h-24 border-transparent bg-transparent"
        )}>
            <div className="container mx-auto px-6 h-full flex items-center justify-between">
                <div className="flex gap-2 items-center font-serif text-2xl font-bold tracking-tight text-foreground">
                    <span className="text-3xl">📊</span> Simple ERP
                </div>

                <div className="flex items-center gap-8">
                    <div className="hidden md:flex gap-8">
                        <NavItem href="#features" label="Características" activeId={activeSection} />
                        <NavItem href="#benefits" label="Beneficios" activeId={activeSection} />
                        <NavItem href="#pricing" label="Planes" activeId={activeSection} />
                        <NavItem href="#contact" label="Contacto" activeId={activeSection} />
                    </div>

                    <div className="h-6 w-px bg-border hidden md:block" />

                    <div className="flex items-center gap-3">
                        <ThemeSwitcher />
                        <Suspense>
                            {children}
                        </Suspense>
                    </div>
                </div>
            </div>
        </nav>
    );
}
