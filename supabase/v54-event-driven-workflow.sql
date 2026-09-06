-- V54 — socle événementiel léger.
-- Les conséquences métier sont déclenchées côté application afin de conserver
-- les contrôles d'accès et d'éviter les doublons avec les workflows existants.
-- Cette migration documente la convention utilisée pour les tâches automatiques.
comment on column public.tasks.source is 'Origine de la tâche : utilisateur, workflow_event, automation, etc.';
