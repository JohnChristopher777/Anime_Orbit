import { createGlobalStyle } from 'styled-components';

const Typography = createGlobalStyle`
  /* Import Japanese-inspired fonts */
  @import url('https://fonts.googleapis.com/css2?family=Bungee&family=Bebas+Neue&family=Staatliches&family=Bangers&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;600;700;900&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap');

  :root {
    /* Typography Scale */
    --font-size-xs: 0.75rem;     /* 12px */
    --font-size-sm: 0.875rem;    /* 14px */
    --font-size-base: 1rem;      /* 16px */
    --font-size-lg: 1.125rem;    /* 18px */
    --font-size-xl: 1.25rem;     /* 20px */
    --font-size-2xl: 1.5rem;     /* 24px */
    --font-size-3xl: 1.875rem;   /* 30px */
    --font-size-4xl: 2.25rem;    /* 36px */
    --font-size-5xl: 3rem;       /* 48px */
    --font-size-6xl: 3.75rem;    /* 60px */

    /* Font Families */
    /* Special Japanese-style display font for "Anime Orbit" logo only */
    --font-logo: 'Bungee', 'Bebas Neue', cursive;
    
    /* Headings - Bold and impactful */
    --font-heading: 'Staatliches', 'Bebas Neue', cursive;
    
    /* Subheadings - Clean and modern */
    --font-subheading: 'Montserrat', sans-serif;
    
    /* Body text - Highly readable */
    --font-body: 'Inter', 'Noto Sans JP', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    
    /* Japanese accent text */
    --font-japanese: 'Noto Sans JP', sans-serif;
    
    /* Special effects/banners */
    --font-banner: 'Bangers', cursive;

    /* Line Heights */
    --line-height-tight: 1.2;
    --line-height-normal: 1.5;
    --line-height-relaxed: 1.75;
    --line-height-loose: 2;

    /* Letter Spacing */
    --letter-spacing-tight: -0.02em;
    --letter-spacing-normal: 0;
    --letter-spacing-wide: 0.05em;
    --letter-spacing-wider: 0.1em;
    --letter-spacing-widest: 0.15em;

    /* Font Weights */
    --font-weight-light: 300;
    --font-weight-normal: 400;
    --font-weight-medium: 500;
    --font-weight-semibold: 600;
    --font-weight-bold: 700;
    --font-weight-extrabold: 800;
    --font-weight-black: 900;
  }

  /* Global Typography Styles */
  
  /* Logo - Anime Orbit brand name only */
  .logo,
  .brand-name {
    font-family: var(--font-logo);
    font-weight: var(--font-weight-bold);
    letter-spacing: var(--letter-spacing-wide);
    text-transform: uppercase;
  }

  /* Main headings - Clean and readable */
  h1, .h1 {
    font-family: var(--font-heading);
    font-size: var(--font-size-4xl);
    font-weight: var(--font-weight-bold);
    line-height: var(--line-height-tight);
    letter-spacing: var(--letter-spacing-tight);
  }

  h2, .h2 {
    font-family: var(--font-heading);
    font-size: var(--font-size-3xl);
    font-weight: var(--font-weight-bold);
    line-height: var(--line-height-tight);
    letter-spacing: var(--letter-spacing-normal);
  }

  h3, .h3 {
    font-family: var(--font-subheading);
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-semibold);
    line-height: var(--line-height-normal);
  }

  h4, .h4 {
    font-family: var(--font-subheading);
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    line-height: var(--line-height-normal);
  }

  h5, .h5 {
    font-family: var(--font-subheading);
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-medium);
    line-height: var(--line-height-normal);
  }

  h6, .h6 {
    font-family: var(--font-subheading);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    line-height: var(--line-height-normal);
  }

  /* Body text - Highly readable */
  p, .body-text {
    font-family: var(--font-body);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-normal);
    line-height: var(--line-height-relaxed);
    letter-spacing: var(--letter-spacing-normal);
  }

  /* Small text */
  small, .text-small {
    font-family: var(--font-body);
    font-size: var(--font-size-sm);
    line-height: var(--line-height-normal);
  }

  /* Utility Classes */
  
  /* Japanese accent text */
  .japanese-text {
    font-family: var(--font-japanese);
    font-weight: var(--font-weight-medium);
  }

  /* Banner/Special text */
  .banner-text {
    font-family: var(--font-banner);
    letter-spacing: var(--letter-spacing-wide);
    text-transform: uppercase;
  }

  /* Readable body text */
  .readable {
    font-family: var(--font-body);
    font-size: var(--font-size-lg);
    line-height: var(--line-height-relaxed);
    max-width: 65ch; /* Optimal reading width */
  }

  /* Display text for hero sections */
  .display {
    font-family: var(--font-heading);
    font-size: var(--font-size-5xl);
    font-weight: var(--font-weight-extrabold);
    line-height: var(--line-height-tight);
    letter-spacing: var(--letter-spacing-tight);
  }

  /* Lead text for introductions */
  .lead {
    font-family: var(--font-body);
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-normal);
    line-height: var(--line-height-relaxed);
  }

  /* Uppercase text */
  .uppercase {
    text-transform: uppercase;
    letter-spacing: var(--letter-spacing-wider);
  }

  /* Truncate text */
  .truncate {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* Responsive Typography */
  @media (max-width: 768px) {
    :root {
      --font-size-xs: 0.7rem;
      --font-size-sm: 0.8rem;
      --font-size-base: 0.9rem;
      --font-size-lg: 1rem;
      --font-size-xl: 1.1rem;
      --font-size-2xl: 1.3rem;
      --font-size-3xl: 1.6rem;
      --font-size-4xl: 2rem;
      --font-size-5xl: 2.5rem;
      --font-size-6xl: 3rem;
    }

    h1, .h1 {
      font-size: var(--font-size-3xl);
    }

    h2, .h2 {
      font-size: var(--font-size-2xl);
    }

    .display {
      font-size: var(--font-size-4xl);
    }
  }

  /* Accessibility */
  @media (prefers-reduced-motion: reduce) {
    * {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
`;

export default Typography;
