export const ROLE_LABELS={collaborateur:"Collaborateur",expert:"Expert",chef_mission:"Chef de mission",gestionnaire_paie:"Gestionnaire de paie",admin:"Admin"};
export const MANAGEMENT_ROLES=["admin","expert","chef_mission"];
export const ADMIN_ROLES=["admin"];
export const STAFF_ROLES=["admin","expert","chef_mission","collaborateur","gestionnaire_paie"];

// Autorisation de navigation : la Sidebar masque ces entrées, mais cette table
// protège aussi la navigation directe/restaurée depuis localStorage.
export const VIEW_ROLES={
  dashboard: STAFF_ROLES,
  pilotage: MANAGEMENT_ROLES,
  equipe: MANAGEMENT_ROLES,
  demo: ADMIN_ROLES,
  "administration": ["admin","expert"],
  "demandes-administration": ["expert","chef_mission","collaborateur","gestionnaire_paie"],
  "permissions-matrix": ADMIN_ROLES,
  corbeille: ADMIN_ROLES,
  "acces-organismes": MANAGEMENT_ROLES,
  "gestionnaire-paie": ["admin","expert","chef_mission","gestionnaire_paie"],
  social: ["admin","expert","chef_mission","gestionnaire_paie"],
  cotisations: ["admin","expert","chef_mission","gestionnaire_paie"],
  "prestations-juridiques": ["admin","expert","chef_mission"],
  age: ["admin","expert","chef_mission"],
  resiliation: ["admin","expert","chef_mission"],
  reprise: ["admin","expert","chef_mission"],
  missionsExcep: ["admin","expert","chef_mission"],
  holdings: ["admin","expert","chef_mission"],
  regimes: ["admin","expert","chef_mission"],
  checklists: ["admin","expert","chef_mission","collaborateur"],
  revision: ["admin","expert","chef_mission","collaborateur"],
  tva: ["admin","expert","chef_mission","collaborateur"],
  acomptes: ["admin","expert","chef_mission","collaborateur"],
  bilans: ["admin","expert","chef_mission","collaborateur"],
  fiscal: ["admin","expert","chef_mission","collaborateur"],
  applications: STAFF_ROLES,
  "mails-types": STAFF_ROLES,
  archives: STAFF_ROLES,
  planning: STAFF_ROLES,
  "mes-taches": STAFF_ROLES,
  "mon-espace": STAFF_ROLES,
  "tva-auto": ["admin","expert","chef_mission","collaborateur"],
  mission: ["admin","expert","chef_mission","collaborateur"],
  clients: STAFF_ROLES,
};

export function canAccessView(role, view){
  if (!role) return false;
  if (role === "super_admin") return view === "super-audit" || view === "super-cabinets" || view === "super-team" || view === "super-demandes" || view === "super-tva" || view === "super-tech" || view === "super-abonnements" || view === "admin-collaborateurs" || view === "demo" || view === "equipe";
  const allowed=VIEW_ROLES[view];
  return !allowed || allowed.includes(role);
}

export const CLIENT_TAB_ROLES={
  droits: MANAGEMENT_ROLES,
  acces: MANAGEMENT_ROLES,
  accesSociaux: MANAGEMENT_ROLES,
  social: ["admin","expert","chef_mission","gestionnaire_paie"],
  age: MANAGEMENT_ROLES,
  formeJuridique: MANAGEMENT_ROLES,
};
const COLLAB_CLIENT_TABS=["overview","tickets","reunions","checklists","infos","contact","facturationElectronique","tva","bilan","acomptes","revision","suivi","rentabilite","validation","notes","historique"];
const PAIE_CLIENT_TABS=["overview","tickets","reunions","infos","contact","facturationElectronique","social","suivi","rentabilite","notes","historique"];
export function canAccessClientTab(role, tab){
  if (MANAGEMENT_ROLES.includes(role)) return true;
  if (role === "collaborateur") return COLLAB_CLIENT_TABS.includes(tab);
  if (role === "gestionnaire_paie") return PAIE_CLIENT_TABS.includes(tab);
  return false;
}

export function canAccessAccountSection(role, section){
  if (section === "audit") return role === "admin" || role === "super_admin";
  return STAFF_ROLES.includes(role) || role === "super_admin";
}

export const FIELD_PERMISSIONS={tvaControle:["admin","expert","chef_mission"],tvaPaiements:["admin","expert","chef_mission"],is:["admin","expert","chef_mission"],cfe:["admin","expert","chef_mission"],honoraires:["admin","expert","chef_mission"],resiliation:["admin","expert","chef_mission"],facturationElectronique:["admin","expert","chef_mission"],portefeuilleId:["admin"],collab:["admin","expert","chef_mission"],expert:["admin","expert","chef_mission"],chefMission:["admin","expert","chef_mission"],statutDossier:["admin","expert","chef_mission"]};
export function filterEditablePatch(role,patch={}){return Object.fromEntries(Object.entries(patch).filter(([k])=>!FIELD_PERMISSIONS[k]||FIELD_PERMISSIONS[k].includes(role)||role==="admin"))}
export const displayCabinetName=(name)=>name||"NOVACAB";
export const canViewOrganismesSociaux=(role)=>["admin","expert","chef_mission"].includes(role);
export const canEditOrganismesSociaux=(role)=>["admin","expert","chef_mission"].includes(role);
export const canAccessOrganismesSociaux=canEditOrganismesSociaux;
