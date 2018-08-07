import {Parser,ParserContainer} from '../Parser.class';

class geofence extends Parser{
    constructor( helpers, config, parsers ){
        super( helpers, config, parsers );
    }
    _shouldParse(parserObj){
        return false; // return /geofence/.test(parserObj.pathName);
    }
    _transformObj(parserObj){return parserObj;}
    async _parse(){}
}

export default geofence;