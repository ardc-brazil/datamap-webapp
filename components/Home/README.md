# The home banner: an isobar map

The landing page hero is drawn as a live synoptic chart — the kind of weather map
meteorologists read every morning. This note explains why it looks the way it
does, so the next change keeps the idea instead of turning it into a generic
animated background.

## Where it comes from

### The mark is already a section of the atmosphere

The DataMap mark is a "D" cut into four horizontal bands whose height shrinks
towards the bottom (36, 25, 14, 10). That is the shape of the atmosphere seen in
profile: pressure falls roughly exponentially with altitude, so layers of equal
pressure difference are thick aloft and crowd together near the ground.

`StrataMark` treats the bands as exactly that — layers. They slide in one after
the other on load, and pull apart as the page scrolls, like an exploded view of
the strata.

### The background is the same idea seen from above

Turn that profile into a map and the layers become **isobars**: lines joining
points of equal pressure. A synoptic chart is the most recognisable picture
atmospheric science has, and it is literally a map of data — which is what the
product is named after.

`IsobarField` draws one:

- **A pressure field** built from a gentle background gradient plus a handful of
  pressure centres that drift slowly along small orbits.
- **Isobars** extracted from that field with *marching squares* — the same
  contouring technique used to draw isolines from gridded model output. That is
  why the lines are irregular, close around centres and never cross: they are
  real contours of a real (if invented) field, not decorated sine waves.
- **Index contours.** Every fourth line is darker, as on topographic and
  synoptic maps.
- **H and L labels** at each centre. They mark centres of **H**igh and **L**ow
  pressure, the international convention on weather charts (Brazilian charts
  sometimes print them as **A**lta and **B**aixa).
- **Wind particles** that move *along* the isobars, perpendicular to the
  pressure gradient. Away from the surface, wind blows parallel to isobars
  (geostrophic wind), so the dots behave the way air does on a real chart.
- **The cursor is a low-pressure system.** Moving the mouse adds a local
  depression to the field, and the isobars reorganise around it.

## Why this and not something else

The brief was "something more elaborate — a parallax, or a nice effect — that
matches what the site is". Generic options (particles, gradients, a globe)
would fit any SaaS. An isobar map only fits a platform for atmospheric data,
and it grows out of the mark rather than sitting next to it.

The visual language stays the site's: monochrome ink on the off-white
background, thin strokes, no colour. The field is faded behind the headline and
at the edges so it never competes with the text.

## Behaviour and constraints

- **Parallax:** `HomeHero` writes the scroll position into the `--hero-scroll`
  and `--hero-progress` CSS variables; the field, the mark's bands and the copy
  each move and fade at their own rate from those, without React re-renders.
- **Reduced motion:** with `prefers-reduced-motion: reduce` the field is drawn
  once, static, and there is no parallax or entrance animation.
- **Cost:** the animation stops while the banner is off screen. The field is
  sampled on a 10px grid every frame; measured at 60 fps on a 1440×900 desktop.
- **No dependencies:** plain Canvas 2D.

## Tuning

At the top of `IsobarField.tsx`:

| Constant | Effect |
|---|---|
| `LEVEL_STEP` | Pressure difference between isobars — smaller means more lines |
| `CELL` | Contouring grid size in px — smaller is smoother and more expensive |
| `PARTICLE_COUNT` | Number of wind particles |
| `CENTERS` | Position, strength (positive = H, negative = L), size and drift of each pressure centre |
