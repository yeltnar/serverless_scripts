import {HttpParser} from '../../HttpParser.class';
import {FunctionalParser} from '../../parse_framework/Parser.class'
const requestP = require('request-promise-native');

interface FunctionalParserObj{
    name:string,
    funct:Function,
    testRegex:RegExp,
    functionalShouldParse?:Function
}

class SlackParser extends HttpParser{

    testRegex = /slack/;
    
    constructor( name, config ){
        super( name, config );

        //constructor(name, local_config, state, parseFunction, testRegex, functionalShouldParse?)
        this.parserContainer.addPrivateParser( new FunctionalParser(name, this.config, this.state, this.functionalParserObj.funct, this.functionalParserObj.testRegex ) );
        console.log(this.config);
    };

    functionalParserObj:FunctionalParserObj = {
        name:"send",
        funct:async (parserObj):Promise<object>=>{

            let query_body = parserObj.query_body

            //return query_body

            let {channel_name, text} = query_body;

            if( channel_name === undefined || text===undefined ){
                return {"err":"channel_name, text"};
            }

            try{
                return await this.message(channel_name, text);
            }catch(e){
                return e;
            }

            //return {"success":true};
        },
        testRegex:/send/,
    }

    message=async (channel_name, text):Promise<any>=>{


        let token = this.getToken(channel_name);
        let channel = this.getChannel(channel_name);

        console.log({token, channel})

        const requestBody = {
            channel,
            text,
            as_user:true,
            pretty:"1w"
        };

        return await this.sendSlackRequest( requestBody, token );
    }

    private sendSlackRequest=async ( body, token )=>{

        const message_type:string="chat.postMessage";
        const method:string="POST";
        const json:boolean=true;
        const content_type="application/json";
        
        const api_url = "https://slack.com/api/";
        const url = api_url+message_type;
        
        let options = { 
            method,
            url,
            headers: { 
                content_type ,
                authorization: 'Bearer '+token
            },
            body,
            json,
        };

        return await requestP( options );
    }

    private getToken=(channel_name)=>{ return this.getChannelValue(channel_name, "token") }
    private getChannel=(channel_name)=>{ return this.getChannelValue(channel_name, "channel") }
    private getChannelValue=( channel_name, key )=>{

        let {channel_table} = this.config;

        const should_return = channel_table && channel_table[channel_name] && channel_table[channel_name][key];

        if( should_return ){
            return channel_table[channel_name][key];
        }
        
    }
}

export default SlackParser;