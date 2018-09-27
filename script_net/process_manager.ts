const pm2 = require('pm2');
const {exec} = require("child_process");
const fs = require('fs');


const child_process_arr:Array<ChildProcessMetadataInterface> = [];

Promise.all([ connectPm2(), loadChildProcessArr() ])
.then(startChildProcesses)
.catch((e)=>{
    console.error("Connect to pm2 failed");
    console.error(e);
});

function connectPm2():Promise<void>{
    return new Promise((resolve, reject)=>{
        const noDaemonMode = false;

        pm2.connect(noDaemonMode, (err)=>{
            if( err ){
                console.error(err);
                reject();
            }else{
                console.log("connected to pm2"); 
                resolve();
            }
        });
    });
}

function loadChildProcessArr(){

    let child_process_metadata_arr = fs.readFileSync("./child_processes.txt").toString().split("\n");
    child_process_metadata_arr.forEach((cur, i, arr) => {

        const package_location = cur+"/package.json";
        
        const cur_package = JSON.parse( fs.readFileSync(package_location).toString() );

        let name;
        let type;
        let main;

        if( cur_package.script_node !== undefined ){
            name = cur_package.script_node.name || cur_package.name;
            type = cur_package.script_node.type;
            main = cur_package.script_node.main || cur_package.main;  
        }else{
            name = cur_package.name;
            type = cur_package.type;
            main = cur_package.main;           
        }

        const child_metadata = {
            name,
            pm2_name:name+i,
            type,
            main,
            package_location,
            location:cur,
            index:i
        };
        
        child_process_arr.push(child_metadata);
        console.log( "Loaded metadata: "+JSON.stringify(child_metadata) );
    });
}

function startChildProcesses(){
    
    const promise_arr=[];

    child_process_arr.forEach((cur, i, arr)=>{
        const current_promise = startChildProcess( cur );
        promise_arr.push(current_promise);
    })

    return Promise.all( promise_arr ).then((resultArr)=>{
        //pm2.disconnect();

        console.log("~Start Process report~"); // buffer for better ui
        resultArr.forEach((cur, i, arr)=>{
            console.log(cur);
        });
        console.log("~Start Process Done~")
        process.exit(1);
    })
}

async function startChildProcess( process_metadata:ChildProcessMetadataInterface ){

    console.log("Starting: "+process_metadata.pm2_name)
    await compile( process_metadata );
    return await run( process_metadata );

}

function compile( process_metadata:ChildProcessMetadataInterface ):Promise<void>{

    return (new Promise(( resolve, reject )=>{

        
        process_metadata.should_compile = process_metadata.type === "ts" || process_metadata.type==="typescript" || process_metadata.main.includes("ts") ;

        if( process_metadata.should_compile ){

            const out_dir = "build";
            const absolute_out_dir = process_metadata.location+"/"+out_dir

            if( !fs.existsSync(absolute_out_dir) ){
                fs.mkdirSync(absolute_out_dir);
            }

            const toExec = "tsc "+process_metadata.main+" --outDir "+out_dir;

            console.log("Compiling: "+process_metadata.pm2_name+": "+toExec+" (dir "+process_metadata.location+")");

            const options = {
                cwd:process_metadata.location
            };
    
            exec(toExec, options, (err, stdout, stderr)=>{
                // if( err ){
                //     reject(JSON.stringify({err,stderr}));
                // }else{
                //     console.log("no err");
                //     console.log(stdout);
                //     resolve();
                // }
                resolve();
            })

        }else{
            resolve();
        }
    }))
    .then((value)=>{
        console.log("Compile done: "+process_metadata.pm2_name);
    })
    .catch(genericPromiseCatch);
}

function run( process_metadata:ChildProcessMetadataInterface ):Promise<{error:Boolean, process_name:string}>{

    return new Promise((resolve, reject)=>{

        // http://pm2.keymetrics.io/docs/usage/pm2-api/
        const options = {
            "name":process_metadata.pm2_name,
            "script":"",
            //"interpreter":"node"
            "args":[process_metadata.index],
            //"cwd":"",
            "force":true

        };

        if( process_metadata.should_compile ){
            options.script = process_metadata.location+"/build/"+process_metadata.name+"/"+process_metadata.name+".js"
        }else{
            options.script = process_metadata.location+"/"+process_metadata.name+"/"+process_metadata.main;
        }
        console.log("Running: "+process_metadata.pm2_name+": "+options.script);

        pm2.start( options, function errback(err){

            if( err ){
                console.error( "Error starting: "+process_metadata.pm2_name );
                console.error( err );
                resolve({error:true, process_name:process_metadata.pm2_name})
            }else{
                console.log("Started: "+process_metadata.pm2_name)
                resolve({error:false, process_name:process_metadata.pm2_name});
            }
        });
    });
}

interface ChildProcessMetadataInterface{
    "type":string,
    "name":string,
    "pm2_name":string,
    "main":string,
    "should_compile"?:boolean,
    "index":number,
    "package_location":string,
    "location":string
}

// move to helper area
function genericPromiseCatch(e){
    console.error("genericPromiseCatch");
    console.error(e);
}