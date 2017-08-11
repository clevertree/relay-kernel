/**
 * Created by Ari on 12/30/2016.
 */

// Set up client-side listeners

(function() {
    window.games.game1.fragment.Rectangle = Rectangle;

    function Rectangle(gl) {
        var Config = window.games.game1;
        var Util = Config.util;

        this.offset = [1,-1];
        this.vertexPosBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPosBuffer); // TODO: conflict?
        var vertices = [-1, -1, 1, -1, -1, 1, 1, 1];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        this.vertexPosBuffer.itemSize = 2;
        this.vertexPosBuffer.numItems = 4;


        this.program = Util.compileProgram(gl, VS, FS);
        this.program.vertexPosAttrib = gl.getAttribLocation(this.program, 'aVertexPosition');
        this.program.offsetUniform = gl.getUniformLocation(this.program, 'uOffset');


    }

    /**
     * Update Sprite Logic
     * @param duration
     */
    Rectangle.prototype.update = function(duration) {

    };

    /**
     * Render Sprite
     * @param e Event
     * @param gl WebGL Instance
     */
    Rectangle.prototype.render = function(e, gl) {
        gl.useProgram(this.program);
        gl.enableVertexAttribArray(this.program.vertexPosArray);
        gl.vertexAttribPointer(this.program.vertexPosAttrib, this.vertexPosBuffer.itemSize, gl.FLOAT, false, 0, 0);
        gl.uniform2f(this.program.offsetUniform, this.offset[0], this.offset[1]);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.vertexPosBuffer.numItems);
    };

    // Shader Source Code

    var VS = [
        "attribute vec2 aVertexPosition;",
        "varying vec2 vTexCoord;",
        "uniform vec2 uOffset;",
        "void main() {",
        "   vTexCoord = aVertexPosition + uOffset;",
        "   gl_Position = vec4(aVertexPosition, 0, 1);",
        "}"
    ].join("\n");

    var FS = [
        "precision mediump float;",
        "varying vec2 vTexCoord;",
        "void main(void) {",
        "   gl_FragColor = vec4(vTexCoord, 0, 1);",
        "}"
    ].join("\n");


})();

/*
 2___3
 |\  |
 | \ |
 |__\|
 0   1
*/