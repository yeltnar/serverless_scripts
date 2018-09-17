import {HttpParser} from '../../HttpParser.class';
import {ParserContainer, FunctionalParserObj, FunctionalParser} from '../../parse_framework/Parser.class'
import ResponseObj from '../../parse_framework/ResponseObj.interface'

import MyParserContainer from '../../MyParserContainer.class';

const requestP = require('request-promise-native');

interface ObdEvent {
    type:string,
    category:string
}

interface ObdResponseObj extends ResponseObj{
    event:ObdEvent
}

let link = "https://ws-expose.mybluemix.net/v1/get-log?token=hello"; // TODO move this somewhere else

class obdParser extends HttpParser{

    mainParserContainer:MyParserContainer;

    testRegex = /obd/;

    constructor( name, config, mainParserContainer ){
        

        // TODO replace this with mongo 
        // let parser_starting_state  = {
        //     "engine":"off",
        //     "location":{
        //         "lat":0,
        //         "lon":0
        //     }
        // };

        // TODO keep track of state so we can just use this one to modify making reading from file easier 
        super( name, config, mainParserContainer );

        this.subParsers.forEach((cur:FunctionalParserObj, index, arr) => {
            this.parserContainer.addPrivateParser( new FunctionalParser(cur.name, this.config, this.state, cur.funct, cur.testRegex, this.mainParserContainer, cur.functionalShouldParse) ); 
        });
    }

    subParsers:Array<FunctionalParserObj>=[
        {
            name:"notification",
            testRegex:/notification/,
            funct:async ( parserObj:ObdResponseObj )=>{

                const event = parserObj.event

                if( event.category === "hard_accel" ){

                }else if( event.category === "speeding" ){
    
                }else if( event.category === "hard_brake" ){
    
                }else{
                    this.pushNotification( {"title":"From car","message":JSON.stringify(event), "link":link} )
                }
            },
            functionalShouldParse:( parserObj:ObdResponseObj )=>{

                return parserObj.event.type === "notification";

            }
        },{
            name:"vehicle",
            testRegex:/vehicle/,
            funct:async ( parserObj:ObdResponseObj )=>{

                const event = parserObj.event

                if( event.category === "status_report" ){
                    // currently do nothing... is just a report 
                }
            },
            functionalShouldParse:( parserObj:ObdResponseObj )=>{

                return parserObj.event.type==="vehicle";

            }
        },{
            name:"ignition",
            testRegex:/ignition/,
            funct:async ( parserObj:ObdResponseObj )=>{   

                const {obj} = parserObj;
                let state = await this.state.getState();

                const event = parserObj.event;
    
                let title = "Car ignition";
                let engine_state;
        
                if( event.category === "off" ){
        
                    engine_state = "off";
        
                }else if( event.category === "on" ){
        
                    engine_state = "on";
        
                }
        
                let location_obj = {
                    lat:obj.request.body.location.lat, 
                    lon:obj.request.body.location.lon
                };
    
                try{
                    let geofence_obj = {
                        query_body:{
                            lat:location_obj.lat,
                            lon:location_obj.lon
                        },
                        pathName:"geofence/get_close_locations"
                    }
                    state.geofence_locations = await this.mainParserContainer.parseExposed("geofence",geofence_obj);
                }catch(e){
                    console.error(e);
                }
                
                state.engine = engine_state;
                state.location = location_obj;
    
                let pushData = {
                    "title":"From car",
                    "message":{
                        geofence_locations:state.geofence_locations,
                        location_obj,
                        engine_state
                    }, 
                    link
                };

                this.mainParserContainer.httpParsers.person.set_location('Drew', state.geofence_locations);

                this.state.setState(state);
                this.pushNotification( pushData );
                console.log( pushData.message );
            },
            functionalShouldParse:( parserObj:ObdResponseObj )=>{

                return parserObj.event.type==="ignition";

            }
        },{
            name:"trip",
            testRegex:/trip/,
            funct:async ( parserObj:ObdResponseObj )=>{

                const event = parserObj.event

                let title = "Trip "+event.category;
                let message;
        
                if( event.category === "finished" ){
                    //message = "finished";
                    message = JSON.stringify(event);
                }
        
                this.pushNotification( {title, message, link} )
            },
            functionalShouldParse:( parserObj:ObdResponseObj )=>{

                return parserObj.event.type==="trip";

            }
        },{
            name:"oauth",
            testRegex:/oauth/,
            funct:async ( parserObj:ObdResponseObj )=>{
                const state = await this.state.getState();

                try{
                    
                    state.token = parserObj.obj.request.query.code;
                    this.state.setState(state);
                    return "token saved"

                }catch(e){

                    let title = "Error";
                    let message = "oauth error";

                    this.pushNotification({title, message})


                    return "error setting token";
                }


            }
        },{
            name:"renew_token",
            testRegex:/renew_token/,
            funct:async ( parserObj:ObdResponseObj )=>{
                
                return this.config.renewUrl;
            }
        }
    ]

    async _parse( parseObj:ResponseObj ){

        const obj = parseObj.obj;

        let event:ObdEvent = {type:undefined, category:undefined};
        let result;
    
        try{
            let regex_result = /(.+):(.+)/.exec( obj.request.body.type )
    
            event = { type:regex_result[1], category:regex_result[2] };
        }catch(e){
            console.error(e);
        }
    
        console.log("event...");
        console.log(event);

        const obdParseObj:ObdResponseObj = { ...parseObj, event };

        let toReturn = await this.parserContainer.parsePrivate( obdParseObj );
        
        //toReturn = ["200"];// TODO remove

        if( Array.isArray(toReturn) && toReturn.length===1 ){
            toReturn = toReturn[0];
        }

        console.log('toReturn')
        console.log(toReturn)

        return toReturn;
    
    }

}

export default obdParser;