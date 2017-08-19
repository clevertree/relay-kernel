/**
 * Created by Ari on 12/30/2016.
 */

(function() {
    var Config = window.games.game1;
    var Util = Config.util;
    Config.fragment.TextureFragment = TextureFragment;

    var PRGTexture;

    function TextureFragment(texture, mVertices, mModelView, glLineMode, mVelocity, mAcceleration) {
        // Variables
        var mProjection =       TextureFragment.P_DEFAULT;
        mVertices = mVertices   || TextureFragment.V_DEFAULT;
        mModelView = mModelView || TextureFragment.MV_DEFAULT;
        mColors = mColors       || TextureFragment.C_DEFAULT;

        // Set up object
        this.render = render;
        this.update = update;
        this.setVelocity = setVelocity;
        this.setAcceleration = setAcceleration;

        // Functions
        
        function setVelocity(vx, vy, vz) {
            mVelocity = Util.m4.translation(vx, vy, vz);
        }

        function setAcceleration(ax, ay, az) {
            if(!mVelocity)
                setVelocity(0,0,0);
            mAcceleration = Util.m4.translation(ax, ay, az);
        }

        function update(duration) {
            if(mAcceleration)
                mVelocity = Util.m4.multiply(mVelocity, mAcceleration);

            if(mVelocity)
                mModelView = Util.m4.multiply(mModelView, mVelocity);
        }

        function render(e, gl) {
            // Compile program
            if(!PRGTexture) {
                // Init Render Mode
                glLineMode = glLineMode || gl.TRIANGLES;

                // Init Program
                PRGTexture = Util.compileProgram(gl, VSColor, FSColor);

                // Position Buffer
                PRGTexture.vertexPositionBuffer = gl.createBuffer();
                PRGTexture.vertexPositionBuffer.itemSize = 3;
                PRGTexture.vertexPositionBuffer.numItems = 3;

                // Color Buffer
                PRGTexture.triangleVertexColorBuffer = gl.createBuffer();
                PRGTexture.triangleVertexColorBuffer.itemSize = 4;
                PRGTexture.triangleVertexColorBuffer.numItems = 3;
                PRGTexture.vertexColorAttribute = gl.getAttribLocation(PRGTexture, "aVertexColor");
                gl.enableVertexAttribArray(PRGTexture.vertexColorAttribute);

                // Vertex Position Attribute
                PRGTexture.vertexPositionAttribute = gl.getAttribLocation(PRGTexture, "aVertexPosition");
                gl.enableVertexAttribArray(PRGTexture.vertexPositionAttribute);

                // Uniforms
                PRGTexture.pMatrixUniform = gl.getUniformLocation(PRGTexture, "uPMatrix");
                PRGTexture.mvMatrixUniform = gl.getUniformLocation(PRGTexture, "uMVMatrix");
            }

            // Update
            update(e.duration);

            gl.useProgram(PRGTexture);

            // Bind Vertex Position Buffer
            gl.bindBuffer(gl.ARRAY_BUFFER, PRGTexture.vertexPositionBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, mVertices, gl.DYNAMIC_DRAW);
            gl.vertexAttribPointer(PRGTexture.vertexPosAttrib, PRGTexture.vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

            // Bind Color Buffer
            gl.bindBuffer(gl.ARRAY_BUFFER, PRGTexture.triangleVertexColorBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, mColors, gl.DYNAMIC_DRAW);
            gl.vertexAttribPointer(PRGTexture.vertexColorAttribute, PRGTexture.triangleVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

            // Set Matrix Uniforms
            gl.uniformMatrix4fv(PRGTexture.pMatrixUniform, false, mProjection);  // Set Projection
            gl.uniformMatrix4fv(PRGTexture.mvMatrixUniform, false, mModelView);  // Set World Coordinates

            // Render
            gl.drawArrays(glLineMode, 0, PRGTexture.vertexPositionBuffer.numItems); // gl.TRIANGLES, gl.POINTS, gl.LINE_LOOP
        }
    }

    // Shapes
    TextureFragment.V_TRIANGLE_EQUILATERAL = new Float32Array([           // /*  2
        0.0,  1.0,  0.0,                                                //    /\
        -1.0, -1.0,  0.0,                                               //   /. \
        1.0, -1.0,  0.0                                                 // 0/____\1
    ]);                                                                 // */
    TextureFragment.V_DEFAULT = TextureFragment.V_TRIANGLE_EQUILATERAL;


    // Colors
    TextureFragment.C_DEFAULT = new Float32Array([
        1.0, 0.0, 0.0, -1.0,
        0.0, 1.0, 0.0, 1.0,
        0.0, 0.0, 1.0, 0.5
    ]);

    TextureFragment.MV_DEFAULT = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1.5, 0, -7, 1];
    TextureFragment.P_DEFAULT = [2.4142136573791504, 0, 0, 0, 0, 2.4142136573791504, 0, 0, 0, 0, -1.0020020008087158, -1, 0, 0, -0.20020020008087158, 0];


    // Color Program

    TextureFragment.VS = [
        "attribute vec3 aVertexPosition;",
        "attribute vec4 aVertexColor;",

        "uniform mat4 uMVMatrix;",
        "uniform mat4 uPMatrix;",

        "varying vec4 vColor;",

        "void main(void) {",
        "   gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);",
        "   vColor = aVertexColor;",
        "}"
    ].join("\n");

    TextureFragment.FS = [
        "precision mediump float;",

        "varying vec4 vColor;",

        "void main(void) {",
        "   gl_FragColor = vColor;",
        "}"
    ].join("\n");

})();

