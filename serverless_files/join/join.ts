import {ParserContainer, FunctionalParserObj, FunctionalParser} from '../../parse_framework/Parser.class'
import { HttpParser } from "../../HttpParser.class";
import ResponseObj from '../../parse_framework/ResponseObj.interface'
import { TextDecoder } from 'util';
import { url } from 'inspector';

const requestP = require('request-promise-native');

let device_name:string="fallback_name";

class Join extends HttpParser{
    testRegex = /join/;

    constructor(name, config, mainParserContainer){
        super(name, config, mainParserContainer);

        this.subParsers.forEach((cur:FunctionalParserObj, index, arr) => {
            this.parserContainer.addPrivateParser( new FunctionalParser(cur.name, this.config, this.state, cur.funct, cur.testRegex, this.mainParserContainer) ); 
        });
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

        const {qs,url} = this.config;

        if( qs.url ===undefined ){
            delete qs.url;
        }

	    title = title+"/"+device_name+"/"+time_string;

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
}

export default Join;