//console.log(process.argv);

//const scheduleObj = require('schedule/schedule.json');
const fs = require('fs');
const {exec, execFile} = require("child_process");
const schedule = require('node-schedule');

let scheduleObj = JSON.parse(fs.readFileSync('schedule.json').toString());

//console.log(scheduleObj);
function runShell(toExec, options, params=""){

	console.log(toExec+" "+options+" "+params);

	if(typeof params === "object"){
		params = JSON.stringify(params);
	}

	return new Promise((resolve, reject)=>{

		toExec = toExec+" "+params;

		exec(toExec, options, (err, stdout, stderr)=>{
			if(err){
				console.error("run shell err");
				console.error(err);
				reject(err);
			}if(stderr){
				console.error("run shell stderr");
				console.error(stderr);
				reject(stderr);
			}else{
				resolve(stdout);
			}
		});
	});
};

function loadScheduledItems(){
	for(let k in scheduleObj){
		try{
			let {command,rule,params,name,options} = scheduleObj[k];
			scheduleObj[k].job=schedule.scheduleJob(rule, async ()=>{
				console.log("running `"+name+"`");
				let result:any="---no result---";
				try{
					result = await runShell(command,options,params);
				}catch(e){
					console.error("schedule app 49 if error is uncaught promise ignore it");
					console.error(e);
				}
				console.log("`"+name +"` result...");
				console.log(result);
				console.log("`"+name+"` next invocation - "+scheduleObj[k].job.nextInvocation());
			});
			console.log("`"+name+"` next invocation - "+scheduleObj[k].job.nextInvocation());
		}catch(e){console.error("schedule 25");console.error(e);}
	}
}

loadScheduledItems();