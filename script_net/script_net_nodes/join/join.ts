import {ParserContainer, FunctionalParserObj, FunctionalParser} from '../../old_props/parse_framework/Parser.class'
//import { HttpParser } from "../../old_props/parse_framework/HttpParser.class";
import ResponseObj from '../../old_props/parse_framework/ResponseObj.interface'
//import {ScriptNetParser} from '../../script_net/script_node_shared/ScriptNetParser';
import {ScriptNetParserOldProp} from '../../script_node_shared/ScriptNetParserOldProp';

import MessageInInterface from '../../script_node_shared/interfaces/MessageIn.interface'
import MessageOutInterface from "../../script_node_shared/interfaces/MessageOut.interface"

const requestP = require('request-promise-native');

class Join extends ScriptNetParserOldProp{

    constructor(){

        super( {
            device_name:"default_name",
            device_group:"default_group",
            parser_name:"join",
            token:"default_token"
        }, {
            client:{
                server_url:"ws-expose.mybluemix.net",
                protocol:"wss",
                url_test_regex:/\/join\//
            }
        } );

        this.subParsers.forEach((cur:FunctionalParserObj, index, arr) => {
            this.parserContainer.addPrivateParser( new FunctionalParser(cur.name, {}, {}, cur.funct, cur.testRegex, null) ); 
        });
    }

    async parse( message_in:MessageInInterface ):Promise<MessageOutInterface>{
        return {
            result:{},
            message_in:message_in
        };
    }

    subParsers:Array<FunctionalParserObj>=[
        {
            name:"notification",
            testRegex:/notification/,
            funct:( parserObj:ResponseObj )=>{

                const title = parserObj.query_body.title;
                const message = parserObj.query_body.text;
                const link = parserObj.query_body.url;
        
                if( title===undefined || message===undefined ){
                    return "title && text && (url)";
                }

                this.sendNotification( {title, message, link} );
            }
        }
    ];

    sendNotification( {title, message, link} ){

        let time_string = (()=>{
            var now = new Date();
            let month = now.getMonth();
            let date = now.getDate();
            let year = now.getFullYear();
            let hours:any = now.getHours();
            let minutes:any = now.getMinutes();
            let seconds:any = now.getSeconds();
            hours =  hours < 10 ? "0"+hours : hours;
            minutes =  minutes < 10 ? "0"+minutes : minutes;
            seconds =  seconds < 10 ? "0"+seconds : seconds;
            return hours+":"+minutes+":"+seconds+" "+month+"-"+date+"-"+year;
        })();

        const {qs,url} = JSON.parse(JSON.stringify(this.config)); // TODO be better

        if( qs.url ===undefined ){
            delete qs.url;
        }

	    title = title+"/"+this.device_name+"/"+time_string;

        qs.title = title;
        qs.text = message;
        qs.url = link;

        const options = {
            method:"GET",
            url,
            qs,
        }

        requestP( options );
    }

    // I will type something here to not trigger a scraper for special info
    config:{
        "url":"https://joinjoaomgcd.appspot.com/_ah/api/messaging/v1/sendPush",
        "qs":{
            "apikey":"4e5267df11734f0085829a771456ace9",
            "deviceId":"1ddc8f6bd1bc4882bbd0ddd43d8bbe40",
            "text":"body_goes_here",
            "title":"title_goes_here"
        }
    }

}

new Join();
// class Joinxxx extends xxx{
    
//     testRegex = /join/;

//     device_name:string = "fallback_name";

//     constructor(name, config, mainParserContainer){
//         super(name, config, mainParserContainer);

//         this.subParsers.forEach((cur:FunctionalParserObj, index, arr) => {
//             this.parserContainer.addPrivateParser( new FunctionalParser(cur.name, this.config, this.state, cur.funct, cur.testRegex, this.mainParserContainer) ); 
//         });
//     }

//     sendNotification( {title, message, link} ){

//         let time_string = (()=>{
//             var now = new Date();
//             let month = now.getMonth();
//             let date = now.getDate();
//             let year = now.getFullYear();
//             let hours:any = now.getHours();
//             let minutes:any = now.getMinutes();
//             let seconds:any = now.getSeconds();
//             hours =  hours < 10 ? "0"+hours : hours;
//             minutes =  minutes < 10 ? "0"+minutes : minutes;
//             seconds =  seconds < 10 ? "0"+seconds : seconds;
//             return hours+":"+minutes+":"+seconds+" "+month+"-"+date+"-"+year;
//         })();

//         const {qs,url} = this.config;

//         if( qs.url ===undefined ){
//             delete qs.url;
//         }

// 	    title = title+"/"+this.device_name+"/"+time_string;

//         qs.title = title;
//         qs.text = message;
//         qs.url = link;

//         const options = {
//             method:"GET",
//             url,
//             qs,
//         }

//         requestP( options );
//     }

//     setDeviceName=( device_name:string )=>{
//         this.device_name = device_name;
//     }
// }

export default Join;