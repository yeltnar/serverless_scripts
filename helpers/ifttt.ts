let requestP = require("request-promise-native");

interface PushMsgObj{
	title: String,
	message: String,
	link?: String
};

let device_name:string="fallback_name";

const iftttConfig={
    "first":"https://maker.ifttt.com/trigger/",
    "second":"/with/key/bXrf4Mm5tIy0Bjis08SiYC",
    "push_notification":"push_notification"
}

// title, message, link
function pushNotification(msgObj:PushMsgObj):Promise<any>{

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

	let date = new Date();
	
	let time_string = (()=>{
		var now = new Date();
		let month = now.getMonth();
		let date = now.getDate();
		let year = now.getFullYear();
		let hours:any = now.getHours();
		let minutes:any = now.getMinutes();
		hours =  hours < 10 ? "0"+hours : hours;
		minutes =  minutes < 10 ? "0"+minutes : minutes;
		return hours+":"+minutes+" "+month+"-"+date+"-"+year;
	})();

	title = title+"/"+device_name+"/"+time_string;

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

function init_pushNotification(init_device_name){
	device_name = init_device_name;
}

export {pushNotification, init_pushNotification}