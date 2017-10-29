/**
 * Created by Ari on 12/29/2016.
 */


// Handle worker command
if (!module) var module = {exports:{}};
module.exports.handleWorkerCommand = function(e, commandString) {
    var split = commandString.split(' ');
    var type = split[0].toLowerCase();
    var filePath = split[1];
    var RELATIVE_ROOT = e.target.RELATIVE_ROOT;
    importScripts(RELATIVE_ROOT + filePath);
    var exp = module.exports;
    if(typeof exp.onLoad === 'function')
        exp.onLoad(e);
};
