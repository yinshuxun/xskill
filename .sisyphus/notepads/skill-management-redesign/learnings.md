# Learnings for Skill Management Redesign

- The competitor `skills-hub` uses a Three-Tier Architecture: Hub (Central), Agent (Global), Project (Workspace).
- We need to implement Sync (Copy/Link) and Collect (Reverse Sync) operations.
- The UI needs a redesign for Skill Cards to show Agent Badges, Tier Indicators, and Hover States.
- We have created `docs/05_skill_management_redesign.md` to document this.
- We have created `src/components/ui/icons.tsx` with SVG icons for supported agents.
- We have created a new `src/components/SkillCard.tsx` component.
- We need to update `src/App.tsx` to use the new `SkillCard` component and remove the old inline one.
- We need to update `docs/02_requirements.md` and `tasks/todo.md`.
