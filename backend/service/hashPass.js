const bcrypt = require("bcrypt");

async function hashUserPass(plainPass){
    const hashPass = await bcrypt.hash(plainPass, 10);
    return hashPass;
}

async function verifyUserPass(plainPass, hashPass){
    const matchPass = await bcrypt.compare(plainPass, hashPass);
    return matchPass;
}

module.exports = {hashUserPass, verifyUserPass};