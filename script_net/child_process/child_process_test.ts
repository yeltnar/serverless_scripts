const fs = require('fs');

setInterval(()=>{
    console.log(process.argv[2]+" worked "+(new Date()).toString()); 
},10000)

//fs.writeFileSync("out.txt",(new Date()).toString());