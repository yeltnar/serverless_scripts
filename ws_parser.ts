import {init_pushNotification} from './helpers/ifttt' 
import MyParserContainer from './MyParserContainer.class';
import {AbstractParser} from './parse_framework/Parser.class';
import StateLoader from './parse_framework/StateLoader.class'

const config = require('config');
const {exec} = require("child_process");
const fs = require("fs");

let mainParserContainer = new MyParserContainer();

// default values 
let in_file_location = process.argv[2];
let out_file_name = process.argv[3];
let out_folder_location = process.argv[4];

let deviceName = "";

process.on("exit", (m)=>{
    //console.log("exiting");
});

process.on("message", async(obj)=>{

    if( obj.response_device ){
        if( obj.response_device.device_name ){
            deviceName = obj.response_device.device_name;
            init_pushNotification(deviceName);
        }
        if( obj.response_device.file_name!==undefined ){
            out_file_name = obj.response_device.file_name;
        }
        if( obj.response_device.out_file_folder!==undefined ){
            out_folder_location = obj.response_device.out_file_folder;
        }
    }

    //console.log(m)
    const result = await masterParser.parse( obj );
    process.send( result );
    process.exit();
});


class MasterParser extends AbstractParser{

    testRegex=/.*/;

    constructor(){

        super( "MasterParser", {}, new StateLoader("MasterParser", "masterParser.json"), mainParserContainer);
    }

    _abstractTransformObj( obj ){

        let query_body = {};

        for(let k in obj.request.query){
            query_body[k] = obj.request.query[k];
        }
        for(let k in obj.request.body){
            query_body[k] = obj.request.body[k];
        }

        return obj;
    }

    async _parse( obj ){

        let result:any=[];

        if( obj.response_device && obj.response_device.device_name ){
            deviceName = obj.response_device.device_name;
            init_pushNotification(deviceName);
        }

        try{
            result = await mainParserContainer.parseExposed(obj);
            result = result.length===1 ? result[0] : result;
        }catch(e){
            console.log(e);
            result = e;
        }
        

        // leave at end of function 
        if( !obj.result ){
        }

        writeToOutFile(result);
    return result;
    }
}

let masterParser = new MasterParser();

if( in_file_location !== undefined ){
    let obj:any;

    try{
        obj = JSON.parse(fs.readFileSync( in_file_location ).toString());

        if( obj.response_device && obj.response_device.device_name ){
            deviceName = obj.response_device.device_name;
        }

        masterParser.parse( obj );
    }catch(e){
        console.error(e);
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

function writeToOutFile(out_data){

    console.log("trying "+out_file_name+" "+out_folder_location)

    if( out_file_name === undefined || out_folder_location === undefined ){return}

    if (!fs.existsSync(out_folder_location)){
        fs.mkdirSync(out_folder_location);
        fs.writeFileSync(out_folder_location+"/.gitignore", "*", ()=>{})
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