import { franc, francAll } from "https://esm.sh/franc";

window.detectLanguageFranc = franc;
window.detectLanguageFrancAll = francAll;

window.dispatchEvent(
    new Event("franc-ready")
);