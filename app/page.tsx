import { AuthButton } from "@/components/auth-button";
import { HeroSection, BenefitsSection, PricingTable, ContactForm, FeatureCard } from "@/components/landing";
import { Navbar } from "@/components/landing/Navbar";
import { ShoppingBag, Users, Zap, BarChart3, ShieldCheck, Clock } from "lucide-react";
import { Suspense } from "react";

const features = [
  {
    icon: <ShoppingBag className="w-6 h-6" />,
    title: "Punto de Venta Intuitivo",
    description: "Venta rápida y fluida, optimizada para tablets y computadores. Soporta múltiples métodos de pago."
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: "Inventario en Tiempo Real",
    description: "Control total de stock, mermas e insumos. Recibe alertas automáticas cuando los niveles son bajos."
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: "Producción Inteligente",
    description: "Planifica tus horneadas y recetas. Calcula costos de producción y márgenes de ganancia exactos."
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: "Gestión de Clientes",
    description: "Fideliza a tus clientes con historial de compras, créditos y promociones personalizadas."
  },
  {
    icon: <ShieldCheck className="w-6 h-6" />,
    title: "Seguridad Robusta",
    description: "Tus datos están protegidos con encriptación de grado bancario y respaldos automáticos en la nube."
  },
  {
    icon: <Clock className="w-6 h-6" />,
    title: "Control de Asistencia",
    description: "Gestiona horarios y turnos de tu personal de forma integrada con el sistema de ventas."
  }
];

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-primary/30 scroll-smooth">
      <Navbar>
        <AuthButton />
      </Navbar>

      {/* Hero Section */}
      <HeroSection />

      {/* Features Section */}
      <section id="features" className="py-24 relative overflow-hidden bg-background">
        <div className="container px-6 mx-auto">
          <div className="max-w-3xl mb-16">
            <h2 className="text-primary font-bold tracking-widest uppercase text-sm mb-4">Potencia tu negocio</h2>
            <h3 className="text-4xl md:text-6xl font-serif text-foreground mb-6">Todo lo que necesitas para tu negocio gastronómico.</h3>
            <p className="text-xl text-muted-foreground font-light">
              Desde el control de insumos hasta el cierre de caja, hemos pensado en cada detalle de tu operación.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <FeatureCard
                key={i}
                {...feature}
                className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both"
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <BenefitsSection />

      {/* Pricing Section */}
      <PricingTable />

      {/* Contact Form Section */}
      <ContactForm />

      {/* Footer */}
      <footer className="py-20 border-t border-border bg-muted/40">
        <div className="container px-6 mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2">
              <div className="flex gap-2 items-center font-serif text-2xl font-bold mb-6 text-foreground">
                <span>📊</span> Simple ERP
              </div>
              <p className="text-muted-foreground max-w-sm mb-8">
                Llevamos la gestión de los negocios gastronómicos al siguiente nivel con tecnología de vanguardia.
              </p>
              <div className="flex gap-4 text-muted-foreground">
                {/* ThemeSwitcher moved to Nav */}
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-6 italic text-foreground text-sm uppercase tracking-wider">Producto</h4>
              <ul className="space-y-4 text-muted-foreground text-sm font-medium">
                <li><a href="#" className="hover:text-primary transition-colors">Funcionalidades</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Integraciones</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Actualizaciones</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Seguridad</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 italic text-foreground text-sm uppercase tracking-wider">Compañía</h4>
              <ul className="space-y-4 text-muted-foreground text-sm font-medium">
                <li><a href="#" className="hover:text-primary transition-colors">Sobre nosotros</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contacto</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Privacidad</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Términos</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-muted-foreground text-xs">
            <p>© 2026 Simple ERP. Gestión inteligente para tu negocio.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-foreground transition-colors font-medium">Twitter</a>
              <a href="#" className="hover:text-foreground transition-colors font-medium">LinkedIn</a>
              <a href="#" className="hover:text-foreground transition-colors font-medium">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
