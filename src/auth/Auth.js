import { supabase } from "../lib/supabase.js";

const AVATARS = ["🎬","🎥","🍿","📺","🎭","🎞️","🦁","🐯","🦊","🐺","🦅","🌟"];
const randomAvatar = () => AVATARS[Math.floor(Math.random() * AVATARS.length)];

export const Auth = {
  getSession: () => supabase.auth.getSession(),
  onAuthChange: (cb) => supabase.auth.onAuthStateChange(cb),
  login: (email, pw) => supabase.auth.signInWithPassword({ email, password: pw }),
  signup: (email, name, pw) => supabase.auth.signUp({ email, password: pw, options: { data: { name, avatar: randomAvatar() } } }),
  google: () => supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } }),
  logout: () => supabase.auth.signOut(),
};
