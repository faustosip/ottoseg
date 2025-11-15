"use client";

import { ClassicBulletinLayout } from "@/components/bulletin/classic-bulletin-layout";
import { ModernBulletinLayout } from "@/components/bulletin/modern-bulletin-layout";
import { DesignSwitcher, useDesignPreference } from "@/components/bulletin/design-switcher";
import type { BulletinData } from "@/components/bulletin/classic-bulletin-layout";

/**
 * Datos de ejemplo para demostración
 */
const EXAMPLE_BULLETIN: BulletinData = {
  date: new Date(),
  economia: {
    title: "Banco Central ajusta tasas de interés para controlar inflación",
    summary: "El Banco Central del Ecuador anunció un ajuste en las tasas de interés como medida para controlar la inflación que ha mostrado un incremento sostenido en los últimos meses. Esta decisión busca mantener la estabilidad económica del país y proteger el poder adquisitivo de los ciudadanos. Los expertos señalan que esta medida tendrá efectos en el corto plazo sobre los créditos hipotecarios y de consumo.",
    imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80",
    sourceUrl: "https://www.primicias.ec/economia",
  },
  politica: {
    title: "Asamblea Nacional debate nueva reforma tributaria",
    summary: "La Asamblea Nacional inició el debate de una nueva reforma tributaria que busca incrementar la recaudación fiscal sin afectar a los sectores más vulnerables. Los asambleístas de diferentes bancadas presentaron sus propuestas, mientras que organizaciones empresariales expresaron su preocupación por el posible impacto en la inversión. El proyecto contempla cambios en el impuesto a la renta y al valor agregado.",
    imageUrl: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&q=80",
    sourceUrl: "https://www.primicias.ec/politica",
  },
  sociedad: {
    title: "Ministerio de Educación anuncia programa de becas para estudiantes",
    summary: "El Ministerio de Educación lanzó un nuevo programa de becas destinado a estudiantes de escasos recursos que cursan la secundaria. La iniciativa beneficiará a más de 10,000 jóvenes a nivel nacional y contempla apoyo económico mensual, útiles escolares y acceso a plataformas digitales de aprendizaje. Las inscripciones estarán abiertas durante todo el mes.",
    imageUrl: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80",
    sourceUrl: "https://www.lahora.com.ec/sociedad",
  },
  seguridad: {
    title: "Policía Nacional refuerza operativos en zonas de alta criminalidad",
    summary: "La Policía Nacional intensificó los operativos de seguridad en barrios que han registrado un incremento en los índices delictivos durante las últimas semanas. Los uniformados realizan patrullajes permanentes y controles vehiculares para prevenir actos delincuenciales. Las autoridades hacen un llamado a la ciudadanía para colaborar reportando actividades sospechosas a través de las líneas de emergencia.",
    imageUrl: "https://images.unsplash.com/photo-1590622782014-c4675e2da6d4?w=800&q=80",
    sourceUrl: "https://www.ecu911.gob.ec/noticias",
  },
  internacional: {
    title: "Cumbre de presidentes latinoamericanos aborda crisis migratoria",
    summary: "Los mandatarios de varios países latinoamericanos se reunieron en una cumbre extraordinaria para discutir estrategias conjuntas frente a la crisis migratoria que afecta a la región. Los temas principales incluyeron la regularización de migrantes, la cooperación fronteriza y el desarrollo de programas sociales. Se espera que de esta reunión surjan acuerdos concretos para ser implementados en los próximos meses.",
    imageUrl: "https://images.unsplash.com/photo-1569098644584-210bcd375b59?w=800&q=80",
    sourceUrl: "https://www.elcomercio.com/internacional",
  },
  vial: {
    title: "Nuevas señalizaciones mejoran seguridad en principales avenidas",
    summary: "La Agencia Nacional de Tránsito implementó nuevas señalizaciones horizontales y verticales en las principales avenidas de la ciudad para mejorar la seguridad vial. El proyecto incluye la instalación de semáforos inteligentes, pasos peatonales elevados y cámaras de vigilancia. Las autoridades esperan reducir los accidentes de tránsito en un 30% durante el próximo año.",
    imageUrl: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&q=80",
    sourceUrl: "https://www.teleamazonas.com/vial",
  },
};

/**
 * Página de Boletines (Demo)
 *
 * Esta es una página temporal de demostración que muestra los layouts
 * clásico y moderno implementados en las Fases 4 y 5.
 */
export default function BoletinesPage() {
  const [design, setDesign] = useDesignPreference("classic");

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header de la página */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Boletines de Noticias
          </h1>
          <p className="text-gray-600">
            Vista previa de los diseños Clásico y Moderno
          </p>
        </div>

        {/* Design Switcher */}
        <div className="mb-8 flex justify-center">
          <DesignSwitcher
            currentDesign={design}
            onDesignChange={setDesign}
          />
        </div>

        {/* Renderizar el layout según la selección */}
        {design === "classic" ? (
          <ClassicBulletinLayout bulletin={EXAMPLE_BULLETIN} />
        ) : (
          <ModernBulletinLayout bulletin={EXAMPLE_BULLETIN} />
        )}
      </div>
    </div>
  );
}
