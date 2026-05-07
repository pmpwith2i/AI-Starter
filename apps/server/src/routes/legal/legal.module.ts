import type { FastifyInstance } from "fastify";
import type { FromSchema } from "json-schema-to-ts";
import {
  GET_PRIVACY_POLICY_ROUTE_SCHEMA,
  GET_TERMS_ROUTE_SCHEMA,
} from "@repo/server-sdk/schemas";
import { ENVIRONMENT_VARIABLES } from "#src/constants/env.constants.js";

const PRIVACY_POLICY_PLACEHOLDER = `# Informativa sulla Privacy

_Versione: ${"${version}"}_

Questa è una versione placeholder dell'informativa sulla privacy di oncologo.it.

## Dati raccolti
- Dati anagrafici (nome, cognome, email, telefono)
- Dati sanitari (allergie, condizioni mediche, piani nutrizionali) — Art. 9 GDPR
- Dati di utilizzo della piattaforma

## Finalità del trattamento
- Gestione dell'account utente
- Erogazione dei servizi sanitari e di wellness
- Elaborazione AI per suggerimenti nutrizionali e clinici

## Base giuridica
- Esecuzione di un contratto (Art. 6(1)(b))
- Consenso esplicito per il trattamento di dati sanitari (Art. 9(2)(a))

## Diritti dell'interessato
Puoi esercitare i tuoi diritti (accesso, rettifica, cancellazione, portabilità) dalle impostazioni del tuo account o contattando il DPO.

## Trasferimenti extra-UE
Alcuni fornitori (OpenRouter, Resend) hanno sede negli Stati Uniti. Applichiamo Standard Contractual Clauses e pseudonimizzazione dei dati sanitari prima della trasmissione.

---

_Per la versione completa, contattare il DPO._`;

const TERMS_PLACEHOLDER = `# Termini di Servizio

_Versione: ${"${version}"}_

Questa è una versione placeholder dei termini di servizio di oncologo.it.

## Oggetto
oncologo.it è una piattaforma di supporto al wellness per pazienti oncologici.

## Registrazione
L'accesso richiede la creazione di un account e la verifica dell'email.

## Uso della piattaforma
L'utente si impegna a fornire informazioni accurate e ad utilizzare la piattaforma in modo conforme alle leggi.

## Limitazioni
La piattaforma non sostituisce il parere medico professionale.

---

_Per la versione completa, contattare il servizio clienti._`;

export default async (fastify: FastifyInstance) => {
  fastify.get<{
    Reply: {
      200: FromSchema<(typeof GET_PRIVACY_POLICY_ROUTE_SCHEMA.response)[200]>;
    };
  }>("/privacy-policy", {
    schema: GET_PRIVACY_POLICY_ROUTE_SCHEMA,
    handler: async () => {
      const version = ENVIRONMENT_VARIABLES.PRIVACY_POLICY_VERSION;
      return {
        version,
        content: PRIVACY_POLICY_PLACEHOLDER.replace("${version}", version),
        updatedAt: new Date(version).toISOString(),
      };
    },
  });

  fastify.get<{
    Reply: {
      200: FromSchema<(typeof GET_TERMS_ROUTE_SCHEMA.response)[200]>;
    };
  }>("/terms", {
    schema: GET_TERMS_ROUTE_SCHEMA,
    handler: async () => {
      const version = ENVIRONMENT_VARIABLES.TERMS_VERSION;
      return {
        version,
        content: TERMS_PLACEHOLDER.replace("${version}", version),
        updatedAt: new Date(version).toISOString(),
      };
    },
  });
};
