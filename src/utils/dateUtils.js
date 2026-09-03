export function todayISO(){return new Date().toISOString().slice(0,10);}
export function addYearISO(iso,years=1){if(!iso||typeof iso!=="string")return iso;const[y,m,d]=iso.split("-").map(Number);if(!y||!m||!d)return iso;return `${String(y+years).padStart(4,"0")}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;}
export function fmtFR(iso){if(!iso||typeof iso!=="string")return "—";const[y,m,d]=iso.split("-");return y&&m&&d?`${d}/${m}/${y}`:iso;}
export function addMonthsISO(iso,months){if(!iso||typeof iso!=="string")return null;const[y,m,d]=iso.split("-").map(Number);if(!y||!m||!d)return null;return new Date(y,m-1+months,d).toISOString().slice(0,10);}
export function fmtEUR(v){const n=Number(v);if(v===""||v==null||Number.isNaN(n))return "—";return n.toLocaleString("fr-FR",{style:"currency",currency:"EUR",maximumFractionDigits:0});}
export function getBilanEcheance(dateCloture){return dateCloture?addMonthsISO(dateCloture,3):null;}
export function getBilanStatut(b,dateCloture){const echeance=getBilanEcheance(dateCloture);const enRetard=echeance&&!b.transmis&&todayISO()>echeance;if(b.transmis)return{label:"Transmis",tone:"green"};if(enRetard)return{label:"En retard",tone:"red"};if(b.valideClient)return{label:"Validé client",tone:"purple"};if(b.revision==="terminee")return{label:"Révision terminée",tone:"purple"};if(b.revision==="en_cours")return{label:"En cours",tone:"amber"};return{label:"À faire",tone:"neutral"};}
export function sameDay(a,b){return a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();}
export function startOfWeek(d){const x=new Date(d);const day=(x.getDay()+6)%7;x.setDate(x.getDate()-day);x.setHours(0,0,0,0);return x;}
export function isValidISODate(str){if(typeof str!=="string"||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(str))return false;const[y,m,d]=str.split("-").map(Number);const dt=new Date(y,m-1,d);return m>=1&&m<=12&&dt.getFullYear()===y&&dt.getMonth()===m-1&&dt.getDate()===d;}
