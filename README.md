# Wonders Rally: World Tour

A rebuilt browser racing prototype designed for iPad landscape play.

## What changed

- Full-screen cinematic presentation
- Large analog-style thumb steering instead of relying on arrow keys
- Auto-acceleration, brake, nitro, optional iPad tilt steering
- Actual photographs of all seven New Wonders used in the tracks and destination cards
- New pseudo-3D road renderer, road curvature, lane markings, scenery, speed effects, particles, a more detailed car, engine sound, race HUD, relics, hazards, boost gates, and saved best times

## Play

Unzip the folder and open `index.html` in Safari, Chrome, or Edge. Landscape orientation is strongly recommended.

For local development:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Controls

### iPad / touch

- The car accelerates automatically.
- Drag the large wheel on the left to steer.
- Hold **BRAKE** to slow down.
- Hold **NITRO** for a speed boost.
- **ENABLE TILT** can use iPad motion steering when browser permission is granted.

### Keyboard

- A / D or Left / Right: steer
- S, Down, or Space: brake
- W, Up, or Shift: nitro

## Photograph credits

The photographs are bundled locally and sourced from Wikimedia Commons under Creative Commons licenses.

- Great Wall of China — Mike from Vancouver / Flickr, CC BY-SA 2.0
  Source: https://commons.wikimedia.org/wiki/File:Great_Wall_Panorama_-2_(847771375).jpg
- Petra, Al-Khazneh — Graham Racher; derivative by MrPanyGoff, CC BY-SA 2.0
  Source: https://commons.wikimedia.org/wiki/File:Al_Khazneh_Petra_edit_2.jpg
- Machu Picchu — Martin St-Amant, CC BY-SA 3.0
  Source: https://commons.wikimedia.org/wiki/File:80_-_Machu_Picchu_-_Juin_2009_-_crop.jpg
- Taj Mahal — Shikhar Sharma, CC BY-SA 3.0
  Source: https://commons.wikimedia.org/wiki/File:Taj_Mahal_Front.JPG
- Colosseum — Nicholas Hartmann, CC BY-SA 4.0
  Source: https://commons.wikimedia.org/wiki/File:Rome_Colosseum_exterior_panorama.jpg
- Chichén Itzá — Daniel Schwen, CC BY-SA 4.0
  Source: https://commons.wikimedia.org/wiki/File:Chichen_Itza_3.jpg
- Christ the Redeemer — Nico Kaiser, CC BY 2.0
  Source: https://commons.wikimedia.org/wiki/File:Cristo_Redentor_-_Rio_de_Janeiro,_Brasil.jpg

This remains a lightweight browser prototype rather than a commercial AAA production. It is designed to create a substantially more cinematic arcade-racing feel without requiring a game engine or multi-gigabyte 3D asset library.
