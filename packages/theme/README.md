# @fox-finance/theme

Theme tokens and design primitives for Fox Finance applications.

## Getting Started

```bash
cd packages/theme
pnpm build
```

## Responsibilities

- Provides design tokens (colors, spacing, typography, breakpoints).
- Ensures consistent look-and-feel across apps and contractor-delivered packages.
- Exports theme objects/hooks compatible with @fox-finance/ui.

## Usage

```
import { useTheme } from "@fox-finance/theme";

function Example() {
  const theme = useTheme();
  return <div style={{ color: theme.colors.primary }}>Hello</div>;
}
```

## Notes

- Update theme tokens only through design review.
- Version carefully; theme changes can cascade across all apps.
