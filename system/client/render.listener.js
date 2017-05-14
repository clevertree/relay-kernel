/**
 * Created by Ari on 12/29/2016.
 */
(function(){
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
                content = content.substr(selector.length+1);

                target = target.querySelectorAll(selector);
                if(target.length > 0) {
                    for(var i=0; i<target.length; i++) {
                        target[i].innerHTML = content;
                    }

                } else {
                    throw new Error("Render Error: Could not find selector: " + selector);

                }
                break;
        }

    }
})();
