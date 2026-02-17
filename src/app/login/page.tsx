"use client";

import { useState } from "react";
import { signIn, signOut, useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Si ya tiene sesión, redirigir al dashboard
  if (session && !isPending) {
    router.replace("/dashboard");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Email y contraseña son requeridos");
      return;
    }

    setIsLoading(true);
    try {
      const result = await signIn.email({
        email: email.trim(),
        password,
        callbackURL: "/dashboard",
      });

      if (result.error) {
        setError("Credenciales incorrectas. Verifica tu email y contraseña.");
        return;
      }

      // Verificar si usuario está activo
      const meRes = await fetch("/api/admin/users/me");
      if (meRes.ok) {
        const meData = await meRes.json();
        if (!meData.isActive) {
          await signOut();
          setError("Tu cuenta ha sido desactivada. Contacta al administrador.");
          return;
        }
      }
    } catch {
      setError("Error al iniciar sesión. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-red-900 px-4">
      <Card className="w-full max-w-md p-8">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Image
            src="/logos/otto-logo.png"
            alt="OTTO Seguridad"
            width={180}
            height={72}
            className="h-16 w-auto"
            priority
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </div>

        <h1 className="text-2xl font-bold text-center mb-2">Iniciar Sesión</h1>
        <p className="text-sm text-muted-foreground text-center mb-6">
          Ingresa tus credenciales para acceder al sistema
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              autoComplete="email"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Iniciando sesión...
              </>
            ) : (
              "Iniciar Sesión"
            )}
          </Button>
        </form>

        <p className="text-xs text-muted-foreground text-center mt-6">
          Otto Seguridad &copy; {new Date().getFullYear()}
        </p>
      </Card>
    </div>
  );
}
