import MessageInInterface from "./interfaces/MessageIn.interface";
import MessageOutInterface from "./interfaces/MessageOut.interface";
import {connectToScriptNetAsClient,connectToScriptNetAsServer} from "./script_net_ws_client"
import {WsDataInterface,WsDataClientInterface,WsDataServerInterface} from "../script_node_shared/interfaces/WsDataInterface"

// interface any data on script net
interface ParserDataInterface {

    device_name:string,
    parser_name:string,
    device_group:string,
    token:string
}

abstract class ScriptNetParser{

    device_name:string      = "fallback_device_name";
    parser_name:string      = "fallback_parser_name";
    device_group:string     = "fallback_device_name";
    token:string            = "default_device_token";

    client_connection_data:WsDataClientInterface;
    server_connection_data:WsDataServerInterface;
    
    constructor( parser_data:ParserDataInterface, ws_connect_data:WsDataInterface ){

        this.device_name = parser_data.device_name;
        this.parser_name = parser_data.parser_name;
        this.device_group = parser_data.device_group;
        this.token = parser_data.token;

        if( ws_connect_data && ws_connect_data.client ){

            this.client_connection_data = ws_connect_data.client
            connectToScriptNetAsClient( this );

        }else if( ws_connect_data && ws_connect_data.server ){

            this.server_connection_data = ws_connect_data.server
            connectToScriptNetAsServer( this );

        }
    }

    // function to check if it should parse, do pre parsing, and start parsing 
    public messageCallback = async( message_in_obj:MessageInInterface )=>{

        message_in_obj = (await this.preShouldParse( message_in_obj ));
        let should_parse:boolean = await this.shouldParse( message_in_obj );
        let url_test_should_parse:boolean = await this.shouldParse( message_in_obj );

        let message_out_obj:MessageOutInterface;

        if( should_parse || url_test_should_parse ){
            message_in_obj = await this.preProcess( message_in_obj );
            message_out_obj = await this.parse( message_in_obj );
            message_out_obj = await this.postProcesses( message_out_obj );
            
        }else{
            // TODO report not parsing 
        }
    }

    // over write this if needed
    private async preShouldParse( message_obj:MessageInInterface ):Promise<MessageInInterface>{
        return message_obj;
    };

    // over write this if needed
    private async shouldParse( message_obj:MessageInInterface ):Promise<boolean>{
        return false; // if this is false the url checker will be the only one that matters
    };

    protected async urlTestShouldParse( message_obj:MessageInInterface ):Promise<boolean>{
        //return this.client_connection_data.url_test_regex.test( message_obj.url );
        return true;
    };

    // over write this if needed
    private async preProcess( message_obj:MessageInInterface ):Promise<MessageInInterface>{
        return message_obj;
    };

    abstract parse( message_obj:MessageInInterface ):Promise<MessageOutInterface>;

    // over write this if needed
    private async postProcesses( message_obj:MessageOutInterface ):Promise<MessageOutInterface>{
        return message_obj;
    };
}

export {ScriptNetParser,WsDataClientInterface,WsDataServerInterface};