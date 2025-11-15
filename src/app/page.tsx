import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Newspaper, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <main className="flex-1">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Hero Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10">
                <Newspaper className="h-9 w-9 text-primary" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent">
              OttoSeguridad
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Tu resumen diario de noticias ecuatorianas, generado automáticamente cada mañana
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
            <Button asChild size="lg" className="min-w-[200px]">
              <Link href="/dashboard/bulletin">
                Ver Boletines
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="min-w-[200px]">
              <Link href="/dashboard">
                Dashboard
              </Link>
            </Button>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 text-left">
            <div className="p-6 border rounded-lg hover:border-primary/50 transition-colors">
              <h3 className="font-semibold text-lg mb-2">
                Generación Automática
              </h3>
              <p className="text-sm text-muted-foreground">
                Boletines generados diariamente a las 6:00 AM con las últimas noticias de Ecuador
              </p>
            </div>
            <div className="p-6 border rounded-lg hover:border-primary/50 transition-colors">
              <h3 className="font-semibold text-lg mb-2">
                6 Categorías
              </h3>
              <p className="text-sm text-muted-foreground">
                Noticias organizadas en Economía, Política, Sociedad, Seguridad, Internacional y Vial
              </p>
            </div>
            <div className="p-6 border rounded-lg hover:border-primary/50 transition-colors">
              <h3 className="font-semibold text-lg mb-2">
                Dos Diseños
              </h3>
              <p className="text-sm text-muted-foreground">
                Elige entre diseño clásico o moderno según tu preferencia con un solo clic
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
