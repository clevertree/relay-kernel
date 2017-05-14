/**
 * Created by Ari on 12/29/2016.
 */

if (!module) var module = {exports:{}};
module.exports.initWorkerCommands = function(worker) {
    worker.addEventListener('message', handleMessage);

    var PATHS = ['exec'];

    var typeCommands = {};

    
    // Define command
    function handleMessage(e) {
        var commandString = e.data || e.detail;
        if (!commandString)
            throw new Error("Ignoring empty message");
        var type = commandString.split(/[^\w]+/)[0].toLowerCase();

        if(typeof typeCommands[type] !== 'undefined')
            return typeCommands[type](e, commandString);

        // Attempt to load command file
        var handleWorkerCommand = null;
        for(var i=0; i<PATHS.length; i++) {
            try {
                var path = PATHS[i] + '/' + type + '.js';
                importScripts(path);
                handleWorkerCommand = module.exports.handleWorkerCommand;
            } catch (ex) {
            }
        }

        if(!handleWorkerCommand)
            throw new Error("module.exports.handleWorkerCommand not found: " + type + ". PATHS=" + PATHS.join(', '));

        typeCommands[type] = handleWorkerCommand;
        // console.log("Imported " + filePath, typeCommands);
        return typeCommands[type](e, commandString);
    }
};