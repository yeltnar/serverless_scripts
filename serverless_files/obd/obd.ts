import Parser from '../../Parser.class';

let link = "https://ws-expose.mybluemix.net/v1/get-log?token=hello"; // TODO move this somewhere else

class obdParser extends Parser{

    pushNotification;

    constructor( helpers, config, parsers, pushNotification ){
        super( helpers, config, parsers );
        this.pushNotification = pushNotification;
    }

    _shouldParse( parserObj ){
        return /obd/.test(parserObj.pathName);;
    }

    _transformObj(parserObj){
        return parserObj.obj;
    }

    async _doParse( obj ){

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
            let message;
    
            if( event.category === "off" ){
    
                message = "off";
    
                let location_obj = {
                    lat:obj.request.body.location.lat, 
                    lon:obj.request.body.location.lon
                };
    
                result = this.checkSetLightOn( location_obj );
    
            }else if( event.category === "on" ){
    
                message = "on";
    
            }
    
            this.pushNotification( {title, message, link} )
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



    async checkSetLightOn( location_obj ){

        let query_body = {
            lat:location_obj.lat, 
            lon:location_obj.lon
        };

        //try{}catch(e){}

        let sun_up; 
        try{
            sun_up = await this.parsers.weather.parse({query_body,pathName:"/sun_up/"});
        }catch(e){
            console.log(e);
            sun_up=null;
        }

        let geofence_locations

        let car_at_home; 
        try{
            geofence_locations = await this.parsers.geofence.parse({query_body,pathName:null});
            car_at_home = geofence_locations.indexOf("home")>=0;
        }catch(e){
            console.log(e);
            car_at_home=null;
        }

        const toReturn = {sun_up,car_at_home,geofence_locations,location_obj};

        this.pushNotification( {"title":"From car","message":toReturn} )

        if( !sun_up && car_at_home  ){
            try{
                await this.parsers.hue.parse({"light_name":"living_room","state":"on"});
            }catch(e){console.error(e);}
        }
        return toReturn;
    }

}

export default obdParser;