(()=>{
    
    const fs = require('fs');

    const path = "./state";

    let obj = {};

    fs.readdir(path, function(err, items) {
    
        for (var i=0; i<items.length; i++) {

            let file = items[i];
            let cur = file.split('.json').join('')

            if( cur.indexOf('.ts')>-1 ){
                continue;
            }

            let file_contents = fs.readFileSync(file).toString()
            obj[cur] = JSON.parse(file_contents);

            // console.log(file);
            // console.log(cur);
            // console.log(file_contents);
        }

        console.log(obj);
        fs.writeFileSync('master_state.json',JSON.stringify(obj));
    });


})();