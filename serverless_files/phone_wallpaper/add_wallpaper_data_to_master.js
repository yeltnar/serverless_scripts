const fs = require('fs');

let master_json_location = '../../state/master_state.json';

let master_json = JSON.parse( fs.readFileSync(master_json_location).toString() );
let usedWallpaperArr = JSON.parse( fs.readFileSync('./used_wallpaper.json').toString() );
let savedWallpaperArr = JSON.parse( fs.readFileSync('./saved_wallpaper.json').toString() );

master_json.phoneWallpaper.usedWallpaperArr = usedWallpaperArr;
master_json.phoneWallpaper.savedWallpaperArr = savedWallpaperArr;

console.log(master_json.phoneWallpaper)

fs.writeFileSync( master_json_location, JSON.stringify(master_json) );