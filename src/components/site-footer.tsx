export function SiteFooter() {
  return (
    <footer className="border-t py-6 text-center text-sm text-muted-foreground">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center space-y-2">
          <p>
            © {new Date().getFullYear()} OttoSeguridad. Todos los derechos reservados.
          </p>
          <p className="text-xs">
            Resumen diario de noticias ecuatorianas generado automáticamente
          </p>
        </div>
      </div>
    </footer>
  );
}
