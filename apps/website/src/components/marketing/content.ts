/**
 * Hoisted static copy for marketing sections.
 *
 * The constants below are placeholder strings the design-system-agent will
 * rewrite after the interview. Keep them generic enough to render the
 * marketing layout end-to-end without referencing any specific domain.
 */

import type { ComponentType } from "react";
import { BadgeCheck, CalendarClock, HeartPulse } from "lucide-react";

export interface ValuePillar {
  title: string;
  copy: string;
  detail: string;
  icon: ComponentType<{ className?: string }>;
}

export const VALUE_PILLARS: readonly ValuePillar[] = [
  {
    title: "Trustworthy",
    copy: "Every interaction is reviewed by our team before reaching you.",
    detail: "Replace this copy with your domain-specific value proposition.",
    icon: BadgeCheck,
  },
  {
    title: "Always available",
    copy: "Schedule what you need in real time, no calls required.",
    detail: "Replace this copy with your domain-specific value proposition.",
    icon: CalendarClock,
  },
  {
    title: "End-to-end",
    copy: "We stay with you between touchpoints.",
    detail: "Replace this copy with your domain-specific value proposition.",
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
    title: "Discover",
    text: "Replace with the first step of your user journey.",
  },
  {
    n: "02",
    title: "Decide",
    text: "Replace with the second step of your user journey.",
  },
  {
    n: "03",
    title: "Continue",
    text: "Replace with the third step of your user journey.",
  },
];

export interface Credential {
  name: string;
  detail: string;
}

export const CREDENTIALS: readonly Credential[] = [
  { name: "GDPR", detail: "Personal-data handling compliant with GDPR" },
  { name: "Transparent pricing", detail: "No hidden fees" },
  { name: "Free to try", detail: "Sign up without a card" },
];

export interface QuickPill {
  label: string;
  href: string;
}

export const HERO_QUICK_PILLS: readonly QuickPill[] = [];

export interface TrustStat {
  value: string;
  label: string;
}

export const TRUST_STATS: readonly TrustStat[] = [
  { value: "—", label: "Replace" },
  { value: "—", label: "with real" },
  { value: "—", label: "metrics" },
];

export interface Testimonial {
  text: string;
  name: string;
  detail: string;
  city: string;
  treatment: string;
}

/**
 * Placeholder testimonials. Replace with real quotes once you have them, or
 * remove the Testimonials section from the homepage.
 */
export const HOMEPAGE_TESTIMONIALS: readonly Testimonial[] = [];

export interface PricingTier {
  title: string;
  range: string;
  duration: string;
  detail: string;
}

export const PRICING_TIERS: readonly PricingTier[] = [
  {
    title: "Replace this tier",
    range: "—",
    duration: "—",
    detail:
      "Add your real pricing tiers or drop the PricingTransparency section.",
  },
];

export interface Faq {
  question: string;
  answer: string;
}

export const HOMEPAGE_FAQS: readonly Faq[] = [
  {
    question: "What is {{PROJECT_NAME}}?",
    answer: "{{ONE_LINER}}",
  },
  {
    question: "How do I sign up?",
    answer: "Click the call-to-action and follow the email-verification flow.",
  },
  {
    question: "Is my data protected?",
    answer:
      "Yes — see our Privacy Policy. We use AES-256-GCM encryption for sensitive fields and consent-record auditing per GDPR.",
  },
];
