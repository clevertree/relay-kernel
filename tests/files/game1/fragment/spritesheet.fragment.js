/**
 * Created by Ari on 12/30/2016.
 */

(function() {
    var Config = window.games.game1;
    var Util = Config.util;
    Config.fragment.SpriteSheet = SpriteSheet;

    var PROGRAM;

    function SpriteSheet(gl, pathSpriteSheet, tileSizeX, tileSizeY, frameRate, flags, vColor, mModelView, glLineMode, mVelocity, mAcceleration) {
        if(typeof flags === 'undefined') flags = SpriteSheet.FLAG_DEFAULTS;
        if(typeof frameRate === 'undefined') frameRate = (1/20 * 1000);

        // Init Render Mode
        glLineMode = glLineMode || 4; // gl.TRIANGLES;

        // Variables
        mModelView =            mModelView || defaultModelViewMatrix;
        vColor =                vColor || defaultColor;
        var vActiveColor =      vColor.slice(0);

        // Set up public object
        this.render =           render;
        this.update =           update;
        this.setVelocity =      setVelocity;
        this.setAcceleration =  setAcceleration;
        this.move =             move;

        // Set up private properties
        var tilePos = [0, 0];
        var mTextureCoordinates = defaultTextureCoordinates;
        var iSpriteSheet = null;
        var rowCount = 1, colCount = 1;
        var tileScaleX = 1;
        var tileScaleY = 1;

        // Initiate Shaders
        if(!PROGRAM)
            initProgram(gl);

        // Create a texture.
        var tSpriteSheet = gl.createTexture();
        tSpriteSheet.loaded = false;
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, tSpriteSheet);

        // Fill the texture with a 1x1 blue pixel.
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
            new Uint8Array([0, 256, 0, 128]));

        // Asynchronously load the spritesheet
        iSpriteSheet = new Image();
        iSpriteSheet.src = pathSpriteSheet;
        iSpriteSheet.addEventListener('load', function(e) {
            // Now that the image has loaded make copy it to the texture.
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, tSpriteSheet);

            // Upload the image into the texture.
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, iSpriteSheet);

            // Set the parameters so we can render any size image.
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            if(flags & SpriteSheet.FLAG_GENERATE_MIPMAP) {
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.generateMipmap(gl.TEXTURE_2D);
            } else {
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            }

            colCount = iSpriteSheet.width / tileSizeX;
            if(colCount % 1 !== 0) console.error("Sprite sheet width (" + iSpriteSheet.width + ") is not divisible by " + tileSizeX);
            rowCount = iSpriteSheet.height / tileSizeY;
            if(rowCount % 1 !== 0) console.error("Sprite sheet height (" + iSpriteSheet.height + ") is not divisible by " + tileSizeY);

            tileScaleX = tileSizeX / iSpriteSheet.width;
            tileScaleY = tileSizeY / iSpriteSheet.height;

            setTilePosition(0, 0);
        });



        // Functions

        var lastKeyCount = 0;
        function render(t, gl, stage, flags) {

            // Update
            update(t, stage, flags);

            // Render
            gl.useProgram(PROGRAM);

            // Bind Vertex Coordinate
            gl.bindBuffer(gl.ARRAY_BUFFER, bufVertexPosition);
            gl.vertexAttribPointer(aVertexPosition, 2, gl.FLOAT, false, 0, 0);

            // Bind Texture Coordinate
            gl.bindBuffer(gl.ARRAY_BUFFER, bufTextureCoordinate);
            gl.bufferData(gl.ARRAY_BUFFER, mTextureCoordinates, gl.DYNAMIC_DRAW);
            gl.vertexAttribPointer(aTextureCoordinate, 2, gl.FLOAT, false, 0, 0);

            // Set the projection and viewport.
            gl.uniformMatrix4fv(uPMatrix, false, stage.mProjection || defaultProjectionMatrix);
            gl.uniformMatrix4fv(uMVMatrix, false, mModelView);
            gl.uniform4fv(uColor, vActiveColor);

            // Tell the shader to get the texture from texture unit 0
            gl.activeTexture(gl.TEXTURE0 + 0);
            gl.bindTexture(gl.TEXTURE_2D, tSpriteSheet);
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
            tilePos = [x, y];
            mTextureCoordinates = new Float32Array([
                (x+0)*tileScaleX,       (y+1)*tileScaleY,
                (x+0)*tileScaleX,       (y+0)*tileScaleY,
                (x+1)*tileScaleX,   (y+1)*tileScaleY,
                (x+1)*tileScaleX,   (y+1)*tileScaleY,
                (x+0)*tileScaleX,       (y+0)*tileScaleY,
                (x+1)*tileScaleX,   (y+0)*tileScaleY,
            ]);
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
        var lastTime = 0;
        function update(t, stage, flags) {
            var elapsedTime = t - lastTime;
            lastTime = t;
            frameCount++;

            if(mAcceleration)
                mVelocity = Util.multiply(mVelocity, mAcceleration);

            if(mVelocity)
                mModelView = Util.multiply(mModelView, mVelocity);

            sinceLastFrame += elapsedTime;
            if(sinceLastFrame > frameRate) {
                var frameCount = Math.floor(sinceLastFrame / frameRate);
                sinceLastFrame -= frameRate * frameCount;
                if(frameCount > 16) frameCount = 16;
                for (var i=0; i<frameCount; i++) {
                    // Update Next Tile Position
                    tilePos[0]++;
                    if (tilePos[0] >= colCount) {
                        tilePos[0] = 0;
                        tilePos[1]++;
                        if (tilePos[1] >= rowCount) {
                            tilePos = [0, 0];
                        }
                    }
                }
                setTilePosition(tilePos[0], tilePos[1]);
            }

            if(flags & Config.flags.RENDER_SELECTED) {
                if(vActiveColor === vColor)
                    vActiveColor = vColor.slice(0);
                vActiveColor[0] = vColor[0] * Math.abs(Math.sin(t/500));
                vActiveColor[1] = vColor[1] * Math.abs(Math.sin(t/1800));
                vActiveColor[2] = vColor[2] * Math.abs(Math.sin(t/1000));
                vActiveColor[3] = vColor[3] * Math.abs(Math.sin(t/300));
            } else {
                vActiveColor = vColor
            }
        }

        function move(tx, ty, tz) {
            mModelView = Util.translate(mModelView, tx, ty, tz)
        }

        function initProgram(gl) {

            // Init Program
            var program = Util.compileProgram(gl, SpriteSheet.VS, SpriteSheet.FS);
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
            uSampler = gl.getUniformLocation(program, "uSampler");
            uColor = gl.getUniformLocation(program, "uColor");

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

    SpriteSheet.FLAG_GENERATE_MIPMAP = 0x01;
    SpriteSheet.FLAG_DEFAULTS = 0; //SpriteSheet.FLAG_GENERATE_MIPMAP;

    var defaultModelViewMatrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
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

    var defaultColor = new Float32Array([1,1,1,1]);
    // Texture Program

    var aVertexPosition, bufVertexPosition;
    var aTextureCoordinate, bufTextureCoordinate;
    var uPMatrix, uMVMatrix, uSampler, uColor;

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
        "uniform vec4 uColor;",

        "varying vec2 vTextureCoordinate;",

        "void main() {",
        "    gl_FragColor = texture2D(uSampler, vTextureCoordinate) * uColor;",
        "}"
    ].join("\n");

})();

