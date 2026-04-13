import "./global.css";

import { createRoot } from "react-dom/client";
import "./lib/i18n";
import { App } from "./App";

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
