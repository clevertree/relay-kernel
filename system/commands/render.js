/**
 * Created by Ari on 12/29/2016.
 */


// Handle worker command
if (!module) var module = {exports:{}};
module.exports.handleWorkerCommand = function(e, commandString) {

    // Include client-side javascript support files
    commandString = "INCLUDE system/commands/render.js;" + commandString; // TODO: better hack needed
    
    e.target.postMessage(
        // Render command back to client
        commandString
    );
};

// Handle client-side response
if (typeof document !== 'undefined') (function(){
    document.addEventListener('response:render', handleRenderResponse);
    
    function handleRenderResponse (e) {
        var commandString = e.data || e.detail;
        e.preventDefault();

        var type = commandString.split(' ')[0].toLowerCase();
        var target = document.body;
        var content = commandString.substr(type.length+1);
        switch(type) {
            case 'render':
                target.innerHTML = content;
                break;
            case 'render.selector':
                var selector = content.split(' ')[0].toLowerCase();
                if(!selector)
                    throw new Error("Invalid Selector");
                target = target.querySelector(selector);
                if(!target)
                    throw new Error("Render Error: Could not find selector: " + selector);
                content = content.substr(selector.length+1);
                target.innerHTML = content;
                break;
        }

    }
})();
