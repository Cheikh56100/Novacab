import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];
const warnings = [];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const p = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(p) : [p];
  });
}

const files = walk(path.join(root, "src")).filter(f => /\.(js|jsx|ts|tsx)$/.test(f));
const sqlFiles = walk(path.join(root, "supabase")).filter(f => f.endsWith(".sql"));

if (!fs.existsSync(path.join(root, "src/services/notifications.js"))) failures.push("Service notifications central absent.");
if (!fs.existsSync(path.join(root, "src/tva/engine/accountNormalizer.js"))) failures.push("Normalisateur comptable absent.");
if (!fs.existsSync(path.join(root, "supabase/v2.1-architecture-consolidation.sql"))) failures.push("Migration V2.1 absente.");

const allSource = files.map(f => fs.readFileSync(f, "utf8")).join("\n");
if (/from\(["']notifications["']\)/.test(allSource) && !/services\/notifications/.test(allSource)) warnings.push("Accès direct aux notifications détecté : vérifier qu'il s'agit d'un cas légitime.");
if (/destinataire_id/.test(allSource)) warnings.push("Compatibilité historique destinataire_id encore présente : elle doit rester confinée à la migration SQL.");
if (/localStorage\.getItem\(STORE\)/.test(allSource)) failures.push("Un stockage métier global STORE persiste dans le frontend : utiliser cabinet-scoped state.");
const notificationDirect = files.filter(f => !f.endsWith("services/notifications.js") && /from\(["']notifications["']\)/.test(fs.readFileSync(f, "utf8")));
if (notificationDirect.length) failures.push(`Accès direct notifications hors service central : ${notificationDirect.map(f => path.relative(root,f)).join(", ")}`);

const core = fs.readFileSync(path.join(root, "src/components-refactored/core.js"), "utf8");
const currentTeamDefinitions = sqlFiles.reduce((n, f) => n + (fs.readFileSync(f, "utf8").match(/create\s+(?:or\s+replace\s+)?function\s+public\.current_team_id\s*\(/gi) || []).length, 0);
if (currentTeamDefinitions > 1) warnings.push(`current_team_id est historiquement redéfinie dans ${currentTeamDefinitions} migrations ; V2.1 doit rester la source canonique finale.`);
if (!core.includes("insertProductNotification")) failures.push("core.js ne délègue pas les notifications au service central.");
const duplicateFunctionFiles = sqlFiles.filter(f => /create\s+(?:or\s+replace\s+)?function\s+public\.current_team_id\s*\(/i.test(fs.readFileSync(f, "utf8")));
if (duplicateFunctionFiles.length < 1) failures.push("La fonction canonique current_team_id est absente des migrations.");

console.log(`Architecture NOVACAB V2.1 : ${failures.length ? "FAIL" : "OK"}`);
for (const x of failures) console.error(`✖ ${x}`);
for (const x of warnings) console.warn(`⚠ ${x}`);
if (failures.length) process.exit(1);
