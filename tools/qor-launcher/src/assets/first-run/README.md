# First-run animation

Put the launcher's first-run animation here. It plays once, the first time a newly
installed or updated launcher opens, then never again for that version. Any click or
key skips it, and it never plays for someone who has asked for less motion.

- **One file.** If there are several, the first by name is used.
- **Video** (`.webm` or `.mp4`) plays to its end. Use no sound; it is muted anyway.
  1920×1080 or 2560×1440, 16:9, filling the window (edges may be cropped).
  Keep it under about ten seconds.
- **Animated image** (`.gif`, `.webp`, `.apng`) or a still (`.png`, `.svg`) is shown
  for six seconds, fitted inside the window.
- The window's background is the theme's darkest colour, so a dark first and last
  frame blends in.

With no file here, a longer version of the splash plays, ending on
"Installed. Welcome to the Nexus."

The file is built into the launcher, so rebuild the installer after adding it
(`npm run app:build`).
