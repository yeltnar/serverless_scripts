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
    
    constructor( name, config, mainParserContainer ){
        super( name, config, mainParserContainer );

        for( let k in this.functionalParsers ){
            let current_parser = this.functionalParsers[k];
            this.parserContainer.addPrivateParser( new FunctionalParser(current_parser.name, this.config, this.state, current_parser.funct, current_parser.testRegex, mainParserContainer ) );
        }
    };

    

    functionalParsers:object = {
        sendParser:{
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
        },
        timeParser:{
            name:"time",
            funct:async (parserObj):Promise<object>=>{
    
                let channel_name = "Drew"
                let text = (new Date()).toISOString();
    
                try{
                    return await this.message(channel_name, text);
                }catch(e){
                    return e;
                }
    
                //return {"success":true};
            },
            testRegex:/time/,
        },
        onMyWayParser:{
            name:"on_my_way",
            funct:async (parserObj):Promise<object>=>{
    
                let query_body = parserObj.query_body
    
                //return query_body
    
                let {channel_name} = query_body;
                let text = "I'm on my way!";
    
                if( channel_name === undefined){
                    return {"err":"channel_name"};
                }
    
                try{
                    return await this.message(channel_name, text);
                }catch(e){
                    return e;
                }
    
                //return {"success":true};
            },
            testRegex:/on_my_way/,
        },
        imThereParser:{
            name:"im_there",
            funct:async (parserObj):Promise<object>=>{
    
                let query_body = parserObj.query_body
    
                //return query_body
    
                let {channel_name} = query_body;
                let text = "I'm there";
    
                if( channel_name === undefined){
                    return {"err":"channel_name"};
                }
    
                try{
                    return await this.message(channel_name, text);
                }catch(e){
                    return e;
                }
    
                //return {"success":true};
            },
            testRegex:/im_there/,
        }
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