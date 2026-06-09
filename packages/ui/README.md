# @inkroute/ui

Shared InkRoute UI primitives for app surfaces that need consistent accessibility and design tokens before a full Storybook exists.

## Current primitives

- `inkrouteTheme` for shared color, radius, focus, and typography class contracts.
- `Button`, `Badge`, `Card`, `Surface`, and `SectionHeader` for app chrome.
- `Input`, `Textarea`, `Field`, `FieldLabel`, `FieldHint`, and `FieldError` for accessible form composition.
- `NavBar` and `NavItem` for labeled navigation groups with `aria-current` support.
- `Dialog`, `DialogPanel`, and `DialogTitle` for native dialog composition.

## Still required

- Adopt primitives across web/dashboard screens.
- Add visual regression or Storybook coverage.
- Run package typecheck/test and app smoke tests after dependency install.
