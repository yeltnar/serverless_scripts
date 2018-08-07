import {Parser,ParserContainer} from '../../Parser.class';

let link = "https://ws-expose.mybluemix.net/v1/get-log?token=hello"; // TODO move this somewhere else

class obdParser extends Parser{

    pushNotification;

    constructor( helpers, config, name, pushNotification ){

        // TODO replace this with mongo 
        let parser_starting_state  = {
            "engine":"off"
        };

        super( helpers, config, name, parser_starting_state );
        
        this.pushNotification = pushNotification;
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
            console.log(e);
        }
    
        console.log("event...");
        console.log(event);
    
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
    
                let location_obj = {
                    lat:obj.request.body.location.lat, 
                    lon:obj.request.body.location.lon
                };
    
                result = this.checkSetLightOn( location_obj, obj.response_device.device_name );
    
            }else if( event.category === "on" ){
    
                engine_state = "on";
    
            }

            let state = this.getState();
            state.engine = engine_state;
            this.setState(state);
    
            this.pushNotification( {title, message:engine_state, link} )
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
    
        return result;
    
    }

    async checkSetLightOn( location_obj, response_device_name ){

        let query_body = {
            lat:location_obj.lat, 
            lon:location_obj.lon
        };

        //try{}catch(e){}

        let sun_up; 
        try{
            sun_up = await ParserContainer.parse("weather",{query_body,pathName:"/sun_up/"});
        }catch(e){
            console.log(e);
            sun_up=null;
        }

        let geofence_locations

        let car_at_home; 
        try{
            geofence_locations = await ParserContainer.parse("geofence",{query_body,pathName:null});
            car_at_home = geofence_locations.indexOf("home")>=0;
        }catch(e){
            console.log(e);
            car_at_home=null;
        }

        const toReturn = {sun_up,car_at_home,geofence_locations,location_obj};

        let pushData = {"title":"From car/"+response_device_name,"message":toReturn};
        this.pushNotification( pushData );
        console.log( pushData );

        if( !sun_up && car_at_home  ){
            try{
                await ParserContainer.parse("hue",{"light_name":"living_room","state":"on"});
            }catch(e){console.error(e);}
        }
        return toReturn;
    }

}

export default obdParser;