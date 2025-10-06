import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Adding font awesome script for icons
const fontAwesomeScript = document.createElement('script');
fontAwesomeScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/js/all.min.js';
fontAwesomeScript.integrity = 'sha512-fD9DI5bZwQxOi7MhYWnnNPlvXdp/2Pj3XSTRrFs5FQa4mizyGLnJcN6tuvUS6LbmgN1ut+XGSABKvjN0H6Aoow==';
fontAwesomeScript.crossOrigin = 'anonymous';
fontAwesomeScript.referrerPolicy = 'no-referrer';
document.head.appendChild(fontAwesomeScript);

createRoot(document.getElementById("root")!).render(<App />);
