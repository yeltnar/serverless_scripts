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
        super( parser_starting_state, name, config );
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

        let new_state:any = {};
    
        if( event.type === "notification" ){
            this.pushNotification( {"title":"From car","message":JSON.stringify(event), "link":link} )
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
                new_state.geofence_locations = await this.parserContainer.parse("geofence",{query_body:{lat:location_obj.lat,lon:location_obj.lon},pathName:null});
            }catch(e){
                console.error(e);
            }
            
            new_state.engine = engine_state;
            new_state.location = location_obj;

            let pushData = {
                "title":"From car/"+obj.response_device.device_name,
                "message":{
                    geofence_locations:new_state.geofence_locations,
                    location_obj,
                    engine_state
                }, 
                link
            };
            this.pushNotification( pushData );
            console.log( pushData.message );
        }
    
        if( event.type==="trip" ){  
    
            let title = "Trip";
            let message;
    
            if( event.category === "finished" ){
                // currently do nothing... is just a report 
                message = "finished";
            }
    
            this.pushNotification( {title, message, link} )
        }

        this.updateState(new_state);
    
        return result;
    
    }

}

export default obdParser;