import {Parser,ParserContainer} from '../parse_framework/Parser.class';

class geofence extends Parser{
    constructor( name ){
        super( {}, name );
    }
    _shouldParse(parserObj){
        return false; // return /geofence/.test(parserObj.pathName);
    }
    _transformObj(parserObj){return parserObj;}
    async _parse(){}
}

export default geofence;