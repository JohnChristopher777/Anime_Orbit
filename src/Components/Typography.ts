import { createGlobalStyle } from 'styled-components';

export const Typography = createGlobalStyle`
  :root {
    --font-logo: 'Montserrat', sans-serif;
    --font-heading: 'Staatliches', 'Bebas Neue', cursive;
    --font-subheading: 'Montserrat', sans-serif;
    --font-body: 'Inter', 'Noto Sans JP', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    --font-japanese: 'Noto Sans JP', sans-serif;
    --font-banner: 'Bangers', cursive;
  }

  .logo, .brand-name {
    font-family: var(--font-logo);
    font-weight: 900;
    text-transform: uppercase;
  }

  h1, .h1 {
    font-family: var(--font-heading);
    letter-spacing: 0.02em;
  }

  h2, .h2 {
    font-family: var(--font-heading);
    letter-spacing: 0.02em;
  }

  h3, .h3, h4, .h4 {
    font-family: var(--font-subheading);
    font-weight: 700;
  }

  p, .body-text {
    font-family: var(--font-body);
  }
`;

export default Typography;
