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

    console.log("event...");
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
    return main;
}

async function checkSetLightOn( location_obj ){

    let query_body = {
        lat:location_obj.lat, 
        lon:location_obj.lon
    };

    //try{}catch(e){}

    let sun_up; 
    //sun_up = await parsers.weather({query_body,pathName:"/sun_up/"});
    try{
        sun_up = await parsers.weather({query_body,pathName:"/sun_up/"});
    }catch(e){
        console.log(e);
        sun_up=null;
    }

    let geofence_locations

    let car_at_home; 
    try{
        geofence_locations = await parsers.geofence({query_body,pathName:null});
        car_at_home = geofence_locations.indexOf("home")>=0;
        console.log("car is at home");
    }catch(e){
        console.log(e);
        car_at_home=null;
    }

    if( sun_up && car_at_home  ){
        try{
            await parsers.hue({"light_name":"living_room","state":"on"});
        }catch(e){console.error(e);}
    }

    const toReturn = {sun_up,car_at_home,geofence_locations,location_obj};

    pushNotification( {"title":"From car","message":toReturn} )
    return {sun_up,car_at_home,geofence_locations,location_obj};
}

async function check_car_at_on_locataion(location_obj){
    return false;
}

export default obd_init;