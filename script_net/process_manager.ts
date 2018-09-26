const pm2 = require('pm2');
const {exec} = require("child_process");

const noDaemonMode = false;

pm2.connect(noDaemonMode, (err)=>{
    if( err ){
        console.error(err);
    }else{
        console.log("connected to pm2");

        const arr = ["child_process"];
        const promise_arr=[];

        arr.forEach((cur, i, arr)=>{
            const current_promise = startChildProcess( cur );
            promise_arr.push(current_promise);
        })

        Promise.all( promise_arr ).then((resultArr)=>{
            //pm2.disconnect();

            console.log("~Start Process report~"); // buffer for better ui
            resultArr.forEach((cur, i, arr)=>{
                console.log(cur);
            });
            console.log("~Start Process Done~")
            process.exit(1);
        })
    }
});

async function startChildProcess( process_name ){

    console.log("Starting: "+process_name)
    await compile( process_name, "build" );
    return await run( process_name );

}

function compile( in_file, out_dir ):Promise<void>{

    return (new Promise(( resolve, reject )=>{
        
        const toExec = "tsc "+in_file+" --outDir "+out_dir;

        console.log("Compiling child Process: "+toExec);

        exec(toExec, undefined, (err, stdout, stderr)=>{
            // if( err ){
            //     reject(JSON.stringify({err,stderr}));
            // }else{
            //     console.log("no err");
            //     console.log(stdout);
            //     resolve();
            // }
            resolve();
        })

    }))
    .then((value)=>{
        console.log("\tCompile done "+in_file);
    })
    .catch(genericPromiseCatch);
}

function run( process_name ):Promise<{error:Boolean, process_name:string}>{

    return new Promise((resolve, reject)=>{
        console.log("Running: "+process_name);

        // http://pm2.keymetrics.io/docs/usage/pm2-api/
        const options = {
            //"name":process_name,
            "script":"./build/"+process_name+".js",
            //"interpreter":"node"
            //"args":[process_name],
            //"cwd":"",
            //"force":true,

        };

        pm2.start( options, function errback(err){

            if( err ){
                console.error( "Error starting: "+process_name );
                console.error( err );
                resolve({error:true, process_name})
            }else{
                console.log("Started: "+process_name)
                resolve({error:false, process_name});
            }
        });
    });
}

// move to helper area
function genericPromiseCatch(e){
    console.error("genericPromiseCatch");
    console.error(e);
}