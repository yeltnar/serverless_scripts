import {connectToScriptNetAsClient} from '../script_node_shared/script_net_ws_client'\

function message_callback(){
    console.log("message callback");
}

function should_parse(){
    
}

const connection_obj = {
    device_name:"child_process_test",
    device_group:"device_group",
    token:"token",
    token_type:"string",
    should_parse,
    message_callback
};

const ws_connection = connectToScriptNetAsClient( connection_obj );

setInterval(()=>{
    console.log(process.argv[2]+" worked "+(new Date()).toString()); 
},10000)

//fs.writeFileSync("out.txt",(new Date()).toString());