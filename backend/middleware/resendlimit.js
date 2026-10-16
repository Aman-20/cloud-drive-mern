const WINDOW_MS = 15*60*1000;
const REQUEST_PER_WINDOW = 3;

async function checkLimit(user, field, max=REQUEST_PER_WINDOW){
    const now = Date.now();
    const limit = user[field];

    if(!limit.windowStart || now - limit.windowStart.getTime() > WINDOW_MS){
        limit.count = 1;
        limit.windowStart = new Date();
        await user.save();
        return true;
    }

    if(limit.count >= max){
        return false;
    }

    limit.count += 1;
    await user.save();
    return true;
}


function readOnlyLimit(user, field, max=REQUEST_PER_WINDOW){
    const now = Date.now();
    const limit = user[field];

    if(!limit.windowStart || now - limit.windowStart.getTime() > WINDOW_MS){
        return true;
    }

    if(limit.count >= max){
        return false;
    }

    return true;
}

module.exports = {checkLimit, readOnlyLimit};