import {HttpParser} from '../../HttpParser.class';
const requestP = require('request-promise-native');
class geofence extends HttpParser{

    light_lookup_table = {
        "living_room":"1",
        "bedroom":"2"
    }

    // TODO move to config file
    user = "EByeQOPuSZvgsiSgKGYpOTqKwYJnpVo6TqkxZ5Gh"; // TODO move this to config
    baseAddress = "http://192.168.1.111/api"

    constructor( name, config ){
        super( name, config );

        this.state.registerForStateChanges(this.car_home_sun_down_lights_on);
    }
    _shouldParse(parserObj){
        return /hue/.test(parserObj.pathName);
    }

    _transformObj(parserObj){
        return parserObj.query_body;
    }

    async _parse( query_body ){

        let light_id;
        let state = query_body.state;
    
        console.log(query_body)
    
        if( query_body.light_id !== undefined ){
            light_id = query_body.id
        }else if( query_body.light_name !== undefined ){
            light_id = this.light_lookup_table[ query_body.light_name ];
        }else{
            return "no light id nor light name";
        }
    
        if( state === undefined ){
            return "no light state";
        }
    
        let res = await this._setLightState(light_id, state);
    
        return res
    }

    _setLightState(id, on=true){
    
        if(typeof on === "string" ){
            on = on==="on";
        }
    
        if(id===undefined){throw new Error("light id must be defined");}
        if(on===undefined){throw new Error("light state must be defined");}
    
        let options = { 
            method: 'PUT',
              url: this.baseAddress+'/'+this.user+'/lights/'+id+'/state',
              body: JSON.stringify({on})
        };
        return requestP(options).then(this.helpers.tryToParsePromise);
    }

    car_home_sun_down_lights_on= async(state)=>{

        // check data is present
        if( state.obd===undefined || state.obd.previousState===undefined ){
            return;
        }

        // check data matches desired pre conditions
        let shouldContinue = state.obd.engine === 'off' && state.obd.previousState.engine === 'on';
        if( !shouldContinue ){
            return 
        }

        let at_home 
        if( state.obd.geofence_locations ){
            at_home = state.obd.geofence_locations.indexOf('home')>=0;
        }

        // start of block to stub out weather state
        let sun_up; 
        if( state.obd.location && state.obd.location.lat!==0 && state.obd.location.lon!==0 ){

            try{
                sun_up = await this.parserContainer.parse("weather",{query_body:state.obd.location,pathName:"/sun_up/"});
            }catch(e){
                console.error(e);
                sun_up=null;
            }
        }
        // end of block to stub out weather state

        // TODO remove when you can
        state.weather = state.weather || {};
        state.weather.sun_up = sun_up;

        if( state.weather.sun_status === 'down' && at_home ){

            let query_body = {
                light_name:"living_room",
                state:"on"
            }

            await this._parse( query_body );
            
            this.pushNotification({
                title:"car off @ home -> lights on",
                message:{
                    weather:state.weather,
                    obd:state.obd
                }
            })
            
        }
    }
}

export default geofence;