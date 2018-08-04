import Parser from '../../Parser.class';
const requestP = require('request-promise-native');

class weatherParser extends Parser {

    constructor( helpers, config, parsers ){
        super( helpers, config, parsers );
    }

    _shouldParse( parserObj ):boolean{
        return /weather/.test(parserObj.pathName);
    }

    _transformObj(parserObj){
        return parserObj;
    }

    async _doParse( parserObj ){

        let toReturn:any={};
    
        if( /sun_status/.test(parserObj.pathName) ){
            const results = await this.getCurrentLocalAstronomy( parserObj.query_body.lat, parserObj.query_body.lon );
    
            toReturn.sunrise = results.moon_phase.sunrise;
            toReturn.sunset = results.moon_phase.sunset;
            toReturn.time = results.current_observation.local_time_rfc822;
        }
    
        if( /sun_up_home/.test(parserObj.pathName) ){
            let query_body = {lat:32.917795, lon:-96.769769};
            toReturn = await this._doParse({query_body,pathName:"/sun_up/"});
        }
        else if( /sun_up/.test(parserObj.pathName) ){
    
            let query_body = {lat:parserObj.query_body.lat, lon:parserObj.query_body.lon};
    
            let sunsetData = await this._doParse({query_body,pathName:"/sun_status/"});
    
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

    getCurrentLocalWeather(lat, lon){

        if( this.config.token===undefined ){throw "this.config.token must be defined";}
        if( lat===undefined ){throw "lat must be defined";}
        if( lon===undefined ){throw "lon must be defined";}

        const url = `http://api.wunderground.com/api/${this.config.token}/conditions/q/${lat},${lon}.json`

        return requestP(url);
    }

    getCurrentLocalAstronomy(lat, lon){

        if( this.config.token===undefined ){throw "this.config.token must be defined";}
        if( lat===undefined ){throw "lat must be defined";}
        if( lon===undefined ){throw "lon must be defined";}

        const url = `http://api.wunderground.com/api/${this.config.token}/conditions/astronomy/q/${lat},${lon}.json`;

        return requestP(url).then((res)=>{
            // if lat/lon don't have reading this will fail
            return JSON.parse(res);
        });
    }
}

export default weatherParser;