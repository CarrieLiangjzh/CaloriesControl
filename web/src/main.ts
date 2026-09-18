import { loadProfile } from "./data/profileStore";
import { mountShell } from "./shell";
import "./styles.css";

const root = document.querySelector("#app");
if (!(root instanceof HTMLElement)) {
  throw new Error("missing #app");
}

if (!window.location.hash) {
  window.location.replace(loadProfile() ? "#/today" : "#/profile");
}

mountShell(root);
