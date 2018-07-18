let fs = require('fs');
let huejay = require('huejay');

import { pushNotification } from '../../../helpers/ifttt';



(async function main(){

    let lightObj:any=(await setUpLightsObj())[0];

    let client = new huejay.Client({
        host:     lightObj.ip,
        port:     80,               // Optional
        username: 'bridgeusername', // Optional
        timeout:  15000,            // Optional, timeout in milliseconds (15000 is the default)
      });

    client.users.get()
    .then(user => {
        console.log('Username:', user.username);
        console.log('Device type:', user.deviceType);
        console.log('Create date:', user.created);
        console.log('Last use date:', user.lastUsed);
    }).catch((e)=>{
        console.error(e);
    });

    console.log( client );

})()

let args:any = process.argv;
args.shift();
args.shift();
args = JSON.parse(args[0]||"{}");

// pushNotification( {"title":"template","message":args, "link":"https://ws-expose.mybluemix.net/v1/get-log?token=hello"} )

//console.log(args.request.body)



// if( process.argv[2] === undefined ){
// 	console.log("no args found");
// }else{
// 	fs.writeFileSync("log.json",process.argv[2]);
// 	//console.log(process.argv[2]);
// 	let data
// 	try{
// 		//data = JSON.parse(process.argv[2]||"{}")
// 	}catch(e){
// 		console.log(e);
// 	}
// }

async function setUpLightsObj(){
    let obj;
    try{
        obj = JSON.parse(fs.readFileSync("lights.json").toString());
    }catch(e){
        console.log("1");

        await huejay.discover().then(bridges => {
            obj = bridges;
        
            for (let bridge of obj) {
                console.log(`Id: ${bridge.id}, IP: ${bridge.ip}`);
            }
        }).catch(error => {
            console.log(`An error occurred: ${error.message}`);
        });
        fs.writeFileSync( "lights.json", JSON.stringify(obj) );
        
    }
    return obj;
}