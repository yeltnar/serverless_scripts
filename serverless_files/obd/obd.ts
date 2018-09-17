import {HttpParser} from '../../HttpParser.class';
import {ParserContainer, FunctionalParserObj, FunctionalParser} from '../../parse_framework/Parser.class'
import ResponseObj from '../../parse_framework/ResponseObj.interface'

import MyParserContainer from '../../MyParserContainer.class';
import StateLoader from '../../parse_framework/StateLoader.class';

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
                    this.mainParserContainer.httpParsers.person.set_location('Drew', state.geofence_locations);
        
                }else if( event.category === "on" ){
        
                    engine_state = "on";
                    this.mainParserContainer.httpParsers.person.set_location('Drew', state.geofence_locations);
        
                }
                
                state.engine = engine_state;

                const {lat,lon} = obj.request.body.location;

                let pushData = {
                    "title":"From car",
                    "message":{
                        geofence_locations:state.geofence_locations,
                        location_obj:{lat,lon},
                        engine_state
                    }, 
                    link
                };



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
                    
                    const code = parserObj.obj.request.query.code;
                    //this.state.setState(state);

                    const options = { 

                        method: 'POST',
                        url: this.config.accessTokenUrl,
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        form: 
                            {
                                client_id: this.config.client_id,
                                client_secret: this.config.client_secret,
                                code,
                                grant_type: "authorization_code"
                            } 

                    };

                    const resp = await requestP( options ).then(( resp )=>{

                        let resp_obj:object;

                        if( typeof resp === "string" ){
                            resp_obj = JSON.parse( resp );
                        }

                        return resp_obj;
                    });

                    return this.saveToken( resp );

                }catch(e){

                    let title = "Error";
                    let message = "oauth error";

                    this.pushNotification({title, message})


                    return {"msg":"error setting token","error":e};
                }


            }
        },{
            name:"\/renew_token\/",
            testRegex:/renew_token/,
            funct:async ( parserObj:ObdResponseObj )=>{

                const user_id = parserObj.query_body.user_id;
                let user_id_arr = parserObj.query_body.user_id_arr || [];
                const update_all = parserObj.query_body.update_all || false;

                if( typeof user_id_arr === "string" ){
                    user_id_arr = JSON.parse(user_id_arr);
                }
                //return "247"

                if( user_id!==undefined ){
                    user_id_arr.push( user_id )
                }
                //return "252"

                if( update_all ){

                    const saved_users = ((await this.state.getState())).saved_users || [];

                    console.log("saved users")
                    console.log(saved_users)

                    console.log("Object.keys(saved_users)")
                    console.log(Object.keys(saved_users))
                    
                    user_id_arr = user_id_arr.concat( Object.keys(saved_users) );

                }else if( user_id_arr.length===0 ){
                    return "user_id || user_id_arr || update_all";
                }

                const promise_arr=[];

                console.log("user_id_arr")
                console.log(user_id_arr)

                user_id_arr.forEach(( cur )=>{
                    console.log("adding "+cur+" to renew list")
                    promise_arr.push( this.renewToken( cur ).then((token_response)=>{
                        if( token_response.err===undefined ){
                            return this.saveToken( token_response );
                        }else{
                            return token_response;
                        }
                    }).catch((err)=>{
                        let title = "Error";
                        let message = "oauth error 271";

                        this.pushNotification({title, message})
                        return err;
                    }));
                });

                return await Promise.all(promise_arr).then((res_arr)=>{

                    console.log("res_arr")
                    console.log(res_arr)

                    if( res_arr.length === 0 ){
                        return "obd 276 res_arr.length === 0";
                    }else if( res_arr.length === 1 ){
                        return res_arr[0];
                    }else{
                        return res_arr;
                    }
                }).catch((e)=>{
                    return {"err":e};
                });
            }
        },{
            name:"\/authorize_app\/",
            testRegex:/authorize_app/,
            funct:async ( parserObj:ObdResponseObj )=>{
                return "https://accounts.automatic.com/oauth/authorize/?client_id=cf4234c39e73c53258ce&response_type=code&scope=scope:public%20scope:user:profile%20scope:location%20scope:vehicle:profile%20scope:vehicle:events%20scope:trip%20scope:behavior";
            }
        }
    ]

    private renewToken = async( user_id:string )=>{

        const user_obj = ((await this.state.getState()).saved_users || {})[user_id];

        if( user_obj===undefined ){
            return {"err":user_id+" refresh_token not found"}
        }

        const refresh_token = user_obj.refresh_token;

        var options = { 
            method: 'POST',
            url: 'https://accounts.automatic.com/oauth/access_token/',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            form: 
            { 
                client_id: this.config.client_id,
                client_secret: this.config.client_secret,
                grant_type: "refresh_token",
                refresh_token
            } 
        };

        return await requestP(options);;
    }

    private saveToken = async( token_response )=>{
        const {user_id, access_token, expires_in, scope, refresh_token, token_type} = token_response;
        const state = await this.state.getState();

        state.saved_users = state.saved_users || {};
        state.saved_users[user_id] = state.saved_users[user_id] || {};

        state.saved_users[user_id].access_token = access_token;
        state.saved_users[user_id].refresh_token = refresh_token;
        state.saved_users[user_id].expires_in = expires_in;
        state.saved_users[user_id].scope = scope;
        state.saved_users[user_id].token_type = token_type;

        this.state.setState(state);

        let title = "Token Saved";
        let message = user_id;
        this.pushNotification({title,message})

        return "token saved"
    }

    private updateObdLocation=async (lat, lon):Promise<{lat:string, lon:string}>=>{

        const state = await this.state.getState();

        let location_obj = {
            lat, 
            lon
        };
        state.location = location_obj;
    
        try{
            state.geofence_locations = await this.mainParserContainer.httpParsers.geofence.check_geofence(lat, lon);
        }catch(e){
            console.error(e);
        }

        this.state.setState( state );

        return location_obj
    } 

    async _parse( parseObj:ResponseObj ){

        const obj = parseObj.obj;

        try{
            const {lat,lon} = obj.request.body.location;
            await this.updateObdLocation(lat, lon);
            console.log("car now at "+lat+","+lon);
        }catch(e){
            console.log("Could not update obd location");
        }

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