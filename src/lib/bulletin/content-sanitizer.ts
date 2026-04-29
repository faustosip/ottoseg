/**
 * Sanitizador de contenido de noticias.
 *
 * El scraper a veces concatena al final de un articulo el contenido de "noticias
 * relacionadas" o "contenido patrocinado". Estas funciones detectan esos
 * marcadores y cortan el tail, ademas de estructurar el texto en parrafos
 * logicos.
 */

const SPAM_MARKERS = [
  "contenido patrocinado",
  "publicidad",
  "patrocinado",
  "tambien te puede interesar",
  "también te puede interesar",
  "tambien podria interesarte",
  "también podría interesarte",
  "te puede interesar",
  "lee tambien",
  "lee también",
  "noticias relacionadas",
  "mas noticias",
  "más noticias",
  "voces de la ciudad",
  "especialistas analizan",
  "test:",
  "lee aqui",
  "lee aquí",
  "suscribete a",
  "suscríbete a",
  "siguenos en",
  "síguenos en",
  "compartir en",
  "comparte esta nota",
];

/**
 * Corta el texto en el primer marcador de spam encontrado.
 */
export function stripSpamTail(text: string): string {
  if (!text) return "";

  let cutAt = text.length;
  const lower = text.toLowerCase();

  for (const marker of SPAM_MARKERS) {
    const idx = lower.indexOf(marker);
    if (idx !== -1 && idx < cutAt) {
      cutAt = idx;
    }
  }

  return text.slice(0, cutAt).trim().replace(/[\s,;:]+$/, "");
}

/**
 * Divide el texto en parrafos logicos.
 *
 * Estrategia:
 * 1. Si el texto ya tiene saltos de linea, respeta esa division.
 * 2. Si no, divide por oraciones y agrupa cada N oraciones en un parrafo.
 */
export function splitIntoParagraphs(
  text: string,
  sentencesPerParagraph = 3,
): string[] {
  if (!text) return [];

  const byLineBreak = text
    .split(/\n{2,}|\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (byLineBreak.length > 1) {
    return byLineBreak;
  }

  const sentenceRegex = /[^.!?]+[.!?]+(?:\s|$)/g;
  const matches = text.match(sentenceRegex);
  const sentences = matches
    ? matches.map((s) => s.trim()).filter(Boolean)
    : [text.trim()];

  if (sentences.length <= sentencesPerParagraph) {
    return [sentences.join(" ")];
  }

  const paragraphs: string[] = [];
  for (let i = 0; i < sentences.length; i += sentencesPerParagraph) {
    paragraphs.push(sentences.slice(i, i + sentencesPerParagraph).join(" "));
  }

  return paragraphs;
}

/**
 * Cuenta palabras aproximadas.
 */
export function wordCount(text: string): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).length;
}

/**
 * Pipeline completo: sanitiza + divide en parrafos.
 */
export function processArticleBody(text: string): {
  paragraphs: string[];
  totalWords: number;
} {
  const cleaned = stripSpamTail(text);
  const paragraphs = splitIntoParagraphs(cleaned);
  const totalWords = wordCount(cleaned);
  return { paragraphs, totalWords };
}
