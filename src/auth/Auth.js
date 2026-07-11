import { LS, SK } from "../constants/storage.js";

export const Auth = {
  get: () => LS.get(SK.U, null),
  signup: (name, email, pw) => {
    const db = LS.get(SK.DB, {}); if (db[email]) return {error:"Account already exists."};
    const u = {id:`u_${Date.now()}`,name,email,avatar:name.slice(0,2).toUpperCase(),joinedAt:Date.now()};
    db[email]={...u,pw}; LS.set(SK.DB,db); LS.set(SK.U,u); return {user:u};
  },
  login: (email,pw) => {
    const db=LS.get(SK.DB,{}); const r=db[email];
    if(!r) return {error:"No account found."}; if(r.pw!==pw) return {error:"Incorrect password."};
    const u={id:r.id,name:r.name,email:r.email,avatar:r.avatar,joinedAt:r.joinedAt}; LS.set(SK.U,u); return {user:u};
  },
  google: () => {
    const names=["Alex Rivera","Jordan Kim","Sam Patel","Casey Morgan","Drew Chen"];
    const name=names[Math.floor(Math.random()*names.length)];
    const email=`${name.toLowerCase().replace(" ",".")}@gmail.com`;
    const db=LS.get(SK.DB,{}); let u;
    if(db[email]) u={id:db[email].id,name:db[email].name,email,avatar:db[email].avatar,joinedAt:db[email].joinedAt,provider:"google"};
    else { u={id:`g_${Date.now()}`,name,email,avatar:name.slice(0,2).toUpperCase(),provider:"google",joinedAt:Date.now()}; db[email]={...u,pw:null}; LS.set(SK.DB,db); }
    LS.set(SK.U,u); return {user:u};
  },
  logout: () => localStorage.removeItem(SK.U),
};
