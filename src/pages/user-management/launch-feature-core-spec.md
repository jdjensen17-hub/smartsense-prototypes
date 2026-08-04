# <Feature name>

## Intent
<What user problem this solves and why now. 2–4 sentences. Name the persona and module.>

## Module
<monitor | operate | guard | admin | dashboard | shell>

## User journey
<Walk the primary flow(s) step by step, including the states and branches the user hits.>

## Acceptance criteria
Per flow, observable and user-facing. Include the key states.
- [ ] <"The system lets me… / shows me… / prevents me from…">
- [ ] <loading / empty / populated / error / permission-denied behavior where relevant>
- [ ] <...>

## Test cases
Concrete enough that the agent can implement and verify each without guessing intent.
- Happy path: <step-by-step of the primary success flow and expected result>
- State/variant cases: <loading, empty, populated, error, permission-denied — each as a checkable case>
- Negative cases: <what must NOT happen — e.g., "a viewer-role user cannot see the edit control">

## Success signals
<How we'll know it works, in the user's terms. Behavioral or outcome-based.>

## Reference materials
<Describe any shared mockups/screenshots and what each illustrates. The images themselves are attached to the Epic — visual evidence only, never code to copy.>

## Scope
**In:** <what this feature covers>
**Out:** <explicitly excluded, to keep it small>

## Additional context
<Any useful product context that doesn't fit above: background, prior attempts, domain rules, real-world examples, edge cases, related features, competitor/reference examples, rationale for decisions, links to further reading. Include everything the requester offered that helps the build agent understand intent. Omit only technical/implementation detail. Drop this section only if there genuinely is nothing more to capture.>

## Open questions
Every question here must carry a resolution — none may be left dangling. Resolve each one of two ways:
- <question> → **Answer:** <the requester's decision>
- <question> → **Answer: agent decides** <optional guidance/constraints for the call the build agent should make>