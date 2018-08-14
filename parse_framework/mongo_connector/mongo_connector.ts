var mongoose = require('mongoose');

const State = mongoose.model('StateSchema', new mongoose.Schema({
    _id: String,
    state: Object,
    date_created: Date,
    date_updated: Date
}));

function updateState(_id, state_object):Promise<any>{

    console.log("\n\nstate_object\n\n");
    console.log(state_object);
    
    return new Promise(async (resolve, reject)=>{

        let state_entry = await makeGetState(_id);

        if(state_entry!==null){

            state_entry.state = state_object;

            state_entry.save(((err, state_entry)=>{
                if( err!==undefined ){reject(err);}

                resolve(state_entry);
            }));

        }else{
            reject(new Error("state is null"));
        }

    });
}

function findById(_id): Promise<any> {

    return new Promise((resolve, rejct) => {

        State.findById(_id, function (err, states) {
            if (err) return console.error(err);
            resolve(states);
        })

    })
}

function find(query = {}): Promise<any> {

    return new Promise((resolve, rejct) => {

        State.find(query, function (err, states) {
            if (err) return console.error(err);
            resolve(states);
        })

    })
}

async function makeGetState(_id) {
    let state_obj = await findById( _id );
    if(state_obj===null){
        state_obj = await makeNewState(_id)
    }
    return state_obj;
}

function makeNewState(_id): Promise<any> {

    return new Promise((resolve, reject) => {

        let phone_schema = new State({ name:_id, state: {}, _id });

        phone_schema.save(function (err, phone_state) {
            if (err) {
                return reject(err);
            };

            resolve(phone_state);

        });
    })

}

function getConnectedMongoose(): Promise<any> {
    return new Promise((resolve, rejct) => {

        mongoose.connect('mongodb://localhost/test');

        var db = mongoose.connection;
        db.on('error', console.error.bind(console, 'connection error:'));
        db.once('open', function () {
            resolve(mongoose);
        })

    })
}

async function mongo_connector_init(){

    await getConnectedMongoose()

    return {updateState, makeGetState};
}

export {mongo_connector_init};