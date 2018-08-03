import { lstat } from "fs";
const requestP = require('request-promise-native');

let helpers,parseObj,parsers,weather_config;

async function main( parse_obj ){

    let toReturn:any={};

    if( /sun_status/.test(parse_obj.pathName) ){
        const results = await getCurrentLocalAstronomy( parse_obj.query_body.lat, parse_obj.query_body.lon );
        
        console.log("results")
        console.log(Object.keys(results))
        console.log(results.moon_phase)


        toReturn.sunrise = results.moon_phase.sunrise;
        toReturn.sunset = results.moon_phase.sunset;
        toReturn.time = results.current_observation.local_time_rfc822;
    }

    if( /sun_up/.test(parse_obj.pathName) ){

        let query_body = {lat:parse_obj.query_body.lat, lon:parse_obj.query_body.lon};

        let sunsetData = await main({query_body,pathName:"/sun_status/"});

        let now = new Date();
        
        let sunrise = new Date();
        sunrise.setHours( sunsetData.sunrise.hour );
        sunrise.setMinutes( sunsetData.sunrise.minute );
        sunrise.setSeconds(0);
        sunrise.setMilliseconds(0);

        let sunset = new Date();
        sunset.setHours( sunsetData.sunset.hour );
        sunset.setMinutes( sunsetData.sunset.minute );
        sunset.setSeconds(0);
        sunset.setMilliseconds(0);

        toReturn = sunrise < now && sunset > now;

        if( toReturn ){
            console.log("sun is up")
        }else{
            console.log("sun is down")
        }
    }



    return toReturn;
}

function weather_init( local_helpers, local_parseObj, local_parsers, local_weather_config ){
    helpers = local_helpers;
    parseObj = local_parseObj;
    parsers = local_parsers;
    weather_config = local_weather_config;

    return main;
}

export default weather_init;

function getCurrentLocalWeather(lat, lon){

    if( weather_config.token===undefined ){throw "weather_config.token must be defined";}
    if( lat===undefined ){throw "lat must be defined";}
    if( lon===undefined ){throw "lon must be defined";}

    const url = `http://api.wunderground.com/api/${weather_config.token}/conditions/q/${lat},${lon}.json`

    return requestP(url);
}

function getCurrentLocalAstronomy(lat, lon){

    if( weather_config.token===undefined ){throw "weather_config.token must be defined";}
    if( lat===undefined ){throw "lat must be defined";}
    if( lon===undefined ){throw "lon must be defined";}

    const url = `http://api.wunderground.com/api/${weather_config.token}/conditions/astronomy/q/${lat},${lon}.json`;

    return requestP(url).then((res)=>{
        // if lat/lon don't have reading this will fail
        return JSON.parse(res);
    });
}