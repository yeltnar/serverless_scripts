import {HttpParser} from '../../HttpParser.class';
import { ParserContainer, AbstractSubParser } from '../../parse_framework/Parser.class';

class geofence extends HttpParser{

    parserContainer:ParserContainer;

    constructor(name, config ){

        super( {}, name, config );

        this.parserContainer = new ParserContainer();

        this.parserContainer.addPrivateParser(new check_geofence_parser("check_geofence_parser", config));

    }
    _shouldParse(parserObj){
        return /geofence/.test(parserObj.pathName);
    }
    _transformObj(parserObj){return parserObj;}
    async _parse( parserObj ){
        let toReturn;
        toReturn = await this.parserContainer.parsePrivate(parserObj);

        if( typeof toReturn!=='string' && toReturn.length===1 ){
            toReturn = toReturn[0]
        }
    
        return toReturn;
    }
}

class check_geofence_parser extends AbstractSubParser{
    
    constructor(name, config){
        super({}, name, config);
    }

    _transformObj(obj){return obj;}

    _shouldParse(parserObj){
        return /get_close_locations/.test(parserObj.pathName);
    }

    async _parse(parserObj){
        let toReturn;
    
        toReturn = this._check_geofence( parserObj.query_body.lat, parserObj.query_body.lon );
    
        return toReturn;
    }

   private  _check_geofence( in_lat, in_lon ){

        let matched_locations = [];

        for(let k in this.config.points){
            let c_lat = this.config.points[k].lat;
            let c_lon = this.config.points[k].lon;

            let lat_distance = c_lat - in_lat;
            let lon_distance = c_lon - in_lon;

            let distance = Math.sqrt( Math.pow(lat_distance,2)+Math.pow(lon_distance,2) );

            if( distance <= this.config.points[k].threashold ){
                matched_locations.push(this.config.points[k].name);
            }
        }

        return matched_locations;

    }
}

export default geofence;