import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Content-Type":"application/json"};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:cors});
async function sha256(value:string){const b=new TextEncoder().encode(value);const d=await crypto.subtle.digest("SHA-256",b);return Array.from(new Uint8Array(d)).map(x=>x.toString(16).padStart(2,"0")).join("")}
Deno.serve(async(req)=>{
 if(req.method==="OPTIONS") return new Response("ok",{headers:cors});
 if(req.method!=="POST") return json({error:"Method not allowed"},405);
 const admin=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,{auth:{persistSession:false}});
 try{
  const {action,code}=await req.json();
  if(action==="create"){
   const token=(req.headers.get("Authorization")||"").replace(/^Bearer\\s+/i,"");
   if(!token)return json({error:"Unauthorized"},401);
   const {data:{user},error:userError}=await admin.auth.getUser(token); if(userError||!user)return json({error:"Unauthorized"},401);
   const {data:team,error:teamError}=await admin.from("team").select("auth_user_id,statut,portefeuille_id").eq("auth_user_id",user.id).eq("statut","actif").maybeSingle();
   if(teamError)throw teamError; if(!team?.portefeuille_id)return json({error:"Compte NOVACAB non rattaché à un portefeuille actif."},403);
   const raw=`${crypto.randomUUID()}${crypto.randomUUID().replaceAll("-","")}`; const hash=await sha256(raw);
   const {error}=await admin.from("nfi_sso_handoffs").insert({code_hash:hash,auth_user_id:user.id,portefeuille_id:team.portefeuille_id,expires_at:new Date(Date.now()+90000).toISOString()});
   if(error)throw error; return json({code:raw});
  }
  if(action==="exchange"){
   if(!code)return json({error:"Code manquant"},400); const hash=await sha256(code);
   const {data:h,error}=await admin.from("nfi_sso_handoffs").select("id,auth_user_id,expires_at,used_at").eq("code_hash",hash).maybeSingle();
   if(error)throw error; if(!h||h.used_at||new Date(h.expires_at).getTime()<Date.now())return json({error:"Le lien de connexion NOVACAB est invalide ou expiré."},401);
   const {data:u,error:ue}=await admin.auth.admin.getUserById(h.auth_user_id); if(ue||!u.user?.email)return json({error:"Utilisateur NOVACAB introuvable."},401);
   const {data:link,error:le}=await admin.auth.admin.generateLink({type:"magiclink",email:u.user.email}); if(le||!link?.properties?.hashed_token)throw le||new Error("Impossible de générer le jeton SSO.");
   const {error:mark}=await admin.from("nfi_sso_handoffs").update({used_at:new Date().toISOString()}).eq("id",h.id).is("used_at",null); if(mark)throw mark;
   return json({token_hash:link.properties.hashed_token,email:u.user.email});
  }
  return json({error:"Action inconnue"},400);
 }catch(e){console.error(e);return json({error:e instanceof Error?e.message:"Erreur SSO"},500)}
});
