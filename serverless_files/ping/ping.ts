import {HttpParser} from '../../HttpParser.class';
import { Parser, ParserContainer, AbstractParser } from '../../parse_framework/Parser.class';
const requestP = require('request-promise-native');

class Ping extends HttpParser{

    parserContainer:ParserContainer;


    constructor( name, config ){
        super( name, config );
        
        this.parserContainer = new ParserContainer();
        this.parserContainer.addPrivateParser( new PingSubParser(name, config, this.state) );
    }
    _shouldParse(parserObj){
        return /ping/.test(parserObj.pathName);
    }

    _transformObj(parserObj){
        return parserObj;
    }

    async _parse( parserObj ){

        let supParseResult = await this.parserContainer.parsePrivate( parserObj );
        if( supParseResult.length !== 0 ){
            return supParseResult;
        }

        let now = new Date();

        let start = new Date(parserObj.obj.date);

        return {
            'time_at_ping_parse':now.toString(),
            'time_at_ping_parse_ms':now.getTime(),

            'start':start.toString(),
            'start_ms':start.getTime(),

            'ms_to_parse':now.getTime()-start.getTime()
        };
    }
}

class PingSubParser extends Parser{
    
    _shouldParse(parserObj){
        return /sup_parser/.test(parserObj.pathName);
    }

    async _parse(parserObj){

        let now = new Date();

        let start = new Date(parserObj.obj.date);

        return {
            'msg':'made it to PingSubParser',
            'time_at_ping_parse':now.toString(),
            'time_at_ping_parse_ms':now.getTime(),

            'start':start.toString(),
            'start_ms':start.getTime(),

            'ms_to_parse':now.getTime()-start.getTime()
        };
    }
}

export default Ping;