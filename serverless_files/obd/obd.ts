let fs = require('fs');
let helpers, pushNotification, parseObj, parsers;

let link = "https://ws-expose.mybluemix.net/v1/get-log?token=hello";

async function main( obj ){

    let event={type:undefined, category:undefined};
    let result;

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

            let location_obj = {
                lat:obj.request.body.location.lat, 
                lon:obj.request.body.location.lon
            };

            result = checkSetLightOn( location_obj );

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

    return result;

}

function obd_init( local_helpers, local_pushNotification, local_parseObj, local_parsers ){
    helpers = local_helpers;
    pushNotification = local_pushNotification
    parseObj = local_parseObj;
    parsers = local_parsers;
    console.log("local_parsers")
    console.log(local_parsers)
    return main;
}

async function checkSetLightOn( location_obj ){

    // console.log('hi')

    // let now = Date.now();

    // let promiseResult = Promise.all([ parsers.weather({"report":"sunset"}), check_car_at_on_locataion(location_obj) ]);
    // let sunset = promiseResult[0];
    // let car_at_on_locataion = promiseResult[1];

    // if( now > sunset  && car_at_on_locataion ){
    //     await parsers.hue({"light_name":"living_room","state":"on"})
    // }
}

async function check_car_at_on_locataion(location_obj){
    return false;
}

export default obd_init;