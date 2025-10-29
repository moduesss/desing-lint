# 🧩 Design Lint

**Design Lint** is a Figma plugin that helps teams **maintain design‑system consistency**.
It scans your file for unlinked colors, text styles, misnamed tokens, and duplicate components — and shows an actionable report right inside Figma.

---

## 🚀 Features

* **Detect unlinked styles** — finds fills, strokes, and texts not using shared Paint/Text styles.
* **Nearest‑match suggestions** — recommends the closest existing style for any inline color.
* **Duplicate‑component finder** — flags components with identical names and dimensions.
* **Naming audit** — validates Paint/Text style names via RegExp patterns (e.g. `^color/`, `^type/`).
* **Instant navigation** — click any issue to select that node in the canvas.
* **JSON export** — export the lint report for QA or automation pipelines.

---

## 🛠 Tech Stack

* **Figma Plugin API** (TypeScript)
* **esbuild** — fast bundling & watch mode
* **Vanilla HTML + CSS UI**
* **figma‑plugin‑typings** for IntelliSense

---

## 🧩 Local Development

```bash
git clone https://github.com/yourusername/design-lint
cd design-lint
npm install
npm run dev
```

Then open **Figma Desktop → Plugins → Development → Import plugin from manifest…** and select the folder containing `manifest.json`.

Now open any Figma file and run:

```
Plugins → Development → Design Lint → Scan
```

### Available Scripts

| Command         | Description                 |
| --------------- | --------------------------- |
| `npm run dev`   | Build and watch for changes |
| `npm run build` | Production build            |
| `npm run clean` | Remove `dist/` directory    |

---

## 💡 Why Design Lint?

* Keep your design system **clean, predictable, and scalable**.
* Catch inconsistencies **before** they reach developers.
* Empower designers to self‑audit quickly.
* Reduce manual QA time via automated checks.

---

## 📄 License

MIT © 2025 Dima «aquarsmooduesss» Artemov
