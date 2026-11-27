window.__ERR_TRAP__=true; window.addEventListener("error",e=>{document.body.innerHTML="<pre style=\"background:#111;color:#ff5555;padding:16px;white-space:pre-wrap;font-size:13px\">RUNTIME ERROR:\n"+(e.error?.stack||e.message)+"</pre>";}); window.addEventListener("unhandledrejection",e=>{document.body.innerHTML="<pre style=\"background:#111;color:#ffaa00;padding:16px;white-space:pre-wrap;font-size:13px\">PROMISE ERROR:\n"+(e.reason?.stack||e.reason)+"</pre>";});
try { if ("serviceWorker" in navigator) navigator.serviceWorker.getRegistrations().then((r) => r.forEach((x) => x.unregister())); } catch (_) {}
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Add debug logging
console.log("=== 🚀 ZUKA App Starting ===");
console.log("If you see a blank screen after login:");
console.log("1. Open browser console (F12 or right-click > Inspect > Console)");
console.log("2. Check for errors in red");
console.log("3. Look for auth state changes in logs");

console.log("🔍 Mounting React App...");
createRoot(document.getElementById("root")!).render(<App />);
console.log("🔍 App rendered to DOM");
