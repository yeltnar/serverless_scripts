let fs = require('fs');
import { pushNotification } from '../../../helpers/ifttt';

let link = "https://ws-expose.mybluemix.net/v1/get-log?token=hello";

let event_type;
try{
    let file_contents = fs.readFileSync("data.json").toString();
    //console.log(file_contents);
    let file_obj = JSON.parse( file_contents );
    event_type = file_obj.request.body.type;
}catch(e){
    console.log(e);
    //pushNotification( {"title":"Car message", "message":"could not parse process.argv[2]", link} )
}

console.log(event_type);

if( /notification\:.+/.test(event_type) ){
    pushNotification( {"title":"From car","message":event_type, "link":"https://ws-expose.mybluemix.net/v1/get-log?token=hello"} )
}

if( /vehicle\:.+/.test(event_type) ){ 
    if( /vehicle\:status_report/.test(event_type) ){
        // currently do nothing... is just a report 
    }
}

if( /ignition\:.+/.test(event_type) ){   

    let title = "Car ignition";
    let message;

    if( /.+\:off/.test(event_type) ){

        message = "off";

    }else if( /.+\:on/.test(event_type) ){

        message = "on";

    }

    pushNotification( {title, message, link} )
}

if( /trip\:.+/.test(event_type) ){  

    let title = "Trip";
    let message;

    if( /.+\:finished/.test(event_type) ){
        // currently do nothing... is just a report 
        message = "finished";
    }

    pushNotification( {title, message, link} )
}
