/**
 * Created by Ari on 12/30/2016.
 */

(function() {
    var Config = window.games.game1;
    var Util = Config.util;
    Config.fragment.HeightMap = HeightMap;
    var PIXELS_PER_UNIT = Config.constants.PIXELS_PER_UNIT;

    var PROGRAM;

    function HeightMap(gl, pathTextures, flags, pixelsPerUnit, mPosition, mVelocity, mAcceleration, vColor) {
        if(typeof flags === 'undefined')
            flags = HeightMap.FLAG_DEFAULTS;

        if(!Array.isArray(pathTextures))
            pathTextures = [pathTextures];

        // Variables
        var THIS =              this;
        pixelsPerUnit =         pixelsPerUnit || PIXELS_PER_UNIT;
        mPosition =             mPosition || [0, 0, 0];
        var mModelView =        defaultModelViewMatrix;
        vColor =                vColor || defaultColor;
        var vActiveColor =      vColor.slice(0);
        var vActiveColorRange = [0,0];

        // Set up private properties
        var mVertexPosition = getVertexPositions(1, 1);
        var mTextureCoordinates = defaultTextureCoordinates;
        var textures = [];
        var HeightMapData, idLevelMapData, levelMapSize = [1,1];


        mModelView = Util.scale(mModelView, 500, 15, 1);

        // Initiate Shader program
        if(!PROGRAM)
            initProgram(gl);

        for(var i=0; i<pathTextures.length; i++)
            loadTexture(pathTextures[i]);


        // Functions

        this.render = function(t, gl, stage, flags) {

            // Update
            this.update(t, stage, flags);

            // Render
            gl.useProgram(PROGRAM);

            // Bind Vertex Coordinate
            gl.bindBuffer(gl.ARRAY_BUFFER, bufVertexPosition);
            gl.bufferData(gl.ARRAY_BUFFER, mVertexPosition, gl.DYNAMIC_DRAW);
            gl.vertexAttribPointer(aVertexPosition, 2, gl.FLOAT, false, 0, 0);


            // Bind Texture Coordinate
            gl.bindBuffer(gl.ARRAY_BUFFER, bufTextureCoordinate);
            gl.bufferData(gl.ARRAY_BUFFER, mTextureCoordinates, gl.DYNAMIC_DRAW);
            gl.vertexAttribPointer(aTextureCoordinate, 2, gl.FLOAT, false, 0, 0);


            // Set the projection and viewport.
            gl.uniformMatrix4fv(uPMatrix, false, stage.mProjection);
            gl.uniformMatrix4fv(uMVMatrix, false, mModelView);
            // gl.uniform2fv(uMapSize, mMapSize);
            gl.uniform4fv(uColor, vActiveColor);
            gl.uniform4fv(uColorRange, vActiveColorRange);


            // gl.uniform2fv(uInverseSpriteTextureSize, inverseTextureSize);
            // gl.uniform2fv(uInverseTileTextureSize, inverseTileTextureSize);



            // Tell the shader to get the tile sheet from texture unit 0
            gl.activeTexture(gl.TEXTURE0);
            gl.uniform1i(uTexture0, 0);
            gl.bindTexture(gl.TEXTURE_2D, textures[0]);

            // Tell the shader to get the level map from texture unit 0
            // gl.activeTexture(gl.TEXTURE1);
            // gl.uniform1i(uLevelMap, 1);
            // gl.bindTexture(gl.TEXTURE_2D, tLevelMap);

            for(var i=20; i>0; i--) {
                gl.uniformMatrix4fv(uMVMatrix, false, Util.translate(mModelView, 0, 0, -0.5*i));
                gl.drawArrays(gl.TRIANGLES, 0, 6);
            }

            gl.uniformMatrix4fv(uMVMatrix, false, mModelView);
            // draw the quad (2 triangles, 6 vertices)
            gl.drawArrays(gl.TRIANGLES, 0, 6);

        };

        var frameCount = 0;
        this.update = function(t, stage, flags) {
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
                THIS.updateEditor(t, stage, flags);
            } else {
                vActiveColor = vColor
            }

        };

        // Map Data

        this.getTilePixel = function(x, y) {
            if(x < 0 || y < 0 || x > levelMapSize[0] || y > levelMapSize[1])
                return null;
            var pos = (x+y*levelMapSize[0])*4;
            return idLevelMapData.data.slice(pos, pos+4);
        };

        this.getPixel = function(x, y) {
            var lx = Math.floor(x/tileSize);
            var ly = Math.floor(y/tileSize);
            if(lx < 0 || ly < 0 || lx > levelMapSize[0] || ly > levelMapSize[1])
                return null;
            var tpixel = this.getTilePixel(lx, ly);
            if(!tpixel || tpixel[2] === 0)
                return tpixel;

            var tx = (tpixel[0]*tileSize) + (x%tileSize);
            var ty = (tpixel[1]*tileSize) + (y%tileSize);
            var tpos = (tx+ty*HeightMapData.width)*4;
            return HeightMapData.data.slice(tpos, tpos+4);
        };

        this.testHit = function(x, y, z) {
            if(z !== mPosition[2] || !idLevelMapData)
                return null;
            
            var tx = Math.round((x - mPosition[0])/tileSize * pixelsPerUnit);
            var ty = Math.round(-(y - mPosition[1])/tileSize * pixelsPerUnit);
            // console.log("Test Hit: ", x, y, ' => ', px, py, this.getPixel(px, py));
            var tpixel = this.getTilePixel(tx, ty);
            if(!tpixel || tpixel[2] < 128)
                return null;

            var px = (tpixel[0]*tileSize) + (tx%tileSize);
            var py = (tpixel[1]*tileSize) + (ty%tileSize);
            var tpos = (px+py*HeightMapData.width)*4;
            var pixel = HeightMapData.data.slice(tpos, tpos+4);
            if(pixel[3] < 200)
                return null;
            return pixel;
        };

        // Editor

        this.saveEditorMap = function(left, top, width, height) {
            if(typeof left === 'undefined') left = 0;
            if(typeof top === 'undefined') top = 0;
            if(typeof width === 'undefined') width = iLevelMap.width;
            if(typeof height === 'undefined') height = iLevelMap.height;

            Util.assetSavePNG(pathLevelMap, idLevelMapData.data, left, top, width, height);
        };

        this.setEditorSelection = function(left, top, right, bottom) {
            if(left < 0) left = 0;
            if(top < 0) top = 0;
            if(right > levelMapSize[0]) right = levelMapSize[0];
            if(bottom > levelMapSize[1]) bottom = levelMapSize[1];
            if(left >= right) right = left+1;
            if(top >= bottom) bottom = top+1;
            vActiveColorRange = [tileSize*left, tileSize*top, tileSize*right, tileSize*bottom];
            return [left, top, right, bottom];
        };

        this.changeEditorPixel = function(toPixel) {
            var left = vActiveColorRange[0] / tileSize;
            var top = vActiveColorRange[1] / tileSize;
            var width = (vActiveColorRange[2] - vActiveColorRange[0]) / tileSize;
            var height = (vActiveColorRange[3] - vActiveColorRange[1]) / tileSize;

            var ppos = 0;
            for(var y=top; y<top+height; y++) {
                for(var x=left; x<left+width; x++) {
                    var pos = (x)*4 + (y)*4*levelMapSize[0];
                    idLevelMapData.data[pos+0] = toPixel[ppos+0];
                    idLevelMapData.data[pos+1] = toPixel[ppos+1];
                    idLevelMapData.data[pos+2] = toPixel[ppos+2];
                    idLevelMapData.data[pos+3] = toPixel[ppos+3];
                    ppos+=4;
                    if(ppos >= toPixel.length)
                        ppos = 0;
                }
            }

            // Upload the image into the texture.
            gl.bindTexture(gl.TEXTURE_2D, tLevelMap);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, idLevelMapData);
        };


        // Model/View

        this.setVelocity = function(vx, vy, vz) {
            mVelocity = Util.translation(vx, vy, vz);
        };

        this.setAcceleration = function(ax, ay, az) {
            if(!mVelocity)
                setVelocity(0,0,0);
            mAcceleration = Util.translation(ax, ay, az);
        };

        this.move = function(tx, ty, tz) {
            mPosition[0] += tx || 0;
            mPosition[1] += ty || 0;
            mPosition[2] += tz || 0;
            this.reset();
            console.log("Set Level Position: ", mPosition);
        };

        this.moveTo = function(x, y, z) {
            mPosition = [x || 0, y || 0, z || 0];
            this.reset();
            console.log("Set Level Position: ", mPosition);
        };


        this.reset = function() {
            mModelView = defaultModelViewMatrix;
            var sx = 1000; // iLevelMap.width * tileSize / (pixelsPerUnit);
            var sy = 100; // iLevelMap.height * tileSize / (pixelsPerUnit);
            mModelView = Util.translate(mModelView, mPosition[0], mPosition[1], mPosition[2]);
            mModelView = Util.scale(mModelView, sx * 2, sy * 2, 1);
            console.log("Set Level Scale: ", sx, sy);
        };

        // Textures

        function loadTexture(pathTexture) {

            // Create a tile sheet texture.
            var texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);

            // Fill the texture with a 1x1 blue pixel.
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                new Uint8Array([0, 256, 0, 128]));

            // Asynchronously load the spritesheet
            var image = new Image();
            image.src = pathTexture;
            image.addEventListener('load', onLoadTexture);
            texture.srcImage = image;

            textures.push(texture);

            function onLoadTexture(e) {
                // Now that the image has loaded make copy it to the texture.
                gl.bindTexture(gl.TEXTURE_2D, texture);
                // Upload the image into the texture.
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

                texture.srcImage = image;


                // Set the parameters so we can render any size image.

                if(flags & HeightMap.FLAG_REPEAT_TILES) {
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
                } else {
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                }


                if(flags & HeightMap.FLAG_GENERATE_MIPMAP) {
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                    gl.generateMipmap(gl.TEXTURE_2D);
                } else {
                    // MUST be filtered with NEAREST or tile lookup fails
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                }
            }

        }

        // Init

        function getVertexPositions(sx, sy) {
            sx /= 2;
            sy /= 2;

            // Put a unit quad in the buffer
            return new Float32Array([
                -0, 0,
                -0, sy,
                sx, 0,
                sx, 0,
                -0, sy,
                sx, sy,
            ]);
        }

        function initProgram(gl) {

            // Init Program
            var program = Util.compileProgram(gl, HeightMap.VS, HeightMap.FS);
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

            uTexture0 = gl.getUniformLocation(program, "uTexture0");
            uTexture1 = gl.getUniformLocation(program, "uTexture1");
            uTexture2 = gl.getUniformLocation(program, "uTexture2");
            uTexture3 = gl.getUniformLocation(program, "uTexture3");

            // uLevelMap = gl.getUniformLocation(program, "uLevelMap");
            uColor = gl.getUniformLocation(program, "uColor");
            uColorRange = gl.getUniformLocation(program, "uColorRange");

            // Create a Vertex Position Buffer.
            bufVertexPosition = gl.createBuffer();

            // bufVertexPosition = gl.createBuffer();
            // gl.bindBuffer(gl.ARRAY_BUFFER, bufVertexPosition);
            // gl.bufferData(gl.ARRAY_BUFFER, defaultVertexPositions, gl.STATIC_DRAW);


            // Create a Texture Coordinates Buffer
            bufTextureCoordinate = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, bufTextureCoordinate);
            gl.bufferData(gl.ARRAY_BUFFER, defaultTextureCoordinates, gl.STATIC_DRAW);

            // use texture unit 0
            gl.activeTexture(gl.TEXTURE0 + 0);

            // bind to the TEXTURE_2D bind point of texture unit 0
            // gl.bindTexture(gl.TEXTURE_2D, tTileSheet);

            PROGRAM = program;
        }

    }

    // Static

    var lastKeyCount = 0;
    HeightMap.prototype.updateEditor = function(t, stage, flags) {

        // Press-once keys
        if(lastKeyCount < Config.input.keyEvents) {
            lastKeyCount = Config.input.keyEvents;
            console.log("Editor not enabled");
        }
    };


    HeightMap.FLAG_GENERATE_MIPMAP = 0x01;
    HeightMap.FLAG_REPEAT_TILES = 0x10;
    HeightMap.FLAG_REPEAT_MAP = 0x20;
    HeightMap.FLAG_DEFAULTS = 0x10; // HeightMap.FLAG_GENERATE_MIPMAP;

    var defaultModelViewMatrix = Util.translation(0,0,0); //[1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    var defaultColor = new Float32Array([1,1,1,1]);


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
    var uPMatrix, uMVMatrix, uMapSize, uLevelMap, uTexture0, uTexture1, uTexture2, uTexture3, uTileSize, uInverseTileSize, uInverseTileTextureSize, uInverseSpriteTextureSize, uColor, uColorRange;

    // Shader
    HeightMap.VS = [
        "attribute vec4 aVertexPosition;",
        "attribute vec2 aTextureCoordinate;",
        // "attribute vec4 aColor;",

        // "varying vec2 vPixelCoordinate;",
        "varying vec2 vTextureCoordinate;",

        "uniform mat4 uPMatrix;",
        "uniform mat4 uMVMatrix;",
        "uniform vec2 uMapSize;",
        "uniform vec2 uInverseTileTextureSize;",
        "uniform float uInverseTileSize;",

        "void main(void) {",
        "   vTextureCoordinate = aTextureCoordinate;",
        "   gl_Position = uPMatrix * uMVMatrix * aVertexPosition;",
        // "   vColor = aColor;",
        "}"
    ].join("\n");

    HeightMap.FS = [
        "precision highp float;",

        // "varying vec2 vPixelCoordinate;",
        "varying vec2 vTextureCoordinate;",

        "uniform sampler2D uTexture0;",
        "uniform sampler2D uTexture1;",
        "uniform sampler2D uTexture2;",
        "uniform sampler2D uTexture3;",

        "uniform vec4 uColor;",
        "uniform vec4 uColorRange;",


        "vec2 textureSize = vec2(64.0, 32.0);",

        "vec4 getValueFromTexture(float index) {",
        "   index *= textureSize.x * textureSize.y;",
        "   float column = mod(index, textureSize.x);",
        "   float row    = floor(index / textureSize.x);",
        "   vec2 uv = vec2(",
        "       (column + 0.5) / textureSize.x,",
        "       (row    + 0.5) / textureSize.y);",
        "   return texture2D(uTexture0, uv);",
        "}",


        "void main(void) {",
        "   vec4 pxHeight = getValueFromTexture(vTextureCoordinate.x);",

        // "   if(tile.z == 0.00) { discard; }",
        "   if(vTextureCoordinate.y > pxHeight.w) { discard; }",
        "   pxHeight.w = 1.00;", // (pxHeight.w - vTextureCoordinate.y) { discard; }",

        // "   sprite.w *= tile.w;", //  * vColor
        // "   if(tile.x > uColorRange.x && tile.y > uColorRange.y && tile.x < uColorRange.z && tile.y < uColorRange.w)",
        // "   if(vPixelCoordinate.x >= uColorRange.x && vPixelCoordinate.y >= uColorRange.y && vPixelCoordinate.x <= uColorRange.z && vPixelCoordinate.y <= uColorRange.w)",
        // "       sprite *= uColor;", //  * vColor


        "   gl_FragColor = pxHeight;", //  * vColor
        // "    gl_FragColor = texture2D(uTileSheet, vTextureCoordinate);",
// "   gl_FragColor = tile;",
        "}"
    ].join("\n");

})();


// "uniform int repeatTiles;",

// TODO: allow multiple arrays + offset, allow them each to repeat, no color arrays,
// SOL: array of data + array of settings, loop one offset array + data array + color array?
// SOL2: need to use textures for random access. repeat primary textures at different offsets. array of secondary texture positions?
// SOL3: Array of highmaps selects texture, repeat, breaks on -1, allow looped map; alternating map; etc

//         struct my_struct {
//             float r;
//     float g;
//     float b;
//     float a;
// };
//     uniform my_struct u_colors[2];

// Use a texture if you want random access to lots of data in a shader.
//
//     If you have 10000 values you might make a texture that's 100x100 pixels. you can then get each value from the texture with something like
//
// uniform sampler2D u_texture;
//
// vec2 textureSize = vec2(100.0, 100.0);
//
// vec4 getValueFromTexture(float index) {
//     float column = mod(index, textureSize.x);
//     float row    = floor(index / textureSize.x);
//     vec2 uv = vec2(
//         (column + 0.5) / textureSize.x,
//         (row    + 0.5) / textureSize.y);
//     return texture2D(u_texture, uv);
// }