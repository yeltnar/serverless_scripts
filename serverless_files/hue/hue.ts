const requestP = require('request-promise-native');

let helpers, pushNotification, parseObj;

// "ifttt":{
//     "first":"https://maker.ifttt.com/trigger/",
//     "second":"/with/key/bXrf4Mm5tIy0Bjis08SiYC",
//     "push_notification":"push_notification"
// },

let light_lookup_table = {
    "living_room":"1",
    "bedroom":"2"
}

// TODO move to config file
let user = "EByeQOPuSZvgsiSgKGYpOTqKwYJnpVo6TqkxZ5Gh"; // TODO move this to config
let baseAddress = "http://192.168.1.111/api"

async function hue_parse( query_body ){

    let light_id;
    let state = query_body.state;

    console.log(query_body)

    if( query_body.light_id !== undefined ){
        light_id = query_body.id
    }else if( query_body.light_name !== undefined ){
        light_id = light_lookup_table[ query_body.light_name ];
    }else{
        return "no light id nor light name";
    }

    if( state === undefined ){
        return "no light state";
    }

    let res = await setLightState(light_id, state);

    return res
}

function getLightId(name){
    return light_lookup_table[name];
}

function setLightState(id, on=true){

    if(typeof on === "string" ){
        on = on==="on";
    }

    if(id===undefined){throw new Error("light id must be defined");}
    if(on===undefined){throw new Error("light state must be defined");}

    let options = { 
        method: 'PUT',
          url: baseAddress+'/'+user+'/lights/'+id+'/state',
          body: JSON.stringify({on})
    };
    return requestP(options).then(helpers.tryToParsePromise);
}

function hue_int( local_helpers, local_pushNotification, local_parseObj ){
    helpers = local_helpers
    pushNotification = local_pushNotification
    parseObj = local_parseObj

    return hue_parse;
}

export default hue_int