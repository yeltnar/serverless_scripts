const config = require('config');
const {exec} = require("child_process")
const fs = require("fs")

//my files
import {helpersInit} from './helpers/helper'
import {pushNotification} from './helpers/ifttt'
//import lights from './serverless_files/lights/lights';
import obd_init from './serverless_files/obd/obd';
import wallpaper_init  from './serverless_files/phone_wallpaper/app';
import hue_init  from './serverless_files/hue/hue';
import weather_init  from './serverless_files/weather/weather';
import slack from './serverless_files/slack/slack';

let helpers =  helpersInit();

let parsers = {phone_wallpaper:null,obd:null,hue:null,weather:null};

parsers.phone_wallpaper = wallpaper_init( helpers, config.phone_wallpaper, parseObj )
parsers.obd = obd_init( helpers, pushNotification, parseObj, parsers )
parsers.hue = hue_init( helpers, config.hue, parseObj )
parsers.weather = weather_init( helpers, config.hue, parseObj, config.weather )

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
    let result={};

    for(let k in obj.request.query){
        query_body[k] = obj.request.query[k];
    }
    for(let k in obj.request.body){
        query_body[k] = obj.request.body[k];
    }

    if( /wallpaper/.test(pathName) ){

        parsers.phone_wallpaper( query_body );

    }

    if ( /obd/.test(pathName) ) {
        result = await parsers.obd( obj );
    }

    if(/hue/.test(pathName)  ){
        result = await parsers.hue( query_body );
    }

    if(/weather/.test(pathName)  ){
        result = await parsers.weather( {query_body,pathName} );
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