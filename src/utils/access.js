export const ROLE_LABELS={collaborateur:"Collaborateur",expert:"Expert",chef_mission:"Chef de mission",gestionnaire_paie:"Gestionnaire de paie",admin:"Admin"};
export const displayCabinetName=(name)=>name||"NOVACAB";
export const canViewOrganismesSociaux=(role)=>["admin","expert","chef_mission"].includes(role);
export const canEditOrganismesSociaux=(role)=>["admin","expert","chef_mission"].includes(role);
export const canAccessOrganismesSociaux=canEditOrganismesSociaux;
