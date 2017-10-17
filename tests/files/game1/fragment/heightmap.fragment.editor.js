/**
 * Created by Ari on 12/30/2016.
 */

(function() {
    var Config = window.games.game1;
    var Util = Config.util;
    Config.fragment.editor.HeightMapEditor = HeightMapEditor;
    var PIXELS_PER_UNIT = Config.constants.PIXELS_PER_UNIT;

    var keyConstants = Config.input.keyConstants;
    var lastKeyCount = 0;

    function HeightMapEditor(heightMap) {
        var HeightMap = Config.fragment.HeightMap;
        if(!heightMap instanceof HeightMap)
            throw new Error("Invalid Height Map: ", heightMap);

        var THIS = this;
        var selectedTexture = 0;

        this.update = function(t, stage, flags) {

            var V = 1;
            var PK = Config.input.pressedKeys;
            var ctrl = PK[keyConstants.CHAR_CTRL] ? 1 : 0;
            if(ctrl) V = PIXELS_PER_UNIT;
            var shift = PK[keyConstants.CHAR_SHIFT] ? V : 0;


            // Hold-down keys
            if (PK[39]) THIS.moveSelection(V-shift, shift);     // Right
            if (PK[37]) THIS.moveSelection(shift-V, -shift);   // Left
            if (PK[40]) THIS.changePixel([0, 0, 0, -V]);     // Down
            if (PK[38]) THIS.changePixel([0, 0, 0, V]);   // Up

            if (PK[82]) THIS.changePixel([shift ? -V : V, 0, 0, 0]);  // R
            if (PK[71]) THIS.changePixel([0, shift ? -V : V, 0, 0]);  // G
            if (PK[66]) THIS.changePixel([0, 0, shift ? -V : V, 0]);  // B


            // Press-once keys
            if(lastKeyCount < Config.input.keyEvents) {
                lastKeyCount = Config.input.keyEvents;
                switch(Config.input.lastKey) {
                    case 65: // A
                        heightMap.setHighlightRange(0, heightMap.getMapLength());
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
                        THIS.commitTextureData(heightMap.getTextures()[0]);
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
                    // console.log("Key Change", noShift, Config.input.lastKey);
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
                var offset = i*4;
//                 var offset = (Math.floor(i/image.width)*image.width + (i%image.width)) * 4;
                imageData.data[offset + 0] += pixelData[pos + 0];
                imageData.data[offset + 1] += pixelData[pos + 1];
                imageData.data[offset + 2] += pixelData[pos + 2];
                imageData.data[offset + 3] += pixelData[pos + 3];
                pos += 4;
                if(pos >= pixelData.length)
                    pos = 0;
            }

            heightMap.updateTexture(texture, imageData);
            console.log("Change Pixel: ",  pixelData);
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
            range[1] += vStart + vLength;
            heightMap.setHighlightRange(range[0], range[1]);
            // console.log("Range: ",  heightMap.getHighlightRange(), vStart, vLength);
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


        // Save

        this.commitTextureData = function(texture) {
            var image = texture.srcImage,
                imageData = loadImageData(image);

            var canvas = document.createElement('canvas');
            canvas.width = image.width;
            canvas.height = image.height;
            var mapContext = canvas.getContext('2d');
            // mapContext.drawImage(imageData, 0, 0);
            mapContext.putImageData(imageData, 0, 0);
                
            var data = canvas.toDataURL();

            var POST = {
                "action": "asset-save-png",
                "path": image.srcRelative,
                "data": data,
                // "left": 0,
                // "top": 0,
                "width": image.width,
                "height": image.height
            };
            var xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function() {
                if (this.readyState === 4) {
                    if(this.status !== 200)
                        throw new Error(this.responseText);
                    var json = JSON.parse(this.responseText);
                    console.log(json);
                }
            };

            xhttp.open("POST", Config.path.root + '/client/game1.interface.php', true);
            xhttp.setRequestHeader('Content-type', 'application/json');
            xhttp.send(JSON.stringify(POST));

            console.info("Saving texture data: ", Config.path.root);
        };

    }

    // Static

})();