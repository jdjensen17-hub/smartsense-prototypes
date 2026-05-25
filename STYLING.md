# STYLING.md

**Emotion Styling Reference for lists-web-components**

---

> **Scope.** This doc covers *how* to style components with Emotion — patterns, tokens, conventions.
> For *what* to build with in the first place, see [`jolt-design-system-v2.md`](./jolt-design-system-v2.md):
> - **Color Source Rule** — all colors must come from `@joltup/colors`. No hardcoded hex, no Tailwind color utilities, no raw RGB.
> - **Component Source Rule** — prefer `@joltup/lists-web-components` (e.g. `Button`, `Drawer`, `Chip`, `DataGrid`) before building anything custom.

---

## Stack

```ts
import colors from '@joltup/colors';
import styled from '@emotion/styled';
```

Never use inline styles, CSS modules, plain CSS files, `css` template literals, or hardcoded hex values.

---

## Two Patterns — Know Which to Use

| Situation | Pattern |
|---|---|
| Static / structural / layout components | Pattern 1: direct `@joltup/colors` |
| Hover / active / disabled states or theme support | Pattern 2: `LIST_COMPONENT_COLORS` |

### Pattern 1: Direct colors (static components)

```js
import colors from '@joltup/colors';
import styled from '@emotion/styled';

const MyComponentStyle = styled.div({
  label: 'my-component',           // always include; matches component name
  backgroundColor: colors.grey[100],
  color: colors.grey[900],
  border: `1px solid ${colors.grey[400]}`,
  borderRadius: '4px',
  padding: '8px 16px',
});
```

### Pattern 2: Theme-based (interactive/stateful components)

```js
import styled from '@emotion/styled';
import { THEME_LIGHT } from '../constants';

const defaultThemeColors = THEME_LIGHT.LIST_COMPONENT_COLORS;

const MyComponentStyle = styled.div(
  ({ theme: { LIST_COMPONENT_COLORS = defaultThemeColors } }) => ({
    label: 'my-component',
    color: LIST_COMPONENT_COLORS.BACKGROUND.CONTRAST_TEXT,
    border: `1px solid ${LIST_COMPONENT_COLORS.BORDER.LIGHT}`,
    '&:hover': {
      backgroundColor: LIST_COMPONENT_COLORS.BACKGROUND.TRASNPARENT_HOVER,
    },
    '&:disabled': {
      color: LIST_COMPONENT_COLORS.DISABLED.MAIN,
    },
  }),
);
```

> ⚠️ `TRASNPARENT_HOVER` and `TRASNPARENT_ACTIVE` are typos in the source constants that have spread through the codebase. Use them as-is.

---

## Nested Selectors

```js
const MyStyle = styled.div({
  label: 'my-component',
  padding: '8px',
  '&.is-active': { backgroundColor: colors.blue[50] },
  '&:hover': { backgroundColor: colors.grey[100] },
  '.child-text': { color: colors.grey[700], lineHeight: '22px' },
});
```

---

## File Naming

Style files live alongside the component:

```
banner/
  Banner.js
  Banner.style.js   ← preferred
  index.js
```

---

## `@joltup/colors` Token Reference

### Primary Theme
```js
colors.primaryTheme.blue        // #1678C2
colors.primaryTheme.blueLight   // #E1F5FF
colors.primaryTheme.blueDark    // #1358A0
colors.primaryTheme.green       // #27B872
colors.primaryTheme.greenLight  // #E3F5EA
colors.primaryTheme.greenDark   // #005A23
colors.primaryTheme.red         // #C21D1D
```

### Grey Scale (most used)
```js
colors.grey[50]   // #F9F9F9  — page/section backgrounds
colors.grey[100]  // #F3F3F3  — subtle background fill
colors.grey[200]  // #EAEAEA  — dividers, light borders
colors.grey[300]  // #DBDBDB  — borders
colors.grey[400]  // #B7B7B7  — subdued borders
colors.grey[500]  // #979797  — placeholder text, icons
colors.grey[600]  // #6F6F6F  — secondary text
colors.grey[700]  // #5B5B5B  — body text
colors.grey[800]  // #3D3D3D  — strong text
colors.grey[900]  // #1C1C1C  — primary text / near-black
```

### Blue Scale
```js
colors.blue[50]   // #E1F5FF
colors.blue[100]  // #B4E5FE
colors.blue[200]  // #83D5FE
colors.blue[300]  // #52C4FC
colors.blue[400]  // #2FB7FC
colors.blue[500]  // #19AAFA
colors.blue[600]  // #199CEB
colors.blue[700]  // #1889D6
colors.blue[800]  // #1678C2  — primaryTheme.blue
colors.blue[900]  // #1358A0  — primaryTheme.blueDark
```

### Green / Red / Other
```js
colors.green[50]   // #E3F5EA
colors.green[400]  // #27B872
colors.green[900]  // #005A23
colors.red[50]     // #FFEAED
colors.red[400]    // #EB4C46
colors.red[800]    // #C21D1D
// purple, teal, yellow: full 50–900 range available
```

### Special Tokens
```js
colors.white.white             // #ffffff
colors.black.black             // #000000
colors.black.highEmphasis      // rgba(0,0,0,.87)
colors.black.mediumEmphasis    // rgba(0,0,0,.6)
colors.black.disabled          // rgba(0,0,0,.38)
colors.brown.brown             // #9C5F00
```

---

## `LIST_COMPONENT_COLORS` Token Reference

Source: `lists-web-components/src/components/constants.js`
Default: `THEME_LIGHT`. Both themes share the same key structure.

### PRIMARY
| Token | Light | Dark |
|---|---|---|
| `PRIMARY.LIGHTER` | `blue[50]` #E1F5FF | `green[50]` #E3F5EA |
| `PRIMARY.LIGHT` | `blue[100]` #B4E5FE | `green[100]` #BBE5CC |
| `PRIMARY.MAIN` | `blue[400]` #2FB7FC | `green[400]` #27B872 |
| `PRIMARY.DARK` | `blue[800]` #1678C2 | `green[800]` #007938 |
| `PRIMARY.DARKER` | `blue[900]` #1358A0 | `green[900]` #005A23 |
| `PRIMARY.DARK_CONTRAST_TEXT` | `white` #ffffff | same |

### SECONDARY
| Token | Light & Dark |
|---|---|
| `SECONDARY.LIGHTER` | `grey[50]` #F9F9F9 |
| `SECONDARY.LIGHT` | `grey[100]` #F3F3F3 |
| `SECONDARY.LIGHT_CONTRAST_TEXT` | `black.highEmphasis` rgba(0,0,0,.87) |
| `SECONDARY.MAIN` | `grey[400]` #B7B7B7 |
| `SECONDARY.DARK` | `grey[800]` #3D3D3D |
| `SECONDARY.DARK_CONTRAST_TEXT` | `white` #ffffff |

### BACKGROUND
| Token | Light | Dark |
|---|---|---|
| `BACKGROUND.SECONDARY` | `white` #ffffff | `black` #000000 |
| `BACKGROUND.PRIMARY` | `grey[200]` #EAEAEA | `grey[800]` #3D3D3D |
| `BACKGROUND.CONTRAST_TEXT` | `black.highEmphasis` rgba(0,0,0,.87) | `white` #ffffff |
| `BACKGROUND.TRASNPARENT_HOVER` ⚠️ | `grey[50]` #F9F9F9 | `grey[700]` #5B5B5B |
| `BACKGROUND.TRASNPARENT_ACTIVE` ⚠️ | `grey[200]` #EAEAEA | `grey[900]` #1C1C1C |

### BORDER
| Token | Light | Dark |
|---|---|---|
| `BORDER.LIGHTEST` | `grey[100]` #F3F3F3 | same |
| `BORDER.LIGHTER` | `grey[200]` #EAEAEA | same |
| `BORDER.LIGHT` | `grey[300]` #DBDBDB | same |
| `BORDER.MAIN` | `grey[400]` #B7B7B7 | same |
| `BORDER.DARK` | `grey[500]` #979797 | same |
| `BORDER.DARKER` | `black.mediumEmphasis` rgba(0,0,0,.6) | `white` #ffffff |

### ERROR
| Token | Light & Dark |
|---|---|
| `ERROR.LIGHTER` | `red[50]` #FFEAED |
| `ERROR.LIGHT` | `red[100]` #FFCBCF |
| `ERROR.MAIN` | `red[400]` #EB4C46 |
| `ERROR.DARK` | `red[800]` #C21D1D |

### DISABLED
| Token | Light & Dark |
|---|---|
| `DISABLED.CONTRAST_TEXT` | `grey[400]` #B7B7B7 |
| `DISABLED.LIGHTER` | `grey[50]` #F9F9F9 |
| `DISABLED.MAIN` | `black.disabled` rgba(0,0,0,.38) |
