# Shakuro Font Installation

To complete the font setup, please download the Shakuro font files and place them in this directory:

## Required Files:

1. `Shakuro-Regular.woff2`
2. `Shakuro-Regular.woff`
3. `Shakuro-Regular.ttf`

## Where to get the Shakuro font:

- Visit: https://www.dafont.com/ or similar font websites
- Search for "Shakuro" or a similar display/decorative font
- Download the font package
- Extract the font files to this directory

## Alternative Fonts (if Shakuro is not available):

If you cannot find Shakuro, you can use these similar fonts:

- **Bungee** (already included as fallback in the CSS)
- **Staatliches** (already included)
- **Archivo Black**
- **Anton**

## Note:

The current CSS in `src/index.css` is already configured to use Shakuro with fallbacks.
Once you add the font files here, the "ANIME ORBIT" logo will display with the custom font.

Current fallback chain:

```css
font-family: "Shakuro", "Bungee", cursive;
```

The site will work perfectly fine with the fallback fonts until Shakuro is added!
