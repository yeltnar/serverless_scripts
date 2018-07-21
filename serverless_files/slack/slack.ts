const fs = require('fs');

let o = JSON.parse(process.argv[2]);

console.log(o);

fs.writeFileSync( "serverless_files/slack_cli_webhook/log.txt",JSON.stringify(o) );

export default {}