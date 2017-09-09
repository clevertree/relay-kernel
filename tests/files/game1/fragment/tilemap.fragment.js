/**
 * Created by Ari on 12/30/2016.
 */

(function() {
    var Config = window.games.game1;
    var Util = Config.util;
    Config.fragment.TileMap = TileMap;

    var PROGRAM;

    function TileMap(gl, pathLevelMap, pathTileSheet, tileSize, mMapSize, flags, vColor, mModelView, mVelocity, mAcceleration) {
        if(typeof flags === 'undefined')
            flags = TileMap.FLAG_DEFAULTS;

        // Variables
        mModelView =            mModelView || defaultModelViewMatrix;
        vColor =                vColor || defaultColor;
        mMapSize =              mMapSize || [tileSize * 32, tileSize * 24];
        var vActiveColor =      vColor.slice(0);
        var vActiveColorRange = [0,0,tileSize,tileSize];

        // Set up public object
        this.render =           render;
        this.update =           update;
        this.setVelocity =      setVelocity;
        this.setAcceleration =  setAcceleration;

        // Set up private properties
        var mTextureCoordinates = defaultTextureCoordinates;
        var tTileSheet, iTileSheet = null;
        var tLevelMap, iLevelMap = null;
        var rowCount = 1, colCount = 1;
        var inverseSpriteTextureSize = [1,1];
        var inverseTileTextureSize = [1,1];
        var levelMapData, levelMapSize = [1,1];

        // Initiate Shaders
        if(!PROGRAM)
            initProgram(gl);

        // Create a texture.
        tTileSheet = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tTileSheet);

        // Fill the texture with a 1x1 blue pixel.
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
            new Uint8Array([0, 256, 0, 128]));

        // Asynchronously load the spritesheet
        iTileSheet = new Image();
        iTileSheet.src = pathTileSheet;
        iTileSheet.addEventListener('load', function(e) {
            // Now that the image has loaded make copy it to the texture.
            gl.bindTexture(gl.TEXTURE_2D, tTileSheet);
            // Upload the image into the texture.
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, iTileSheet);

         
            // Set the parameters so we can render any size image.

            if(flags & TileMap.FLAG_REPEAT_TILES) {
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
            } else {
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            }


            if(flags & TileMap.FLAG_GENERATE_MIPMAP) {
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.generateMipmap(gl.TEXTURE_2D);
            } else {
                // MUST be filtered with NEAREST or tile lookup fails
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            }

            // console.log("Sprite Sheet Texture Loaded: ", image, tTileMap);

            colCount = iTileSheet.width / tileSize;
            if(colCount % 1 !== 0) console.error("Tile sheet width (" + iTileSheet.width + ") is not divisible by " + tileSize);
            rowCount = iTileSheet.height / tileSize;
            if(rowCount % 1 !== 0) console.error("Tile sheet height (" + iTileSheet.height + ") is not divisible by " + tileSize);

            inverseSpriteTextureSize = [1 / iTileSheet.width, 1 / iTileSheet.height];
        });


        // Load the Level Map
        tLevelMap = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tLevelMap);

        // Fill the texture with a 1x1 pixel.
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
            new Uint8Array([0, 256, 0, 128]));

        // Asynchronously load the spritesheet
        iLevelMap = new Image();
        iLevelMap.src = pathLevelMap;
        iLevelMap.addEventListener('load', function(e) {
            // Now that the image has loaded make copy it to the texture.
            gl.bindTexture(gl.TEXTURE_2D, tLevelMap);

            // Upload the image into the texture.
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, iLevelMap);

            // Set the parameters so we can render any size image.

            if(flags & TileMap.FLAG_REPEAT_MAP || true) {
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
            } else {
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            }
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

            levelMapSize = [iLevelMap.width, iLevelMap.height];
            inverseTileTextureSize = [1 / iLevelMap.width, 1 / iLevelMap.height];

            var canvas = document.createElement('canvas');
            var mapContext = canvas.getContext('2d');
            mapContext.drawImage(iLevelMap, 0, 0);
            levelMapData = mapContext.getImageData(0, 0, iLevelMap.width, iLevelMap.height);
        });

        var quadVerts = [
            //x  y  u  v
            -1, -1, 0, 1,
            1, -1, 1, 1,
            1,  1, 1, 0,

            -1, -1, 0, 1,
            1,  1, 1, 0,
            -1,  1, 0, 0
        ];

        var bufQuadVertices = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, bufQuadVertices);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(quadVerts), gl.STATIC_DRAW);


        // Functions


        function render(t, gl, stage, flags) {

            // Update
            update(t, stage, flags);

            // Render
            gl.useProgram(PROGRAM);

            gl.bindBuffer(gl.ARRAY_BUFFER, bufQuadVertices);
            gl.vertexAttribPointer(aVertexPosition, 2, gl.FLOAT, false, 16, 0);
            gl.vertexAttribPointer(aTextureCoordinate, 2, gl.FLOAT, false, 16, 8);

            // Bind Vertex Coordinate
            // gl.bindBuffer(gl.ARRAY_BUFFER, bufVertexPosition);
            // gl.vertexAttribPointer(aVertexPosition, 2, gl.FLOAT, false, 0, 0);

            // Bind Texture Coordinate
            // gl.bindBuffer(gl.ARRAY_BUFFER, bufTextureCoordinate);
            // gl.bufferData(gl.ARRAY_BUFFER, mTextureCoordinates, gl.DYNAMIC_DRAW);
            // gl.vertexAttribPointer(aTextureCoordinate, 2, gl.FLOAT, false, 0, 0);


            // Set the projection and viewport.
            gl.uniformMatrix4fv(uPMatrix, false, stage.mProjection);
            gl.uniformMatrix4fv(uMVMatrix, false, mModelView);
            gl.uniform2fv(uMapSize, mMapSize);
            gl.uniform4fv(uColor, vActiveColor);
            gl.uniform4fv(uColorRange, vActiveColorRange);

            // mMapSize[0]+=1; mMapSize[1]+=1;




            gl.uniform2fv(uInverseSpriteTextureSize, inverseSpriteTextureSize);
            gl.uniform2fv(uInverseTileTextureSize, inverseTileTextureSize);



            // Tell the shader to get the tile sheet from texture unit 0
            gl.activeTexture(gl.TEXTURE0);
            gl.uniform1i(uTileSheet, 0);
            gl.bindTexture(gl.TEXTURE_2D, tTileSheet);

            // Tell the shader to get the level map from texture unit 0
            gl.activeTexture(gl.TEXTURE1);
            gl.uniform1i(uLevelMap, 1);
            gl.bindTexture(gl.TEXTURE_2D, tLevelMap);

            // gl.uniform1i(shader.uniform.tiles, 1);
            // gl.uniform2f(shader.uniform.viewOffset, Math.floor(x * layer.scrollScaleX), Math.floor(y * layer.scrollScaleY));
            // gl.uniform2fv(shader.uniform.inverseTileTextureSize, layer.inverseTextureSize);
            // gl.uniform1i(shader.uniform.repeatTiles, layer.repeat ? 1 : 0);


            // draw the quad (2 triangles, 6 vertices)
            gl.drawArrays(gl.TRIANGLES, 0, 6);
        }

        function setVelocity(vx, vy, vz) {
            mVelocity = Util.translation(vx, vy, vz);
        }

        function setAcceleration(ax, ay, az) {
            if(!mVelocity)
                setVelocity(0,0,0);
            mAcceleration = Util.translation(ax, ay, az);
        }

        var frameCount = 0;
        function update(t, stage, flags) {
            frameCount++;

            if(mAcceleration)
                mVelocity = Util.multiply(mVelocity, mAcceleration);

            if(mVelocity)
                mModelView = Util.multiply(mModelView, mVelocity);

            if(flags & Config.flags.RENDER_SELECTED) {
                if(vActiveColor === vColor)
                    vActiveColor = vColor.slice(0);
                vActiveColor[0] = vColor[0] * Math.abs(Math.sin(t/500));
                vActiveColor[1] = vColor[1] * Math.abs(Math.sin(t/1800));
                vActiveColor[2] = vColor[2] * Math.abs(Math.sin(t/1000));
                vActiveColor[3] = vColor[3] * Math.abs(Math.sin(t/300));
                updateEditor(t, stage, flags);
            } else {
                vActiveColor = vColor
            }

        }

        var CHAR_SHIFT = 16;
        var lastKeyCount = 0;
        function updateEditor(t, stage, flags) {

            if(lastKeyCount < Config.input.keyEvents) {
                var noShift = Config.input.pressedKeys[CHAR_SHIFT] ? 0 : 1;
                lastKeyCount = Config.input.keyEvents;
                switch(Config.input.lastKey) {
                    case 39: // RIGHT:
                        moveEditorSelection(tileSize * noShift, 0, tileSize, 0);
                        break;
                    case 37: // LEFT
                        moveEditorSelection(-tileSize * noShift, 0, -tileSize, 0);
                        break;
                    case 40: // DOWN:
                        moveEditorSelection(0, tileSize * noShift, 0, tileSize);
                        break;
                    case 38: // UP:
                        moveEditorSelection(0, -tileSize * noShift, 0, -tileSize);
                        break;

                    case 78: // N:
                        changeEditorNextPixel();
                        break;

                    case 76: // L
                        changeEditorLastPixel();
                        break;

                    case 67: // C
                        copyEditorPixel();
                        break;

                    case 86: // V
                        pasteEditorPixel();
                        break;


                    default:
                        // console.log("Key Change", noShift, Config.input.lastKey);
                }
            }
        }

        function moveEditorSelection(vx, vy, vw, vh) {
            vActiveColorRange[0] += vx;
            vActiveColorRange[1] += vy;
            vActiveColorRange[2] += vw;
            vActiveColorRange[3] += vh;
            if(vActiveColorRange[0] < 0) vActiveColorRange[0] = 0;
            if(vActiveColorRange[1] < 0) vActiveColorRange[1] = 0;
            if(vActiveColorRange[2] <= tileSize) vActiveColorRange[2] = tileSize;
            if(vActiveColorRange[2] <= vActiveColorRange[0] + tileSize) vActiveColorRange[0] = vActiveColorRange[2] - tileSize;
            if(vActiveColorRange[3] <= tileSize) vActiveColorRange[3] = tileSize;
            if(vActiveColorRange[3] <= vActiveColorRange[1] + tileSize) vActiveColorRange[1] = vActiveColorRange[3] - tileSize;
        }

        function changeEditorNextPixel() {
            var toPixel = getEditorMapPixel(vActiveColorRange[0]/tileSize, vActiveColorRange[1]/tileSize);
            // Next Pixel in the row
            toPixel[0]++;
            if(toPixel[0]>255) {
                toPixel[0] = 0;
                toPixel[1]++;
                if(toPixel[1] > 255)
                    toPixel[1] = 0;
            }
            changeEditorPixel(toPixel);
        }

        function changeEditorLastPixel() {
            var toPixel = getEditorMapPixel(vActiveColorRange[0]/tileSize, vActiveColorRange[1]/tileSize);
            // Next Pixel in the row
            toPixel[0]--;
            if(toPixel[0]<0) {
                toPixel[0] = 255;
                toPixel[1]--;
                if(toPixel[1] < 0)
                    toPixel[1] = 255;
            }
            changeEditorPixel(toPixel);
        }

        function changeEditorPixel(toPixel) {
            for(var x=vActiveColorRange[0]; x<vActiveColorRange[2]; x+=tileSize) {
                for(var y=vActiveColorRange[1]; y<vActiveColorRange[3]; y+=tileSize) {
                    var pos = (x/tileSize)*4 + (y/tileSize)*4*levelMapSize[0];
                    levelMapData.data[pos+0] = toPixel[0];
                    levelMapData.data[pos+1] = toPixel[1];
                    levelMapData.data[pos+2] = toPixel[2];
                    levelMapData.data[pos+3] = toPixel[3];
                }
            }

            // Upload the image into the texture.
            gl.bindTexture(gl.TEXTURE_2D, tLevelMap);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, levelMapData);
        }

        var pixelCache;
        function copyEditorPixel() {
            var w = (vActiveColorRange[2] - vActiveColorRange[0]) / tileSize;
            var h = (vActiveColorRange[3] - vActiveColorRange[1]) / tileSize;
            pixelCache = new ImageData(w, h);
            var i = 0;
            for(var x=vActiveColorRange[0]; x<vActiveColorRange[2]; x+=tileSize) {
                for(var y=vActiveColorRange[1]; y<vActiveColorRange[3]; y+=tileSize) {
                    var pos = (x/tileSize)*4 + (y/tileSize)*4*levelMapSize[0];
                    pixelCache.data[i++] = levelMapData.data[pos+0];
                    pixelCache.data[i++] = levelMapData.data[pos+1];
                    pixelCache.data[i++] = levelMapData.data[pos+2];
                    pixelCache.data[i++] = levelMapData.data[pos+3];
                }
            }
            console.log("Copied: ", pixelCache);
        }

        function pasteEditorPixel() {
            if(!pixelCache)
                throw new Error("No pixel cache");

            var dx = vActiveColorRange[0] / tileSize;
            var dy = vActiveColorRange[1] / tileSize;
            var w = (vActiveColorRange[2] - vActiveColorRange[0]) / tileSize;
            if(pixelCache.width < w) w = pixelCache.width;
            var h = (vActiveColorRange[3] - vActiveColorRange[1]) / tileSize;
            if(pixelCache.height < h) h = pixelCache.height;

            for(var x=0; x<w; x++) {
                for(var y=0; y<h; y++) {
                    var pos = x*4 + y*4*pixelCache.width;
                    var dpos = (x+dx)*4 + (y+dy)*4*levelMapSize[0];

                    levelMapData.data[dpos+0] = pixelCache.data[pos+0];
                    levelMapData.data[dpos+1] = pixelCache.data[pos+1];
                    levelMapData.data[dpos+2] = pixelCache.data[pos+2];
                    levelMapData.data[dpos+3] = pixelCache.data[pos+3];
                }
            }

            // Upload the image into the texture.
            gl.bindTexture(gl.TEXTURE_2D, tLevelMap);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, levelMapData);
            console.log("Pasted: ", pixelCache);
        }

        function getEditorMapPixel(x, y) {
            var pos = x*4 + y*4*levelMapSize[0];
            return levelMapData.data.slice(pos, pos+4);
        }



        function initProgram(gl) {

            // Init Program
            var program = Util.compileProgram(gl, TileMap.VS, TileMap.FS);
            gl.useProgram(program);

            // Enable Vertex Position Attribute.
            aVertexPosition = gl.getAttribLocation(program, "aVertexPosition");
            gl.enableVertexAttribArray(aVertexPosition);

            // Enable Texture Position Attribute.
            aTextureCoordinate = gl.getAttribLocation(program, "aTextureCoordinate");
            gl.enableVertexAttribArray(aTextureCoordinate);

            // Lookup Uniforms
            uPMatrix = gl.getUniformLocation(program, "uPMatrix");
            uMVMatrix = gl.getUniformLocation(program, "uMVMatrix");
            uMapSize = gl.getUniformLocation(program, "uMapSize");
            uTileSheet = gl.getUniformLocation(program, "uTileSheet");
            uLevelMap = gl.getUniformLocation(program, "uLevelMap");
            uTileSize = gl.getUniformLocation(program, "uTileSize");
            uColor = gl.getUniformLocation(program, "uColor");
            uColorRange = gl.getUniformLocation(program, "uColorRange");
            uInverseTileSize = gl.getUniformLocation(program, "uInverseTileSize");
            uInverseTileTextureSize = gl.getUniformLocation(program, "uInverseTileTextureSize");
            uInverseSpriteTextureSize = gl.getUniformLocation(program, "uInverseSpriteTextureSize");

            gl.uniform1f(uTileSize, tileSize);
            gl.uniform1f(uInverseTileSize, 1/tileSize);

            // Create a Vertex Position Buffer.
            bufVertexPosition = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, bufVertexPosition);
            gl.bufferData(gl.ARRAY_BUFFER, defaultVertexPositions, gl.STATIC_DRAW);

            // Create a Texture Coordinates Buffer
            bufTextureCoordinate = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, bufTextureCoordinate);
            gl.bufferData(gl.ARRAY_BUFFER, mTextureCoordinates, gl.STATIC_DRAW);

            // use texture unit 0
            gl.activeTexture(gl.TEXTURE0 + 0);

            // bind to the TEXTURE_2D bind point of texture unit 0
            // gl.bindTexture(gl.TEXTURE_2D, tTileSheet);

            PROGRAM = program;
        }

    }

    // Static


    TileMap.FLAG_GENERATE_MIPMAP = 0x01;
    TileMap.FLAG_REPEAT_TILES = 0x10;
    TileMap.FLAG_REPEAT_MAP = 0x20;
    TileMap.FLAG_DEFAULTS = 0x10; // TileMap.FLAG_GENERATE_MIPMAP;

    var defaultModelViewMatrix = Util.translation(0,0,0); //[1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    var defaultColor = new Float32Array([1,1,1,1]);


    // Put a unit quad in the buffer
    var defaultVertexPositions = new Float32Array([
        0, 0,
        0, 1,
        1, 0,
        1, 0,
        0, 1,
        1, 1,
    ]);

    // Put texcoords in the buffer
    var defaultTextureCoordinates = new Float32Array([
        0, 0,
        0, 1,
        1, 0,
        1, 0,
        0, 1,
        1, 1,
    ]);

    // Texture Program

    var aVertexPosition, bufVertexPosition;
    var aTextureCoordinate, bufTextureCoordinate;
    var uPMatrix, uMVMatrix, uMapSize, uLevelMap, uTileSheet, uTileSize, uInverseTileSize, uInverseTileTextureSize, uInverseSpriteTextureSize, uColor, uColorRange;

    // Shader
    TileMap.VS = [
        "attribute vec4 aVertexPosition;",
        "attribute vec2 aTextureCoordinate;",
        // "attribute vec4 aColor;",

        "varying vec2 vPixelCoordinate;",
        "varying vec2 vTextureCoordinate;",

        "uniform mat4 uPMatrix;",
        "uniform mat4 uMVMatrix;",
        "uniform vec2 uMapSize;",
        "uniform vec2 uInverseTileTextureSize;",
        "uniform float uInverseTileSize;",

        "void main(void) {",
        // "   vPixelCoordinate = (aTextureCoordinate * viewportSize) + viewOffset;",
        "   vPixelCoordinate = aTextureCoordinate * uMapSize;",
        "   vTextureCoordinate = vPixelCoordinate * uInverseTileTextureSize * uInverseTileSize;",
        "   gl_Position = uPMatrix * uMVMatrix * aVertexPosition;",
        // "   vColor = aColor;",
        // "   gl_Position = aVertexPosition;",
        "}"
    ].join("\n");

    TileMap.FS = [
        "precision highp float;",

        "varying vec2 vPixelCoordinate;",
        "varying vec2 vTextureCoordinate;",
        // "varying vec4 vColor;",

        "uniform sampler2D uLevelMap;",
        "uniform sampler2D uTileSheet;",
        "uniform vec4 uColor;",
        "uniform vec4 uColorRange;",

        "uniform vec2 uInverseTileTextureSize;",
        "uniform vec2 uInverseSpriteTextureSize;",
        "uniform float uTileSize;",
        // "uniform int repeatTiles;",

        "void main(void) {",
        // "   if(repeatTiles == 0 && (vTextureCoordinate.x < 0.0 || vTextureCoordinate.x > 1.0 || vTextureCoordinate.y < 0.0 || vTextureCoordinate.y > 1.0)) { discard; }",
        "   vec4 tile = texture2D(uLevelMap, vTextureCoordinate);",
        "   if(tile.x == 1.0 && tile.y == 1.0) { discard; }",
        "   vec2 spriteOffset = floor(tile.xy * 256.0) * uTileSize;", // xy = rg
        "   vec2 spriteCoord = mod(vPixelCoordinate, uTileSize);",
        "   vec4 sprite = texture2D(uTileSheet, (spriteOffset + spriteCoord) * uInverseSpriteTextureSize);", //  * vColor
        "   sprite.w *= tile.w;", //  * vColor
        // "   if(tile.x > uColorRange.x && tile.y > uColorRange.y && tile.x < uColorRange.z && tile.y < uColorRange.w)",
        "   if(vPixelCoordinate.x >= uColorRange.x && vPixelCoordinate.y >= uColorRange.y && vPixelCoordinate.x <= uColorRange.z && vPixelCoordinate.y <= uColorRange.w)",
        "       sprite *= uColor;", //  * vColor
        "   gl_FragColor = sprite;", //  * vColor
        // "    gl_FragColor = texture2D(uTileSheet, vTextureCoordinate);",
// "   gl_FragColor = tile;",
        "}"
    ].join("\n");

})();
