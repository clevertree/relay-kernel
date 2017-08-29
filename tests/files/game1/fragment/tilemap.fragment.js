/**
 * Created by Ari on 12/30/2016.
 */

(function() {
    var Config = window.games.game1;
    var Util = Config.util;
    Config.fragment.TileMap = TileMap;

    var PROGRAM;

    function TileMap(gl, pathLevelMap, pathTileSheet, tileSize, flags, mModelView, mVelocity, mAcceleration) {
        if(typeof flags === 'undefined')
            flags = TileMap.FLAG_DEFAULTS;

        // Variables
        mModelView =            mModelView || defaultModelViewMatrix;

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
        var mMapSize = [1,1];

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

            inverseTileTextureSize = [1 / iLevelMap.width, 1 / iLevelMap.height];
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


        function render(elapsedTime, gl, stage) {

            // Update
            update(elapsedTime, stage);

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
            gl.uniformMatrix4fv(uPMatrix, false, stage.mProjection || defaultProjectionMatrix);
            gl.uniformMatrix4fv(uMVMatrix, false, mModelView);
            gl.uniform2fv(uMapSize, mMapSize);
            mMapSize[0]+=10; mMapSize[1]+=10;
            mMapSize[0]+=10; mMapSize[1]+=10;



            // gl.enableVertexAttribArray(shader.attribute.position);
            // gl.enableVertexAttribArray(shader.attribute.texture);
            // gl.vertexAttribPointer(shader.attribute.position, 2, gl.FLOAT, false, 16, 0);
            // gl.vertexAttribPointer(shader.attribute.texture, 2, gl.FLOAT, false, 16, 8);

            // gl.uniform2fv(shader.uniform.viewportSize, this.scaledViewportSize);
            // gl.uniform2fv(shader.uniform.inverseSpriteTextureSize, this.inverseSpriteTextureSize);
            // gl.uniform1f(shader.uniform.tileSize, this.tileSize);
            // gl.uniform1f(shader.uniform.uInverseTileSize, 1/this.tileSize);





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

        var frameCount = 0; var sinceLastFrame = 0;
        function update(elapsedTime, stage) {
            frameCount++;

            if(mAcceleration)
                mVelocity = Util.multiply(mVelocity, mAcceleration);

            if(mVelocity)
                mModelView = Util.multiply(mModelView, mVelocity);
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

    var defaultModelViewMatrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1.5, 0, -7, 1];
    var defaultProjectionMatrix = [2.4142136573791504, 0, 0, 0, 0, 2.4142136573791504, 0, 0, 0, 0, -1.0020020008087158, -1, 0, 0, -0.20020020008087158, 0];


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
    var uPMatrix, uMVMatrix, uMapSize, uLevelMap, uTileSheet, uTileSize, uInverseTileSize, uInverseTileTextureSize, uInverseSpriteTextureSize;

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
        "   gl_FragColor = sprite;", //  * vColor
        // "    gl_FragColor = texture2D(uTileSheet, vTextureCoordinate);",
// "   gl_FragColor = tile;",
        "}"
    ].join("\n");

})();



// "precision highp float;
// attribute vec2 aVertexPosition;
// attribute vec2 aTextureCoord;
// attribute vec4 aColor;
// attribute float aTextureId;
//
// uniform mat3 projectionMatrix;
//
// varying vec2 vTextureCoord;
// varying vec4 vColor;
// varying float vTextureId;
//
// void main(void){
//     gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
//
//     vTextureCoord = aTextureCoord;
//     vTextureId = aTextureId;
//     vColor = aColor;
// }
// "
//
//
//
//
// "precision mediump float;
// varying vec2 vTextureCoord;
// varying vec4 vColor;
// varying float vTextureId;
// uniform sampler2D uSamplers[16];
// void main(void){
//     vec4 color;
//     float textureId = floor(vTextureId+0.5);
//
//
//     if(textureId == 0.0)
//     {
//         color = texture2D(uSamplers[0], vTextureCoord);
//     }
//     else if(textureId == 1.0)
//     {
//         color = texture2D(uSamplers[1], vTextureCoord);
//     }
//     else if(textureId == 2.0)
//     {
//         color = texture2D(uSamplers[2], vTextureCoord);
//     }
//     else if(textureId == 3.0)
//     {
//         color = texture2D(uSamplers[3], vTextureCoord);
//     }
//     else if(textureId == 4.0)
//     {
//         color = texture2D(uSamplers[4], vTextureCoord);
//     }
//     else if(textureId == 5.0)
//     {
//         color = texture2D(uSamplers[5], vTextureCoord);
//     }
//     else if(textureId == 6.0)
//     {
//         color = texture2D(uSamplers[6], vTextureCoord);
//     }
//     else if(textureId == 7.0)
//     {
//         color = texture2D(uSamplers[7], vTextureCoord);
//     }
//     else if(textureId == 8.0)
//     {
//         color = texture2D(uSamplers[8], vTextureCoord);
//     }
//     else if(textureId == 9.0)
//     {
//         color = texture2D(uSamplers[9], vTextureCoord);
//     }
//     else if(textureId == 10.0)
//     {
//         color = texture2D(uSamplers[10], vTextureCoord);
//     }
//     else if(textureId == 11.0)
//     {
//         color = texture2D(uSamplers[11], vTextureCoord);
//     }
//     else if(textureId == 12.0)
//     {
//         color = texture2D(uSamplers[12], vTextureCoord);
//     }
//     else if(textureId == 13.0)
//     {
//         color = texture2D(uSamplers[13], vTextureCoord);
//     }
//     else if(textureId == 14.0)
//     {
//         color = texture2D(uSamplers[14], vTextureCoord);
//     }
//     else
//     {
//         color = texture2D(uSamplers[15], vTextureCoord);
//     }
//
//
//     gl_FragColor = color * vColor;
// }"
