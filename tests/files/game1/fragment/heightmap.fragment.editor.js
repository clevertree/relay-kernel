/**
 * Created by Ari on 12/30/2016.
 */

(function() {
    var Config = window.games.game1;
    var Util = Config.util;
    Config.fragment.editor.HeightMapEditor = new HeightMapEditor;

    var lastKeyCount = 0;

    function HeightMapEditor() {
        this.update = function(t, heightMap, stage, flags) {

            // Press-once keys
            if(lastKeyCount < Config.input.keyEvents) {
                lastKeyCount = Config.input.keyEvents;
                console.log("Editor Enabled: ", this);
            }
        };
    }

    // Static

})();