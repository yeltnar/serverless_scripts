let fs = require('fs');
let huejay = require('huejay');

const hue_bridge_data = "./serverless_files/lights/data/bridge_data.json";
const hue_user_data = "./serverless_files/lights/data/user_data.json";

import { pushNotification } from '../../helpers/ifttt';

// (async function main(){

//     let lightObj:any=(await setUpHueLightsObj())[0];

//     let client = new huejay.Client({
//         host:     lightObj.ip,
//         //port:     80,               // Optional
//         username: 'bridgeusername', // Optional
//         //timeout:  15000,            // Optional, timeout in milliseconds (15000 is the default)
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

async function getBridgeData(){
    console.log("getBridgeData");
    let bridge_arr;
    try{
        bridge_arr = JSON.parse(fs.readFileSync(hue_bridge_data).toString());
    }catch(e){
        console.log("setting up new lights");

        bridge_arr = await huejay.discover()

        fs.writeFileSync( hue_bridge_data, JSON.stringify(bridge_arr) );
        
    }
    return bridge_arr[0];
}

async function getClientData(bridge_data){
    console.log("getClientData");
    return new huejay.Client({
        host:     bridge_data.ip,
        //port:     80,               // Optional
        //username: 'bridgeusername', // Optional
        //timeout:  15000,            // Optional, timeout in milliseconds (15000 is the default)
      });
}

async function getUserData(client){
    console.log("getUserData");
    let bridge_arr;
    try{
        bridge_arr = JSON.parse(fs.readFileSync(hue_user_data).toString());
    }catch(e){
        console.log("setting up new lights user");

        let user = new client.users.User;

        client.users.create(user)
        .then(user => {
          console.log(`New user created - Username: ${user.username}`);
        })
        .catch(error => {
          if (error instanceof huejay.Error && error.type === 101) {
            return console.log(`Link button not pressed. Try again...`);
          }
      
          console.log(error.stack);
        });;

        fs.writeFileSync( hue_bridge_data, JSON.stringify(bridge_arr) );
        
    }
    return bridge_arr[0];
}

async function setUpHueLightsObj(){


    let bridge_data = await getBridgeData();
    let client = await getClientData(bridge_data);
    let user_data = await getUserData(client);

    console.log(bridge_data);
    console.log(user_data);
}

export default setUpHueLightsObj