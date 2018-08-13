let requestP = require("request-promise-native");

const iftttConfig={
    "first":"https://maker.ifttt.com/trigger/",
    "second":"/with/key/bXrf4Mm5tIy0Bjis08SiYC",
    "push_notification":"push_notification"
}

// title, message, link
function pushNotification(msgObj){

	console.log("msgObj...");
	console.log(msgObj);

	let title;
	let message;
	let link;

	if( typeof msgObj === "object" ){
		title  = msgObj.title
		message = msgObj.message
		link    = msgObj.link
	}else{ // assume string
		throw "msgObj must be an object";
	}

	let url = iftttConfig.first+iftttConfig.push_notification+iftttConfig.second

	let options = { 
		method: 'POST',
	  	url,
	  	headers:{
	  		"Content-Type":"application/json"
	  	},
	  	body: {
	  		"value1":title,
	  		"value2":message,
	  		"value3":link
	  	},
	  	json:true
	};
	return requestP(options).then((results)=>{
		console.log("results is "+results);
	})

	//return requestP(options);

}

export {pushNotification}