import MessageInInterface from "./interfaces/MessageIn.interface";
import MessageOutInterface from "./interfaces/MessageOut.interface";
import {connectToScriptNetAsClient,connectToScriptNetAsServer} from "./script_net_ws_client"

import {ScriptNetParser} from "./ScriptNetParser";
import {ParserContainer} from '../old_props/parse_framework/Parser.class'

abstract class ScriptNetParserOldProp extends ScriptNetParser{

    parserContainer=new ParserContainer();
}

export {ScriptNetParserOldProp};