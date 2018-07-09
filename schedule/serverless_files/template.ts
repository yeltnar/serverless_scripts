let fs = require('fs');

if( process.argv[2] === undefined ){
	console.log("no args found");
}else{
	fs.writeFileSync("log.json",process.argv[2]);
	console.log(process.argv[2]);
	let data
	try{
		//data = JSON.parse(process.argv[2]||"{}")
	}catch(e){
		console.log(e);
	}
}

