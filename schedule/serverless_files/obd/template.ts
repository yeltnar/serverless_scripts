let fs = require('fs');
import { pushNotification } from '../../../helpers/ifttt';

let link = "https://ws-expose.mybluemix.net/v1/get-log?token=hello";

let event_type;
try{
    event_type = JSON.parse( process.argv[2] );
}catch(e){
    console.log("obd/template.ts could not parse process.argv[2]");
    pushNotification( {"title":"Car message", "message":"could not parse process.argv[2]", link} )
}

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

    let title = "Trip done";
    let message;

    if( /.+\:finished/.test(event_type) ){
        // currently do nothing... is just a report 
        message = "finished";
    }

    pushNotification( {title, message, link} )
}
