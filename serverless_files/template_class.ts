import Parser from '../../Parser.class';

class geofence extends Parser{
    constructor( helpers, config, parsers ){
        super( helpers, config, parsers );
    }
    _shouldParse(){
        return false;
    }
    _transformObj(parserObj){return parserObj;}
    _doParse(){}
}

export default geofence;