let fs = require('fs');
let huejay = require('huejay');

import { pushNotification } from '../../helpers/ifttt';

// (async function main(){

//     let lightObj:any=(await setUpLightsObj())[0];

//     let client = new huejay.Client({
//         host:     lightObj.ip,
//         port:     80,               // Optional
//         username: 'bridgeusername', // Optional
//         timeout:  15000,            // Optional, timeout in milliseconds (15000 is the default)
//       });

//     client.users.get()
//     .then(user => {
//         console.log('Username:', user.username);
//         console.log('Device type:', user.deviceType);
//         console.log('Create date:', user.created);
//         console.log('Last use date:', user.lastUsed);
//     }).catch((e)=>{
//         console.error(e);
//     });

//     console.log( client );

// })()

function setUpHueLightsObj(){
    // console.log("hello");
    // return
    // let obj;
    // try{
    //     obj = JSON.parse(fs.readFileSync("./serverless_files/lights/lights.json").toString());
    // }catch(e){
    //     console.log("1");

    //     await huejay.discover().then(bridges => {
    //         obj = bridges;
        
    //         for (let bridge of obj) {
    //             console.log(`Id: ${bridge.id}, IP: ${bridge.ip}`);
    //         }
    //     }).catch(error => {
    //         console.log(`An error occurred: ${error.message}`);
    //     });
    //     fs.writeFileSync( "lights.json", JSON.stringify(obj) );
        
    // }
    // return obj;
}

export default setUpHueLightsObj;