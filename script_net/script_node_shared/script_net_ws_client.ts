import {ScriptNetParser} from "../script_node_shared/ScriptNetParser";
import {WsDataClientInterface} from "../script_node_shared/interfaces/WsDataInterface"

const WebSocket_old = require('ws');
const WebSocket = require("isomorphic-ws"); // TODO test this to see if it works


const defaultClientConnectionObj:WsDataClientInterface = {
    server_url:"bluemix.net",
    protocol:"wss",
    url_test_regex: new RegExp(".*"),
    max_ping_interval:5*1000*60
}

function connectToScriptNetAsServer( script_net_parser:ScriptNetParser ){

    if( script_net_parser.server_connection_data === undefined ){
        throw new Error("server_connection_data is undefined");
    }

    console.log("connect to script net server");
}

function connectToScriptNetAsClient( script_net_parser:ScriptNetParser ) {

    if( script_net_parser.client_connection_data === undefined ){
        throw new Error("client_connection_data is undefined");
    }

    let connectionObj = { ...defaultClientConnectionObj, ...script_net_parser.client_connection_data }

    let ws;

    //let connectInterval = setInterval(doStartConnection, 5000)
    doStartConnection(); 

    let clearResetIntervalId;

    function doStartConnection(){

        try{
            console.log("attempting "+connectionObj.server_url+" "+(new Date().toString()));
            ws = new WebSocket(connectionObj.protocol+"://"+connectionObj.server_url);
        }catch( e ){
            console.error(e);
            setTimeout(()=>{
                doStartConnection()
            },1000)
        }

        if(!ws){return}

        ws.on('open', () => {
            //clearInterval(connectInterval);
            send_to_ws({});
            console.log("connected "+connectionObj.server_url+" "+(new Date().toString()));
            resetRestartTimer();
        });

        ws.on('message', async(data) => {
            try{
                
                data = JSON.parse(data);
                setDeviceInfo(data);
                await script_net_parser.messageCallback( data );
                send_to_ws(data);

            }catch(e){
                console.error(e);
            }
            //console.log("");// for new line
        });

        ws.on('close', () => {
            console.log("disconnected "+connectionObj.server_url+" "+(new Date().toString()));
            //startSocketConnection()
            setTimeout(doStartConnection, 1000)
        });

        ws.on('ping',async (data)=>{
            console.log("ping: "+data.toString());
            resetRestartTimer();
        })
    }

    function resetRestartTimer(){
        
        if( clearResetIntervalId !== undefined ){
            clearTimeout(clearResetIntervalId);
        }else{
            console.log("clear interval set: "+connectionObj.max_ping_interval)
        }

        clearResetIntervalId = setTimeout(()=>{
            console.log("max_ping_interval ("+connectionObj.max_ping_interval+") lapsed ");
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

            obj.response_device.device_name = script_net_parser.device_name;
            obj.response_device.device_group = script_net_parser.device_group;
            obj.response_device.token = script_net_parser.token;


        }catch(e){
            console.log(e);
        }

        return obj;

    }

    return ws;
}

export {
    connectToScriptNetAsClient,
    connectToScriptNetAsServer
};