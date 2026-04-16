"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronRight,
  BookOpen,
  LogIn,
  LayoutDashboard,
  Newspaper,
  Plus,
  Eye,
  Send,
  Settings,
  Users,
  Tag,
  Rss,
  FileText,
  Shield,
  Video,
  ArrowUp,
  Menu,
  X,
} from "lucide-react";

const sections = [
  { id: "intro", label: "Introduccion", icon: BookOpen },
  { id: "login", label: "Inicio de Sesion", icon: LogIn },
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "boletines", label: "Boletines", icon: Newspaper },
  { id: "generar", label: "Generar Boletin", icon: Plus },
  { id: "detalle", label: "Detalle del Boletin", icon: FileText },
  { id: "noticias", label: "Tab Noticias", icon: Rss },
  { id: "editar", label: "Tab Editar", icon: Settings },
  { id: "auditoria", label: "Tab Auditoria", icon: Shield },
  { id: "publicar", label: "Autorizar y Publicar", icon: Send },
  { id: "vista-publica", label: "Vista Publica", icon: Eye },
  { id: "fuentes", label: "Fuentes", icon: Rss },
  { id: "suscriptores", label: "Suscriptores", icon: Users },
  { id: "categorias", label: "Categorias", icon: Tag },
  { id: "usuarios", label: "Usuarios", icon: Users },
  { id: "email", label: "Envio de Correos", icon: Send },
  { id: "video", label: "Video Tutorial", icon: Video },
];

function ScreenshotImg({
  src,
  alt,
  caption,
}: {
  src: string;
  alt: string;
  caption?: string;
}) {
  return (
    <figure className="my-6">
      <div className="border border-gray-200 rounded-lg overflow-hidden shadow-md">
        <Image
          src={src}
          alt={alt}
          width={1440}
          height={900}
          className="w-full h-auto"
          unoptimized
        />
      </div>
      {caption && (
        <figcaption className="text-sm text-gray-500 mt-2 text-center italic">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

function StepBox({
  number,
  children,
}: {
  number: number;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4 my-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-sm">
        {number}
      </div>
      <div className="flex-1 pt-0.5">{children}</div>
    </div>
  );
}

function SectionTitle({
  id,
  icon: Icon,
  children,
}: {
  id: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <h2
      id={id}
      className="text-2xl font-bold text-gray-900 mt-12 mb-4 pb-3 border-b-2 border-red-600 flex items-center gap-3 scroll-mt-20"
    >
      <div className="p-2 bg-red-50 rounded-lg">
        <Icon className="h-6 w-6 text-red-600" />
      </div>
      {children}
    </h2>
  );
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 my-4 rounded-r-lg">
      <p className="text-sm text-blue-800">{children}</p>
    </div>
  );
}

function WarningBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-amber-50 border-l-4 border-amber-500 p-4 my-4 rounded-r-lg">
      <p className="text-sm text-amber-800">{children}</p>
    </div>
  );
}

export function ManualContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-red-900 text-white py-8 px-6 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-white/10 rounded-lg"
            >
              {sidebarOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <BookOpen className="h-7 w-7" />
                Manual de Usuario - OttoSeguridad
              </h1>
              <p className="text-red-200 text-sm mt-1">
                Guia completa del sistema de boletines de seguridad
              </p>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="hidden sm:flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm transition-colors"
          >
            <LayoutDashboard className="h-4 w-4" />
            Volver al Dashboard
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex">
        {/* Sidebar - Table of Contents */}
        <aside
          className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 fixed lg:sticky top-[88px] left-0 w-72 h-[calc(100vh-88px)] overflow-y-auto bg-gray-50 border-r border-gray-200 p-4 transition-transform z-40 lg:z-0`}
        >
          <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wider">
            Contenido
          </h3>
          <nav className="space-y-1">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors group"
                >
                  <Icon className="h-4 w-4 text-gray-400 group-hover:text-red-500" />
                  <span>{section.label}</span>
                  <ChevronRight className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              );
            })}
          </nav>
        </aside>

        {/* Overlay for mobile sidebar */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/30 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 px-6 py-8 lg:px-12 max-w-4xl">
          {/* ============================================ */}
          {/* INTRODUCCION */}
          {/* ============================================ */}
          <SectionTitle id="intro" icon={BookOpen}>
            Introduccion al Sistema
          </SectionTitle>
          <p className="text-gray-700 leading-relaxed">
            <strong>OttoSeguridad</strong> es una plataforma de generacion
            automatizada de boletines de noticias de seguridad para Ecuador. El
            sistema recopila noticias de multiples fuentes periodisticas
            ecuatorianas, las clasifica mediante inteligencia artificial, genera
            resumenes y permite su distribucion por correo electronico a
            suscriptores.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h4 className="font-semibold text-gray-900 mb-2">
                Recopilacion Automatica
              </h4>
              <p className="text-sm text-gray-600">
                Noticias de Primicias, La Hora, El Comercio, Teleamazonas y
                ECU911
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h4 className="font-semibold text-gray-900 mb-2">
                Clasificacion con IA
              </h4>
              <p className="text-sm text-gray-600">
                Categorizacion automatica en Economia, Politica, Sociedad,
                Seguridad, Internacional y Vial
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h4 className="font-semibold text-gray-900 mb-2">
                Distribucion por Email
              </h4>
              <p className="text-sm text-gray-600">
                Envio masivo a suscriptores con seguimiento de apertura y clicks
              </p>
            </div>
          </div>

          {/* ============================================ */}
          {/* LOGIN */}
          {/* ============================================ */}
          <SectionTitle id="login" icon={LogIn}>
            Inicio de Sesion
          </SectionTitle>
          <p className="text-gray-700 leading-relaxed">
            Para acceder al sistema, ingrese a{" "}
            <code className="bg-gray-100 px-2 py-1 rounded text-red-600 text-sm">
              app.ottoseguridadai.com
            </code>{" "}
            y utilice sus credenciales de acceso.
          </p>
          <StepBox number={1}>
            <p className="text-gray-700">
              Abra su navegador y vaya a la URL del sistema. Vera la pantalla de
              inicio de sesion.
            </p>
          </StepBox>
          <ScreenshotImg
            src="/manual/screenshots/01-login.png"
            alt="Pantalla de inicio de sesion"
            caption="Pantalla de inicio de sesion de OttoSeguridad"
          />
          <StepBox number={2}>
            <p className="text-gray-700">
              Ingrese su <strong>correo electronico</strong> y{" "}
              <strong>contrasena</strong> proporcionados por el administrador.
            </p>
          </StepBox>
          <ScreenshotImg
            src="/manual/screenshots/02-login-filled.png"
            alt="Login con credenciales"
            caption="Ingreso de credenciales de acceso"
          />
          <StepBox number={3}>
            <p className="text-gray-700">
              Haga clic en <strong>&quot;Iniciar Sesion&quot;</strong>. Sera
              redirigido al Dashboard principal.
            </p>
          </StepBox>
          <InfoBox>
            Si su cuenta ha sido desactivada por el administrador, recibira un
            mensaje de error. Contacte al administrador para reactivar su
            cuenta.
          </InfoBox>

          {/* ============================================ */}
          {/* DASHBOARD */}
          {/* ============================================ */}
          <SectionTitle id="dashboard" icon={LayoutDashboard}>
            Dashboard Ejecutivo
          </SectionTitle>
          <p className="text-gray-700 leading-relaxed">
            El Dashboard es la pantalla principal del sistema. Muestra
            indicadores clave de rendimiento (KPIs), graficos de tendencias y la
            actividad reciente.
          </p>
          <ScreenshotImg
            src="/manual/screenshots/03-dashboard.png"
            alt="Dashboard ejecutivo"
            caption="Dashboard ejecutivo con KPIs, graficos y actividad reciente"
          />
          <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">
            Indicadores KPI
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
              <div>
                <p className="font-medium text-gray-900">
                  Boletines Publicados
                </p>
                <p className="text-sm text-gray-600">
                  Total de boletines que han sido autorizados y publicados
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
              <div>
                <p className="font-medium text-gray-900">
                  Suscriptores Activos
                </p>
                <p className="text-sm text-gray-600">
                  Cantidad de suscriptores que reciben los boletines
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-orange-500 mt-2" />
              <div>
                <p className="font-medium text-gray-900">Tasa de Apertura</p>
                <p className="text-sm text-gray-600">
                  Porcentaje de emails abiertos vs enviados
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-purple-500 mt-2" />
              <div>
                <p className="font-medium text-gray-900">
                  Noticias Procesadas
                </p>
                <p className="text-sm text-gray-600">
                  Total de noticias recopiladas y clasificadas
                </p>
              </div>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">
            Graficos Disponibles
          </h3>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>
              <strong>Boletines por Semana:</strong> Tendencia de generacion de
              boletines
            </li>
            <li>
              <strong>Emails Enviados vs Abiertos:</strong> Efectividad de las
              campanas de email
            </li>
            <li>
              <strong>Noticias por Categoria:</strong> Distribucion de noticias
              (Economia, Politica, etc.)
            </li>
            <li>
              <strong>Articulos por Fuente:</strong> Volumen de noticias por
              cada fuente periodistica
            </li>
          </ul>
          <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">
            Actividad Reciente
          </h3>
          <p className="text-gray-700">
            En la seccion inferior del Dashboard se muestra un registro de las
            acciones recientes: autorizaciones, publicaciones, envios de email y
            eliminaciones con fecha, hora y usuario responsable.
          </p>

          {/* ============================================ */}
          {/* MENU NAVEGACION */}
          {/* ============================================ */}
          <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-3">
            Menu de Navegacion
          </h3>
          <ScreenshotImg
            src="/manual/screenshots/19-menu-navegacion.png"
            alt="Menu de navegacion"
            caption="Barra de navegacion superior con todos los modulos del sistema"
          />
          <p className="text-gray-700">
            El menu superior permite acceder a todos los modulos del sistema:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3">
            {[
              { name: "Boletines", desc: "Gestion de boletines diarios" },
              { name: "Fuentes", desc: "Configuracion de fuentes de noticias" },
              { name: "Suscriptores", desc: "Gestion de lista de correos" },
              { name: "Categorias", desc: "Categorias de clasificacion" },
              { name: "Usuarios", desc: "Administracion de usuarios" },
              { name: "Dashboard", desc: "Panel de indicadores" },
            ].map((item) => (
              <div
                key={item.name}
                className="p-3 bg-gray-50 rounded-lg border text-sm"
              >
                <p className="font-semibold text-gray-900">{item.name}</p>
                <p className="text-gray-500 text-xs">{item.desc}</p>
              </div>
            ))}
          </div>
          <InfoBox>
            El administrador puede configurar que menus ve cada usuario. Si no
            ve alguno de estos menus, contacte al administrador para solicitar
            acceso.
          </InfoBox>

          {/* ============================================ */}
          {/* BOLETINES */}
          {/* ============================================ */}
          <SectionTitle id="boletines" icon={Newspaper}>
            Lista de Boletines
          </SectionTitle>
          <p className="text-gray-700 leading-relaxed">
            La seccion de Boletines muestra todos los boletines generados en
            orden cronologico (mas recientes primero). Cada tarjeta muestra la
            fecha, estado, cantidad de noticias y categorias cubiertas.
          </p>
          <ScreenshotImg
            src="/manual/screenshots/04-boletines-lista.png"
            alt="Lista de boletines"
            caption="Vista general de todos los boletines generados"
          />
          <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">
            Estados de un Boletin
          </h3>
          <div className="space-y-2">
            {[
              {
                status: "Borrador",
                color: "bg-gray-200 text-gray-700",
                desc: "Recien creado, en proceso de recopilacion",
              },
              {
                status: "Listo",
                color: "bg-blue-100 text-blue-700",
                desc: "Noticias clasificadas y resumenes generados",
              },
              {
                status: "Autorizado",
                color: "bg-green-100 text-green-700",
                desc: "Aprobado por un administrador",
              },
              {
                status: "Publicado",
                color: "bg-green-200 text-green-800",
                desc: "Disponible publicamente y enviado",
              },
              {
                status: "Fallido",
                color: "bg-red-100 text-red-700",
                desc: "Error durante la generacion",
              },
            ].map((item) => (
              <div key={item.status} className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${item.color}`}
                >
                  {item.status}
                </span>
                <span className="text-sm text-gray-600">{item.desc}</span>
              </div>
            ))}
          </div>

          {/* ============================================ */}
          {/* GENERAR BOLETIN */}
          {/* ============================================ */}
          <SectionTitle id="generar" icon={Plus}>
            Generar Nuevo Boletin
          </SectionTitle>
          <p className="text-gray-700 leading-relaxed">
            Para generar un nuevo boletin diario, haga clic en el boton{" "}
            <strong>&quot;Generar Nuevo Boletin&quot;</strong> en la esquina
            superior derecha de la lista de boletines.
          </p>
          <ScreenshotImg
            src="/manual/screenshots/05-generar-boletin.png"
            alt="Generar boletin"
            caption="Pantalla de generacion de un nuevo boletin"
          />
          <WarningBox>
            Solo se puede generar un boletin por dia. Si ya existe un boletin
            para la fecha actual, el boton estara deshabilitado.
          </WarningBox>
          <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">
            Proceso de Generacion (Pipeline)
          </h3>
          <div className="space-y-4">
            <StepBox number={1}>
              <p className="text-gray-700">
                <strong>Recopilacion (Scraping):</strong> El sistema visita
                automaticamente las fuentes configuradas y extrae las noticias
                del dia.
              </p>
            </StepBox>
            <StepBox number={2}>
              <p className="text-gray-700">
                <strong>Clasificacion (IA):</strong> La inteligencia artificial
                analiza cada noticia y la asigna a una categoria (Economia,
                Politica, Sociedad, Seguridad, Internacional, Vial).
              </p>
            </StepBox>
            <StepBox number={3}>
              <p className="text-gray-700">
                <strong>Resumen (IA):</strong> Se generan resumenes concisos de
                las noticias mas relevantes de cada categoria.
              </p>
            </StepBox>
          </div>
          <InfoBox>
            El proceso completo toma entre 3-8 minutos dependiendo de la
            cantidad de noticias. No cierre la ventana durante la generacion.
          </InfoBox>

          {/* ============================================ */}
          {/* DETALLE BOLETIN */}
          {/* ============================================ */}
          <SectionTitle id="detalle" icon={FileText}>
            Detalle del Boletin
          </SectionTitle>
          <p className="text-gray-700 leading-relaxed">
            Al hacer clic en un boletin de la lista, accede a su vista
            detallada. Aqui puede ver los resumenes, las noticias originales,
            editar contenido, revisar la auditoria y gestionar la publicacion.
          </p>
          <ScreenshotImg
            src="/manual/screenshots/06-boletin-detalle.png"
            alt="Detalle del boletin"
            caption="Vista de detalle de un boletin con tabs y botones de accion"
          />
          <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">
            Botones de Accion
          </h3>
          <div className="space-y-2">
            {[
              {
                btn: "Reactivar Boletin",
                desc: "Permite regenerar el procesamiento del boletin",
              },
              {
                btn: "Enviar Prueba",
                desc: "Envia un email de prueba al administrador antes del envio masivo",
              },
              {
                btn: "Compartir Link Publico",
                desc: "Genera un enlace publico para compartir el boletin (solo si esta autorizado/publicado)",
              },
              {
                btn: "Eliminar",
                desc: "Elimina el boletin permanentemente (con confirmacion)",
              },
            ].map((item) => (
              <div key={item.btn} className="flex items-start gap-3 text-sm">
                <code className="bg-gray-100 px-2 py-1 rounded text-red-600 whitespace-nowrap">
                  {item.btn}
                </code>
                <span className="text-gray-600">{item.desc}</span>
              </div>
            ))}
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">
            Tab: Resumenes
          </h3>
          <p className="text-gray-700">
            Muestra el boletin con los resumenes generados por IA. Puede
            alternar entre dos disenos: <strong>Clasico</strong> (formato
            tradicional de newsletter) y <strong>Moderno</strong> (tarjetas con
            gradientes).
          </p>
          <ScreenshotImg
            src="/manual/screenshots/07-tab-resumenes.png"
            alt="Tab resumenes"
            caption="Tab de resumenes con selector de diseno Clasico/Moderno"
          />

          {/* ============================================ */}
          {/* TAB NOTICIAS */}
          {/* ============================================ */}
          <SectionTitle id="noticias" icon={Rss}>
            Tab: Noticias
          </SectionTitle>
          <p className="text-gray-700 leading-relaxed">
            Esta pestana muestra todas las noticias recopiladas, organizadas por
            fuente. Cada noticia tiene un checkbox que indica si fue
            seleccionada para el boletin. Puede ver el total de noticias, las
            seleccionadas y las fuentes consultadas.
          </p>
          <ScreenshotImg
            src="/manual/screenshots/08-tab-noticias.png"
            alt="Tab noticias"
            caption="Noticias organizadas por fuente con contadores y checkboxes"
          />
          <p className="text-gray-700 mt-3">
            Las fuentes se muestran como pestanas secundarias:{" "}
            <strong>La Hora, Primicias, El Comercio, Teleamazonas, ECU911</strong>.
            Haga clic en cada fuente para ver sus noticias.
            Cada noticia incluye titulo, descripcion, fecha y un enlace{" "}
            <strong>&quot;Ver original&quot;</strong> para abrir la noticia en su
            fuente original.
          </p>

          {/* ============================================ */}
          {/* TAB EDITAR */}
          {/* ============================================ */}
          <SectionTitle id="editar" icon={Settings}>
            Tab: Editar
          </SectionTitle>
          <p className="text-gray-700 leading-relaxed">
            En esta pestana puede editar los resumenes generados por la IA,
            agregar noticias manualmente y modificar el contenido antes de
            autorizar el boletin. Los cambios se guardan automaticamente.
          </p>
          <ScreenshotImg
            src="/manual/screenshots/09-tab-editar.png"
            alt="Tab editar"
            caption="Interfaz de edicion del boletin con campos editables por categoria"
          />
          <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">
            Agregar Noticias Manualmente
          </h3>
          <p className="text-gray-700">
            Si desea agregar una noticia que no fue recopilada automaticamente,
            use el formulario de <strong>&quot;Agregar noticia manual&quot;</strong>.
            Complete el titulo, resumen, URL de la fuente y seleccione la
            categoria correspondiente.
          </p>

          {/* ============================================ */}
          {/* TAB AUDITORIA */}
          {/* ============================================ */}
          <SectionTitle id="auditoria" icon={Shield}>
            Tab: Auditoria
          </SectionTitle>
          <p className="text-gray-700 leading-relaxed">
            El registro de auditoria muestra un historial cronologico de todas
            las acciones realizadas sobre el boletin: quien lo autorizo, quien
            lo publico, cuando se envio el email y cualquier eliminacion.
          </p>
          <ScreenshotImg
            src="/manual/screenshots/10-tab-auditoria.png"
            alt="Tab auditoria"
            caption="Registro de auditoria mostrando acciones, usuarios y fechas"
          />
          <p className="text-gray-700 mt-3">
            Cada entrada muestra:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-700 mt-2">
            <li>
              <strong>Tipo de accion:</strong> Autorizado, Publicado, Email
              Enviado, Eliminado
            </li>
            <li>
              <strong>Usuario:</strong> Nombre y correo del responsable
            </li>
            <li>
              <strong>Fecha y hora:</strong> Momento exacto de la accion
            </li>
          </ul>

          {/* ============================================ */}
          {/* AUTORIZAR Y PUBLICAR */}
          {/* ============================================ */}
          <SectionTitle id="publicar" icon={Send}>
            Autorizar y Publicar
          </SectionTitle>
          <p className="text-gray-700 leading-relaxed">
            El flujo de publicacion de un boletin sigue estos pasos:
          </p>
          <div className="flex flex-wrap items-center gap-2 my-6 justify-center">
            {[
              "Borrador",
              "Listo",
              "Autorizado",
              "Publicado",
              "Email Enviado",
            ].map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                <span
                  className={`px-3 py-2 rounded-lg text-sm font-medium ${
                    i === 4
                      ? "bg-green-600 text-white"
                      : i === 3
                        ? "bg-green-100 text-green-800"
                        : i === 2
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {step}
                </span>
                {i < 4 && (
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                )}
              </div>
            ))}
          </div>
          <StepBox number={1}>
            <p className="text-gray-700">
              <strong>Autorizar:</strong> Revise el contenido del boletin en la
              tab &quot;Resumenes&quot;. Si todo esta correcto, haga clic en{" "}
              <strong>&quot;Autorizar&quot;</strong>. Esto registra en la
              auditoria quien aprobo el boletin.
            </p>
          </StepBox>
          <StepBox number={2}>
            <p className="text-gray-700">
              <strong>Publicar:</strong> Una vez autorizado, haga clic en{" "}
              <strong>&quot;Publicar&quot;</strong>. Esto genera el enlace
              publico del boletin.
            </p>
          </StepBox>
          <StepBox number={3}>
            <p className="text-gray-700">
              <strong>Enviar Prueba:</strong> Antes del envio masivo, envie un
              email de prueba con <strong>&quot;Enviar Prueba&quot;</strong> para
              verificar como se ve el correo.
            </p>
          </StepBox>
          <StepBox number={4}>
            <p className="text-gray-700">
              <strong>Enviar a Suscriptores:</strong> Finalmente, envie el
              boletin a todos los suscriptores registrados. El sistema rastrea
              las aperturas y los clicks.
            </p>
          </StepBox>
          <WarningBox>
            Una vez enviado el email a suscriptores, el boletin no se puede
            eliminar para mantener la integridad del registro de auditoria.
          </WarningBox>

          {/* ============================================ */}
          {/* VISTA PUBLICA */}
          {/* ============================================ */}
          <SectionTitle id="vista-publica" icon={Eye}>
            Vista Publica del Boletin
          </SectionTitle>
          <p className="text-gray-700 leading-relaxed">
            Los boletines publicados tienen una vista publica accesible sin
            necesidad de iniciar sesion. Esta vista tiene un diseno de 3
            columnas: Video (izquierda), Noticias por categoria (centro) y
            Ultima Hora (derecha).
          </p>
          <ScreenshotImg
            src="/manual/screenshots/17-vista-publica.png"
            alt="Vista publica"
            caption="Vista publica del boletin con layout de 3 columnas"
          />
          <p className="text-gray-700 mt-3">
            Para compartir un boletin, use el boton{" "}
            <strong>&quot;Compartir Link Publico&quot;</strong> en la vista de
            detalle. El enlace se copiara al portapapeles y podra compartirlo
            por cualquier medio.
          </p>

          {/* ============================================ */}
          {/* FUENTES */}
          {/* ============================================ */}
          <SectionTitle id="fuentes" icon={Rss}>
            Configuracion de Fuentes
          </SectionTitle>
          <p className="text-gray-700 leading-relaxed">
            En la seccion de <strong>Fuentes</strong> se configuran los sitios
            web de donde el sistema recopila noticias automaticamente. Las
            fuentes actuales incluyen los principales medios ecuatorianos.
          </p>
          <ScreenshotImg
            src="/manual/screenshots/13-fuentes.png"
            alt="Fuentes de noticias"
            caption="Configuracion de fuentes de noticias del sistema"
          />
          <InfoBox>
            La configuracion de fuentes es una tarea avanzada. Solo modifique
            estos valores si sabe lo que esta haciendo o bajo instrucciones del
            equipo tecnico.
          </InfoBox>

          {/* ============================================ */}
          {/* SUSCRIPTORES */}
          {/* ============================================ */}
          <SectionTitle id="suscriptores" icon={Users}>
            Gestion de Suscriptores
          </SectionTitle>
          <p className="text-gray-700 leading-relaxed">
            La seccion de Suscriptores permite gestionar la lista de correos
            electronicos que reciben los boletines. Puede agregar, editar y
            eliminar suscriptores individualmente o importarlos masivamente
            desde un archivo CSV.
          </p>
          <ScreenshotImg
            src="/manual/screenshots/14-suscriptores.png"
            alt="Suscriptores"
            caption="Gestion de suscriptores de email"
          />
          <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">
            Funciones Disponibles
          </h3>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>
              <strong>Agregar suscriptor:</strong> Ingrese nombre y correo
              electronico
            </li>
            <li>
              <strong>Importar CSV:</strong> Cargue un archivo CSV con columnas
              &quot;name&quot; y &quot;email&quot;
            </li>
            <li>
              <strong>Exportar:</strong> Descargue la lista completa en formato
              CSV
            </li>
            <li>
              <strong>Eliminar:</strong> Remueva suscriptores individuales
            </li>
          </ul>
          <InfoBox>
            Los suscriptores pueden desuscribirse automaticamente a traves del
            enlace incluido en cada correo electronico.
          </InfoBox>

          {/* ============================================ */}
          {/* CATEGORIAS */}
          {/* ============================================ */}
          <SectionTitle id="categorias" icon={Tag}>
            Gestion de Categorias
          </SectionTitle>
          <p className="text-gray-700 leading-relaxed">
            Las categorias determinan como se clasifican las noticias. Puede
            crear nuevas categorias, editar las existentes y reordenarlas
            arrastrando las tarjetas.
          </p>
          <ScreenshotImg
            src="/manual/screenshots/15-categorias.png"
            alt="Categorias"
            caption="Gestion de categorias de noticias"
          />
          <p className="text-gray-700 mt-3">
            Las categorias predeterminadas son:{" "}
            <strong>
              Economia, Politica, Sociedad, Seguridad, Internacional y Vial
            </strong>
            . La IA utilizara estas categorias para clasificar automaticamente
            las noticias recopiladas.
          </p>

          {/* ============================================ */}
          {/* USUARIOS */}
          {/* ============================================ */}
          <SectionTitle id="usuarios" icon={Users}>
            Administracion de Usuarios
          </SectionTitle>
          <p className="text-gray-700 leading-relaxed">
            La seccion de Usuarios permite al administrador gestionar las
            cuentas de acceso al sistema. Puede crear nuevos usuarios, cambiar
            contrasenas, activar/desactivar cuentas y asignar permisos de menu.
          </p>
          <ScreenshotImg
            src="/manual/screenshots/16-usuarios.png"
            alt="Usuarios"
            caption="Panel de administracion de usuarios"
          />
          <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">
            Funciones de Administracion
          </h3>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>
              <strong>Crear usuario:</strong> Defina nombre, email y contrasena
              para un nuevo usuario
            </li>
            <li>
              <strong>Cambiar contrasena:</strong> Restablezca la contrasena de
              cualquier usuario
            </li>
            <li>
              <strong>Activar/Desactivar:</strong> Las cuentas desactivadas no
              pueden iniciar sesion
            </li>
            <li>
              <strong>Permisos de menu:</strong> Controle que secciones del
              sistema puede ver cada usuario
            </li>
          </ul>
          <WarningBox>
            Los cambios en permisos se aplican inmediatamente. El usuario
            afectado vera los cambios la proxima vez que cargue la pagina.
          </WarningBox>

          {/* ============================================ */}
          {/* EMAIL */}
          {/* ============================================ */}
          <SectionTitle id="email" icon={Send}>
            Envio de Correos Electronicos
          </SectionTitle>
          <p className="text-gray-700 leading-relaxed">
            El sistema envia boletines por correo electronico a todos los
            suscriptores registrados. Los correos incluyen el contenido completo
            del boletin con un diseno profesional.
          </p>
          <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">
            Proceso de Envio
          </h3>
          <StepBox number={1}>
            <p className="text-gray-700">
              Asegurese de que el boletin este en estado{" "}
              <strong>Autorizado</strong> o <strong>Publicado</strong>.
            </p>
          </StepBox>
          <StepBox number={2}>
            <p className="text-gray-700">
              Haga clic en <strong>&quot;Enviar Prueba&quot;</strong> para recibir
              un email de prueba en su correo y verificar el contenido.
            </p>
          </StepBox>
          <StepBox number={3}>
            <p className="text-gray-700">
              Si la prueba se ve bien, haga clic en{" "}
              <strong>&quot;Enviar a Suscriptores&quot;</strong> para distribuir
              el boletin a toda la lista.
            </p>
          </StepBox>
          <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">
            Seguimiento de Emails
          </h3>
          <p className="text-gray-700">
            El sistema rastrea automaticamente:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-700 mt-2">
            <li>
              <strong>Aperturas:</strong> Cuantos destinatarios abrieron el
              email
            </li>
            <li>
              <strong>Clicks:</strong> Cuantos hicieron clic en los enlaces de
              noticias
            </li>
          </ul>
          <p className="text-gray-700 mt-3">
            Estos datos se reflejan en el Dashboard ejecutivo en los graficos de
            &quot;Emails Enviados vs Abiertos&quot; y en la &quot;Tasa de
            Apertura&quot;.
          </p>

          {/* ============================================ */}
          {/* VIDEO TUTORIAL */}
          {/* ============================================ */}
          <SectionTitle id="video" icon={Video}>
            Video Tutorial
          </SectionTitle>
          <p className="text-gray-700 leading-relaxed mb-6">
            A continuacion puede ver un video tutorial que demuestra el uso
            completo del sistema OttoSeguridad:
          </p>
          <div className="border border-gray-200 rounded-lg overflow-hidden shadow-lg">
            <video
              controls
              className="w-full"
              poster="/manual/screenshots/03-dashboard.png"
              preload="metadata"
            >
              <source src="/manual/video-tutorial.mp4" type="video/mp4" />
              Su navegador no soporta la reproduccion de video.
            </video>
          </div>
          <p className="text-sm text-gray-500 mt-2 text-center italic">
            Video tutorial del sistema OttoSeguridad
          </p>

          {/* ============================================ */}
          {/* FOOTER */}
          {/* ============================================ */}
          <div className="mt-16 pt-8 border-t border-gray-200">
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <p className="text-gray-600 text-sm">
                <strong>Manual de Usuario - OttoSeguridad</strong>
              </p>
              <p className="text-gray-500 text-xs mt-1">
                Version 1.0 | Ultima actualizacion: Abril 2026
              </p>
              <p className="text-gray-500 text-xs mt-1">
                Para soporte tecnico, contacte al administrador del sistema.
              </p>
            </div>
          </div>
        </main>
      </div>

      {/* Scroll to top button */}
      <button
        onClick={scrollToTop}
        className="fixed bottom-6 right-6 bg-red-600 text-white p-3 rounded-full shadow-lg hover:bg-red-700 transition-colors z-50"
        title="Volver arriba"
      >
        <ArrowUp className="h-5 w-5" />
      </button>
    </div>
  );
}
