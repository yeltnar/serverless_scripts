import { HttpParser } from "../../HttpParser.class";

const WebSocket = require('ws');

interface ConnectToScriptNetClientInterface{
    "url"?:string,
    "ip_protocol"?:string,
    "max_ping_interval"?:number,

    "device_name":string,
    "device_group":string,
    "token":string,
    "token_type":string,

    "should_parse":Function,
    "message_callback":Function

}

const defaultConnectionObj = {

}

function connectToScriptNetAsClient( abstract_parser:HttpParser ){
    console.log("connect to script net");

    const connectionObj = {

        device_name: abstract_parser.name,
        device_group: abstract_parser.device_group,
        token: abstract_parser.token,
        should_parse: abstract_parser._shouldParse,
        message_callback: abstract_parser.parse
    };
    abstract_parser.;





    return startSocketConnection( connectionObj );;
}

// function connectToScriptNetAsServer( connectionObj?:ConnectToScriptNetClientInterface ){
//     console.log("connect to script net");
//     return ws_connection;
// }

function startSocketConnection( connectionObj:ConnectToScriptNetClientInterface ) {

    connectionObj = { ...defaultConnectionObj, ...connectionObj }

    let ws;

    //let connectInterval = setInterval(doStartConnection, 5000)
    doStartConnection(); 

    let clearResetIntervalId;

    function doStartConnection(){

        try{
            console.log("attempting "+connectionObj.url+" "+(new Date().toString()));
            ws = new WebSocket(connectionObj.url);
        }catch( e ){
            doStartConnection()
        }

        if(!ws){return}

        ws.on('open', () => {
            //clearInterval(connectInterval);
            send_to_ws({});
            console.log("connected "+connectionObj.url+" "+(new Date().toString()));
            resetRestartTimer();
        });

        ws.on('message', async(data) => {
            try{
                
                data = JSON.parse(data);
                setDeviceInfo(data);
                await connectionObj.message_callback( data );
                send_to_ws(data);

            }catch(e){
                console.error(e);
            }
            //console.log("");// for new line
        });

        ws.on('close', () => {
            console.log("disconnected "+connectionObj.url+" "+(new Date().toString()));
            //startSocketConnection()
            setTimeout(doStartConnection, 1000)
        });

        ws.on('ping',async (data)=>{
            console.log(data.toString());
            resetRestartTimer();
        })
    }

    function resetRestartTimer(){
        
        if( clearResetIntervalId !== undefined ){
            clearTimeout(clearResetIntervalId);
        }else{
            console.log("clear interval set")
        }

        clearResetIntervalId = setTimeout(()=>{
            restartConnection();
        },connectionObj.max_ping_interval);
    }

    function restartConnection(){
        console.log('resetting connection')
        ws.close();
    }


    function send_to_ws(obj:any) {

        if (typeof obj !== 'object') {
            throw "send_to_ws obj must be an object";
        }

        setDeviceInfo(obj);

        ws.send(JSON.stringify(obj));
    }


    function setDeviceInfo(obj){

        try{

            obj.response_device = obj.response_device || {};

            obj.response_device.device_name = connectionObj.device_name;
            obj.response_device.device_group = connectionObj.device_group;
            obj.response_device.token = connectionObj.token;
            obj.response_device.token_type = connectionObj.token_type;


        }catch(e){
            console.log(e);
        }

        return obj;

    }

    return ws;
}

export {connectToScriptNetAsClient,ConnectToScriptNetClientInterface};