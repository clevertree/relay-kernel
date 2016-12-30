/**
 * Created by Ari on 12/29/2016.
 */

if (!module) var module = {exports:{}};
module.exports.initWorkerCommands = function(worker) {
    worker.addEventListener('message', handleMessage);

    // Define commands
    function handleMessage(e) {
        var commandString = e.data || e.detail;
        if (!commandString)
            throw new Error("Ignoring empty message");
        var type = commandString.split(/[^\w]+/)[0].toLowerCase();
        
        switch(type) {
            case 'echo': 
                return handleCommandEcho(e, commandString);
        }
        
        throw new Error("Unhandled Worker Command: " + commandString);
    }
    
    
    function handleCommandEcho(e, commandString) {
        e.target.postMessage(commandString);
        // console.log(commandString, e.target);
        // e.preventDefault();
    }
};