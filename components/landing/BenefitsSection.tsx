import { Zap, ShieldCheck, BarChart3, TrendingUp, Clock, MousePointerClick } from "lucide-react";

const benefits = [
    {
        icon: <TrendingUp className="w-10 h-10 text-emerald-400" />,
        title: "Aumento de Rentabilidad",
        description: "Reduce mermas y optimiza tus recetas para maximizar el margen de cada producto vendido."
    },
    {
        icon: <Clock className="w-10 h-10 text-blue-400" />,
        title: "Ahorro de Tiempo",
        description: "Automatiza tareas administrativas y enfócate en lo que importa: la calidad de tus panes y pasteles."
    },
    {
        icon: <ShieldCheck className="w-10 h-10 text-purple-400" />,
        title: "Control Absoluto",
        description: "Desde cualquier lugar y en cualquier momento, supervisa tus ventas, stock y personal con total transparencia."
    }
];

export function BenefitsSection() {
    return (
        <section id="benefits" className="py-24 bg-muted/30">
            <div className="container px-6 mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-primary font-bold tracking-widest uppercase text-sm mb-4">Por qué elegirnos</h2>
                    <h3 className="text-4xl md:text-5xl font-serif text-foreground mb-6">Beneficios tangibles para tu negocio.</h3>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto font-light">
                        Nuestro ERP no es solo una herramienta, es tu aliado estratégico para escalar tu panadería al siguiente nivel.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-6xl mx-auto">
                    {benefits.map((benefit, i) => (
                        <div key={i} className="group relative">
                            <div className="absolute -inset-2 bg-gradient-to-r from-primary/10 to-transparent rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="relative p-8 rounded-3xl border border-border bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-all duration-300">
                                <div className="mb-6 p-3 rounded-2xl bg-primary/10 inline-block group-hover:scale-110 transition-transform duration-300">
                                    {benefit.icon}
                                </div>
                                <h4 className="text-2xl font-serif text-foreground mb-4">{benefit.title}</h4>
                                <p className="text-muted-foreground leading-relaxed italic font-light">
                                    "{benefit.description}"
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
