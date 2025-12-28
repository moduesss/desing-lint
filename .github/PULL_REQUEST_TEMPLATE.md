## Summary

Briefly describe **what this PR changes** and **why**.
Focus on intent and impact, not implementation details.

---

## Type of change (check all that apply)

- [ ] Bug fix (no behavior change)
- [ ] Rule behavior change
- [ ] New rule or check
- [ ] Performance / stability improvement
- [ ] UI / UX change
- [ ] Documentation only

---

## Rule impact (required for rule-related changes)

If this PR affects lint rules, answer explicitly:

- **Rule ID(s):**
- **Does this change when the rule triggers?**  
  - [ ] Yes
  - [ ] No
- **Does it change default severity or level?**  
  - [ ] Yes
  - [ ] No
- **Does it reduce or increase false positives?**  
  Explain briefly.

If not applicable, write: _Not applicable_.

---

## Behavior change explanation

Describe **how lint results may differ** after this change.
Include concrete scenarios if possible.

If there is no behavior change, write: _No behavior change_.

---

## Figma Plugin API safety

Confirm that this PR respects Figma plugin constraints:

- [ ] All variable access uses async APIs
- [ ] No sync calls to restricted Figma APIs
- [ ] Scan remains fail-soft (errors do not crash linting)
- [ ] Large files / many pages were considered

---

## Performance considerations

- Does this PR add new tree traversals, async loops, or heavy computations?
- Were caches, batching, or guards added where appropriate?

If not applicable, write: _No impact_.

---

## How this was tested

Describe how you verified the change:
- file size / structure
- specific scenarios
- manual or automated checks

---

## Checklist

- [ ] Build passes (`npm run build`)
- [ ] Changes are scoped and focused
- [ ] No unintended behavior changes
- [ ] Documentation updated if needed
