let fs = require('fs');
let helpers;
let pushNotification;

let link = "https://ws-expose.mybluemix.net/v1/get-log?token=hello";

function main( obj ){

    let event={type:undefined, category:undefined};

    try{
        let regex_result = /(.+):(.+)/.exec( obj.request.body.type )

        event = { type:regex_result[1], category:regex_result[2] };
    }catch(e){
        console.log(e);
    }

    console.log(event);

    if( event.type === "notification" ){
        pushNotification( {"title":"From car","message":JSON.stringify(event), "link":link} )
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

}

function obd_init( local_helpers, local_pushNotification ){
    helpers = local_helpers;
    pushNotification = local_pushNotification
    return main;
}

export default obd_init;