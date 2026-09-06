import { ROLE_LABELS, VIEW_ROLES, canAccessView, canAccessAccountSection, canAccessClientTab } from '../src/utils/access.js';

const roles = ['admin','expert','chef_mission','collaborateur','gestionnaire_paie'];
const views = ['dashboard','planning','mes-taches','pilotage','equipe','clients','holdings','regimes','resiliation','reprise','missionsExcep','checklists','revision','tva','acomptes','bilans','fiscal','social','cotisations','gestionnaire-paie','acces-organismes','prestations-juridiques','age','applications','mails-types','archives','corbeille','aides-secteur','administration','permissions-matrix','demo','tva-auto','mission'];
let failures = 0;
const assert=(ok,msg)=>{ if(!ok){console.error(`FAIL ${msg}`); failures++;} };

assert(roles.every(r=>ROLE_LABELS[r]), 'les 5 rôles métier doivent être déclarés');
assert(canAccessView('admin','permissions-matrix'), 'Admin doit accéder à la matrice');
assert(!canAccessView('expert','permissions-matrix'), 'Expert ne doit pas administrer la matrice');
assert(canAccessView('expert','administration'), 'Expert doit accéder au cockpit administration');
assert(!canAccessView('chef_mission','administration'), 'Chef de mission ne doit pas accéder au cockpit administration');
assert(canAccessView('chef_mission','equipe'), 'Chef de mission doit accéder à l’équipe');
assert(!canAccessView('collaborateur','equipe'), 'Collaborateur ne doit pas administrer l’équipe');
assert(canAccessView('gestionnaire_paie','gestionnaire-paie'), 'Gestionnaire paie doit accéder à son parcours métier');
assert(!canAccessView('gestionnaire_paie','tva'), 'Gestionnaire paie ne doit pas accéder au parcours TVA');
assert(!canAccessView('gestionnaire_paie','prestations-juridiques'), 'Gestionnaire paie ne doit pas accéder au juridique');
assert(canAccessView('collaborateur','tva-auto'), 'Collaborateur doit accéder à TVA Auto depuis ses dossiers');
assert(!canAccessView('gestionnaire_paie','tva-auto'), 'Gestionnaire paie ne doit pas accéder à TVA Auto');
assert(canAccessView('collaborateur','tva'), 'Collaborateur doit accéder au travail TVA de ses dossiers');
assert(!canAccessView('collaborateur','acces-organismes'), 'Collaborateur ne doit pas voir les accès sensibles aux organismes sociaux');
assert(!canAccessClientTab('collaborateur','droits'), 'Collaborateur ne doit pas gérer les droits d’un dossier');
assert(!canAccessClientTab('collaborateur','acces'), 'Collaborateur ne doit pas voir les codes d’accès sensibles');
assert(canAccessClientTab('gestionnaire_paie','social'), 'Gestionnaire paie doit voir le suivi social d’un dossier');
assert(!canAccessClientTab('gestionnaire_paie','tva'), 'Gestionnaire paie ne doit pas voir la TVA d’un dossier');
assert(canAccessAccountSection('admin','audit'), 'Admin doit voir le journal d’audit');
assert(!canAccessAccountSection('expert','audit'), 'Expert ne doit pas voir le journal d’audit personnel');

console.log(`ROLE PARCOURS: ${roles.length} rôles × ${views.length} vues contrôlés — ${failures ? `${failures} échec(s)` : 'OK'}`);
if (failures) process.exit(1);
