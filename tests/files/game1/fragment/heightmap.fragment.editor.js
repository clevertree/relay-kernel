/**
 * Created by Ari on 12/30/2016.
 */

(function() {
    var Config = window.games.game1;
    var Util = Config.util;
    Config.fragment.editor.HeightMapEditor = HeightMapEditor;

    var CHAR_SHIFT = 16;
    var lastKeyCount = 0;

    function HeightMapEditor(heightMap) {
        var HeightMap = Config.fragment.HeightMap;
        if(!heightMap instanceof HeightMap)
            throw new Error("Invalid Height Map: ", heightMap);

        var range = [0, 100];

        this.update = function(t, stage, flags) {

            var PK = Config.input.pressedKeys;
            var noShift = Config.input.pressedKeys[CHAR_SHIFT] ? 0 : 1;

            // Hold-down keys
            if(PK[37] || PK[38] || PK[39] || PK[40]) {
                if(t > lastHoldTime) {
                    if (PK[39]) heightMap.moveEditorSelection(noShift, 0, 1, 0);     // Right
                    if (PK[37]) heightMap.moveEditorSelection(-noShift, 0, -1, 0);   // Left
                    if (PK[40]) heightMap.moveEditorSelection(0, noShift, 0, 1);     // Down
                    if (PK[38]) heightMap.moveEditorSelection(0, -noShift, 0, -1);   // Up
                    lastHoldTime = t + lastHoldDelay;
                    if(lastHoldDelay > 20)
                        lastHoldDelay-=20;
                }
            } else {
                lastHoldTime = t;
                lastHoldDelay=200;
            }


            // Press-once keys
            if(lastKeyCount < Config.input.keyEvents) {
                lastKeyCount = Config.input.keyEvents;
                switch(Config.input.lastKey) {
                    case 65: // A
                        heightMap.setEditorSelection(0, 0, 99999999, 99999999);
                        break;

                    case 78: // N:
                        heightMap.changeEditorNextPixel();
                        break;

                    case 76: // L
                        heightMap.changeEditorLastPixel();
                        break;


                    case 67: // C
                        heightMap.copyEditorPixel();
                        break;

                    case 46: // DEL
                    case 68: // D
                        heightMap.changeEditorPixel([0, 0, 0, 0]);
                        break;

                    case 45: // INS
                    case 86: // V
                        heightMap.pasteEditorPixel();
                        break;

                    case 83: // S
                        heightMap.saveEditorMap();
                        break;

                    case 84: // T
                        heightMap.printEditorTilePattern();
                        break;


                    default:
//                     console.log("Key Change", noShift, Config.input.lastKey);
                }
            }
        };
    }

    // Static

})();