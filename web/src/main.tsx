import React from "react";
import ReactDOM from "react-dom/client";
import { Toaster } from "react-hot-toast";
import App from "./App";
import "./index.css";
const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
function syncTheme() {
  document.documentElement.classList.toggle("dark", systemTheme.matches);
}
syncTheme();
systemTheme.addEventListener("change", syncTheme);
if (import.meta.hot)
  import.meta.hot.dispose(() =>
    systemTheme.removeEventListener("change", syncTheme),
  );
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Toaster
      position="bottom-center"
      toastOptions={{
        style: {
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          background: "var(--popover)",
          color: "var(--popover-foreground)",
        },
      }}
    />
    <App />
  </React.StrictMode>,
);
