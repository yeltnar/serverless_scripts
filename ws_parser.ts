const config = require('config');
const {exec} = require("child_process");
const fs = require("fs");

//my files
import {ParserContainer,parseInit} from './parse_framework/Parser.class';
import helpers from './helpers/helper'
import {pushNotification, init_pushNotification} from './helpers/ifttt' 
//import lights from './serverless_files/lights/lights';

import ObdParser from './serverless_files/obd/obd';
import PhoneWallpaperParser  from './serverless_files/phone_wallpaper/app';
import HueParser  from './serverless_files/hue/hue';
import WeatherParser  from './serverless_files/weather/weather';
import GeofenceParser  from './serverless_files/geofence/geofence';
import {NotifyLeaving}  from './serverless_files/notify_leaving/notify_leaving';
import GetParsers  from './serverless_files/get_parsers/get_parsers';
import Ping  from './serverless_files/ping/ping';
import Person  from './serverless_files/person/person';
import slack from './serverless_files/slack/slack';

parseInit(pushNotification, helpers);

ParserContainer.addStaticParser(new ObdParser("obd", config.obd));
ParserContainer.addStaticParser(new PhoneWallpaperParser("phoneWallpaper", config.phone_wallpaper));
ParserContainer.addStaticParser(new HueParser("hue", config.hue));
ParserContainer.addStaticParser(new WeatherParser("weather", config.weather)); // TODO these names seem so brok)en
ParserContainer.addStaticParser(new GeofenceParser("geofence", config.geofence));
ParserContainer.addStaticParser(new NotifyLeaving("notify_leaving", config.notify_leaving));
ParserContainer.addStaticParser(new Ping("ping", config.ping));
ParserContainer.addStaticParser(new GetParsers("get_parsers", config.get_parsers));
ParserContainer.addStaticParser(new Person("person", config.persons.drew));

const serverless_folder = config.serverless_folder; // serverless_folder has the `/` at the end

let in_file_location = process.argv[2];
let out_file_name = process.argv[3];
let out_folder_location = process.argv[4];

if( in_file_location === undefined ){
    // prob importing 
    console.log("module.parent");
    console.log(module.parent);
    //throw "file_location not defined";
}else{

    try{
        let obj = JSON.parse(fs.readFileSync( in_file_location ).toString());
        doParseObj( obj );
    }catch(e){
        console.error(e);
    }
}

async function doParseObj(obj) {

    let pathName = obj.request._parsedUrl.pathname;
    let query_body = {};
    let result:any=[];

    // TODO put this in a better spot
    if( obj.response_device && obj.response_device.device_name ){
        init_pushNotification(obj.response_device.device_name);
        console.log(Object.keys(obj));
    }

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

export default doParseObj;