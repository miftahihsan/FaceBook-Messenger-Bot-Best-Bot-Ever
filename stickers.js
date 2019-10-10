const fs = require('fs')

function dissapointedHacker(){
    return fs.createReadStream('./stickers/hacker_boy/hacker_boy_18');
}

module.exports = {
    dissapointedHacker
};