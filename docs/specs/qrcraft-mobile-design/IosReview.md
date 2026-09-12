# iOS design review (`/emil-design-eng`)

Review of the nine iOS artboards (`Main` / Generate, `IosGenerateDark`, `IosForm`,
`IosDesignSheet`, `IosDesignAdvanced`, `IosScan`, `IosScanResult`, `IosSaved`,
`IosSettings`). These are static comps, so the notes below are what needs to be
built in as motion/feedback once they become live components, plus a couple of
craft gaps visible in the comp itself.

| Before | After | Why |
| --- | --- | --- |
| Segmented controls (reliability, security, theme, foreground-fill) render each pill's glass background independently, swapped on selection | One shared "thumb" element that slides via `transform: translateX()` with `transition: transform 180ms ease-out` | These are tapped occasionally, not constantly — deserves a real animation, not a hard color cut; sliding thumb also reads as one continuous surface instead of re-rendered pills |
| Content-type row (Link/Wi-Fi/Contact/…) selection swap on `Main`/`IosForm` is instant | Crossfade + slight scale on the newly active pill (`opacity`/`transform`, ~150ms ease-out) | State indication for the active type should feel deliberate, matching the reliability segment's motion language — right now the two controls would feel inconsistent once built |
| Toggle switches ("Hidden network", "Transparent background") | Animate the thumb with `transform: translateX()` (not width/left), 150–200ms ease-out; on press, momentarily widen the thumb (iOS convention) | `transform` is GPU-accelerated and interruptible; matches native iOS toggle feel, which users will compare this against constantly |
| QR preview regenerates its full pixel grid on every debounced edit (`Main`, `IosGenerateDark`) | Add `filter: blur(2px)` for ~120ms during the swap, synced with the byte-counter update | A hard-cut QR pattern change reads as flicker; blur bridges old/new modules into one perceived transform instead of two overlapping QR codes |
| Design/Advanced-Design bottom sheets (`IosDesignSheet`, `IosDesignAdvanced`) — scrim and sheet are separate absolutely-positioned layers | Fade the scrim's opacity in lockstep with the sheet's `translateY(100%) → translateY(0)`, both using `--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1)`; wire swipe-to-dismiss with velocity (~0.11) rather than a hard threshold | Spatial consistency: scrim and sheet should read as one motion, not two independently-timed layers; velocity-based dismiss is the iOS sheet convention users expect |
| Amber warning banner in `IosDesignSheet` ("Dots at Low reliability…") appears/disappears based on the reliability choice | Animate height + opacity together (not a hard mount/unmount), and expect to hand-tune the pairing per the Sonner playbook | It's conditional content shifting layout — an instant pop-in/out will feel broken; this needs the "trial and error until it feels right" treatment, not a formula |
| Saved-designs grid selection border (`IosSaved`, the `1.5px solid #A04D28` ring on "Menu card") | Transition `border-color`/`box-shadow` explicitly (~150ms ease), never `transition: all` | Selecting a different saved design should feel like a state change, not a redraw |
| Scan viewfinder (`IosScan`) shows a single static horizontal line mid-frame | This needs to be a continuously sweeping line, `linear` easing, looping | Constant motion (like a progress bar) belongs on `linear`, not eased — the static line as drawn will look like an unfinished/frozen scanner once built |
| Icon-only tap targets: header "Design" shortcut (36×36px, `Main`), password-reveal eye icon (`IosForm`) | Keep the visual chip at its current size but pad the actual hit target to ≥44×44pt | Apple HIG minimum touch target; these are small enough today that mis-taps are likely on real hardware even though they look fine in a static comp |
| `IosSettings`: "Clear history" and "Privacy" rows carry an empty `<span>` where a value label would go | Either give them a real trailing value/state or drop the empty span | Unseen-detail rule cuts both ways — a placeholder gap next to the chevron reads as unfinished dead space even though no one will consciously clock why |

## Already right, keep as-is

- The Design sheets use `translateY` (not `scale(0)` or center-scale) since
  they're edge-anchored sheets, not modals — correct per the modal/popover
  distinction (modals stay centered; sheets slide from their edge).
- The whole set reserves top/bottom safe areas without drawing fake status
  bars/keyboards, per the README's own convention.
