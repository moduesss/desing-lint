# 🧩 Design Lint

**Design Lint** is a Figma plugin that helps teams **maintain design‑system consistency**.
It scans your file for duplicate components, mixed styles, and instance issues — and shows a clear report right inside Figma.

---

## 🚀 Features

* **Duplicate component detection** — global by name; highlights the original and every duplicate.
* **Mixed styles** — finds mixed fills, strokes, effects, fontName, textStyleId.
* **Instance issues** — size mismatches with the master, detached instances.
* **Grouped results** — page → component → findings; counters and quick filters by problem type.
* **Navigation** — “Show” jumps to the node on the canvas.
* **Exports** — JSON for automation, copy-friendly summaries for Slack/Jira.
* **Bilingual UI** — EN/RU toggle in the header.
* **Built‑in tips** — short rules and how to fix each class of issues.

---

## 🛠 Tech Stack

* **Figma Plugin API** (TypeScript)
* **esbuild** — fast bundling & watch mode
* **Vite + React + SCSS UI**
* **figma‑plugin‑typings** for IntelliSense

---

## 💡 Why Design Lint?

* Keep your design system **clean, predictable, and scalable**.
* Catch inconsistencies **before** they reach developers.
* Empower designers to self‑audit quickly.
* Reduce manual QA time via automated checks.

---

## 📄 License

MIT © 2025 Dima «aquarsmooduesss» Artemov
