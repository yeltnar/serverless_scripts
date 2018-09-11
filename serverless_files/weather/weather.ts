import {HttpParser} from '../../HttpParser.class';
import {FunctionalParser, FunctionalParserObj} from '../../parse_framework/Parser.class'
import ParseObj from '../../parse_framework/ResponseObj.interface'
import { stringify } from 'querystring';

const requestP = require('request-promise-native');


class weatherParser extends HttpParser {

    testRegex = /weather/

    constructor( name, config, mainParserContainer ){
        super( name, config, mainParserContainer );


        this.subParser.forEach((cur, index, arr) => {
            this.parserContainer.addPrivateParser( new FunctionalParser(cur.name, this.config, this.state, cur.funct, cur.testRegex, this.mainParserContainer) );
        });
    }

    subParser:Array<FunctionalParserObj> = [
        {
            name:"update_state",
            testRegex:/\/update_state\//,
            funct:async ( parseObj:ParseObj )=>{

                let {lat, lon} = parseObj.query_body;

                let toReturn:any = "default";

                if( lat!==undefined && lon!==undefined ){
                    let  new_stateObj = {
                        weather: await this.getCurrentLocalWeather( lat, lon ),
                        astronomy: await this.getCurrentLocalAstronomy( lat, lon )
                    }

                    let stateObj = this.state.getState();

                    stateObj[`${lat},${lon}`] = new_stateObj; // TODO make different so it doesn't save every weather location forever

                    this.state.setState( stateObj );
                    toReturn = stateObj;
                }else{
                    console.log("lat, lon");
                }

                return toReturn;
                
            },
            functionalShouldParse:(parseObj)=>{return false;}
        },{
            name:"sun_status",
            testRegex:/sun_status/,
            funct:async ( parserObj:ParseObj )=>{

                let toReturn:any={};

                const results = await this.getCurrentLocalAstronomyCache( parserObj.query_body.lat, parserObj.query_body.lon );
    
                toReturn.sunrise = results.moon_phase.sunrise;
                toReturn.sunset = results.moon_phase.sunset;
                toReturn.time = results.current_observation.local_time_rfc822;
                
                return toReturn;
            },
            functionalShouldParse:(parseObj)=>{return false;}
        },{
            name:"sun_up_home",
            testRegex:/sun_up_home/,
            funct:async ( parseObj:ParseObj )=>{

                let toReturn:any={};

                let query_body = {lat:32.917795, lon:-96.769769}; // TODO make home able to change
                toReturn = await this._parse({query_body,pathName:"/sun_up/"});


                return toReturn;
            },
            functionalShouldParse:(parseObj)=>{return false;}
        },{
            name:"sun_up",
            testRegex:/sun_up/,
            funct:async ( parserObj:ParseObj )=>{

                let toReturn:any={};

                let query_body = {lat:parserObj.query_body.lat, lon:parserObj.query_body.lon};
    
                let sunsetData = await this._parse({query_body,pathName:"/sun_status/"});
        
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
        
                let sun_is_up = sunrise < now && sunset > now;
        
                if( sun_is_up ){
                    console.log("sun is up")
                }else{
                    console.log("sun is down")
                }
                toReturn = sun_is_up;


                return toReturn;
            },
            functionalShouldParse:(parseObj)=>{return false;}
        }
    ];

    async getCurrentLocalWeather(lat, lon){

        if( this.config.token===undefined ){throw "this.config.token must be defined";}
        if( lat===undefined ){throw "lat must be defined";}
        if( lon===undefined ){throw "lon must be defined";}

        const url = `http://api.wunderground.com/api/${this.config.token}/conditions/q/${lat},${lon}.json`

        return JSON.parse( await requestP(url) );
    }

    async getCurrentLocalAstronomy(lat, lon){

        if( this.config.token===undefined ){throw "this.config.token must be defined";}
        if( lat===undefined ){throw "lat must be defined";}
        if( lon===undefined ){throw "lon must be defined";}

        const url = `http://api.wunderground.com/api/${this.config.token}/conditions/astronomy/q/${lat},${lon}.json`;

        return await requestP(url).then((res)=>{
            // if lat/lon don't have reading this will fail
            let res_parsed = JSON.parse(res);

            if( res_parsed ){
                // handle error here
            }

            return res_parsed;
        });
    }

    getCurrentLocalAstronomyCache=async (lat, lon)=>{

        let lat_lon_weather_obj = (await this.state.getState())[`${lat},${lon}`];

        if( lat_lon_weather_obj===undefined ){
            return await this.getCurrentLocalAstronomy(lat, lon);
        }else{
            return (await this.state.getState())[`${lat},${lon}`].astronomy;
        }
    }
}

export default weatherParser;