# 🧩 Design Lint

**Design Lint** is a Figma plugin for **auditing design consistency and structure**.
It scans Figma files for structural and stylistic issues and presents a clear,
explainable report directly inside Figma.

Design Lint focuses on **analysis, not enforcement**.

---

## 🚀 What it does

* **Component duplication detection**  
  Identifies structurally identical components and highlights potential duplicates.

* **Mixed styles**  
  Detects mixed fills, strokes, effects, font properties, and text styles.

* **Instance integrity checks**  
  Finds detached instances and significant deviations from their main components.

* **Structured results**  
  Findings are grouped by page → component → issue, with counters and quick filters.

* **Canvas navigation**  
  “Show” actions jump directly to the affected node.

* **Export**  
  JSON output for automation and copy-friendly summaries for tracking tools.

* **Bilingual UI**  
  English / Russian toggle built into the interface.

* **Rule explanations**  
  Each issue includes a short description and guidance.

---

## 🧠 Design principles

Design Lint follows a conservative linting philosophy:

* Prefer **false negatives** over false positives.
* Never rely on name-based heuristics for semantic decisions.
* Report issues that are explainable and actionable.
* Fail softly — broken nodes should not break the scan.

---

## 🚫 What Design Lint is NOT

* Not a design system manager.
* Not an auto-fix or formatting tool.
* Not a replacement for design reviews.
* Not an opinionated styling enforcer.

---

## 🛠 Tech Stack

* **Figma Plugin API** (TypeScript)
* **esbuild** — fast bundling
* **Vite + React + SCSS** for UI
* **figma-plugin-typings**

---

## 📄 License

MIT © 2025 Dima “aquarsmooduesss” Artemov


# 🧩 Design Lint

**Design Lint** — это плагин для Figma, предназначенный для **анализа консистентности и структуры дизайна**.
Он сканирует файл, находит структурные и стилистические проблемы
и показывает понятный, объяснимый отчёт прямо в Figma.

Design Lint фокусируется на **анализе, а не на принудительном исправлении**.

---

## 🚀 Что он делает

* **Поиск дубликатов компонентов**  
  Определяет структурно идентичные компоненты и потенциальные дубликаты.

* **Смешанные стили**  
  Обнаруживает mixed fills, strokes, effects, свойства шрифта и текстовые стили.

* **Проверка инстансов**  
  Находит отсоединённые инстансы и значимые отклонения от мастер-компонентов.

* **Структурированный отчёт**  
  Результаты сгруппированы по странице → компоненту → проблеме.

* **Навигация по холсту**  
  Кнопка “Show” ведёт прямо к проблемному элементу.

* **Экспорт**  
  JSON для автоматизации и копируемые сводки.

* **Двуязычный интерфейс**  
  Переключение EN / RU встроено в UI.

* **Пояснения правил**  
  Каждое правило сопровождается кратким объяснением и рекомендацией.

---

## 🧠 Принципы работы

Design Lint придерживается консервативного подхода:

* Лучше **пропустить проблему**, чем выдать ложное срабатывание.
* Никаких семантических решений на основе имён.
* Только объяснимые и воспроизводимые проверки.
* Ошибки в файле не должны ломать сканирование.

---

## 🚫 Чем Design Lint не является

* Это не менеджер дизайн-системы.
* Это не авто-фикс и не форматтер.
* Это не замена дизайн-ревью.
* Это не инструмент навязывания стиля.

---

## 🛠 Технологии

* **Figma Plugin API** (TypeScript)
* **esbuild**
* **Vite + React + SCSS**
* **figma-plugin-typings**

---

## 📄 Лицензия

MIT © 2025 Дима «aquarsmooduesss» Артёмов
