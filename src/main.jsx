import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { Toaster } from "react-hot-toast"; // 1. Import Toaster

const container = document.getElementById("root");
const root = createRoot(container);

root.render(
  // 2. Wrap App and render Toaster here
  <>
    <Toaster position="top-center" />
    <App />
  </>
);
