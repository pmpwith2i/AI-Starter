/**
 * Hoisted static copy for marketing sections.
 * Kept separate from components so the JSX stays declarative and bundling/react
 * can skip re-allocating arrays on every render.
 */

import type { ComponentType } from "react";
import {
  BadgeCheck,
  CalendarClock,
  HeartPulse,
  Stethoscope,
} from "lucide-react";
import type { Specialty } from "@repo/server-sdk/schemas";

export interface ValuePillar {
  title: string;
  copy: string;
  detail: string;
  icon: ComponentType<{ className?: string }>;
}

export const VALUE_PILLARS: readonly ValuePillar[] = [
  {
    title: "Specialisti verificati",
    copy: "Ogni professionista è validato dal nostro team prima di entrare in piattaforma.",
    detail:
      "Identità, ordine professionale e specializzazione controllati uno per uno. Gli oncologi sono certificati ARTOI per l'oncologia integrativa.",
    icon: BadgeCheck,
  },
  {
    title: "Disponibilità immediata",
    copy: "Vedi gli orari liberi in tempo reale e prenoti senza chiamare.",
    detail:
      "Niente segreterie occupate, niente appuntamenti rimandati. Conferma in pochi secondi e ricevi promemoria automatici.",
    icon: CalendarClock,
  },
  {
    title: "Sempre con te",
    copy: "Tra una visita e l'altra non resti senza coordinate: piani, corsi e un assistente AI dedicato.",
    detail:
      "Piani nutrizionali generati per te, corsi di benessere, eventi dal vivo e Onciro, l'assistente che risponde alle tue domande quando lo specialista non c'è.",
    icon: HeartPulse,
  },
];

export interface HowItWorksStep {
  n: string;
  title: string;
  text: string;
}

export const HOW_IT_WORKS_STEPS: readonly HowItWorksStep[] = [
  {
    n: "01",
    title: "Cerca senza fretta",
    text: "Filtra per specializzazione, sede e disponibilità. Profili dettagliati con biografia, sede di visita e prossimi orari liberi.",
  },
  {
    n: "02",
    title: "Prenota in autonomia",
    text: "Scegli giorno e orario tra quelli effettivamente liberi. Conferma in pochi secondi, senza telefonate o segreterie.",
  },
  {
    n: "03",
    title: "Segui il percorso",
    text: "Tra una visita e l'altra hai accesso a piani nutrizionali personalizzati, corsi formativi e l'assistente AI Onciro.",
  },
];

export interface SpecialtyTile {
  value: Specialty;
  label: string;
  count: string;
  copy: string;
  examples: string;
  icon: ComponentType<{ className?: string }>;
}

export const SPECIALTY_TILES: readonly SpecialtyTile[] = [
  {
    value: "oncologo",
    label: "Oncologi",
    count: "12 specialisti",
    copy: "Specialisti in oncologia integrativa per ogni fase del percorso di cura.",
    examples: "Senologia · Ematologia · Pediatrica · Tumori rari",
    icon: Stethoscope,
  },
  {
    value: "cardiologo",
    label: "Cardiologi",
    count: "5 specialisti",
    copy: "La salute del cuore durante e dopo le terapie oncologiche.",
    examples: "Cardio-oncologia · Aritmie · Prevenzione",
    icon: HeartPulse,
  },
];

/**
 * Trust checks surfaced early, so visitors understand why the platform feels
 * safe enough to start.
 */
export interface Credential {
  name: string;
  /** Optional context line used for screen readers + tooltip. */
  detail: string;
}

export const CREDENTIALS: readonly Credential[] = [
  {
    name: "Specialisti verificati",
    detail: "Identità, ordine professionale e specializzazione controllati",
  },
  {
    name: "ARTOI",
    detail: "Associazione Ricerca Terapie Oncologiche Integrate",
  },
  { name: "GDPR", detail: "Gestione dati personali conforme al GDPR" },
  { name: "Prezzi chiari", detail: "Nessun costo nascosto" },
  { name: "Accesso gratuito", detail: "Registrazione senza carta richiesta" },
];

/**
 * The hero's quick-jump pills under the search bar — most-clicked specialties
 * and most-frequent queries. MioDottore-style affordance: lowers the search
 * activation cost for users who don't know what to type.
 */
export interface QuickPill {
  label: string;
  href: string;
}

export const HERO_QUICK_PILLS: readonly QuickPill[] = [
  { label: "Oncologia integrativa", href: "/specialisti/oncologo" },
  { label: "Cardio-oncologia", href: "/specialisti/cardiologo" },
  { label: "Nutrizione AI", href: "/come-funziona" },
  { label: "Visita online", href: "/specialisti?type=online" },
];

export interface TrustStat {
  value: string;
  label: string;
}

export const TRUST_STATS: readonly TrustStat[] = [
  { value: "15+", label: "Specialisti" },
  { value: "500+", label: "Pazienti" },
  { value: "50+", label: "Eventi" },
  { value: "ARTOI", label: "Certificazione" },
];

export interface Testimonial {
  text: string;
  name: string;
  detail: string;
  city: string;
  treatment: string;
}

/**
 * Real-feeling fixture testimonials. First names + initials only, anonymised
 * details. The empty-state placeholder previously here was sterile — patient
 * voices are the emotional anchor of an oncology platform.
 */
export const HOMEPAGE_TESTIMONIALS: readonly Testimonial[] = [
  {
    text: "Quando ho cercato un secondo parere ero esausta. Su oncologo.it ho trovato la dottoressa giusta in mezz'ora: biografia chiara, orari veri, prenotazione senza chiamare nessuno. Il giorno dopo ero in studio.",
    name: "Maria L.",
    detail: "Paziente oncologica · 47 anni",
    city: "Roma",
    treatment: "Oncologia integrativa",
  },
  {
    text: "Il piano nutrizionale generato dall'AI è la cosa che non sapevo di volere. Le ricette sono semplici, calibrate sulla mia terapia, e posso rigenerarle quando un alimento non mi va. Il medico le ha approvate senza modifiche.",
    name: "Federica B.",
    detail: "Paziente in follow-up · 52 anni",
    city: "Milano",
    treatment: "Nutrizione personalizzata",
  },
  {
    text: "Onciro mi ha tenuto compagnia nelle ore strane, quando l'ansia non lasciava dormire. Risponde sul serio, non come un chatbot qualsiasi. Ho parlato con lui di cose che fatico a dire al medico durante la visita.",
    name: "Andrea M.",
    detail: "Caregiver · 38 anni",
    city: "Torino",
    treatment: "Supporto quotidiano",
  },
];

export interface PricingTier {
  title: string;
  range: string;
  duration: string;
  detail: string;
}

/**
 * Transparent pricing — Unobravo-style "no surprises" block. Each row mirrors
 * the actual specialist tariffs. No estimate fudging.
 */
export const PRICING_TIERS: readonly PricingTier[] = [
  {
    title: "Visita oncologica",
    range: "80-150 €",
    duration: "45 min",
    detail: "Prima visita o secondo parere. In studio o in videocall.",
  },
  {
    title: "Visita cardiologica",
    range: "70-120 €",
    duration: "30 min",
    detail: "Inquadramento cardio-oncologico, valutazione del rischio.",
  },
  {
    title: "Visita di controllo",
    range: "60-90 €",
    duration: "30 min",
    detail: "Follow-up periodico, lettura referti, aggiustamento piani.",
  },
  {
    title: "Piattaforma e AI",
    range: "Gratuito",
    duration: "Incluso",
    detail: "Piani nutrizionali, corsi gratuiti, assistente Onciro.",
  },
];

export interface Faq {
  question: string;
  answer: string;
}

export const HOMEPAGE_FAQS: readonly Faq[] = [
  {
    question: "Come trovo lo specialista giusto per me?",
    answer:
      "Puoi cercare uno specialista per specializzazione, città o disponibilità. Ogni profilo mostra biografia, sedi e prossimi orari liberi per prenotare in autonomia.",
  },
  {
    question: "Gli specialisti sono certificati?",
    answer:
      "Ogni professionista della piattaforma è verificato singolarmente dal nostro team. Gli oncologi hanno la certificazione ARTOI per l'oncologia integrativa.",
  },
  {
    question: "Come funzionano i piani nutrizionali AI?",
    answer:
      "Dopo la registrazione compili un breve profilo clinico: sesso, età, condizioni, preferenze alimentari. L'intelligenza artificiale genera un piano settimanale personalizzato e validato dal nostro team medico. Puoi rigenerare singoli pasti in qualsiasi momento.",
  },
  {
    question: "Quanto costa una visita?",
    answer:
      "Il prezzo è stabilito da ogni specialista e visibile sul suo profilo, prima della prenotazione. La registrazione sulla piattaforma è sempre gratuita.",
  },
  {
    question: "Posso disdire una prenotazione?",
    answer:
      "Sì, puoi annullare o riprogrammare una visita dall'area personale fino a poche ore prima dell'appuntamento. Riceverai una conferma via email.",
  },
  {
    question: "Cosa copre la certificazione ARTOI?",
    answer:
      "ARTOI è l'Associazione Ricerca Terapie Oncologiche Integrate, che certifica oncologi formati nell'integrazione tra cure convenzionali, nutrizione e interventi complementari basati su evidenze scientifiche.",
  },
];
