import * as Core from "./core.js";
import * as Icons from "lucide-react";
import * as ReactNS from "react";
import { supabase } from "../supabaseClient";
import * as TaskService from "../services/tasks";
import * as AutomationService from "../services/automation";
import * as LegalService from "../services/legal";
import * as SecurityAudit from "../services/securityAudit";
import * as ActivityService from "../services/activity";
import * as DeadlineService from "../services/deadlines";
import * as PermissionService from "../services/permissions";
import * as Annual from "../services/annual";
import * as DateUtils from "../utils/dateUtils";
import * as ExcelUtils from "../utils/excelUtils";
import * as AccessUtils from "../utils/access";
import * as ChecklistUtils from "../utils/checklists";
import { RAW_SEED_CLIENTS } from "../data/seedClients";
import { TASK_STATUTS, TASK_STATUT_BY_CODE, TASK_PRIORITES, TASK_PRIORITE_BY_CODE, taskSortWeight } from "../constants/pilotage";
import { bucketize as bucketizeDeadlines, BUCKET_LABELS as DEADLINE_BUCKET_LABELS } from "../services/deadlines";

export const S = {
  appShell: { display: "flex", height: "100vh", width: "100%", background: Core.T?.paper, fontFamily: Core.T?.sans, color: Core.T?.ink, overflow: "hidden" },
  main: { flex: 1, display: "flex", flexDirection: "column", minWidth: 0 },
  content: { flex: 1, overflowY: "auto", overflowX: "hidden", padding: "22px 28px 48px" },
};

// Compatibility layer created during the modularisation of the legacy App.jsx.
// New code should import the smallest dependency it needs instead of Shared.
export const Shared = {
  ...Core,
  ...Icons,
  ...ReactNS,
  supabase,
  ...TaskService,
  ...AutomationService,
  ...LegalService,
  ...SecurityAudit,
  ...ActivityService,
  ...DeadlineService,
  ...PermissionService,
  ...Annual,
  ...DateUtils,
  ...ExcelUtils,
  ...AccessUtils,
  ...ChecklistUtils,
  RAW_SEED_CLIENTS,
  TASK_STATUTS, TASK_STATUT_BY_CODE, TASK_PRIORITES, TASK_PRIORITE_BY_CODE, taskSortWeight,
  bucketizeDeadlines, DEADLINE_BUCKET_LABELS,
  S,
};
