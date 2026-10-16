const mongoose = require("mongoose");

async function mongoConnect(URL) {
    mongoose.connect(URL, {dbName:"dashboard"}).then(()=>{
        console.log("mongoDB is Connected...");
    }).catch((err)=>{
        console.log("MongoDBerror: ",err);
    })
}

module.exports = mongoConnect;