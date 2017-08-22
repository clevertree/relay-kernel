/**
 * Created by Ari on 12/30/2016.
 */

(function() {
    var Config = window.games.game1;
    var Util = Config.util;
    Config.fragment.SpriteSheet = SpriteSheet;

    var PROGRAM;

    function SpriteSheet(gl, pathSpriteSheet, tileSizeX, tileSizeY, mModelView, glLineMode, mVelocity, mAcceleration) {
        // Init Render Mode
        glLineMode = glLineMode || 4; // gl.TRIANGLES;

        // Variables
        mModelView =            mModelView || defaultModelViewMatrix;

        // Set up object
        this.render =           render;
        this.update =           update;
        this.setVelocity =      setVelocity;
        this.setAcceleration =  setAcceleration;

        // Load Sprite Sheet Texture
        // var tilePos = [0, 0];
        var mTextureCoordinates = defaultTextureCoordinates;
        var tSpriteSheet = Util.loadTexture(gl, pathSpriteSheet, onLoadTexture);
        var iSpriteSheet = null;
        var rowCount = 1, colCount = 1;
        function onLoadTexture(e, texture, image) {
            iSpriteSheet = image;
            console.log("Sprite Sheet Texture Loaded: ", image, texture);

            rowCount = image.width / tileSizeX;
            if(rowCount % 1 !== 0) console.error("Sprite sheet width (" + image.width + ") is not divisible by " + tileSizeX);
            colCount = image.width / tileSizeY;
            if(colCount % 1 !== 0) console.error("Sprite sheet height (" + image.width + ") is not divisible by " + tileSizeY);

            setTilePosition(0, 0);
        }


        // Functions


        function render(elapsedTime, gl, stage) {
            if(!PROGRAM)
                initProgram(gl);

            // Update
            update(elapsedTime, stage);

            // Render
            gl.useProgram(PROGRAM);

            // Bind Vertex Coordinate
            gl.bindBuffer(gl.ARRAY_BUFFER, bufVertexPosition);
            gl.vertexAttribPointer(aVertexPosition, 2, gl.FLOAT, false, 0, 0);

            // Bind Texture Coordinate
            gl.bindBuffer(gl.ARRAY_BUFFER, bufTextureCoordinate);
            gl.vertexAttribPointer(aTextureCoordinate, 2, gl.FLOAT, false, 0, 0);

            // Set the projection and viewport.
            gl.uniformMatrix4fv(uPMatrix, false, stage.mProjection || defaultProjectionMatrix);
            gl.uniformMatrix4fv(uMVMatrix, false, mModelView);

            // Tell the shader to get the texture from texture unit 0
            gl.uniform1i(uSampler, 0);

            // draw the quad (2 triangles, 6 vertices)
            gl.drawArrays(glLineMode, 0, 6);
        }

        /**
         *
         * @param x
         * @param y
         * 0,0 => 0,0 256,256
         * 1,1 => 256,256, 512, 512
         */
        function setTilePosition(x, y) {
            // tilePos = [x, y];
            var tx = tileSizeX / iSpriteSheet.width;
            var ty = tileSizeY / iSpriteSheet.height;
            mTextureCoordinates = new Float32Array([
                (x+0)*tx,       (y+1)*ty,
                (x+0)*tx,       (y+0)*ty,
                (x+1)*tx,   (y+1)*ty,
                (x+1)*tx,   (y+1)*ty,
                (x+0)*tx,       (y+0)*ty,
                (x+1)*tx,   (y+0)*ty,
            ]);
            gl.bindBuffer(gl.ARRAY_BUFFER, bufTextureCoordinate);
            gl.bufferData(gl.ARRAY_BUFFER, mTextureCoordinates, gl.STATIC_DRAW);
        }

        function setVelocity(vx, vy, vz) {
            mVelocity = Util.translation(vx, vy, vz);
        }

        function setAcceleration(ax, ay, az) {
            if(!mVelocity)
                setVelocity(0,0,0);
            mAcceleration = Util.translation(ax, ay, az);
        }

        function update(elapsedTime, stage) {
            if(mAcceleration)
                mVelocity = Util.multiply(mVelocity, mAcceleration);

            if(mVelocity)
                mModelView = Util.multiply(mModelView, mVelocity);
        }

        function initProgram(gl) {

            // Init Program
            var program = Util.compileProgram(gl, SpriteSheet.VS, SpriteSheet.FS);

            // Enable Vertex Position Attribute.
            aVertexPosition = gl.getAttribLocation(program, "aVertexPosition");
            gl.enableVertexAttribArray(aVertexPosition);

            // Enable Texture Position Attribute.
            aTextureCoordinate = gl.getAttribLocation(program, "aTextureCoordinate");
            gl.enableVertexAttribArray(aTextureCoordinate);

            // Lookup Uniforms
            uPMatrix = gl.getUniformLocation(program, "uPMatrix");
            uMVMatrix = gl.getUniformLocation(program, "uMVMatrix");
            uSampler = gl.getUniformLocation(program, "uSampler");

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
            gl.bindTexture(gl.TEXTURE_2D, tSpriteSheet);

            PROGRAM = program;
        }
    }

    // Static

    SpriteSheet.loadSpriteSheet = function (gl, sheetPath, tileSize) {
        var texture = Util.loadTexture(gl, sheetPath, onLoad);
        var SpriteSheet = new SpriteSheet(texture, null, null, null, null, tileSize);
        function onLoad(e, texture, image) {
            SpriteSheet.setTilePosition()
        }

        return SpriteSheet;
    };

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
    var uPMatrix, uMVMatrix, uSampler;

    SpriteSheet.VS = [
        "attribute vec4 aVertexPosition;",
        "attribute vec2 aTextureCoordinate;",

        "uniform mat4 uPMatrix;",
        "uniform mat4 uMVMatrix;",

        "varying vec2 vTextureCoordinate;",

        "void main() {",
        "    gl_Position = uPMatrix * uMVMatrix * aVertexPosition;",
        "    vTextureCoordinate = aTextureCoordinate;",
        "}"
    ].join("\n");

    SpriteSheet.FS = [
        "precision mediump float;",

        "uniform sampler2D uSampler;",

        "varying vec2 vTextureCoordinate;",

        "void main() {",
        "    gl_FragColor = texture2D(uSampler, vTextureCoordinate);",
        "}"
    ].join("\n");

})();

