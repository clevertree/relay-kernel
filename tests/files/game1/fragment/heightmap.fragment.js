/**
 * Created by Ari on 12/30/2016.
 */

(function() {
    var Config = window.games.game1;
    var Util = Config.util;
    Config.fragment.HeightMap = HeightMap;
    var PIXELS_PER_UNIT = Config.constants.PIXELS_PER_UNIT;

    var PROGRAM;

    function HeightMap(gl, pathTextures, mapLength, flags) {
        if(typeof flags === 'undefined')
            flags = HeightMap.FLAG_DEFAULTS;

        if(!Array.isArray(pathTextures))
            pathTextures = [pathTextures];



        // Variables
        var THIS =              this;
        var pixelsPerUnit =     PIXELS_PER_UNIT;
        mapLength =             mapLength || 9192;
        var mPosition =         [0, 0, 0];
        var mScale =            [128, 8, 1];
        var mModelView =        defaultModelViewMatrix;
        // vColor =             vColor || defaultColor;
        var vHighlightColor =   defaultColor.slice(0);
        var vHighlightRange =   [0,0];

        // Set up private properties
        var mVertexPosition = defaultTextureCoordinates;
        var mTextureCoordinates = defaultTextureCoordinates;
        var textures = [], vTextureSizes = [0, 0, 0, 0, 0, 0, 0, 0];


        mModelView = Util.scale(mModelView, mScale[0], mScale[1], mScale[2]);

        // Initiate Shader program
        if(!PROGRAM)
            initProgram(gl);

        for(var i=0; i<pathTextures.length; i++)
            loadTexture(pathTextures[i]);


        // Bind Texture Coordinate
        gl.bindBuffer(gl.ARRAY_BUFFER, bufTextureCoordinate);
        gl.bufferData(gl.ARRAY_BUFFER, mTextureCoordinates, gl.STATIC_DRAW);
        gl.vertexAttribPointer(aTextureCoordinate, 2, gl.FLOAT, false, 0, 0);

        // Bind Vertex Coordinate
        gl.bindBuffer(gl.ARRAY_BUFFER, bufVertexPosition);
        gl.bufferData(gl.ARRAY_BUFFER, mVertexPosition, gl.STATIC_DRAW);
        gl.vertexAttribPointer(aVertexPosition, 2, gl.FLOAT, false, 0, 0);

        // Functions

        this.render = function(t, gl, stage, flags) {

            // Update
            this.update(t, stage, flags);

            // Render
            gl.useProgram(PROGRAM);

            // gl.bindBuffer(gl.ARRAY_BUFFER, bufVertexPosition);
            // gl.bindBuffer(gl.ARRAY_BUFFER, bufTextureCoordinate);

            // Bind Vertex Coordinate
            gl.vertexAttribPointer(aVertexPosition, 2, gl.FLOAT, false, 0, 0);

            // Bind Texture Coordinate
            gl.vertexAttribPointer(aTextureCoordinate, 2, gl.FLOAT, false, 0, 0);


            // Set the projection and viewport.
            gl.uniformMatrix4fv(uPMatrix, false, stage.mProjection);
            gl.uniformMatrix4fv(uMVMatrix, false, mModelView);
            gl.uniform1f(uMapLength, mapLength);

            gl.uniform4fv(uHighlightColor, vHighlightColor);
            gl.uniform2fv(uHighlightRange, vHighlightRange);

            gl.uniform1fv(uTextureSize, vTextureSizes);


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

            // for(var i=20; i>0; i--) {
            //     gl.uniformMatrix4fv(uMVMatrix, false, Util.translate(mModelView, 0, 0, -0.5*i));
            //     gl.drawArrays(gl.TRIANGLES, 0, 6);
            // }

            // draw the quad (2 triangles, 6 vertices)
            gl.drawArrays(gl.TRIANGLES, 0, 6);

        };

        var frameCount = 0;
        this.update = function(t, stage, flags) {
            frameCount++;

            // if(mAcceleration)
            //     mVelocity = Util.multiply(mVelocity, mAcceleration);

            // if(mVelocity)
            //     mModelView = Util.multiply(mModelView, mVelocity);

            if(flags & Config.flags.RENDER_SELECTED) {
                vHighlightColor[0] = Math.abs(Math.sin(t/500));
                vHighlightColor[1] = Math.abs(Math.sin(t/1800));
                vHighlightColor[2] = Math.abs(Math.sin(t/1000));
                vHighlightColor[3] = Math.abs(Math.sin(t/600)/2)+0.3;
                updateEditor(t, stage, flags);
            } else {
                // vActiveColor = vColor
            }

        };

        // Properties

        this.getMapLength = function()                      { return mapLength; };
        this.getMapSize = function()                        { return mapSize; };
        this.setMapSize = function(newLength, newHeight)    { mapSize = [newLength, newHeight]; };
        this.getHighlightRange = function()         { return vHighlightRange; };
        this.setHighlightRange = function(left, right) {
            if(left < 0 || left > mapLength) left = 0;
            if(right <= left) right = left+1;
            else if(right > mapLength) right = mapLength;
            vHighlightRange = [left, right];
        };

        // Map Data

        this.testHit = function(x, y, z) {
            if(z !== mPosition[2])
                return null;

            var rx = x / mScale[0] - mPosition[0];
            if(rx < 0 || rx > 1)
                return null;
            var ry = y / mScale[1] - mPosition[1];
            if(ry < 0 || ry > 1)
                return null;

            var px = Math.floor(rx * mapLength);
            // var py = Math.floor(ry * mapSize[1]);
            var leftHeight = 0, rightHeight = 0;
            for(var i=0; i<textures.length; i++) {
                var texture = textures[i];
                if(!texture.heightMapData)
                    continue;
                leftHeight += texture.heightMapData[(px+0) % texture.heightMapData.length];
                rightHeight += texture.heightMapData[(px+1) % texture.heightMapData.length];
            }
            // console.log(rx, ry, px, leftHeight, rightHeight, leftHeight/256, rightHeight/256);

            return ry < (leftHeight+rightHeight)/(2);
            //
            // var ry = y / mScale[1] - mPosition[1];
            //
            // var tx = Math.round((x - mPosition[0])/tileSize * pixelsPerUnit);
            // var ty = Math.round(-(y - mPosition[1])/tileSize * pixelsPerUnit);
            // // console.log("Test Hit: ", x, y, ' => ', px, py, this.getPixel(px, py));
            // var tpixel = this.getTilePixel(tx, ty);
            // if(!tpixel || tpixel[2] < 128)
            //     return null;
            //
            // var px = (tpixel[0]*tileSize) + (tx%tileSize);
            // var py = (tpixel[1]*tileSize) + (ty%tileSize);
            // var tpos = (px+py*heightMapData.width)*4;
            // var pixel = heightMapData.data.slice(tpos, tpos+4);
            // if(pixel[3] < 200)
            //     return null;
            // return pixel;
        };
        // Model/View

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

        this.getTextures = function () { return textures; };

        this.updateTexture = function(texture, imageData) {

            // Upload the image into the texture.
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, imageData);

            var heightMapData = new Float32Array(imageData.data.length/4);

            for(var i=0; i<imageData.data.length; i+=4) {
                heightMapData[i/4] =
                    imageData.data[i+0]/256
                    + imageData.data[i+1]/(256*256)
                    + imageData.data[i+2]/(256*256*256);
//                    + imageData.data[i+3]*256*256*256)
//                     /(256*256*256);
            }

            texture.heightMapData = heightMapData;
//             console.log("Heightmap updated: ", imageData);
        };

        function loadTexture(pathTexture) {

            // Create a tile sheet texture.
            var texture = gl.createTexture();
            var textureID = textures.length;
            textures[textureID] = texture;
            texture.textureID = textureID;

            gl.bindTexture(gl.TEXTURE_2D, texture);

            // Fill the texture with a 1x1 blue pixel.
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                new Uint8Array([0, 256, 0, 128]));

            // Asynchronously load the spritesheet
            var image = new Image();
            image.srcRelative = pathTexture;
            image.src = pathTexture;
            image.addEventListener('load', onLoadTexture);
            texture.srcImage = image;

            function onLoadTexture(e) {

                var canvas = document.createElement('canvas');
                var mapContext = canvas.getContext('2d');
                mapContext.drawImage(image, 0, 0);
                var imageData = mapContext.getImageData(0, 0, image.width, image.height);

                texture.srcImage = image;
                vTextureSizes[textureID*2] = image.width;
                vTextureSizes[textureID*2 + 1] = image.height;

                THIS.updateTexture(texture, imageData);

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

        // Editor

        var updateEditor = function(t, stage, flags) {
            if(Config.fragment.editor.HeightMapEditor) {
                var editor = new Config.fragment.editor.HeightMapEditor(THIS);
                updateEditor = editor.update;
                updateEditor(t, stage, flags);
                THIS.editor = editor;
            }
        };

        // Init

        // function getVertexPositions(sx, sy) {
        //     sx /= 2;
        //     sy /= 2;
        //
        //     // Put a unit quad in the buffer
        //     return new Float32Array([
        //         -0, 0,
        //         -0, sy,
        //         sx, 0,
        //         sx, 0,
        //         -0, sy,
        //         sx, sy,
        //     ]);
        // }

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

            uMapLength = gl.getUniformLocation(program, "uMapLength");

            uTexture0 = gl.getUniformLocation(program, "uTexture0");
            uTexture1 = gl.getUniformLocation(program, "uTexture1");
            uTexture2 = gl.getUniformLocation(program, "uTexture2");
            uTexture3 = gl.getUniformLocation(program, "uTexture3");

            // uLevelMap = gl.getUniformLocation(program, "uLevelMap");
            uHighlightColor = gl.getUniformLocation(program, "uHighlightColor");
            uHighlightRange = gl.getUniformLocation(program, "uHighlightRange");
            uTextureSize = gl.getUniformLocation(program, "uTextureSize");


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

    HeightMap.FLAG_GENERATE_MIPMAP = 0x01;
    HeightMap.FLAG_REPEAT_TILES = 0x10;
    HeightMap.FLAG_REPEAT_MAP = 0x20;
    HeightMap.FLAG_DEFAULTS = 0; //0x10; // HeightMap.FLAG_GENERATE_MIPMAP;

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
    var uPMatrix, uMVMatrix, uMapLength,
        uTexture0, uTexture1, uTexture2, uTexture3,
        uHighlightColor, uHighlightRange, uTextureSize;

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

        "uniform float uMapLength;",


        "uniform vec4 uHighlightColor;",
        "uniform vec2 uHighlightRange;",
        "uniform float uTextureSize[8] ;",

        "vec4 getHeightMapPixel(float index, sampler2D texture, float textureWidth, float textureHeight) {",
        // "   float index = vTextureCoordinate.x * textureWidth * textureSize.y;",
        "   float column = mod(index, textureWidth);",
        "   float row    = mod(floor(index / textureWidth), textureHeight);",
        "   vec2 uv = vec2(",
        "       (column + 0.5) / textureWidth,",
        "       (row    + 0.5) / textureHeight);",
        "   return texture2D(texture, uv);",
        "}",

        "void main(void) {",
        "   float index = vTextureCoordinate.x * uMapLength;",
        "   vec4 pxHeight = getHeightMapPixel(index, uTexture0, uTextureSize[0], uTextureSize[1]);",

        "   float height = pxHeight.x + pxHeight.y/256.0 + pxHeight.z/65536.0;",

        "   if(uTextureSize[2] > 0.0) { pxHeight += getHeightMapPixel(index, uTexture1, uTextureSize[2], uTextureSize[3]);",
        "       if(uTextureSize[4] > 0.0) { pxHeight += getHeightMapPixel(index, uTexture2, uTextureSize[4], uTextureSize[5]);",
        "           if(uTextureSize[6] > 0.0) { pxHeight += getHeightMapPixel(index, uTexture3, uTextureSize[6], uTextureSize[7]);",
        "   }}}",

        "   if(vTextureCoordinate.y > height) { discard; }",
        "   pxHeight.x = 1.0;",
        "   pxHeight.y = 1.0;",
        "   pxHeight.z = 1.0;",
        "   pxHeight.w = 1.0;",

        "   if(index >= uHighlightRange[0] && index <= uHighlightRange[1])",
        "       pxHeight.w = uHighlightColor.w;",

        "   gl_FragColor = pxHeight;", //  * vColor
        "}"
    ].join("\n");

})();


