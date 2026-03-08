import { HeroSection, PricingTable, FeatureCard } from "@/components/landing";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { AuthButton } from "@/components/auth-button";
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
    <main className="min-h-screen bg-[#070708] text-foreground selection:bg-primary/30">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/20 backdrop-blur-xl">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex gap-2 items-center font-serif text-2xl text-white font-bold tracking-tight">
            <span className="text-3xl">📊</span> Simple ERP
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex gap-8 text-sm font-medium text-white/60">
              <a href="#features" className="hover:text-primary transition-colors">Características</a>
              <a href="#pricing" className="hover:text-primary transition-colors">Precios</a>
              <a href="/docs" className="hover:text-primary transition-colors">Documentación</a>
            </div>
            <div className="h-6 w-px bg-white/10 hidden md:block" />
            <Suspense>
              <AuthButton />
            </Suspense>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <HeroSection />

      {/* Features Section */}
      <section id="features" className="py-24 relative overflow-hidden">
        <div className="container px-6 mx-auto">
          <div className="max-w-3xl mb-16">
            <h2 className="text-primary font-bold tracking-widest uppercase text-sm mb-4">Potencia tu negocio</h2>
            <h3 className="text-4xl md:text-6xl font-serif text-white mb-6">Todo lo que necesitas para tu negocio gastronómico.</h3>
            <p className="text-xl text-white/50 font-light">
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

      {/* Pricing Section */}
      <PricingTable />

      {/* Footer */}
      <footer className="py-20 border-t border-white/5 bg-black/40">
        <div className="container px-6 mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2">
              <div className="flex gap-2 items-center font-serif text-2xl text-white font-bold mb-6">
                <span>📊</span> Simple ERP
              </div>
              <p className="text-white/50 max-w-sm mb-8">
                Llevamos la gestión de los negocios gastronómicos al siguiente nivel con tecnología de vanguardia.
              </p>
              <div className="flex gap-4">
                <ThemeSwitcher />
              </div>
            </div>
            <div>
              <h4 className="text-white font-bold mb-6 italic">Producto</h4>
              <ul className="space-y-4 text-white/40 text-sm">
                <li><a href="#" className="hover:text-primary">Funcionalidades</a></li>
                <li><a href="#" className="hover:text-primary">Integraciones</a></li>
                <li><a href="#" className="hover:text-primary">Actualizaciones</a></li>
                <li><a href="#" className="hover:text-primary">Seguridad</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-6 italic">Compañía</h4>
              <ul className="space-y-4 text-white/40 text-sm">
                <li><a href="#" className="hover:text-primary">Sobre nosotros</a></li>
                <li><a href="#" className="hover:text-primary">Contacto</a></li>
                <li><a href="#" className="hover:text-primary">Privacidad</a></li>
                <li><a href="#" className="hover:text-primary">Términos</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-white/30 text-xs">
            <p>© 2026 Simple ERP. Gestión inteligente para tu negocio.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition-colors">Twitter</a>
              <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
              <a href="#" className="hover:text-white transition-colors">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
