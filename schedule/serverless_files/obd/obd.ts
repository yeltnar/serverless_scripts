let fs = require('fs');
import { pushNotification } from '../../../helpers/ifttt';

let link = "https://ws-expose.mybluemix.net/v1/get-log?token=hello";

let data_file_location = process.argv[2];

let event={type:undefined, category:undefined};
try{
    let file_contents = fs.readFileSync(data_file_location).toString();
    //console.log(file_contents);
    let file_obj = JSON.parse( file_contents );

    let regex_result = /(.+):(.+)/.exec( file_obj.request.body.type )

    event = { type:regex_result[1], category:regex_result[2] };
}catch(e){
    console.log(e);
    //pushNotification( {"title":"Car message", "message":"could not parse process.argv[2]", link} )
}

console.log(event);

if( event.type === "notification" ){
    pushNotification( {"title":"From car","message":JSON.stringify(event), "link":"https://ws-expose.mybluemix.net/v1/get-log?token=hello"} )
}

if( event.type==="vehicle" ){ 
    if( event.category === "status_report" ){
        // currently do nothing... is just a report 
    }
}

if( event.type==="ignition" ){   

    let title = "Car ignition";
    let message;

    if( event.category === "off" ){

        message = "off";

    }else if( event.category === "on" ){

        message = "on";

    }

    pushNotification( {title, message, link} )
}

if( event.type==="trip" ){  

    let title = "Trip";
    let message;

    if( event.category === "finished" ){
        // currently do nothing... is just a report 
        message = "finished";
    }

    pushNotification( {title, message, link} )
}
