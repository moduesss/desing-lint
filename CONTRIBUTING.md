# Contributing to Design Lint

This guide explains how to contribute to the Design Lint plugin. English comes first; Russian follows below.

## Project scope
Design Lint is a static analysis tool for Figma files. It reports issues but is not a design system manager, auto-fixer, or formatter. Contributions should align with this scope.

## What we welcome
- Bug fixes and correctness improvements to lint rules.
- Additions/adjustments to existing rules with clear rationale and tests where applicable.
- Maintenance work that improves stability, build reliability, or developer ergonomics.
- Documentation updates that reflect actual behavior and architecture.

## What we avoid
- Large refactors without a focused goal or measurable benefit.
- Cosmetic churn (renames, formatting-only changes) that obscures history.
- Feature changes to lint behavior without updating rule docs and change records.
- Adding tools, configs, or dependencies that are not already in the repo without discussion.

## Local setup
1. Install dependencies: `npm install`.
2. Build once: `npm run build` (runs Vite UI build + inline HTML + esbuild for plugin code).
3. Dev loop (optional): `npm run dev` to watch UI/inline/code bundles.
4. Generated assets live in `dist/`; source code is under `src/` (plugin logic) and `ui/` (React UI).

## Working with lint rules
- Rule definitions live in `src/lint/rules.ts` (metadata, severity, level). Implementations live under `src/scan/implementations/` and are wired via `src/scan/index.ts`.
- Structural logic (component signatures, variable handling) resides in `src/scan/implementations/shared.ts`.
- Any behavior change to a rule should be clearly described in the PR (scope, impact, rationale).
- Keep rules deterministic and conservative: avoid name-based heuristics; prefer structural checks already in place. False negatives are acceptable; false positives are not.

## Figma Plugin API constraints
- The plugin runs with `documentAccess: dynamic-page`; all variable access must be async (`getVariableByIdAsync`, etc.). Do not call sync variable APIs.
- Load pages/sets safely: use `loadAllPagesAsync`, `setCurrentPageAsync`, and guard highlighting/selection.
- The scan must be fail-soft: errors from the Figma API should not crash linting. Broken nodes are marked and skipped by other rules.
- Avoid introducing API calls that are unavailable in the Figma sandbox for plugins.

## Before opening a PR
- Confirm the change fits the project scope (static analysis, no autofix/formatting).
- Check existing issues/PRs to avoid duplication.
- For non-trivial changes, start a discussion via Issues before implementation.

## Pull request expectations
- Keep PRs focused and small; separate unrelated changes.
- Call out any breaking or behavior changes to rules (severity, triggers, defaults).
- Describe notable changes in the PR summary; keep documentation aligned with behavior.
- Ensure builds pass (`npm run build`) and avoid introducing new build-time tools without justification.
- Prefer explicit comments only where logic is non-obvious; maintain readability of rule implementations.

---

# Руководство по вкладу в Design Lint

Ниже — русская версия тех же требований.

## Область проекта
Design Lint — инструмент статического анализа Figma-файлов. Он выявляет проблемы, но не управляет дизайн-системой, не автоисправляет и не форматирует. Вклады должны соответствовать этой задаче.

## Что приветствуется
- Исправления багов и корректности правил.
- Дополнения/уточнения существующих правил с понятной мотивацией и тестами, где применимо.
- Поддержка стабильности, надёжности сборки и удобства разработки.
- Обновление документации, отражающее фактическое поведение и архитектуру.

## Чего избегаем
- Крупные рефакторинги без явной цели и выгоды.
- Косметические правки (переименования, форматирование), мешающие истории.
- Изменения поведения правил без обновления документации и записей об изменениях.
- Добавление инструментов/зависимостей, которых нет в репозитории, без предварительного обсуждения.

## Локальная настройка
1. Установить зависимости: `npm install`.
2. Собрать: `npm run build` (Vite для UI + инлайн HTML + esbuild для кода плагина).
3. Режим разработки (опционально): `npm run dev` для вотча UI/inline/code.
4. Сборки лежат в `dist/`; исходники — в `src/` (логика плагина) и `ui/` (React UI).

## Работа с правилами линта
- Определения правил — `src/lint/rules.ts` (метаданные, severity, уровень). Реализация — в `src/scan/implementations/`, подключение в `src/scan/index.ts`.
- Структурные помощники (сигнатуры компонентов, обработка переменных) — в `src/scan/implementations/shared.ts`.
- Изменения поведения правил описывайте прямо в тексте PR (что меняется, зачем, эффект).
- Правила должны быть детерминированными и консервативными: без эвристик по именам, используйте структурные проверки. Предпочтительны ложные пропуски перед ложными срабатываниями.

## Ограничения Figma Plugin API
- Плагин работает в `documentAccess: dynamic-page`; доступ к переменным только через async API (`getVariableByIdAsync` и т.п.). Sync-вызовы запрещены.
- Безопасно грузите страницы/сеты: `loadAllPagesAsync`, `setCurrentPageAsync`; подсветку/выбор оборачивайте проверками.
- Скан должен быть отказоустойчивым: ошибки Figma API не должны падать скан; проблемные узлы помечаются и пропускаются другими правилами.
- Не добавляйте вызовы API, недоступные в среде Figma плагинов.

## Перед отправкой PR
- Убедитесь, что изменение вписывается в область проекта (статический анализ, без автоисправлений/форматтера).
- Проверьте существующие issues/PR, чтобы избежать дублирования.
- Для нетривиальных изменений начните обсуждение в Issues перед реализацией.

## Ожидания к pull request
- Держите PR маленькими и сфокусированными; разделяйте несвязанные изменения.
- Явно помечайте любые ломающие или поведенческие изменения правил (severity, триггеры, дефолты).
- Описывайте заметные изменения в описании PR; документация должна соответствовать поведению.
- Убедитесь, что сборка проходит (`npm run build`); не добавляйте новые build-инструменты без веской причины.
- Комментарии — только там, где логика неочевидна; сохраняйте читабельность реализаций правил.
