import { HttpParser } from "../../HttpParser.class";
import {ParserContainer} from '../../parse_framework/Parser.class' // chan ge

class get_parsers extends HttpParser{

    testRegex = /get_parsers/;

    constructor(name, config){
        super(name, config);
    }

    async _parse(){
        return ParserContainer.toJSON();
    }

}

export default get_parsers;