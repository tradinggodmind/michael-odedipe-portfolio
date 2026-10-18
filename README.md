# Michael Odedipe — AI photography portfolio

[View the live portfolio](https://tradinggodmind.github.io/michael-odedipe-portfolio/)

A responsive portfolio for Michael Odedipe, an AI photographer and art director based in Nigeria. It presents 50 independent fashion studies in five photographic worlds, with four narrative transitions, image-specific details, a headshot, and an email-based enquiry flow.

## Experience

- Studio: depth ring of photographic cards
- Lifestyle: asymmetric bowed and floating planes
- Dystopian Brutalism: continuous hourglass image ribbon
- Real-World Artistic: turning centre card and flared side surfaces
- Sci-Fi-Inspired: diagonal poster stream with local edge echoes
- Forty glossy, pointer-responsive 3D spheres in the opening scene
- Full-viewport gallery stages, uniform scene scaling, 2.6-second automatic transitions, and a one-second hold between steps
- Drag, arrow-key and pause controls, study detail viewer, responsive navigation, and reduced-motion support

The layouts were reconstructed from supplied video references and written analysis. They are independent implementations with Michael's images; pixel-identical reproduction of the reference sites or footage is not claimed. All brand studies are speculative AI-generated work, not commissioned campaigns or endorsements. Garment titles describe original styling rather than verified retail product names.

## Develop

Requires Node.js 22.13 or newer.

```sh
npm ci
npm run dev
```

Before publishing:

```sh
npm run check
npm run verify:content
npm run build
```

The GitHub Actions workflow in `.github/workflows/pages.yml` builds and publishes the `dist/` directory on each push to `main`. In repository Settings → Pages, select **GitHub Actions** as the source. Vite uses relative asset URLs so the site works under this repository path.

Study metadata is in `content/works.json`, descriptions in `content/descriptions.ts`, and photography assets in `public/images/`. Contact drafts open the visitor's email app and are addressed to **odedipeoluwafemi@gmail.com**; the site does not run a mail server.
