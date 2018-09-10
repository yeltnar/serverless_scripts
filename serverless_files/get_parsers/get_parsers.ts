import { HttpParser } from "../../HttpParser.class";
import {ParserContainer} from '../../parse_framework/Parser.class' // chan ge

class get_parsers extends HttpParser{

    testRegex = /get_parsers/;

    constructor(name, config, mainParserContainer){
        super(name, config, mainParserContainer);
    }

    async _parse(){
        return this.mainParserContainer.exposedToJSON();
    }

}

export default get_parsers;