import { db } from "@/lib/db";
import { subscribers } from "@/lib/schema";
import { eq } from "drizzle-orm";
import Image from "next/image";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function UnsubscribePage({ params }: PageProps) {
  const { token } = await params;

  // Verificar si el suscriptor existe
  const [subscriber] = await db
    .select()
    .from(subscribers)
    .where(eq(subscribers.unsubscribeToken, token))
    .limit(1);

  const found = !!subscriber;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <Image
          src="/logos/buho-seguridad.png"
          alt="OttoSeguridad"
          width={80}
          height={80}
          className="mx-auto mb-6"
        />

        {found ? (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              Te has desuscrito exitosamente
            </h1>
            <p className="text-gray-600 mb-6">
              Ya no recibirás los boletines diarios de OttoSeguridad.
            </p>
            <p className="text-sm text-gray-400">
              Si esto fue un error, contacta a{" "}
              <a
                href="mailto:informacion2@ottoseguridad.com.ec"
                className="text-blue-600 hover:underline"
              >
                informacion2@ottoseguridad.com.ec
              </a>
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              Enlace no válido
            </h1>
            <p className="text-gray-600">
              Este enlace de desuscripción no es válido o ya ha expirado.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
