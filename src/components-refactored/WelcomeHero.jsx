import React from "react";
import { ArrowRight, CalendarCheck2, CheckCircle2, Plus, Search, Sparkles } from "lucide-react";
import { Shared } from "./shared.js";
const { T } = Shared;

function WelcomeHero({ me, cabinetName, activeClients, urgentCount, onViewClients, onViewTasks, onNewClient }) {
  const firstName = String(me || "").trim().split(/\s+/)[0] || "à vous";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";
  const mood = urgentCount > 0
    ? `${urgentCount} priorité${urgentCount > 1 ? "s" : ""} mérite${urgentCount > 1 ? "nt" : ""} votre attention aujourd’hui.`
    : "Tout est calme pour le moment. Vous pouvez avancer sereinement.";

  return (
    <section className="novacab-welcome" aria-labelledby="novacab-welcome-title">
      <div className="novacab-welcome-glow" aria-hidden="true" />
      <div className="novacab-welcome-main">
        <div className="novacab-welcome-kicker"><Sparkles size={14} /> Votre cockpit cabinet</div>
        <h1 id="novacab-welcome-title">{greeting} {firstName} <span aria-hidden="true">👋</span></h1>
        <p>{mood} Voici l’essentiel de <strong>{cabinetName || "votre cabinet"}</strong>, présenté simplement pour vous aider à décider quoi faire ensuite.</p>
        <div className="novacab-welcome-actions">
          <button type="button" className="novacab-welcome-primary" onClick={onViewTasks}>
            <CalendarCheck2 size={16} /> Voir mes priorités <ArrowRight size={15} />
          </button>
          <button type="button" className="novacab-welcome-secondary" onClick={onViewClients}>
            <Search size={15} /> Ouvrir un dossier
          </button>
          <button type="button" className="novacab-welcome-ghost" onClick={onNewClient}>
            <Plus size={15} /> Nouveau client
          </button>
        </div>
      </div>
      <div className="novacab-welcome-summary">
        <div className="novacab-welcome-summary-icon"><CheckCircle2 size={20} /></div>
        <div>
          <div className="novacab-welcome-summary-value">{activeClients}</div>
          <div className="novacab-welcome-summary-label">dossiers actifs</div>
        </div>
        <div className="novacab-welcome-summary-divider" />
        <div>
          <div className="novacab-welcome-summary-value">{urgentCount}</div>
          <div className="novacab-welcome-summary-label">priorités du jour</div>
        </div>
      </div>
    </section>
  );
}

export { WelcomeHero };
