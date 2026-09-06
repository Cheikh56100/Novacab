import React, { lazy, Suspense, useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  LayoutGrid, Users, Receipt, FileWarning, Landmark, Building2, FileSpreadsheet,
  ClipboardCheck, Search, ChevronRight, X, Check, AlertTriangle,
  Clock, TrendingUp, UserCircle2, Plus, Stamp, ChevronDown,
  Filter, ArrowUpRight, CircleDot, Loader2, RefreshCw, History,
  ChevronUp, CalendarDays, CalendarRange, Settings2, Trash2,
  Pencil, ChevronLeft, ShieldCheck, LogOut, Mail, Lock, UserRound,
  Phone, Briefcase, UserCheck, Wallet, ShieldAlert, Menu, Bell, Clock3, ArrowLeft, ExternalLink,
  Eye, EyeOff, Copy, KeyRound, Download, MapPin, Contact, Scale, RotateCcw, Upload, FileCheck, SlidersHorizontal, Database, Send, CircleAlert, BarChart3, PieChart,
  CheckCircle2, XCircle, Moon, Laptop2, CircleHelp, Info, FileText, MessageCircle, Sparkles, ListTodo
} from "lucide-react";
import { supabase } from "../supabaseClient";
import { fetchSecurityAudit, logSecurityEvent } from "../services/securityAudit";
import { motion } from "framer-motion";
import { fetchTasks, createTask, updateTask, completeTask, archiveTask, deleteTask, subscribeTasks } from "../services/tasks";
import { logActivity, activityMessages } from "../services/activity";
import { bucketize as bucketizeDeadlines, BUCKET_LABELS as DEADLINE_BUCKET_LABELS } from "../services/deadlines";
import { TASK_STATUTS, TASK_STATUT_BY_CODE, TASK_PRIORITES, TASK_PRIORITE_BY_CODE, taskSortWeight, PILOTAGE_COLORS } from "../constants/pilotage";
import { runAutomation } from "../services/automation";
import { fetchLegalRequests, createLegalRequest, updateLegalRequest, deleteLegalRequest, migrateLocalLegalRequests } from "../services/legal";
import { filterEditablePatch } from "../services/permissions";
import { loadOrganismesSociaux, insertOrganismeSocial, updateOrganismeSocial, deleteOrganismeSocial } from "../services/socialAccess";
import { fetchProductNotifications, insertProductNotification, markProductNotificationRead } from "../services/notifications";
const TvaAutomation = lazy(() => import("../tva/TvaAutomation"));

const PALETTE = ["#17345F", "#7C3AED", "#059669", "#D97706", "#DC2626", "#0891B2", "#DB2777", "#4F46E5"];

// Référentiel minimal des secteurs utilisé par les vues sectorielles.
const SECTEURS_ACTIVITE = [
  { id: "batiment", label: "Bâtiment & travaux", color: "#D97706" },
  { id: "restauration", label: "Restauration", color: "#DC2626" },
  { id: "commerce", label: "Commerce", color: "#17345F" },
  { id: "immobilier", label: "Immobilier", color: "#7C3AED" },
  { id: "services", label: "Services", color: "#059669" },
  { id: "industrie", label: "Industrie", color: "#0891B2" },
  { id: "transport", label: "Transport", color: "#4F46E5" },
  { id: "sante", label: "Santé", color: "#DB2777" },
  { id: "agriculture", label: "Agriculture", color: "#65A30D" },
  { id: "autres", label: "Autres", color: "#64748B" },
];

const SEED_AIDES_SECTEUR = Object.fromEntries(
  SECTEURS_ACTIVITE.map(({ id }) => [id, { aides: [], obligations: [] }])
);

const TVA_PERIODICITES = ["mensuelle", "trimestrielle"];
const TVA_PERIODICITE_LABELS = { mensuelle: "Mensuelle", trimestrielle: "Trimestrielle" };
const REGIMES_TVA = ["CA3", "CA12", "FEB", "TRIM"];
const REGIMES_TVA_LABELS = { CA3: "CA3", CA12: "CA12", FEB: "Franchise en base", TRIM: "TVA trimestrielle" };
const DASHBOARD_CHART_COLORS = PALETTE;
const PLANNING_FILTERS = [
  { id: "toutes", label: "Toutes" },
  { id: "retard", label: "En retard" },
  { id: "aujourdhui", label: "Aujourd'hui" },
  { id: "semaine", label: "Cette semaine" },
  { id: "plus-tard", label: "Plus tard" },
  { id: "sans-date", label: "Sans date" },
];
const PLANNING_HOURS = Array.from({ length: 12 }, (_, i) => i + 8);
const PLANNING_SLOT_H = 56;
const TASK_PRIORITE_TONE = { faible: "neutral", normale: "neutral", haute: "amber", urgente: "red" };
const PAYMENT_STATUS_OPTIONS = [
  { value: "a_payer", label: "À payer" },
  { value: "paye", label: "Payé" },
  { value: "partiel", label: "Partiel" },
  { value: "annule", label: "Annulé" },
];
const MISSION_EXCEP_TYPES = ["Conseil", "Juridique", "Social", "Fiscal", "Autre"];
const MISSION_EXCEP_STATUTS = ["a_faire", "en_cours", "terminee", "annulee"];
const MISSION_EXCEP_STATUT_LABELS = { a_faire: "À faire", en_cours: "En cours", terminee: "Terminée", annulee: "Annulée" };
const RESILIATION_INITIATEURS = ["Cabinet", "Client", "Autre"];
const RESILIATION_MOTIFS = ["Fin de mission", "Désaccord", "Honoraires", "Confrère", "Autre"];
const ACCES_CATEGORIES = [
  { key: "comptabilite", label: "Comptabilité", placeholder: "logiciel / accès" },
  { key: "banque", label: "Banque", placeholder: "banque" },
  { key: "social", label: "Social", placeholder: "portail social" },
  { key: "fiscal", label: "Fiscal", placeholder: "portail fiscal" },
  { key: "autres", label: "Autres", placeholder: "service" },
];
const REPRISE_PIECES = ["lettreMission", "kbis", "statuts", "derniereCloture", "balance", "fec", "piecesComptables"];
const ROLE_FILTER_OPTIONS = [
  { value: "Tous", label: "Tous" },
  { value: "Collaborateur", label: "Collaborateur" },
  { value: "Expert", label: "Expert" },
  { value: "Chef de mission", label: "Chef de mission" },
];
const STATUT_FILTER_OPTIONS = [
  { value: "actif", label: "Actif" },
  { value: "inactif", label: "Inactif" },
  { value: "transfert", label: "En transfert" },
  { value: "tous", label: "Tous" },
];
const COLLAB_SECTIONS = [
  ["overview", "Vue d'ensemble", Briefcase], ["formations", "Formations", FileText], ["competences", "Compétences", CheckCircle2],
  ["objectifs", "Objectifs", ListTodo], ["realisations", "Réalisations", Sparkles], ["entretiens", "Entretiens", CalendarDays], ["documents", "Documents", FileText], ["historique", "Historique", History],
];
const ACTIVITY_TYPE_LABELS = { note: "Note", statut: "Statut", tache: "Tâche", document: "Document", import: "Import", resiliation: "Résiliation", reprise: "Reprise" };
const NOVACAB_MAIL_TEMPLATES = [
  { id: "tva-synthese", category: "TVA", title: "Synthèse de votre TVA", description: "Récapitulatif des montants collectés, déductibles et de la TVA à payer", subject: "TVA — synthèse de la déclaration {{periode}}", body: "Bonjour {{contact}},\n\nNous avons préparé les éléments de votre déclaration de TVA pour {{periode}}.\n\n• TVA collectée : {{tva_collectee}}\n• TVA déductible : {{tva_deductible}}\n• TVA liée à la sous-traitance / autoliquidation : {{tva_sous_traitant}}\n• TVA à payer : {{montant_a_payer}}\n\nCes montants sont présentés à titre de récapitulatif avant la déclaration. Si vous constatez un élément manquant ou une différence, merci de nous en informer rapidement.\n\nBien cordialement," },
  { id: "tva-elements", category: "TVA", title: "Demande d’éléments TVA", description: "Collecte des éléments nécessaires à la préparation de la déclaration", subject: "TVA — éléments à nous transmettre", body: "Bonjour {{contact}},\n\nAfin de préparer votre déclaration de TVA {{periode}}, merci de nous transmettre les éléments nécessaires à l’établissement de la déclaration.\n\nMerci notamment de vérifier les factures clients, factures fournisseurs, opérations intracommunautaires, importations et éventuelles opérations de sous-traitance avec autoliquidation.\n\nBien cordialement," },
  { id: "tva-validation", category: "TVA", title: "TVA prête à valider", description: "Présentation des montants avant validation par le client", subject: "TVA {{periode}} — validation des montants", body: "Bonjour {{contact}},\n\nVotre déclaration de TVA {{periode}} est prête pour validation.\n\nTVA collectée : {{tva_collectee}}\nTVA déductible : {{tva_deductible}}\nSous-traitance / autoliquidation : {{tva_sous_traitant}}\nMontant de TVA à payer : {{montant_a_payer}}\n\nMerci de nous confirmer que ces éléments vous paraissent cohérents, ou de nous signaler toute correction à apporter avant transmission.\n\nBien cordialement," },
  { id: "relance-pieces", category: "Relances", title: "Relance pièces manquantes", description: "Relance professionnelle des pièces attendues", subject: "Relance — pièces nécessaires à votre dossier", body: "Bonjour {{contact}},\n\nNous revenons vers vous concernant les pièces encore nécessaires au traitement de votre dossier comptable.\n\nMerci de nous les transmettre dès que possible afin que nous puissions poursuivre nos travaux dans les délais prévus.\n\nBien cordialement," },
  { id: "relance-pieces-ferme", category: "Relances", title: "Relance ferme — pièces en attente", description: "Relance avant impact sur les travaux et échéances", subject: "Action requise — pièces comptables en attente", body: "Bonjour {{contact}},\n\nSauf erreur de notre part, plusieurs pièces nécessaires au traitement de votre dossier restent en attente.\n\nSans réception de ces éléments, nous pourrions être contraints de décaler certains travaux et échéances.\n\nMerci de nous transmettre les pièces manquantes dans les meilleurs délais.\n\nBien cordialement," },
  { id: "relance-finale", category: "Relances", title: "Dernière relance avant échéance", description: "Message prioritaire pour les pièces indispensables", subject: "Dernière relance — échéance de votre dossier", body: "Bonjour {{contact}},\n\nNous vous adressons une dernière relance concernant les éléments nécessaires à votre dossier.\n\nAfin de respecter l’échéance prévue, merci de nous transmettre les pièces manquantes au plus vite.\n\nNous restons disponibles si vous rencontrez une difficulté pour réunir ces éléments.\n\nBien cordialement," },
  { id: "relance-information", category: "Relances", title: "Relance demande d’information", description: "Relance d’une question restée sans réponse", subject: "Relance — informations complémentaires attendues", body: "Bonjour {{contact}},\n\nNous revenons vers vous au sujet de notre précédente demande d’informations concernant {{client}}.\n\nVotre retour nous permettra de finaliser le traitement du dossier. Merci de nous répondre dès que possible.\n\nBien cordialement," },
  { id: "budget", category: "Budget", title: "Demande d’éléments budgétaires", description: "Hypothèses pour préparer un budget ou prévisionnel", subject: "Préparation du budget — éléments à nous transmettre", body: "Bonjour {{contact}},\n\nDans le cadre de la préparation du budget de {{client}}, nous vous remercions de nous transmettre vos principales hypothèses : chiffre d’affaires, évolution des charges, investissements, recrutements, financement et événements exceptionnels à anticiper.\n\nCes éléments nous permettront de construire une projection cohérente.\n\nBien cordialement," },
  { id: "budget-point", category: "Budget", title: "Point sur le budget prévisionnel", description: "Proposer un échange pour revoir les hypothèses", subject: "{{client}} — point sur le budget prévisionnel", body: "Bonjour {{contact}},\n\nNous vous proposons de faire un point sur les hypothèses retenues pour le budget prévisionnel de {{client}}.\n\nL’objectif est de valider ensemble les principaux postes et les éventuels changements intervenus depuis notre dernier échange.\n\nBien cordialement," },
  { id: "bilan", category: "Autres", title: "Préparation du bilan", description: "Lancement de la préparation du bilan", subject: "Préparation de votre bilan — éléments à nous transmettre", body: "Bonjour {{contact}},\n\nNous revenons vers vous concernant la préparation du bilan de {{client}}.\n\nMerci de nous transmettre les éléments et justificatifs encore nécessaires afin que nous puissions finaliser nos travaux dans les délais.\n\nBien cordialement," },
  { id: "bilan-validation", category: "Autres", title: "Bilan — demande de validation", description: "Demander une validation ou des observations sur les comptes", subject: "{{client}} — validation des éléments du bilan", body: "Bonjour {{contact}},\n\nLes travaux de préparation de votre bilan avancent. Nous souhaitons valider avec vous les derniers éléments et éventuelles observations avant finalisation.\n\nMerci de nous transmettre votre retour ou de nous indiquer vos disponibilités pour un échange.\n\nBien cordialement," },
  { id: "information", category: "Autres", title: "Demande d’informations", description: "Demande générique d’informations complémentaires", subject: "Dossier {{client}} — informations complémentaires", body: "Bonjour {{contact}},\n\nAfin de poursuivre le traitement de votre dossier, nous aurions besoin de quelques informations complémentaires.\n\nMerci de nous transmettre les éléments disponibles ou de nous indiquer si vous souhaitez que nous échangions à ce sujet.\n\nBien cordialement," },
  { id: "rendez-vous", category: "Autres", title: "Proposition de rendez-vous", description: "Proposer un échange avec le client", subject: "{{client}} — proposition de rendez-vous", body: "Bonjour {{contact}},\n\nNous souhaitons vous proposer un rendez-vous afin de faire le point sur votre dossier {{client}} et les prochaines échéances.\n\nN’hésitez pas à nous communiquer vos disponibilités.\n\nBien cordialement," },
  { id: "documents-recues", category: "Autres", title: "Confirmation de réception", description: "Confirmer la bonne réception des documents", subject: "{{client}} — confirmation de réception de vos documents", body: "Bonjour {{contact}},\n\nNous vous confirmons avoir bien reçu les documents transmis pour votre dossier {{client}}.\n\nNous allons les intégrer à nos travaux et reviendrons vers vous si des éléments complémentaires sont nécessaires.\n\nBien cordialement," },
];

const SECTEUR_NEWS_QUERIES = {
  batiment: "aides réglementation BTP bâtiment France",
  restauration: "aides réglementation restauration France",
  commerce: "aides réglementation commerce France",
  immobilier: "aides réglementation immobilier France",
  services: "aides réglementation entreprises de services France",
  industrie: "aides réglementation industrie France",
  transport: "aides réglementation transport France",
  sante: "aides réglementation santé entreprises France",
  agriculture: "aides réglementation agriculture France",
  autres: "aides réglementation entreprises France",
};
const OFFICIAL_PRO_FEED = "https://www.service-public.fr/entreprendre/rss";
const MOIS_ORDER = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const QUARTER_END_MONTHS = ["Mars", "Juin", "Septembre", "Décembre"];
const MOIS_FULL = MOIS_ORDER;
const BTP_NAF_PREFIXES = ["41", "42", "43"];
const COTISATION_TYPES = [
  { key: "URSSAF", label: "URSSAF" },
  { key: "Retraite", label: "Retraite complémentaire" },
  { key: "Prévoyance", label: "Prévoyance" },
];
const COTISATION_TYPES_BTP = [
  { key: "PRO BTP", label: "PRO BTP" },
  { key: "CIBTP", label: "CIBTP" },
];
const NAF_SECTORS = [
  [/^41|^42|^43/, "batiment"],
  [/^55|^56/, "restauration"],
  [/^45|^46|^47/, "commerce"],
  [/^68/, "immobilier"],
  [/^49|^50|^51|^52|^53/, "transport"],
  [/^86|^87|^88/, "sante"],
  [/^01|^02|^03/, "agriculture"],
  [/^10|^11|^12|^13|^14|^15|^16|^17|^18|^19|^20|^21|^22|^23|^24|^25|^26|^27|^28|^29|^30|^31|^32|^33/, "industrie"],
];
const ACTIVITE_KEYWORDS = [
  { secteurId: "batiment", keywords: ["batiment", "bâtiment", "construction", "plomberie", "electricite", "électricité", "maconnerie", "maçonnerie", "peinture"] },
  { secteurId: "restauration", keywords: ["restaurant", "restauration", "cafe", "café", "traiteur", "bar"] },
  { secteurId: "commerce", keywords: ["commerce", "boutique", "magasin", "vente", "negoce", "négoce"] },
  { secteurId: "immobilier", keywords: ["immobilier", "agence immobiliere", "agence immobilière", "location"] },
  { secteurId: "transport", keywords: ["transport", "taxi", "vsl", "logistique", "messagerie"] },
  { secteurId: "sante", keywords: ["sante", "santé", "medecin", "médecin", "infirmier", "pharmacie"] },
  { secteurId: "agriculture", keywords: ["agriculture", "agricole", "viticulture", "elevage", "élevage"] },
];
const FORME_JURIDIQUE_CHECKLIST_ITEMS = {
  EI: [
    { id: "identite_regime", label: "Vérifier l'identité de l'exploitant, l'activité et le régime fiscal/social" },
    { id: "comptes_annuels", label: "Réviser les comptes annuels et les principaux comptes de bilan / résultat" },
    { id: "declarations", label: "Vérifier les déclarations fiscales et sociales liées à l'activité" },
    { id: "cotisations_tns", label: "Contrôler les cotisations sociales du dirigeant selon son statut" },
  ],
  EURL: [
    { id: "statuts", label: "Relire les statuts et vérifier les évolutions de l'associé unique / gérant" },
    { id: "comptes_annuels", label: "Réviser les comptes annuels et les comptes courants d'associé" },
    { id: "approbation_comptes", label: "Préparer / vérifier la décision d'approbation des comptes et l'affectation du résultat" },
    { id: "depot_comptes", label: "Vérifier les formalités et le dépôt des comptes lorsque requis" },
    { id: "remuneration", label: "Contrôler la rémunération du gérant et ses incidences sociales / fiscales" },
  ],
  SARL: [
    { id: "statuts", label: "Relire les statuts, la répartition du capital et les mandats des gérants" },
    { id: "comptes_annuels", label: "Réviser les comptes annuels et les comptes courants d'associé" },
    { id: "ago", label: "Préparer / vérifier l'assemblée annuelle, l'approbation des comptes et l'affectation du résultat" },
    { id: "depot_comptes", label: "Vérifier les formalités et le dépôt des comptes lorsque requis" },
    { id: "conventions", label: "Contrôler les conventions réglementées lorsqu'elles existent" },
    { id: "remuneration", label: "Contrôler la rémunération des gérants et les charges sociales associées" },
  ],
  SAS: [
    { id: "statuts", label: "Relire les statuts, la gouvernance et les mandats des dirigeants" },
    { id: "comptes_annuels", label: "Réviser les comptes annuels et les comptes courants d'associé" },
    { id: "decision_annuelle", label: "Préparer / vérifier la décision annuelle d'approbation des comptes et l'affectation du résultat" },
    { id: "depot_comptes", label: "Vérifier les formalités et le dépôt des comptes lorsque requis" },
    { id: "conventions", label: "Contrôler les conventions réglementées lorsqu'elles existent" },
    { id: "remuneration", label: "Contrôler la rémunération du président / dirigeants et les charges associées" },
  ],
  SASU: [
    { id: "statuts", label: "Relire les statuts et vérifier les décisions de l'associé unique" },
    { id: "comptes_annuels", label: "Réviser les comptes annuels et les comptes courants d'associé" },
    { id: "decision_annuelle", label: "Préparer / vérifier la décision annuelle d'approbation des comptes et l'affectation du résultat" },
    { id: "depot_comptes", label: "Vérifier les formalités et le dépôt des comptes lorsque requis" },
    { id: "conventions", label: "Contrôler les conventions réglementées lorsqu'elles existent" },
    { id: "remuneration", label: "Contrôler la rémunération du président et les charges associées" },
  ],
  SCI: [
    { id: "statuts", label: "Relire les statuts, les associés et les pouvoirs du ou des gérants" },
    { id: "comptes_annuels", label: "Réviser les comptes et les comptes courants d'associé selon le régime et les obligations du dossier" },
    { id: "resultat_fiscal", label: "Vérifier la détermination et la déclaration du résultat fiscal (IR / IS selon le régime)" },
    { id: "decision_annuelle", label: "Préparer / vérifier la décision ou l'assemblée annuelle prévue par les statuts" },
    { id: "immobilier", label: "Contrôler les biens, loyers, emprunts, charges et opérations immobilières" },
  ],
  SCM: [
    { id: "statuts", label: "Relire les statuts, les associés et les règles de répartition des charges" },
    { id: "comptes_annuels", label: "Réviser les comptes et la répartition des charges entre associés" },
    { id: "decision_annuelle", label: "Vérifier les décisions / assemblées prévues par les statuts" },
    { id: "conventions", label: "Contrôler les conventions et flux entre la SCM et ses associés" },
  ],
  SELARL: [
    { id: "statuts", label: "Relire les statuts, les associés et la gouvernance de la société d'exercice" },
    { id: "comptes_annuels", label: "Réviser les comptes annuels et les comptes courants d'associé" },
    { id: "decision_annuelle", label: "Préparer / vérifier l'approbation des comptes et l'affectation du résultat" },
    { id: "depot_comptes", label: "Vérifier les formalités et le dépôt des comptes lorsque requis" },
    { id: "remuneration", label: "Contrôler la rémunération des dirigeants et les cotisations correspondantes" },
    { id: "reglementation", label: "Vérifier les points réglementaires propres à la profession et à la structure" },
  ],
  SA: [
    { id: "statuts", label: "Relire les statuts, la gouvernance et les mandats des dirigeants" },
    { id: "comptes_annuels", label: "Réviser les comptes annuels et les comptes courants" },
    { id: "ago", label: "Préparer / vérifier l'assemblée annuelle, l'approbation des comptes et l'affectation du résultat" },
    { id: "depot_comptes", label: "Vérifier les formalités et le dépôt des comptes lorsque requis" },
    { id: "conventions", label: "Contrôler les conventions réglementées et les rapports requis" },
    { id: "cac", label: "Vérifier les obligations liées au commissaire aux comptes lorsqu'elles s'appliquent" },
  ],
  SNC: [
    { id: "statuts", label: "Relire les statuts, les associés et les pouvoirs de gestion" },
    { id: "comptes_annuels", label: "Réviser les comptes annuels et les comptes courants d'associé" },
    { id: "decision_annuelle", label: "Vérifier les décisions / assemblées prévues par les statuts" },
    { id: "resultat_fiscal", label: "Contrôler le traitement fiscal du résultat selon le régime applicable" },
    { id: "conventions", label: "Contrôler les opérations et conventions entre associés et société" },
  ],
  Association: [
    { id: "statuts", label: "Relire les statuts, l'objet, la gouvernance et les délégations" },
    { id: "comptes_annuels", label: "Réviser les comptes et le suivi des ressources / subventions" },
    { id: "assemblee", label: "Préparer / vérifier l'assemblée annuelle et les procès-verbaux selon les statuts" },
    { id: "fiscalite", label: "Vérifier la situation fiscale de l'association et les éventuelles activités lucratives" },
    { id: "subventions", label: "Contrôler les conventions, subventions et justificatifs lorsqu'ils existent" },
  ],
};
const HOLDING_CHECKLIST_ITEMS = [];

const T = {
  paper: "var(--color-app)", paperDeep: "var(--color-paper-deep)", ink: "var(--color-ink)", inkSoft: "var(--color-inksoft)", inkMuted: "var(--color-inkmuted)",
  line: "var(--color-line)", card: "var(--color-card)", gold: "#D97706", goldSoft: "var(--badge-amber-bg)",
  green: "#22C55E", greenSoft: "var(--badge-green-bg)", red: "#EF4444", redSoft: "var(--badge-red-bg)",
  amber: "#F59E0B", amberSoft: "var(--badge-amber-bg)",
  navy: "var(--color-accent)", navySoft: "var(--color-accent-soft)",
  sidebarBg: "var(--color-sidebar)", sidebarBg2: "var(--color-sidebar-2)", sidebarInk: "var(--color-sidebar-ink)", sidebarInkMuted: "var(--color-sidebar-muted)",
  sidebarActive: "var(--color-sidebar-active)", sidebarBorder: "var(--color-sidebar-border)", sidebarAccent: "var(--color-accent)",
  serif: "'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif", mono: "'JetBrains Mono', ui-monospace, monospace", sans: "'Inter', -apple-system, sans-serif",
  shadow: "0 1px 2px var(--color-shadow), 0 8px 20px -6px var(--color-shadow)",
  shadowSm: "0 1px 2px var(--color-shadow), 0 1px 3px var(--color-shadow)",
  shadowLg: "0 24px 48px -14px var(--color-shadow)",
  radius: 16, radiusSm: 12, radiusLg: 20,
};

/* Regroupement des pièces du Dossier Permanent : source unique utilisée par la progression de l'accueil et les compteurs. */
const MISSION_GROUPS = [
  { title: "Identité & statuts", keys: ["KBIS", "Statuts", "CNI dirigeants", "CNI associés"] },
  { title: "Cadrage de la mission", keys: ["Notes entrée mission / Devizen", "Acceptation mission", "LM à jour"] },
  { title: "Conformité & suivi", keys: ["LAB / Kanta / Devizen à jour"] },
  { title: "Clôture du dossier", keys: ["Fiche client", "Bouclage"] },
];
const MISSION_ALL_KEYS = MISSION_GROUPS.flatMap((g) => g.keys);

const CHECKLIST_STATUS_ORDER = ["non_fait", "en_cours", "fait"];
/* ============================================================
   SEED DATA — extrait du fichier Excel de suivi du cabinet
   ============================================================ */
import { CURRENT_YEAR, normalizeAnnualClient, withAnnualSnapshot, rolloverAnnualClient, getAnnualSnapshot, listAnnualYears, getExerciseYear, annualSnapshotFromClient } from "../services/annual";

import { RAW_SEED_CLIENTS } from "../data/seedClients";
import { todayISO, addYearISO, fmtFR, addMonthsISO, fmtEUR, getBilanEcheance, getBilanStatut, sameDay, startOfWeek, isValidISODate } from "../utils/dateUtils";
import * as ExcelUtils from "../utils/excelUtils";
const { exportClientsToExcel, downloadClientsGeneralTemplate, exportClientContactsToExcel, exportChecklistsDaDpToExcel, exportAcomptesToExcel, exportTvaDeadlinesToExcel, importTvaDeadlinesFromExcel, parseClientsExcelFile, downloadContactsTemplate, parseContactsExcelFile } = ExcelUtils;
import { ROLE_LABELS, displayCabinetName, canViewOrganismesSociaux, canEditOrganismesSociaux, canAccessOrganismesSociaux } from "../utils/access";
import { CHECKLIST_STATUS, DA_CHECKLIST_ITEMS, DP_CHECKLIST_ITEMS, getDPStatus, checklistProgress } from "../utils/checklists";


function buildGoogleNewsRssUrl(query) {
  return `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=fr&gl=FR&ceid=FR:fr`;
}


// Proxy CORS gratuit, sans clé, sans compte — renvoie le XML brut du flux
function buildProxyUrl(rssUrl) {
  return `https://api.allorigins.win/raw?url=${encodeURIComponent(rssUrl)}`;
}


async function fetchRssFeed(rssUrl, count = 6) {
  const res = await fetch(buildProxyUrl(rssUrl));
  if (!res.ok) throw new Error(`Erreur réseau (${res.status})`);
  const xmlText = await res.text();
  const xml = new DOMParser().parseFromString(xmlText, "text/xml");
  if (xml.querySelector("parsererror")) throw new Error("Flux XML illisible");
  const channelTitle = xml.querySelector("channel > title")?.textContent || "";
  const nodes = Array.from(xml.querySelectorAll("item")).slice(0, count);
  if (nodes.length === 0) throw new Error("Flux vide");
  return nodes.map((node) => ({
    title: node.querySelector("title")?.textContent || "",
    link: node.querySelector("link")?.textContent || "",
    date: node.querySelector("pubDate")?.textContent || "",
    source: channelTitle,
  }));
}


// Récupère les actus d'un secteur : Google Actualités (ciblé) + Service-Public.fr (officiel, générique)
async function fetchSecteurNews(secteurId) {
  const query = SECTEUR_NEWS_QUERIES[secteurId] || SECTEUR_NEWS_QUERIES.autres;
  const results = await Promise.allSettled([
    fetchRssFeed(buildGoogleNewsRssUrl(query), 5),
    fetchRssFeed(OFFICIAL_PRO_FEED, 3),
  ]);
  const items = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
  items.sort((a, b) => new Date(b.date) - new Date(a.date));
  if (items.length === 0 && results.every((r) => r.status === "rejected")) {
    throw new Error("Tous les flux sont indisponibles pour le moment.");
  }
  return items.slice(0, 6);
}



async function loadSecteurContentFromSupabase() {
  const { data, error } = await supabase.from("secteur_content").select("secteur_id, aides, obligations, updated_at, updated_by");
  if (error) { console.error("Erreur chargement contenu secteurs :", error.message); return null; }
  const map = {};
  (data || []).forEach((row) => {
    map[row.secteur_id] = { aides: row.aides || [], obligations: row.obligations || [], updatedAt: row.updated_at, updatedBy: row.updated_by };
  });
  return map;
}


async function upsertSecteurContentRemote(secteurId, patch, updatedBy) {
  const { error } = await supabase.from("secteur_content").upsert({
    secteur_id: secteurId, ...patch, updated_at: new Date().toISOString(), updated_by: updatedBy || null,
  });
  if (error) console.error("Erreur sauvegarde contenu secteur :", error.message);
}


function getFormeJuridiqueItems(client) {
  const base = FORME_JURIDIQUE_CHECKLIST_ITEMS[client.formeJuridique] || [];
  const extra = client.secteur === "immobilier" ? HOLDING_CHECKLIST_ITEMS : [];
  return [...base, ...extra];
}



function normalizeText(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}


function classifyNaf(code) { const c=String(code||"").replace(/\s/g,"").replace(/([0-9]{2})([A-Z])/,"$1.$2"); return (NAF_SECTORS.find(([r])=>r.test(c))||[])[1] || "autres"; }


function classifyActivite(activiteText) {
  const norm = normalizeText(activiteText);
  if (!norm) return "";
  for (const entry of ACTIVITE_KEYWORDS) {
    for (const kw of entry.keywords) {
      if (norm.includes(normalizeText(kw))) return entry.secteurId;
    }
  }
  return "autres";
}



function currentMonthKey() { return MOIS_ORDER[new Date().getMonth()]; }


function previousMonthKey() { return MOIS_ORDER[(new Date().getMonth() + 11) % 12]; }



/* ============================================================
   MIGRATION — assure la compatibilité avec les anciennes données
   ============================================================ */
function migrateClients(list) {
  const year = CURRENT_YEAR();
  return (list || []).map((c, i) => {
    const next = { ...c };
    if (!next.id) next.id = next.siren ? `siren-${next.siren}` : `c-${i}-${next.nom || "x"}`;
    // Version locale toujours définie : elle est utilisée par le verrou optimiste
    // Supabase pour éviter qu'une modification réussie soit considérée comme un conflit au clic suivant.
    if (!Number(next._version)) next._version = 1;
    if (!next.portefeuilleId) next.portefeuilleId = "axe"; // valeur par défaut pour les données d'origine (avant multi-cabinets)
   if (!next.statutDossier) next.statutDossier = "actif"; // Actif / Inactif
    if (next.tvaRegime === "CA3" && !next.tvaPeriodicite) next.tvaPeriodicite = "mensuelle"; // valeur par défaut = comportement historique
    if (!next.tvaControle) next.tvaControle = {}; // { [mois]: { commentaire, par, date } } — remarques du contrôle TVA (cf. écran TVA)
    if (!next.expert) next.expert = "";
    if (!next.chefMission) next.chefMission = "";
    if (!next.dateCloture) next.dateCloture = "";
    if (!next.formeJuridique) next.formeJuridique = "";
    if (!next.regimeFiscal) next.regimeFiscal = "";
    if (!next.capital) next.capital = "";
    if (!next.activite) next.activite = "";
    if (!next.contact) next.contact = { telephone: "", email: "", adresse: "", codePostal: "", ville: "", contactNom: "", contactFonction: "" };
    if (next.secteurManuel == null) next.secteurManuel = false;
    if (!next.secteur) next.secteur = classifyNaf(next.codeNaf);
    if (!next.formeJuridiqueHistory) next.formeJuridiqueHistory = {};
    if (!next.lienSharepoint) next.lienSharepoint = "";
    if (!next.revision) next.revision = {};
    if (!next.missionsExceptionnelles) next.missionsExceptionnelles = [];
    next.missionsExceptionnelles = next.missionsExceptionnelles.map((m) => (
      m.statut === "livree" ? { ...m, statut: "valide" } : m
    ));
    // Facturation électronique : structure dédiée (remplace l'ancien bloc Corporate).
    if (!next.facturationElectronique) {
      next.facturationElectronique = {
        mandatAutoriseCabinet: null, plateformeChoisiePar: "", plateforme: "",
        inscritAnnuaire: null, annuaireDetails: "", acces: { url: "", identifiant: "", motDePasse: "", notes: "" }
      };
    }
    if (!next.ageAgoHistory) {
      next.ageAgoHistory = {};
      if (next.ageAgo && Object.keys(next.ageAgo).length) {
        next.ageAgoHistory[year] = {
          ago: !!next.ageAgo.ago, depose: false, deposePar: "",
          capitauxInf: !!next.ageAgo.capitauxInf, ageContinuite: !!next.ageAgo.ageContinuite,
        };
      }
    }
    if (!next.regimeHistory) next.regimeHistory = [];
    if (next.tvaExig == null) next.tvaExig = "";
    if (!next.honoraires) next.honoraires = { montant: "", historique: [] };
    if (!next.social) next.social = { concerne: false, effectif: "", cabinetPaie: "", periodicite: "Mensuelle", odMois: {} };
    if (!next.social) next.social = { concerne: false, effectif: "", cabinetPaie: "", periodicite: "Mensuelle", odMois: {} };
// nouveaux champs, à ajouter même si next.social existe déjà :
if (next.social.gestionnaireNom == null) next.social.gestionnaireNom = "";
if (next.social.gestionnaireEmail == null) next.social.gestionnaireEmail = "";
if (next.social.gestionnaireTel == null) next.social.gestionnaireTel = "";
if (next.social.conventionCollective == null) next.social.conventionCollective = "";
if (next.social.regimeDirigeant == null) next.social.regimeDirigeant = "";
    if (!next.missionStatus) {
      next.missionStatus = Object.fromEntries(MISSION_ALL_KEYS.map((k) => [k, next.mission?.[k] ? "fait" : "non_fait"]));
    } else {
      next.missionStatus = { ...Object.fromEntries(MISSION_ALL_KEYS.map((k) => [k, "non_fait"])), ...next.missionStatus };
    }
    if (!next.dossierAnnuelChecklist) next.dossierAnnuelChecklist = {};
    if (!next.demandesClient) next.demandesClient = [];
    if (!next.validationDossier) next.validationDossier = { collaborateur: false, chefMission: false, dateCollaborateur: "", dateChefMission: "", commentaire: "" };
    if (!next.rentabilite) next.rentabilite = { tempsPrevu: "", tempsReel: "", tarifHoraire: "", margeCible: "" };
    if (!next.documentsSuivi) next.documentsSuivi = { demandes: 0, recus: 0, controles: 0 };
    if (!next.notesCollab) next.notesCollab = [];
    if (!next.reunions) next.reunions = [];
    if (!Array.isArray(next.accesDossier)) next.accesDossier = [];
    if (!next.resiliation) {
  next.resiliation = {
    active: false, date: "", initiateur: "", motif: "", motifAutre: "",
    lettreEnvoyee: false, lettreDate: "", preavisRespecte: false,
    piecesRestituees: false, piecesRestitueesDate: "",
    confrereRepreneur: "", lettreConfraterniteEnvoyee: false, lettreConfraterniteRecue: false,
    honorairesSituation: "soldes", derniereCloture: "",
    historique: [],
  };
}
    const [annualNext, annualChanged] = normalizeAnnualClient(next, year);
    if (annualChanged) annualNext.__annualMigrationPending = true;
    return annualNext;
  });
}



/* ============================================================
   STATUT TVA EFFECTIF
   ============================================================ */
function effectiveTvaStatus(client, moisKey) {
  const manual = (client.tvaMois?.[moisKey] || "").toUpperCase();
  if (manual === "OK" || manual === "FAIT" || manual === "NA" || manual === "NON_VALIDE" || manual === "CONTROLE") return manual;

  // Régime CA12 : une seule déclaration annuelle, exigible en Mai N+1.
  // Les 11 autres mois de la grille ne sont pas concernés.
  if (client.tvaRegime === "CA12") {
    if (moisKey !== "Mai") return "";
    const exig = parseInt(client.tvaExig, 10) || 3;
    const now = new Date();
    const deadline = new Date(now.getFullYear(), 4, exig, 23, 59, 59); // 4 = Mai
    return deadline.getTime() < now.getTime() ? "RETARD" : "";
  }

 const exig = parseInt(client.tvaExig, 10);
  if (!exig) return "";
  // Régime CA3 en périodicité trimestrielle : seules les échéances de fin de
  // trimestre civil (Mars, Juin, Septembre, Décembre) sont concernées ; les
  // autres mois de la grille sont non applicables.
  if (client.tvaRegime === "CA3" && client.tvaPeriodicite === "trimestrielle" && !QUARTER_END_MONTHS.includes(moisKey)) {
    return "NA";
  }
  const monthIdx = MOIS_ORDER.indexOf(moisKey);
  const now = new Date();
  // Régime CA3 : la TVA du mois M est déclarée en M+1 (ex. la TVA de juillet
  // est exigible en août, et ne passe donc en retard qu'en août).
  const deadline = new Date(now.getFullYear(), monthIdx + 1, exig, 23, 59, 59);
  return deadline.getTime() < now.getTime() ? "RETARD" : "";
}


function tvaTone(status) {
  return status === "OK" ? "green" : status === "FAIT" ? "amber" : status === "CONTROLE" ? "blue" : status === "NON_VALIDE" ? "purple" : status === "RETARD" ? "red" : "neutral";
}


// Libellé affiché pour chaque statut de cellule TVA — centralisé pour rester cohérent
// entre la grille TVA et la fiche client.
function tvaStatusLabel(status) {
  return status === "RETARD" ? "Retard"
    : status === "FAIT" ? "Fait"
    : status === "CONTROLE" ? "Contrôlé — à déclarer"
    : status === "OK" ? "Validé"
    : status === "NON_VALIDE" ? "Non validé"
    : status === "NA" ? "N/A"
    : "·";
}



/* ============================================================
   ÉVÉNEMENTS FISCAUX — TVA / IS / CFE / Bilan / AGE-AGO
   ============================================================ */
function computeFiscalEvents(clients) {
  const events = [];
  const now = new Date();
  const year = now.getFullYear();

  clients.forEach((c) => {
   // TVA CA3 — la déclaration due ce mois-ci porte sur le mois précédent (M+1)
    if (c.tvaRegime === "CA3" && c.tvaExig) {
      const monthIdx = now.getMonth();
      const declaredMonthIdx = (monthIdx - 1 + 12) % 12;
      const declaredMonthKey = MOIS_ORDER[declaredMonthIdx];
      const isRelevantMonth = c.tvaPeriodicite !== "trimestrielle" || QUARTER_END_MONTHS.includes(declaredMonthKey);
      if (isRelevantMonth) {
        const status = effectiveTvaStatus(c, declaredMonthKey);
        if (status !== "OK" && status !== "NA") {
          events.push({
            id: `${c.id}-tva-${declaredMonthIdx}`, client: c, category: "TVA",
            label: `TVA ${MOIS_FULL[declaredMonthKey]}${c.tvaPeriodicite === "trimestrielle" ? " (trim.)" : ""}`,
            date: new Date(year, monthIdx, parseInt(c.tvaExig, 10) || 20),
            done: false, tone: tvaTone(status),
          });
        }
      }
    }
    // TVA CA12 — déclaration annuelle + acomptes du régime simplifié pour le millésime 2026.
    // Les taux sont paramétrables par millésime dans TVA Auto ; on n'affiche les acomptes
    // que pour 2026, afin de ne pas figer le calendrier au-delà de la réforme annoncée.
    if (c.tvaRegime === "CA12") {
      const status = effectiveTvaStatus(c, "Mai");
      if (status !== "OK" && status !== "NA") {
        events.push({
          id: `${c.id}-tva-ca12`, client: c, category: "TVA",
          label: "TVA annuelle (CA12)",
          date: new Date(year, 4, parseInt(c.tvaExig, 10) || 3),
          done: false, tone: tvaTone(status),
        });
      }
      if (year <= 2026) {
        const ref = Number(c.tvaAcompteReference || c.tvaDetails?.[`${year - 1}-12`]?.tvaDue || 0);
        const july = Number(c.tvaAcomptes?.[year]?.juillet?.montant || 0) || (ref > 0 ? ref * 0.55 : 0);
        const december = Number(c.tvaAcomptes?.[year]?.decembre?.montant || 0) || (ref > 0 ? ref * 0.40 : 0);
        const julyDone = String(c.tvaAcomptes?.[year]?.juillet?.statut || "").toUpperCase() === "PAYE";
        const decDone = String(c.tvaAcomptes?.[year]?.decembre?.statut || "").toUpperCase() === "PAYE";
        if (!julyDone) events.push({
          id: `${c.id}-tva-acompte-juillet-${year}`, client: c, category: "TVA",
          label: `Acompte TVA — juillet (55 %)${july ? ` · ${july.toLocaleString("fr-FR", {style:"currency", currency:"EUR"})}` : ""}`,
          date: new Date(year, 6, 15), done: false, tone: "amber",
        });
        if (!decDone) events.push({
          id: `${c.id}-tva-acompte-decembre-${year}`, client: c, category: "TVA",
          label: `Acompte TVA — décembre (40 %)${december ? ` · ${december.toLocaleString("fr-FR", {style:"currency", currency:"EUR"})}` : ""}`,
          date: new Date(year, 11, 15), done: false, tone: "amber",
        });
      }
    }
    // IS — acomptes (dates statutaires approximatives : 15 mars/juin/sept/déc)
    if (Number(c.is?.montantN1) > 3000) {
      [["mars", 2, "mars"], ["juin", 5, "juin"], ["sept", 8, "septembre"], ["dec", 11, "décembre"]].forEach(([key, m, label]) => {
        if (!c.is[key]) {
          events.push({
            id: `${c.id}-is-${key}`, client: c, category: "IS",
            label: `Acompte IS — ${label}`, date: new Date(year, m, 15), done: false, tone: "amber",
          });
        }
      });
    }
    // CFE — 15 juin / 15 déc
    if (Number(c.cfe?.montantN1) > 3000) {
      [["juin", 5, "juin (acompte)"], ["dec", 11, "décembre (solde)"]].forEach(([key, m, label]) => {
        if (!c.cfe[key]) {
          events.push({
            id: `${c.id}-cfe-${key}`, client: c, category: "CFE",
            label: `CFE — ${label}`, date: new Date(year, m, 15), done: false, tone: "amber",
          });
        }
      });
    }
    // Clôture d'exercice
    if (c.dateCloture && typeof c.dateCloture === "string") {
      const [cy, cm, cd] = c.dateCloture.split("-").map(Number);
      if (cy && cm && cd) {
        events.push({
          id: `${c.id}-cloture`, client: c, category: "Clôture",
          label: "Clôture d'exercice", date: new Date(cy, cm - 1, cd), done: false, tone: "neutral",
        });
        // Bilan (échéance approximative : clôture + 3 mois) si pas encore transmis
        if (!c.bilan?.transmis) {
          const echeance = addMonthsISO(c.dateCloture, 3);
          if (echeance) {
            const [by, bm, bd] = echeance.split("-").map(Number);
            events.push({
              id: `${c.id}-bilan`, client: c, category: "Bilan",
              label: "Dépôt du bilan", date: new Date(by, bm - 1, bd), done: false, tone: "red",
            });
          }
        }
      }
    }
    // AGE/AGO — approbation ~6 mois après clôture si non tenue
    if (c.dateCloture && typeof c.dateCloture === "string") {
      const latestYear = Object.keys(c.ageAgoHistory || {}).sort((a, b) => b - a)[0];
      const y = latestYear ? c.ageAgoHistory[latestYear] : null;
      if (y && !y.ago) {
        const echeance = addMonthsISO(c.dateCloture, 6);
        if (echeance) {
          const [ay, am, ad] = echeance.split("-").map(Number);
          events.push({
            id: `${c.id}-ago-${latestYear}`, client: c, category: "AGO",
            label: `Approbation des comptes ${latestYear}`, date: new Date(ay, am - 1, ad), done: false, tone: "amber",
          });
        }
      }
    }
  });
  return events;
}



// Alertes de proximité d'échéance (J-7 / J-3 / J-1), calculées à partir des mêmes
// événements fiscaux que le planning — pas de table ni de champ supplémentaire.
function computeEcheanceAlerts(clients) {
  const events = computeFiscalEvents(clients);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const thresholds = [7, 3, 1];
  const alerts = [];
  events.forEach((e) => {
    const d = new Date(e.date.getFullYear(), e.date.getMonth(), e.date.getDate());
    const diff = Math.round((d - today) / 86400000);
    if (thresholds.includes(diff)) {
      alerts.push({
        id: `alert-${e.id}-${diff}`,
        client_id: e.client.id,
        client_nom: e.client.nom,
        type: "echeance",
        message: `${e.client.nom} — ${e.label} dans ${diff} jour${diff > 1 ? "s" : ""}`,
        created_at: new Date().toISOString(),
        lu: false,
        isEcheance: true,
      });
    }
  });
  return alerts.sort((a, b) => a.message.localeCompare(b.message));
}


function taskBucket(date) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((d - today) / 86400000);
  if (diffDays < 0) return "retard";
  if (diffDays === 0) return "aujourdhui";
  if (diffDays === 1) return "demain";
  const weekStart = startOfWeek(today);
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 6);
  if (d >= weekStart && d <= weekEnd) return "semaine";
  if (d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()) return "mois";
  const q = Math.floor(today.getMonth() / 3);
  const dq = Math.floor(d.getMonth() / 3);
  if (dq === q && d.getFullYear() === today.getFullYear()) return "trimestre";
  return "plus-tard";
}



/* ============================================================
   STORAGE HELPERS
   ============================================================ */
/* ---- Clients : Supabase (table "clients", colonnes id text + data jsonb + portefeuille_id) ---- */
async function loadClientsFromSupabase() {
  const { data, error } = await supabase.from("clients").select("id, data, portefeuille_id");
  if (error) { console.error("Erreur chargement clients :", error.message); return null; }
  if (!data) return null;
  return data.map((row) => ({ id: row.id, portefeuilleId: row.portefeuille_id, ...(row.data || {}) }));
}


async function insertClientRemote(client) {
  const normalized = withAnnualSnapshot(client, CURRENT_YEAR());
  const { id, portefeuilleId, __annualMigrationPending, ...rest } = normalized;

  const { error } = await supabase
    .from("clients")
    .insert({
      id,
      data: rest,
      portefeuille_id: portefeuilleId || null
    });

  if (error) {
    console.error("Erreur création client :", error.message);
    return { ok: false, error };
  }
  return { ok: true };
}


async function updateClientRemote(id, client, expectedVersion) {
  // Le verrou optimiste compare la version actuellement connue en mémoire
  // à celle stockée dans Supabase. Le client peut déjà contenir la version
  // optimiste suivante : on utilise donc explicitement expectedVersion comme
  // version attendue, puis on écrit expectedVersion + 1.
  const base = Math.max(1, Number(
    expectedVersion != null ? expectedVersion : (Number(client?._version || 1) - 1)
  ));
  const next = base + 1;
  const normalized = withAnnualSnapshot({ ...client, _version: next }, CURRENT_YEAR());
  const { id: _id, portefeuilleId, __annualMigrationPending, ...rest } = normalized;

  const q = await supabase
    .from("clients")
    .update({ data: rest, portefeuille_id: portefeuilleId || null })
    .eq("id", id)
    .eq("data->>_version", String(base))
    .select("id,data,portefeuille_id")
    .maybeSingle();

  if (!q.error && q.data) return { ok: true, version: next, data: q.data };

  if (!q.error && !q.data) {
    // Cas de compatibilité pour une ancienne ligne sans _version.
    const r = await supabase.from("clients").select("id,data").eq("id", id).maybeSingle();
    if (Number(r.data?.data?._version || 0) === 0 && base === 1) {
      const b = await supabase
        .from("clients")
        .update({ data: rest, portefeuille_id: portefeuilleId || null })
        .eq("id", id)
        .select("id,data,portefeuille_id")
        .maybeSingle();
      if (!b.error && b.data) return { ok: true, version: next, data: b.data };
    }
    return { ok: false, conflict: true, error: new Error("Dossier modifié par un autre utilisateur") };
  }

  return { ok: false, error: q.error };
}



async function deleteClientRemote(id) {
  const { error } = await supabase
    .from("clients")
    .delete()
    .eq("id", id);

  if (error) {
    throw error;
  }
}


/* ---- Équipe : Supabase (table "team"). Un compte = un collaborateur.
   Chaque inscription (email + mot de passe) crée automatiquement, côté base
   de données, une fiche "team" qui lui est liée (voir trigger handle_new_user
   dans supabase-init.sql). Le rôle (collaborateur / expert / chef_mission / gestionnaire_paie / admin)
   et le portefeuille (cabinet) déterminent ce que la personne peut voir et faire. ---- */

async function invokeDemoFunction(action, payload = {}) {
  const { data, error } = await supabase.functions.invoke("novacab-demo", {
    body: { action, ...payload },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}



async function ensureCurrentUserTeamRemote() {
  const { data, error } = await supabase.rpc("ensure_current_user_team");
  if (error) {
    console.warn("Synchronisation du compte avec l'équipe impossible :", error.message);
    return null;
  }
  return data || null;
}



async function loadTeamFromSupabase() {
  // Compatibilité avec les schémas team existants. Les colonnes de comptes
  // démo sont optionnelles : leur absence ne doit jamais bloquer le chargement
  // de l'équipe ni l'accès des comptes normaux.
  const { data, error } = await supabase.from("team")
    .select("id, nom, color, email, telephone, cabinet_nom, role, statut, portefeuille_id, auth_user_id")
    .order("nom", { ascending: true });
  if (error) { console.error("Erreur chargement équipe :", error.message); return null; }
  return (data || []).map((row) => ({
    ...row,
    // Valeurs par défaut pour rester compatible avec les anciennes bases.
    is_demo: false,
    demo_expires_at: null,
  }));
}


async function loadMyContractStatusRemote(authUserId) {
  if (!authUserId) return null;
  const { data, error } = await supabase
    .from("cabinet_contracts")
    .select("id, statut, contract_version, accepted_at, portefeuille_id")
    .eq("auth_user_id", authUserId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) { console.warn("Lecture du contrat impossible :", error.message); return null; }
  return data || null;
}



async function acceptMyCabinetContractRemote() {
  const { data, error } = await supabase.rpc("accept_my_cabinet_contract", {
    p_contract_version: "NOVACAB-2026-08",
  });
  if (error) throw error;
  return data;
}



async function insertTeamMemberRemote(member) {
  const { error } = await supabase.from("team").insert(member);
  if (error) console.error("Erreur création collaborateur :", error.message);
}


async function updateSuperAdminTeamMemberRemote(id, patch) {
  const { data, error } = await supabase.rpc("super_admin_update_team_member", {
    p_team_id: id,
    p_patch: patch || {},
  });
  if (error) { console.error("Erreur mise à jour Super Admin :", error.message); return false; }
  return !!data;
}


async function updateTeamMemberRemote(id, patch) {
  // Validation d'un compte en attente : passage obligatoire par le RPC sécurisé.
  // Un nouveau compte n'a pas encore de portefeuille, donc un UPDATE RLS classique
  // peut être refusé avant même que le portefeuille puisse lui être attribué.
  if (patch?.statut === "actif" && patch?.portefeuille_id) {
    const { error } = await supabase.rpc("approve_team_account", {
      p_team_id: id,
      p_portefeuille_id: patch.portefeuille_id,
      p_role: patch.role || "collaborateur",
    });
    if (error) { console.error("Erreur validation compte :", error.message); return false; }
    return true;
  }

  const { error } = await supabase.from("team").update(patch).eq("id", id);
  if (error) { console.error("Erreur mise à jour collaborateur :", error.message); return false; }
  return true;
}


async function deleteTeamMemberRemote(id) {
  const { error } = await supabase.from("team").delete().eq("id", id);
  if (error) console.error("Erreur suppression collaborateur :", error.message);
}



/* ---- Portefeuilles : les cabinets clients de l'outil (NOVACAB, KOF Experts, …) ---- */
async function loadPortefeuillesFromSupabase() {
  const { data, error } = await supabase.from("portefeuilles").select("id, nom, domaine").order("nom", { ascending: true });
  if (error) { console.error("Erreur chargement portefeuilles :", error.message); return null; }
  return data;
}


async function insertPortefeuilleRemote(p) {

  const { data, error } = await supabase.rpc(
    "create_portefeuille_as_super_admin",
    {
      p_nom: p.nom,
      p_domaine: p.domaine || null,
    }
  );

  if (error) {
    console.error(
      "Erreur création portefeuille :",
      error.message
    );

    return {
      error,
      data: null,
    };
  }

  console.log(
    "Portefeuille créé avec succès :",
    data
  );

  return {
    error: null,
    data,
  };
}


async function archivePortefeuilleRemote(id, reason = null) {
  const { error } = await supabase.from("portefeuilles").update({ statut: "resilie", resiliation_motif: reason, resilie_at: new Date().toISOString() }).eq("id", id);
  if (error) console.error("Erreur résiliation portefeuille :", error.message);
  return error;
}


async function deletePortefeuilleRemote(id) {
  const { error } = await supabase.rpc("delete_empty_portefeuille", { target_portefeuille_id: id });
  if (error) console.error("Erreur suppression portefeuille :", error.message);
  return error;
}


async function loadNotificationsFromSupabase(teamId) {
  return fetchProductNotifications({ limit: 30 });
}

async function insertNotificationRemote(n) {
  return insertProductNotification(n);
}

async function markNotificationReadRemote(id) {
  return markProductNotificationRead(id);
}

async function loadOrganismesSociauxRemote(portefeuilleId, clientId = null) {
  return loadOrganismesSociaux(portefeuilleId, clientId);
}


async function insertOrganismeSocialRemote(row) {
  return insertOrganismeSocial(row);
}


async function updateOrganismeSocialRemote(id, patch) {
  return updateOrganismeSocial(id, patch);
}


async function deleteOrganismeSocialRemote(id) {
  return deleteOrganismeSocial(id);
}


async function loadCollaboratorProfileRemote(teamId) {
  if (!teamId) return null;
  const { data, error } = await supabase.from("team_profiles").select("*").eq("team_id", teamId).maybeSingle();
  if (error) { console.warn("Profil collaborateur distant indisponible :", error.message); return null; }
  return data || null;
}


async function upsertCollaboratorProfileRemote(teamId, payload) {
  if (!teamId) return null;
  const row = { team_id: teamId, ...payload, updated_at: new Date().toISOString() };
  const { data, error } = await supabase.from("team_profiles").upsert(row, { onConflict: "team_id" }).select().single();
  if (error) { console.warn("Impossible d'enregistrer le profil collaborateur :", error.message); return null; }
  return data;
}



function formatMailAmount(v) {
  if (v === undefined || v === null || String(v).trim() === "") return "À renseigner";
  return String(v).includes("€") ? String(v) : `${v} €`;
}


function buildNovacabMail(template, client, cabinetName, tvaDeclaration = null) {
  const contact = client?.contact?.contactNom || "Madame, Monsieur";
  const period = tvaDeclaration?.period || (client?.tvaRegime === "CA12" ? "CA12 annuel" : currentMonthKey());
  const declarationReady = tvaDeclaration?.status === "validated";
  const htEncaisse = declarationReady
    ? Number(tvaDeclaration.base_ht_20 || 0) + Number(tvaDeclaration.base_ht_10 || 0) + Number(tvaDeclaration.base_ht_55 || 0) + Number(tvaDeclaration.base_ht_21 || 0)
    : null;
  const values = {
    client: client?.nom || "votre société",
    contact,
    cabinet: cabinetName || "NOVACAB",
    periode: period,
    ht_encaisse: declarationReady ? formatMailAmount(htEncaisse) : "",
    tva_collectee: declarationReady ? formatMailAmount(Number(tvaDeclaration.total_collected || 0)) : "",
    tva_deductible: declarationReady ? formatMailAmount(Number(tvaDeclaration.total_deductible || 0)) : "",
    tva_sous_traitant: declarationReady ? formatMailAmount(Number(tvaDeclaration.autoliquidation_tva || 0)) : "",
    montant_a_payer: declarationReady ? formatMailAmount(Math.max(Number(tvaDeclaration.net_tva || 0), 0)) : "",
    autres_tva: ""
  };
  const replace = (text) => String(text || "").replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_, key) => values[key] ?? "");
  return { subject: replace(template.subject), body: replace(template.body) };
}



/* ============================================================
   HELPERS
   ============================================================ */
function isTvaLate(client) {
  if (!client.tvaRegime || client.tvaRegime === "FRANCHISE") return false;
  return effectiveTvaStatus(client, currentMonthKey()) === "RETARD";
}


function seuilEffectifAlert(effectif) {
  const n = parseInt(effectif, 10);
  if (!n) return null;
  if (n >= 50) return { label: "≥ 50 salariés", tone: "red" };
  if (n >= 45) return { label: "Approche 50", tone: "amber" };
  if (n >= 11) return { label: "≥ 11 salariés", tone: "amber" };
  if (n >= 9) return { label: "Approche 11", tone: "amber" };
  return null;
}


function missionCompletion(client) {
  const statusMap = Object.fromEntries(MISSION_ALL_KEYS.map((k) => [k, getDPStatus(client, k)]));
  const p = checklistProgress(statusMap, DP_CHECKLIST_ITEMS);
  return { done: p.fait, total: p.total, pct: p.pct, enCours: p.enCours, nonFait: p.nonFait };
}


function isBilanLate(client) {
  const b = client.bilan || {};
  if (b.transmis) return false;
  const echeance = getBilanEcheance(client.dateCloture);
  return !!(echeance && todayISO() > echeance);
}


function computeCounts(clients) {
  const total = clients.length;
  const tvaAlert = clients.filter(isTvaLate).length;
  const bilanRetard = clients.filter(isBilanLate).length;
  const missionIncomplete = clients.filter((c) => { const m = missionCompletion(c); return m && m.pct < 100; }).length;
  const ageAlert = clients.filter((c) => Object.values(c.ageAgoHistory || {}).some((y) => y.capitauxInf || y.ageContinuite)).length;
  return { total, tvaAlert, bilanRetard, missionIncomplete, ageAlert };
}


function filterByRole(clients, me, roleFilter) {
  if (roleFilter === "Collaborateur") return clients.filter((c) => c.collab === me);
  if (roleFilter === "Expert") return clients.filter((c) => c.expert === me);
  if (roleFilter === "Chef de mission") return clients.filter((c) => c.chefMission === me);
  return clients;
}


function filterClients(clients, search, roleFilter, me, regimeFilter, statutFilter = "actif") {
  let out = filterByRole(clients, me, roleFilter || "Tous");
  // Les dossiers placés en corbeille restent stockés mais sont exclus de toutes les vues métier.
  out = out.filter((c) => !c.corbeilleDossier);
  if (statutFilter === "actif") out = out.filter((c) => (c.statutDossier || "actif") === "actif");
  else if (statutFilter === "transfert") out = out.filter((c) => c.statutDossier === "transfert");
  else if (statutFilter === "inactif") out = out.filter((c) => c.statutDossier === "inactif");
  // statutFilter === "tous" -> pas de filtre supplémentaire
  if (regimeFilter && regimeFilter !== "Tous") out = out.filter((c) => c.tvaRegime === regimeFilter);
  // APRÈS
if (search.trim()) {
    const q = search.trim().toLowerCase();
    out = out.filter((c) => c.nom.toLowerCase().includes(q) || String(c.siren || "").includes(q));
}
  return out;
}



function buildDistribution(
  clients,
  keyFn,
  labelFn,
  colorFn
) {
  const map = new Map();

  clients.forEach((client) => {
    const key =
      keyFn(client) || "non_renseigne";

    map.set(
      key,
      (map.get(key) || 0) + 1
    );
  });

  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([key, value], i) => ({
      key,
      label: labelFn(key),
      value,
      color:
        colorFn?.(key, i) ||
        DASHBOARD_CHART_COLORS[
          i % DASHBOARD_CHART_COLORS.length
        ],
    }));
}



function inferLegalForm(client) {
  if (client.formeJuridique) {
    return client.formeJuridique;
  }

  const text =
    `${client.nom || ""} ${client.raisonSociale || ""}`
      .toUpperCase();

  const forms = [
    "SASU",
    "SARL",
    "EURL",
    "SAS",
    "SCI",
    "SELARL",
    "SNC",
    "SA",
  ];

  return (
    forms.find(
      (f) => new RegExp(`\\b${f}\\b`).test(text)
    ) || "Non renseignée"
  );
}



function inferCategorieFiscale(client) {
  const explicit = String(client?.categorieFiscale || client?.categorieFiscaleBICBNC || client?.categorieImposition || "").trim().toUpperCase();
  if (explicit) {
    if (explicit.includes("BNC")) return "BNC";
    if (explicit.includes("BIC")) return "BIC";
    if (explicit.includes("BA")) return "BA";
    if (explicit.includes("EI")) return "EI";
    if (explicit.includes("IS")) return "IS";
  }
  const forme = String(inferLegalForm(client) || client?.formeJuridique || "").toUpperCase();
  const activite = normalizeText(client?.activite || "");
  if (forme === "EI" || forme === "EIRL") {
    const liberal = ["medecin","avocat","architecte","consultant","conseil","infirmier","kinesitherapeute","psychologue","expert comptable","formation","profession liberale"];
    if (liberal.some(k => activite.includes(normalizeText(k)))) return "BNC";
    return "EI";
  }
  if (["SCI","SELARL","SELAS"].includes(forme) && (client?.regimeFiscal || "").toUpperCase() === "IR") return "IR";
  if ((client?.regimeFiscal || "").toUpperCase() === "IS") return "IS";
  const liberal = ["medecin","avocat","architecte","consultant","conseil","infirmier","kinesitherapeute","psychologue","expert comptable","formation","profession liberale"];
  if (liberal.some(k => activite.includes(normalizeText(k)))) return "BNC";
  const agricole = ["agriculture","exploitation agricole","elevage","culture"];
  if (agricole.some(k => activite.includes(normalizeText(k)))) return "BA";
  return "BIC";
}


/* ============================================================
   MOBILE KPI SUMMARY (variante "C") — remplace la grille de
   KpiCard sur mobile : une seule carte de synthèse avec des
   pastilles de couleur, le détail chiffré s'ouvrant dans une
   modale plein écran. La grille de KpiCard reste affichée telle
   quelle à partir de md: (desktop/tablette).
   Usage : <MobileKpiSummary title="…" items={[{label, value, tone, onClick}]} />
   ============================================================ */
function toneColors(tone) {
  if (tone === "red") return { dot: "#F87171", text: T.red };
  if (tone === "amber") return { dot: "#FBBF24", text: T.amber };
  if (tone === "green") return { dot: "#34D399", text: T.green };
  return { dot: "#93C5FD", text: T.navy };
}


function uid() { return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }



async function downloadOrganismesTemplate() {
  const XLSX = await import("xlsx");
  const rows = [
    { Client: "Nom société", SIREN: "799300223", SIRET: "98297797700015", Organisme: "URSSAF", Libellé: "Compte principal", Identifiant: "2PYJ", "Mot de passe": "", URL: "https://www.urssaf.fr", Note: "" },
    { Client: "Nom société", SIREN: "799300223", SIRET: "98297797700015", Organisme: "NET ENTREPRISE", Libellé: "Compte principal", Identifiant: "MUNAWAR IQBAL", "Mot de passe": "", URL: "https://www.net-entreprises.fr", Note: "" },
    { Client: "ARC BTP", SIREN: "123456789", SIRET: "12345678901234", Organisme: "CIBTP", Libellé: "Compte principal", Identifiant: "ABC123", "Mot de passe": "", URL: "", Note: "Exemple BTP" },
  ];
  const instructions = [
    ["Champ", "Obligatoire", "Description", "Exemple"],
    ["Client", "Oui si SIREN/SIRET absent", "Nom exact du dossier dans NOVACAB", "Nom société"],
    ["SIREN", "Oui si Client absent", "Identifiant entreprise utilisé pour le rapprochement", "799300223"],
    ["SIRET", "Optionnel", "Permet un rapprochement complémentaire", "98297797700015"],
    ["Organisme", "Oui", "URSSAF, NET ENTREPRISE, SYLAE, CIBTP, PRO BTP, OPCO…", "URSSAF"],
    ["Libellé", "Non", "Nom libre du compte / dossier", "Compte principal"],
    ["Identifiant", "Non", "Login, identifiant ou nom de compte", "2PYJ"],
    ["Mot de passe", "Non", "Secret / mot de passe", "********"],
    ["URL", "Non", "Adresse du portail", "https://www.urssaf.fr"],
    ["Note", "Non", "Précision complémentaire", "Compte principal"],
    [],
    ["Règles d'import", "", "", ""],
    ["1", "", "Une ligne = un accès organisme pour un dossier.", ""],
    ["2", "", "Le dossier est recherché par nom exact, puis SIREN, puis SIRET.", ""],
    ["3", "", "Client/Dossier ou SIREN/SIRET + Organisme sont nécessaires.", ""],
    ["4", "", "Identifiant, mot de passe, URL et note peuvent être vides.", ""],
    ["5", "", "Les lignes non reconnues sont affichées avant import et ne sont jamais écrites automatiquement.", ""],
  ];
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [18,14,18,22,24,24,22,36,28].map(w => ({ wch:w }));
  XLSX.utils.book_append_sheet(wb, ws, "Accès organismes");
  const wi = XLSX.utils.aoa_to_sheet(instructions);
  wi["!cols"] = [{wch:28},{wch:20},{wch:72},{wch:30}];
  XLSX.utils.book_append_sheet(wb, wi, "Instructions");
  XLSX.writeFile(wb, "modele-acces-organismes-sociaux-NOVACAB.xlsx");
}



/* ============================================================
   CADRE SOCIAL — le cabinet ne fait pas la paie, mais suit la
   réception et la comptabilisation des OD de salaire mois par mois.
   ============================================================ */
function odCycle(val) {
  const v = (val || "").toUpperCase();
  return v === "" ? "RECU" : v === "RECU" ? "COMPTA" : v === "COMPTA" ? "NA" : "";
}


function odTone(val) {
  const v = (val || "").toUpperCase();
  return v === "COMPTA" ? "green" : v === "RECU" ? "amber" : v === "NA" ? "neutral" : "neutral";
}


function odLabel(val) {
  const v = (val || "").toUpperCase();
  return v === "COMPTA" ? "Compta" : v === "RECU" ? "Reçu" : v === "NA" ? "N/A" : "·";
}


function bankCycle(val) {
  const v = (val || "").toUpperCase();
  return v === "" ? "FAIT" : v === "FAIT" ? "NA" : "";
}


function bankTone(val) {
  const v = (val || "").toUpperCase();
  return v === "FAIT" ? "green" : v === "NA" ? "neutral" : "neutral";
}


function bankLabel(val) {
  const v = (val || "").toUpperCase();
  return v === "FAIT" ? "Fait" : v === "NA" ? "N/A" : "·";
}


const isBtpClient = (client) => {
  const naf = String(client?.codeNaf || "").trim().replace(/[^0-9A-Z]/gi, "").toUpperCase();
  if (BTP_NAF_PREFIXES.some(prefix => naf.startsWith(prefix))) return true;
  if (client?.secteur === "batiment") return true;
  const activity = normalizeText(client?.activite || "");
  return ACTIVITE_KEYWORDS.find(x => x.secteurId === "batiment")?.keywords.some(k => activity.includes(normalizeText(k))) || false;
};


function cotisationTypesFor(client) {
  return isBtpClient(client) ? [...COTISATION_TYPES, ...COTISATION_TYPES_BTP] : COTISATION_TYPES;
}

 // hauteur en px d'un créneau d'1h

function planningBucket(task, weekStart) {
  if (!task.date_echeance) return "sans-date";
  const [y, m, d] = task.date_echeance.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.round((date - today) / 86400000);
  if (diff < 0) return "retard";
  if (diff === 0) return "aujourdhui";
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 6);
  if (date >= weekStart && date <= weekEnd) return "semaine";
  return "plus-tard";
}


/* ---- Export .ics (Outlook / calendrier) ----
   Une synchronisation live à deux sens nécessiterait un serveur avec l'API
   Microsoft Graph + OAuth, impossible depuis une appli 100% front-end. On génère
   donc ici un fichier .ics standard téléchargeable, importable manuellement dans
   Outlook (Fichier > Ouvrir & exporter > Importer/Exporter, ou double-clic direct). */
function icsEscape(str) {
  return String(str || "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}


function icsDateTime(dateISO, timeHHMM) {
  const [y, m, d] = dateISO.split("-").map(Number);
  const [h, min] = (timeHHMM || "09:00").split(":").map(Number);
  return `${String(y).padStart(4, "0")}${String(m).padStart(2, "0")}${String(d).padStart(2, "0")}T${String(h).padStart(2, "0")}${String(min).padStart(2, "0")}00`;
}


function icsDateTimePlusMinutes(dateISO, timeHHMM, minutes) {
  const [y, m, d] = dateISO.split("-").map(Number);
  const [h, min] = (timeHHMM || "09:00").split(":").map(Number);
  const dt = new Date(y, m - 1, d, h, min);
  dt.setMinutes(dt.getMinutes() + (minutes || 60));
  return `${dt.getFullYear()}${String(dt.getMonth() + 1).padStart(2, "0")}${String(dt.getDate()).padStart(2, "0")}T${String(dt.getHours()).padStart(2, "0")}${String(dt.getMinutes()).padStart(2, "0")}00`;
}


function buildPlanningICS(tasks, clientById) {
  const now = new Date();
  const stamp = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}${String(now.getUTCDate()).padStart(2, "0")}T${String(now.getUTCHours()).padStart(2, "0")}${String(now.getUTCMinutes()).padStart(2, "0")}${String(now.getUTCSeconds()).padStart(2, "0")}Z`;
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//NOVACAB//Planning//FR", "CALSCALE:GREGORIAN", "METHOD:PUBLISH"];
  tasks.filter((t) => t.date_echeance && t.heure_debut).forEach((t) => {
    const client = clientById[t.client_id];
    const summary = client ? `${client.nom} — ${t.nom}` : t.nom;
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${t.id}@novacab.planning`);
    lines.push(`DTSTAMP:${stamp}`);
    lines.push(`DTSTART:${icsDateTime(t.date_echeance, t.heure_debut)}`);
    lines.push(`DTEND:${icsDateTimePlusMinutes(t.date_echeance, t.heure_debut, t.duree_minutes || 60)}`);
    lines.push(`SUMMARY:${icsEscape(summary)}`);
    if (t.commentaire) lines.push(`DESCRIPTION:${icsEscape(t.commentaire)}`);
    lines.push("END:VEVENT");
  });
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}


function exportPlanningToICS(tasks, clientById) {
  const ics = buildPlanningICS(tasks, clientById);
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `planning-novacab-${todayISO()}.ics`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}


export { TvaAutomation, T, PALETTE, SEED_AIDES_SECTEUR, SECTEURS_ACTIVITE, TVA_PERIODICITES, TVA_PERIODICITE_LABELS, REGIMES_TVA, REGIMES_TVA_LABELS, MOIS_ORDER, MOIS_FULL, QUARTER_END_MONTHS, DASHBOARD_CHART_COLORS, PLANNING_FILTERS, PLANNING_HOURS, PLANNING_SLOT_H, TASK_PRIORITE_TONE, PAYMENT_STATUS_OPTIONS, MISSION_EXCEP_TYPES, MISSION_EXCEP_STATUTS, MISSION_EXCEP_STATUT_LABELS, RESILIATION_INITIATEURS, RESILIATION_MOTIFS, ACCES_CATEGORIES, REPRISE_PIECES, ROLE_FILTER_OPTIONS, STATUT_FILTER_OPTIONS, COLLAB_SECTIONS, ACTIVITY_TYPE_LABELS, NOVACAB_MAIL_TEMPLATES, MISSION_GROUPS, MISSION_ALL_KEYS, CHECKLIST_STATUS_ORDER, buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, updateSuperAdminTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS, exportTvaDeadlinesToExcel, importTvaDeadlinesFromExcel };
