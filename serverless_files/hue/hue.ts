import Parser from '../../Parser.class';
const requestP = require('request-promise-native');
class geofence extends Parser{

    light_lookup_table = {
        "living_room":"1",
        "bedroom":"2"
    }

    // TODO move to config file
    user = "EByeQOPuSZvgsiSgKGYpOTqKwYJnpVo6TqkxZ5Gh"; // TODO move this to config
    baseAddress = "http://192.168.1.111/api"

    constructor( helpers, config, parsers ){
        super( helpers, config, parsers );
    }
    _shouldParse(parserObj){
        return /hue/.test(parserObj.pathName);
    }

    _transformObj(parserObj){
        return parserObj.query_body;
    }

    async _doParse( query_body ){

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
}

export default geofence;