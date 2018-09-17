import {HttpParser} from '../../HttpParser.class';
import {FunctionalParserObj, FunctionalParser} from '../../parse_framework/Parser.class';
import ParserObj from '../../parse_framework/ResponseObj.interface'

const requestP = require('request-promise-native');

class SendSms extends HttpParser{
    testRegex = /\/sms\//;

    personTable:object;

    constructor( name, config, mainParserContainer ){
        super( name, config, mainParserContainer );

        this.personTable = this.config.personTable;

        this.subParsers.forEach((cur:FunctionalParserObj) => {
            this.parserContainer.addPrivateParser( new FunctionalParser(cur.name, this.config, this.state, cur.funct, cur.testRegex, this.mainParserContainer, cur.functionalShouldParse) ); 
        });
    }

    subParsers:Array<FunctionalParserObj> = [
        {
            name:"send",
            funct:( parserObj:ParserObj )=>{
                
                const {msg, person} = parserObj.query_body;

                if( msg===undefined || person===undefined ){
                    return "msg & person";
                }

                return this.sendPersonSms(msg, person);
            },
            testRegex:/\/send\//
        },{
            name:"send_julie",
            funct:( parserObj:ParserObj )=>{
                
                const {msg} = parserObj.query_body;
                const person = "julie";

                if( msg===undefined || person===undefined ){
                    return "msg & person";
                }

                return this.sendPersonSms(msg, person);
            },
            testRegex:/\/send_julie\//
        }
    ]

    sendPersonSms=async ( msg:string, person:string ):Promise<object>=>{

        const email = this.personTable[person];

        if( email === undefined ){
            return {msg:"email"};
        }

        return await this.sendEmail( msg, email );
    }

    sendEmail=( msg:string, person:string ):Promise<object>=>{

        const options = { 
            method: 'GET',
            url: 'https://script.google.com/macros/s/AKfycbyZgLvyNWTE-We8gH2C6X77wsnHd3huN2Uh0_L8fYO-cn97jEE/exec',
            qs:{ 
                recipient: '3254503713@txt.att.net',
                subject: 'subject',
                body: 'body' 
            } 
        };

        return requestP(options).then(( reply )=>{

            let reply_obj:object;

            if( typeof reply === "string" ){
                reply_obj = JSON.parse( reply );
            }else{
                reply_obj = reply;
            }

            return reply_obj;

        }).catch(( err )=>{
            this.pushNotification("SMS error", "phone "+person+" - msg:"+msg);
        })
    }
}

export default SendSms