# Shooter Game

This is just a tutorial I did off of YouTube to get a better understanding of developing games for the web.

<img width="795" height="531" alt="image" src="https://github.com/user-attachments/assets/5a5c5437-f6c0-4b01-86b4-972c739b67de" />

## Running the game

You should be able to pull the repo and just open the index file. Alternatively, you can run if you have python 3.* installed:

- `python3 -m http.server`
- navigate to `localhost:8000`

## Notes

I created the sound effects used in the game and added the triggers to fire them. Majority of the logic was from the tutorial, with a few updates I did myself.

The sounds and background music were edited using Audacity. I created the loop of Kavinsky's NightCall for the main music and used some Sonic tracks as the win/lose music. SEGA, please don't come after me :P

I was curious about how to build games made for the web. These days, I am learning Godot and Unity, although when publishing through those services, these applications export to a similar set up like this repo (HTML/CSS/JS + assets), which you can see below.

There is no intent to make this repo more modular. It was a blast learning from the tutorial and following up with music and sound effects. The game has been tested in Chrome and Firefox. 


**Unity**
```
/ExampleGame/
├── index.html                <-- The entry point (sets up the canvas)
├── TemplateData/             <-- CSS, icons, and loading bar visuals
└── Build/
    ├── Game.loader.js        <-- The "brain" that connects JS to the engine
    ├── Game.framework.js     <-- The compiled engine code (JavaScript)
    ├── Game.data             <-- Compressed assets (models, textures, sounds)
    └── Game.wasm             <-- The compiled C# logic (Binary format)
```

**Godot**
```
/GodotExampleGame/
├── index.html                <-- The entry point
├── index.js                  <-- The JavaScript glue code
├── index.pck                 <-- The "Package": contains all your scenes and assets
├── index.wasm                <-- The Godot engine compiled to WebAssembly
├── index.apple-touch-icon.png 
└── index.icon.png
```

## Resources

- [Create a 2d Game by FreeCodeCamp - Youtube](https://youtu.be/7BHs1BzA4fs)
- [NightCall by Kavinsky](https://youtu.be/MV_3Dpw-BRY)
- [Audacity](https://www.audacityteam.org/)
