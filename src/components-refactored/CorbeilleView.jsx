import { Trash2, RotateCcw, Eye, AlertTriangle } from "lucide-react";
import React, { useMemo } from "react";
import { Reveal } from "./Reveal.jsx";
import { Panel } from "./Panel.jsx";
import { EmptyNote } from "./EmptyNote.jsx";
import { Stamped } from "./Stamped.jsx";
import { Shared } from "./shared.js";
const { T } = Shared;

function CorbeilleView({ clients = [], isAdmin, onRestore, onDeletePermanently, onOpenClient }) {
  const rows = useMemo(() => clients.filter(c => c.corbeilleDossier), [clients]);
  return <div>
    <Reveal><h1 style={{fontFamily:T.serif,fontSize:20,fontWeight:800,margin:0}}>Corbeille</h1><p style={{fontSize:12,color:T.inkMuted,margin:"5px 0 18px",lineHeight:1.55}}>Les dossiers placés ici sont masqués des vues métier. Ils peuvent être restaurés ou supprimés définitivement par un administrateur.</p></Reveal>
    <Panel title={`Dossiers dans la corbeille (${rows.length})`}>
      {!rows.length ? <EmptyNote text="La corbeille est vide."/> : <div>{rows.map(c => <div key={c.id} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 4px",borderBottom:`1px solid ${T.line}`,flexWrap:"wrap"}}>
        <div style={{flex:1,minWidth:180}}><div style={{fontSize:12.5,fontWeight:800}}>{c.nom}</div><div style={{fontSize:10.5,color:T.inkMuted}}>{c.siren || "SIREN non renseigné"} · Mis à la corbeille {c.corbeilleDossier?.date ? new Date(c.corbeilleDossier.date).toLocaleDateString("fr-FR") : "—"}</div></div>
        <Stamped tone="red" small>Corbeille</Stamped>
        <button className="btn-secondary !py-1.5" onClick={()=>onOpenClient?.(c.id)}><Eye size={12}/> Consulter</button>
        <button className="btn-secondary !py-1.5" onClick={()=>onRestore?.(c.id)}><RotateCcw size={12}/> Restaurer</button>
        {isAdmin && <button className="btn-secondary !py-1.5" style={{color:T.red,borderColor:"#FECACA"}} onClick={()=>onDeletePermanently?.(c.id)}><Trash2 size={12}/> Supprimer définitivement</button>}
      </div>)}</div>}
    </Panel>
    <div style={{marginTop:12,padding:"10px 12px",borderRadius:10,background:T.amberSoft,color:T.inkSoft,fontSize:10.5,display:"flex",gap:7,alignItems:"flex-start"}}><AlertTriangle size={14} style={{flexShrink:0}}/> La suppression définitive ne peut pas être annulée.
    </div>
  </div>;
}
export { CorbeilleView };
