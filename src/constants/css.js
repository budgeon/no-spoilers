import { G } from "./tokens.js";

export const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  html,body,#root{height:100%;min-height:100vh;}
  body{background:#F5F0E8;color:#1E2535;font-family:'Inter',sans-serif;-webkit-font-smoothing:antialiased;margin:0;}
  input,textarea{outline:none;font-family:inherit;color:#1E2535;}
  button{cursor:pointer;border:none;background:none;color:inherit;font-family:inherit;}
  @keyframes spin{to{transform:rotate(360deg);}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);}}
  @keyframes popIn{from{opacity:0;transform:scale(0.92);}to{opacity:1;transform:scale(1);}}
  @keyframes slideUp{from{transform:translateY(100%);}to{transform:translateY(0);}}
  ::-webkit-scrollbar{width:4px;height:4px;}
  ::-webkit-scrollbar-track{background:transparent;}
  ::-webkit-scrollbar-thumb{background:rgba(107,140,174,0.2);border-radius:2px;}
  .tab-btn{transition:color 0.15s;}
  .tab-btn.active{color:${G.accent};}
  .tab-btn:not(.active){color:${G.dim};}
  .card-hover{transition:transform 0.15s;cursor:pointer;}
  .card-hover:hover{transform:translateY(-2px);}
`;
