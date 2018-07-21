const config = require('config');
const {exec} = require("child_process")
const fs = require("fs")

//my files
import {helpersInit} from './helpers/helper'
import {pushNotification} from './helpers/ifttt'
import lights from './serverless_files/lights/lights';
import obd_init from './serverless_files/obd/obd';
import wallpaper_init  from './serverless_files/phone_wallpaper/app';
import slack from './serverless_files/slack/slack';
import { parse } from 'querystring';

let helpers =  helpersInit();

let parsers = {
    phone_wallpaper: wallpaper_init( helpers ),
    obd: obd_init( helpers, pushNotification )
}

const serverless_folder = config.serverless_folder; // serverless_folder has the `/` at the end

let file_location = process.argv[2];

if( file_location === undefined ){
    throw "file_location not defined";
}

try{
    let obj = JSON.parse(fs.readFileSync( file_location ).toString());
    parseObj( obj );
}catch(e){
    console.error(e);
}

async function parseObj(obj) {
    let pathName = obj.request._parsedUrl.pathname;

    console.log("parseObj with pathName of `"+pathName+"`");

    if ( /dash-trip-ended/.test(pathName) ) {

        let toExec = "ts-node "+serverless_folder+"template.ts"
        let options = "";
        let params = JSON.stringify(JSON.stringify(obj));

        try{ 
            obj.result = await runShell(toExec, options, params);
        }catch(e){
            obj.errors.runShell = e;
            console.error(e);
        }
    }

    if ( /github/.test(pathName) ) {

        let toExec = "ts-node "+serverless_folder+"template.ts"
        let options = "";
        let params = JSON.stringify(JSON.stringify(obj));

        try{ 
            obj.result = await runShell(toExec, options, params);
        }catch(e){
            obj.errors.runShell = e;
            console.error(e);
        }
    }

    if ( /nest/.test(pathName) ) {

        let toExec = "ts-node "+serverless_folder+"template.ts"
        let options = "";
        let params = JSON.stringify(JSON.stringify(obj));

        try{ 
            obj.result = await runShell(toExec, options, params);
        }catch(e){
            obj.errors.runShell = e;
            console.error(e);
        }
    }

    if( /wallpaper/.test(pathName) ){

        parsers.phone_wallpaper( obj );

    }

    // if(/testing/.test(pathName)){

    //     let res_arr = await Promise.all([
    //         recursive_parseObj( obj, "local_obj_1_result"),  
    //         recursive_parseObj( obj, "local_obj_2_result")  
    //     ])

    //     obj.result = res_arr[0].result+" "+res_arr[1].result;
    //

    if( /local_obj_1_result/.test(pathName) ){
        obj.result = "local_obj_1_result";
    }
    if( /local_obj_2_result/.test(pathName) ){
        obj.result = "local_obj_2_result";
    }

    if ( /obd/.test(pathName) ) {
        parsers.obd( obj );
    }

    if( /get-log/.test(pathName) ){

        let toExec = "cd "+serverless_folder+"; cd ../../../ws-expose-client; cat parse_log.txt";
        let options= "";
        let params= "";

        try{ 
            obj.result = await runShell(toExec, options, params);
            obj.result_only = true;
        }catch(e){
            //toReturn = e.toString();
            obj.errors.runShell = e;
            console.error(e); 
        }
    }

    if ( /lights/.test(pathName) ) {

        let toExec = "ts-node "+serverless_folder+"lights/lights.ts"
        let options = "";
        let params = JSON.stringify(JSON.stringify(obj));

        try{ 
            obj.result = await runShell(toExec, options, params);
            obj.result_only=true;
        }catch(e){
            obj.errors.runShell = e;
            console.error(e);
        }
    }

    if(/shell/.test(pathName)){
        let toExec = obj.request.body.toExec || obj.request.query.toExec || "";
        let options = obj.request.body.options || obj.request.query.options || "";
        let params = obj.request.body.params || obj.request.query.params || "";

        try{ 
            obj.result = await runShell(toExec, options, params);
            obj.result_only = true;
        }catch(e){
            //toReturn = e.toString();
            obj.errors.runShell = e;
            console.error(e);
        }
    }

    if(/oauth\/automatic/.test(pathName)){ // oauth/automatic
        console.log( "got it" );
        obj.result = "got it";
        obj.result_only = true;
        fs.writeFileSync( "t.json", JSON.stringify(obj) );
    }

    // leave at end of function 
    if( !obj.result ){

    }
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