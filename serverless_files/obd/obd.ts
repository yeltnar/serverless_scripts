import {HttpParser} from '../../HttpParser.class';

let link = "https://ws-expose.mybluemix.net/v1/get-log?token=hello"; // TODO move this somewhere else

class obdParser extends HttpParser{;

    constructor( name, config ){

        // TODO replace this with mongo 
        let parser_starting_state  = {
            "engine":"off",
            "location":{
                "lat":0,
                "lon":0
            }
        };

        // TODO keep track of state so we can just use this one to modify making reading from file easier 
        super( name, config );
    }

    _shouldParse( parserObj ){
        return /obd/.test(parserObj.pathName);;
    }

    _transformObj(parserObj){
        return parserObj.obj;
    }

    async _parse( obj ){

        let event={type:undefined, category:undefined};
        let result;
    
        try{
            let regex_result = /(.+):(.+)/.exec( obj.request.body.type )
    
            event = { type:regex_result[1], category:regex_result[2] };
        }catch(e){
            console.error(e);
        }
    
        console.log("event...");
        console.log(event);

        let state = await this.state.getState();
        let state_changed = false;
    
        if( event.type === "notification" ){

            if( event.category === "hard_accel" ){

            }else if( event.category === "speeding" ){

            }else if( event.category === "hard_break" ){

            }else{
                this.pushNotification( {"title":"From car","message":JSON.stringify(event), "link":link} )
            }

        }
    
        if( event.type==="vehicle" ){ 
            if( event.category === "status_report" ){
                // currently do nothing... is just a report 
            }
        }
    
        if( event.type==="ignition" ){   
    
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
                state.geofence_locations = await this.parserContainer.parse("geofence",geofence_obj);
            }catch(e){
                console.error(e);
            }
            
            state.engine = engine_state;
            state.location = location_obj;
            state_changed = true;

            let pushData = {
                "title":"From car/"+obj.response_device.device_name,
                "message":{
                    geofence_locations:state.geofence_locations,
                    location_obj,
                    engine_state
                }, 
                link
            };
            this.pushNotification( pushData );
            console.log( pushData.message );
        }
    
        if( event.type==="trip" ){  
    
            let title = "Trip "+event.category;
            let message;
    
            if( event.category === "finished" ){
                //message = "finished";
                message = JSON.stringify(event);
            }
    
            this.pushNotification( {title, message, link} )
        }

        if( state_changed ){
            this.state.setState(state);
        }
    
        return result;
    
    }

}

export default obdParser;