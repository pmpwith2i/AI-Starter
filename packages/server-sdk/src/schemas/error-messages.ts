import type { ErrorCode } from "./error-codes.js";

/**
 * Italian user-facing error messages keyed by ErrorCode.
 * Used by the dashboard to show descriptive toast messages.
 * Falls back to server message if code is not mapped.
 */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  // General
  VALIDATION_ERROR: "Dati non validi. Controlla i campi e riprova.",
  INTERNAL_ERROR: "Si è verificato un errore imprevisto. Riprova più tardi.",
  NOT_FOUND: "Risorsa non trovata.",
  UNAUTHORIZED: "Sessione scaduta. Effettua nuovamente l'accesso.",
  FORBIDDEN: "Non hai i permessi per questa azione.",
  RATE_LIMITED: "Troppe richieste. Attendi qualche momento e riprova.",

  // GDPR / Consent / Data Subject Rights
  CONSENT_REQUIRED:
    "È necessario accettare i termini e i consensi obbligatori prima di continuare.",
  CONSENT_OUTDATED:
    "I termini sono stati aggiornati. Rileggi e accetta i nuovi consensi.",
  ACCOUNT_DELETED: "Questo account è stato eliminato.",
  DELETION_REQUIRES_PASSWORD:
    "Inserisci la password per confermare la cancellazione dell'account.",
  EXPORT_IN_PROGRESS:
    "Un'esportazione dati è già in corso. Attendi il completamento.",

  // Auth
  INVALID_CREDENTIALS: "Email o password non validi.",
  PASSWORD_NOT_SET: "Password non impostata. Richiedi un reset.",
  ACCOUNT_LOCKED:
    "Account temporaneamente bloccato per motivi di sicurezza. Riprova più tardi o richiedi un reset password.",
  EMAIL_ALREADY_EXISTS: "Esiste già un account con questa email.",
  INVALID_REFRESH_TOKEN: "Sessione scaduta. Effettua nuovamente l'accesso.",
  REFRESH_TOKEN_REUSE_DETECTED:
    "Sessione revocata per motivi di sicurezza. Effettua nuovamente l'accesso.",
  TOKEN_EXPIRED: "Sessione scaduta. Effettua nuovamente l'accesso.",
  VERIFICATION_CODE_EXPIRED:
    "Il codice di verifica è scaduto. Richiedi un nuovo codice.",
  VERIFICATION_CODE_INVALID: "Codice di verifica non valido.",
  VERIFICATION_CODE_INVALIDATED:
    "Troppi tentativi errati. Richiedi un nuovo codice.",
  ALREADY_VERIFIED: "L'email è già stata verificata.",
  EMAIL_NOT_VERIFIED:
    "Devi verificare la tua email prima di accedere a questa funzionalità.",
  RESET_CODE_EXPIRED: "Il codice di reset è scaduto. Richiedi un nuovo codice.",
  RESET_CODE_INVALID: "Codice di reset non valido.",
  RESET_CODE_INVALIDATED: "Troppi tentativi errati. Richiedi un nuovo codice.",

  // Profile
  PROFILE_NOT_FOUND: "Profilo non trovato.",
  INVALID_FILE_TYPE:
    "Tipo di file non valido. Formati consentiti: JPEG, PNG, WebP, GIF.",
  UPLOAD_NOT_CONFIGURED: "Il caricamento file non è configurato.",
  NO_FILE_UPLOADED: "Nessun file caricato.",

  // Notifications
  NOTIFICATION_NOT_FOUND: "Notifica non trovata.",

  // Background Tasks
  TASK_NOT_FOUND: "Operazione non trovata.",
  TASK_ALREADY_RUNNING: "Operazione già in corso.",

  NO_ACTIVE_PLAN: "Nessun piano nutrizionale attivo.",
  MEAL_REGENERATION_FAILED: "Errore nella rigenerazione del pasto. Riprova.",
  // PR 5 — fallback messages for the notes preprocessor. The dashboard
  // mutation error handler PREFERs the server-provided message (which
  // contains the specific allergen/diet pair detected) over these defaults.
  TOO_MANY_ALLERGENS:
    "Hai selezionato più di 3 allergie. Cambia le allergie selezionate oppure modifica le note personalizzate.",
  DIET_CONFLICT:
    "La dieta selezionata e le note personalizzate sembrano in conflitto. Verifica la selezione.",

  // Credits
  INSUFFICIENT_CREDITS:
    "Crediti insufficienti per completare l'azione. Controlla il tuo saldo.",
  PLAN_NOT_FOUND: "Piano non trovato.",
  DEFAULT_PLAN_MISSING:
    "Configurazione errata: nessun piano predefinito disponibile.",
  INVALID_DATE_RANGE:
    "Le date scelte non sono valide. Il piano deve iniziare oggi o in futuro e durare al massimo un mese.",

  // Courses
  COURSE_NOT_FOUND: "Corso non trovato.",
  LESSON_NOT_FOUND: "Lezione non trovata.",
  ALREADY_ENROLLED: "Sei già iscritto a questo corso.",
  NOT_ENROLLED: "Non sei iscritto a questo corso.",
  COURSE_NOT_COMPLETED: "Il corso non è stato completato.",
  COURSE_REQUIRES_PURCHASE:
    "Questo corso richiede un acquisto. Sarà disponibile prossimamente.",

  // Events
  EVENT_NOT_FOUND: "Evento non trovato.",
  ALREADY_REGISTERED: "Sei già registrato a questo evento.",
  NOT_REGISTERED: "Non sei registrato a questo evento.",
  EVENT_FULL: "L'evento è al completo.",
  EVENT_PAST: "L'evento è già passato.",
  EVENT_REQUIRES_PURCHASE:
    "Questo evento richiede un acquisto. Sarà disponibile prossimamente.",
  EVENT_BUNDLE_ONLY:
    "Questo evento è disponibile solo all'interno del pacchetto.",
  EVENT_CANCELLED: "L'evento è stato annullato.",
  EVENT_NOT_PUBLISHED: "L'evento non è ancora stato pubblicato.",
  OVERLAPPING_PURCHASE:
    "Possiedi già un biglietto per uno o più eventi di questo pacchetto.",

  // Bundles
  BUNDLE_NOT_FOUND: "Pacchetto non trovato.",
  BUNDLE_CANCELLED: "Il pacchetto è stato annullato.",
  BUNDLE_NOT_PUBLISHED: "Il pacchetto non è ancora stato pubblicato.",
  BUNDLE_REQUIRES_PURCHASE:
    "Questo pacchetto richiede un acquisto. Sarà disponibile prossimamente.",
  BUNDLE_FREE_NOT_GRANTABLE:
    "I pacchetti gratuiti non possono essere assegnati tramite questo flusso.",
  ALREADY_PURCHASED_BUNDLE: "Hai già acquistato questo pacchetto.",

  // Speakers
  SPEAKER_NOT_FOUND: "Speaker non trovato.",
  SPEAKER_HAS_REFERENCES:
    "Impossibile eliminare un relatore già associato a eventi o corsi.",

  // Admin events / bundles
  EVENT_HAS_REGISTRATIONS:
    "Impossibile eliminare un evento con iscrizioni. Annullalo invece.",
  EVENT_HAS_PURCHASES:
    "Impossibile eliminare un evento con acquisti. Annullalo invece.",
  BUNDLE_HAS_PURCHASES:
    "Impossibile eliminare un pacchetto con acquisti. Annullalo invece.",
  REGISTRATION_NOT_FOUND: "Iscrizione non trovata.",
  SLUG_TAKEN: "Lo slug è già in uso.",
  EVENT_IMAGE_NOT_FOUND: "Immagine non trovata.",
  IMAGE_TOO_LARGE: "L'immagine supera il limite di 5 MB.",

  // Appointments
  APPOINTMENT_NOT_FOUND: "Appuntamento non trovato.",
  DOCTOR_NOT_FOUND: "Professionista non trovato.",
  DOCTOR_UNAVAILABLE:
    "Il professionista non è disponibile per l'orario selezionato.",
  APPOINTMENT_CANNOT_CANCEL: "Non è possibile modificare questo appuntamento.",

  // Professional
  PROFESSIONAL_PROFILE_NOT_FOUND: "Profilo professionale non trovato.",
  ROLE_FORBIDDEN: "Non hai i permessi per accedere a questa risorsa.",

  // Invites
  INVITE_NOT_FOUND: "Invito non trovato.",
  INVITE_EXPIRED: "L'invito è scaduto.",
  INVITE_ALREADY_USED: "L'invito è già stato utilizzato.",
  ADMIN_SECRET_INVALID: "Chiave di amministrazione non valida.",

  // Patient Records
  PATIENT_RECORD_NOT_FOUND: "Cartella paziente non trovata.",
  PATIENT_RECORD_HAS_VISITS:
    "Impossibile eliminare: la cartella ha visite associate.",
  PATIENT_ALREADY_LINKED: "Il paziente è già associato.",

  // Visits
  VISIT_NOT_FOUND: "Visita non trovata.",

  // Locations
  LOCATION_NOT_FOUND: "Sede non trovata.",
  LOCATION_HAS_SLOTS:
    "Impossibile eliminare: la sede ha slot di disponibilità.",
  LOCATION_REQUIRED: "È necessario selezionare una sede.",

  // Availability
  AVAILABILITY_CONFLICT: "Conflitto con uno slot di disponibilità esistente.",

  // Chat
  CONVERSATION_NOT_FOUND: "Conversazione non trovata.",
  CONVERSATION_NOT_OWNED: "Non hai accesso a questa conversazione.",

  // Patient Data
  PATIENT_DATA_NOT_FOUND: "Dati del paziente non trovati.",

  // Suggestions
  SUGGESTION_NOT_FOUND: "Suggerimento non trovato.",

  // Blog
  BLOG_POST_NOT_FOUND: "Articolo non trovato.",
};
