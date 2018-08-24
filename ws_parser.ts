const config = require('config');
const {exec} = require("child_process")
const fs = require("fs")

//my files
import {ParserContainer,parseInit} from './parse_framework/Parser.class';
import {helpersInit} from './helpers/helper'
import {pushNotification} from './helpers/ifttt' 
//import lights from './serverless_files/lights/lights';

import ObdParser from './serverless_files/obd/obd';
import PhoneWallpaperParser  from './serverless_files/phone_wallpaper/app';
import HueParser  from './serverless_files/hue/hue';
import WeatherParser  from './serverless_files/weather/weather';
import GeofenceParser  from './serverless_files/geofence/geofence';
import {NotifyLeaving}  from './serverless_files/notify_leaving/notify_leaving';
import Ping  from './serverless_files/ping/ping';
import slack from './serverless_files/slack/slack';

let helpers =  helpersInit();
parseInit(pushNotification, helpers, config);

ParserContainer.addStaticParser(new ObdParser("obd", config.obd));
ParserContainer.addStaticParser(new PhoneWallpaperParser("phoneWallpaper", config.phone_wallpaper));
ParserContainer.addStaticParser(new HueParser("hue", config.hue));
ParserContainer.addStaticParser(new WeatherParser("weather", config.weather)); // TODO these names seem so brok)en
ParserContainer.addStaticParser(new GeofenceParser("geofence", config.geofence));
ParserContainer.addStaticParser(new NotifyLeaving("notify_leaving", config.notify_leaving));
ParserContainer.addStaticParser(new Ping("ping", config.ping));

const serverless_folder = config.serverless_folder; // serverless_folder has the `/` at the end

let in_file_location = process.argv[2];
let out_file_name = process.argv[3];
let out_folder_location = process.argv[4];

if( in_file_location === undefined ){
    throw "file_location not defined";
}

try{
    let obj = JSON.parse(fs.readFileSync( in_file_location ).toString());
    parseObj( obj );
}catch(e){
    console.error(e);
}

async function parseObj(obj) {
    let pathName = obj.request._parsedUrl.pathname;
    let query_body = {};
    let result:any=[];

    for(let k in obj.request.query){
        query_body[k] = obj.request.query[k];
    }
    for(let k in obj.request.body){
        query_body[k] = obj.request.body[k];
    }

    try{
        result = await ParserContainer.parseExposed(obj);

        result = result.length===1 ? result[0] : result;
    }catch(e){
        console.log(e);
        result = e;
    }

    // leave at end of function 
    if( !obj.result ){
    }


    writeToOutFile(result);
}


function runShell(toExec, options, params=""){
	return new Promise((resolve, reject)=>{

		toExec = toExec+" "+params;
        console.log(toExec);

		exec(toExec, options, (err, stdout, stderr)=>{
			if(err){
				console.error("run shell err");
				reject({err,stderr});
			}if(stderr){
				console.error("run shell stderr");
				reject({err,stderr});
			}else{
				resolve(stdout);
			}
		});
	});
}

function log(obj){
    fs.writeFile("parse_log.txt", JSON.stringify(obj), (err)=>{
        if(err){console.error(err);}
        console.log("wrote file");
    });
}

function writeToOutFile(out_data){

    console.log("trying "+out_file_name+" "+out_folder_location)

    if( out_file_name === undefined || out_folder_location === undefined ){return}

    if (!fs.existsSync(out_folder_location)){
        fs.mkdirSync(out_folder_location);
        fs.writeFile(out_folder_location+"/.gitignore", "*", ()=>{})
    }

    //out_file_location
    let out_str;
    if( typeof out_data === "object" ){
        out_str = JSON.stringify(out_data);
    }else{ // assume string
        out_str = out_data;
    }
    fs.writeFileSync(out_folder_location+"/"+out_file_name, out_str);
}