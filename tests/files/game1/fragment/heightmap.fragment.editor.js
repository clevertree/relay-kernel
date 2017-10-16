/**
 * Created by Ari on 12/30/2016.
 */

(function() {
    var Config = window.games.game1;
    var Util = Config.util;
    Config.fragment.editor.HeightMapEditor = HeightMapEditor;
    var PIXELS_PER_UNIT = Config.constants.PIXELS_PER_UNIT;

    var CHAR_SHIFT = 16;
    var lastKeyCount = 0;

    function HeightMapEditor(heightMap) {
        var HeightMap = Config.fragment.HeightMap;
        if(!heightMap instanceof HeightMap)
            throw new Error("Invalid Height Map: ", heightMap);

        var THIS = this;
        var selectedTexture = 0;

        var lastHoldTime = 0, lastHoldDelay = 200;
        this.update = function(t, stage, flags) {

            var PK = Config.input.pressedKeys;
            var noShift = Config.input.pressedKeys[CHAR_SHIFT] ? 0 : 1;

            // Hold-down keys
            if(PK[37] || PK[38] || PK[39] || PK[40]) {
                if(t > lastHoldTime) {
                    if (PK[39]) THIS.moveSelection(1, noShift ? 0 : 1);     // Right
                    if (PK[37]) THIS.moveSelection(-1, noShift  ? 0 : -1);   // Left
                    if (PK[40]) THIS.changePixel([0, 0, 0, noShift ? -1 : -PIXELS_PER_UNIT]);     // Down
                    if (PK[38]) THIS.changePixel([0, 0, 0, noShift ? 1 : PIXELS_PER_UNIT]);   // Up
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
                        heightMap.setHighlightRange(0, heightMap.getMapLength());
                        break;

                    case 82: // R:
                        THIS.changePixel([noShift ? -1 : 1, 0, 0, 0]);
                        break;
                    case 71: // G:
                        THIS.changePixel([0, noShift ? -1 : 1, 0, 0]);
                        break;
                    case 66: // B:
                        THIS.changePixel([0, 0, noShift ? -1 : 1, 0]);
                        break;

                    case 67: // C
                        THIS.copyPixel();
                        break;

                    case 46: // DEL
                    case 68: // D
                        THIS.setPixel([0, 0, 0, 0]);
                        break;

                    case 45: // INS
                    case 86: // V
                        THIS.pasteEditorPixel();
                        break;

                    case 83: // S
                        THIS.saveEditorMap();
                        break;

                    case 84: // T
                        THIS.printHeightPattern();
                        break;

                    case 48: // 0
                    case 49: // 1
                    case 50: // 2
                    case 51: // 3
                    case 52: // 4
                    case 53: // 5
                    case 54: // 6
                    case 55: // 7
                    case 56: // 8
                    case 57: // 9
                        THIS.printHeightPattern();
                        break;

                    default:
//                     console.log("Key Change", noShift, Config.input.lastKey);
                }
            }
        };

        function loadImageData(image) {
            if(image.imageDataCache)
                return image.imageDataCache;
            var canvas = document.createElement('canvas');
            var mapContext = canvas.getContext('2d');
            mapContext.drawImage(image, 0, 0);
            var imageData = mapContext.getImageData(0, 0, image.width, image.height);
            image.imageDataCache = imageData;
            return imageData;
        }

        this.setPixel = function(pixelData) {
            var texture = heightMap.getTextures()[selectedTexture],
                image = texture.srcImage,
                imageData = loadImageData(image);

            var pos = 0, range = heightMap.getHighlightRange();
            for (var i=range[0]; i<range[1]; i++) {
                var offset = (i%image.width) * 4;
                imageData.data[offset + 0] = pixelData[pos + 0];
                imageData.data[offset + 1] = pixelData[pos + 1];
                imageData.data[offset + 2] = pixelData[pos + 2];
                imageData.data[offset + 3] = pixelData[pos + 3];
                pos += 4;
                if(pos >= pixelData.length)
                    pos = 0;
            }

            heightMap.updateTexture(texture, imageData);
            // TODO: save
        };

        this.changePixel = function(pixelData) {
            var texture = heightMap.getTextures()[selectedTexture],
                image = texture.srcImage,
                imageData = loadImageData(image);

            var pos = 0, range = heightMap.getHighlightRange();
            for (var i=range[0]; i<range[1]; i++) {
                var offset = (i%image.width) * 4;
                imageData.data[offset + 0] += pixelData[pos + 0];
                imageData.data[offset + 1] += pixelData[pos + 1];
                imageData.data[offset + 2] += pixelData[pos + 2];
                imageData.data[offset + 3] += pixelData[pos + 3];
                pos += 4;
                if(pos >= pixelData.length)
                    pos = 0;
            }

            heightMap.updateTexture(texture, imageData);
            // TODO: save
        };

        var pixelCache;
        this.copyPixel = function() {
            var texture = heightMap.getTextures()[selectedTexture];
            var image = texture.srcImage;
            var imageData = loadImageData(image);
            var range = heightMap.getHighlightRange();
            var aRange = [range[0] * 4, range[1] * 4];

            pixelCache = new Uint8ClampedArray((range[1]-range[0])*4);

            for (var i=aRange[0]; i<aRange[1]; i++)
                pixelCache[i] = imageData.data[i];

            console.log("Copied: ", pixelCache);
        };

        this.pasteEditorPixel = function() {
            if(!pixelCache)
                throw new Error("No pixel cache");

            this.changePixel(pixelCache);
        };

        this.moveSelection = function(vStart, vLength) {
            var range = heightMap.getHighlightRange();
            range[0] += vStart;
            range[1] += vLength;
            heightMap.setHighlightRange(range[0], range[1]);
        };


        this.printHeightPattern = function(pattern) {
            var texture = heightMap.getTextures()[selectedTexture],
                image = texture.srcImage,
                imageData = loadImageData(image);

            pattern = pattern || function(e, oldPixel) {
                oldPixel[3] = 256 - oldPixel[3];
                return oldPixel;
            };

            var e = {
                firstPixel: imageData.data.slice(range[0]*4, 4),
                lastPixel: imageData.data.slice(range[1]*4, 4),
                image: image,
                imageData: imageData
            };
            var range = heightMap.getHighlightRange();
            for (var pos=range[0]; pos<range[1]; pos++) {
                var offset = (pos%image.width) * 4;
                var oldPixel = imageData.data.slice(offset, 4);
                e.pos = pos;
                var newPixel = pattern(e, oldPixel);
                imageData.data[offset + 0] += newPixel[0];
                imageData.data[offset + 1] += newPixel[1];
                imageData.data[offset + 2] += newPixel[2];
                imageData.data[offset + 3] += newPixel[3];
            }

            heightMap.updateTexture(texture, imageData);
            // TODO: save
        };

    }

    // Static

})();