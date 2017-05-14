/**
 * Created by Ari on 12/30/2016.
 */

// Set up client-side listeners

(function() {

    document.addEventListener('render:start', handleRenderStart);
    document.addEventListener('render:stop', handleRenderStop);


    // Event Listeners

    function handleRenderStart (e) {
        var canvas = e.target;
        if(canvas.nodeName.toLowerCase() !== 'canvas')
            throw new Error("Invalid canvas element: " + canvas);

        // var commandString = e.data || e.detail;
        e.preventDefault();

        var gl = canvas.getContext('webgl');

        // Create Shaders
        var vertexShader = compileShader(gl, tilemapVS, gl.VERTEX_SHADER);
        var fragmentShader = compileShader(gl, tilemapFS, gl.FRAGMENT_SHADER);
        var program = createProgram(gl, vertexShader, fragmentShader);
        console.info("Context initiated: ", gl, program, vertexShader, fragmentShader);

        // console.info("Rendering game1 on ", gl);

        function onFrame(){
            window.requestAnimationFrame(onFrame);
            renderFrame(gl, program, vertexShader, fragmentShader);
        }
        window.requestAnimationFrame(onFrame);
    }


    function handleRenderStop (e) {
        // var commandString = e.data || e.detail;
        e.preventDefault();
        throw new Error("TODO");
    }

    // Rendering

    function renderFrame(gl, program, vertexShader, fragmentShader) {

        gl.clearColor(0.3, 0.9, 0.3, 0.5);
        gl.clearDepth(1.0);
        gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
        /*gl.enable(gl.BLEND);
         gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);*/


        var shader = vertexShader;
        gl.useProgram(program);

        // gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVertBuffer);
        //
        // gl.enableVertexAttribArray(shader.attribute.position);
        // gl.enableVertexAttribArray(shader.attribute.texture);
        // gl.vertexAttribPointer(shader.attribute.position, 2, gl.FLOAT, false, 16, 0);
        // gl.vertexAttribPointer(shader.attribute.texture, 2, gl.FLOAT, false, 16, 8);
        //
        // gl.uniform2fv(shader.uniform.viewportSize, this.scaledViewportSize);
        // gl.uniform2fv(shader.uniform.inverseSpriteTextureSize, this.inverseSpriteTextureSize);
        // gl.uniform1f(shader.uniform.tileSize, this.tileSize);
        // gl.uniform1f(shader.uniform.inverseTileSize, 1/this.tileSize);
        //
        // gl.activeTexture(gl.TEXTURE0);
        // gl.uniform1i(shader.uniform.sprites, 0);
        // gl.bindTexture(gl.TEXTURE_2D, this.spriteSheet);
        //
        // gl.activeTexture(gl.TEXTURE1);
        // gl.uniform1i(shader.uniform.tiles, 1);

        // // Draw each layer of the map
        // var i, layer;
        // for(i = this.layers.length; i >= 0; --i) {
        //     layer = this.layers[i];
        //     if(layer) {
        //         gl.uniform2f(shader.uniform.viewOffset, Math.floor(x * layer.scrollScaleX), Math.floor(y * layer.scrollScaleY));
        //         gl.uniform2fv(shader.uniform.inverseTileTextureSize, layer.inverseTextureSize);
        //         gl.uniform1i(shader.uniform.repeatTiles, layer.repeat ? 1 : 0);
        //
        //         gl.bindTexture(gl.TEXTURE_2D, layer.tileTexture);
        //
        //         gl.drawArrays(gl.TRIANGLES, 0, 6);
        //     }
        // }
    }

    // Shader

    var tilemapVS = [
        "attribute vec2 position;",
        "attribute vec2 texture;",

        "varying vec2 pixelCoord;",
        "varying vec2 texCoord;",

        "uniform vec2 viewOffset;",
        "uniform vec2 viewportSize;",
        "uniform vec2 inverseTileTextureSize;",
        "uniform float inverseTileSize;",

        "void main(void) {",
        "   pixelCoord = (texture * viewportSize) + viewOffset;",
        "   texCoord = pixelCoord * inverseTileTextureSize * inverseTileSize;",
        "   gl_Position = vec4(position, 0.0, 1.0);",
        "}"
    ].join("\n");

    var tilemapFS = [
        "precision highp float;",

        "varying vec2 pixelCoord;",
        "varying vec2 texCoord;",

        "uniform sampler2D tiles;",
        "uniform sampler2D sprites;",

        "uniform vec2 inverseTileTextureSize;",
        "uniform vec2 inverseSpriteTextureSize;",
        "uniform float tileSize;",
        "uniform int repeatTiles;",

        "void main(void) {",
        "   if(repeatTiles == 0 && (texCoord.x < 0.0 || texCoord.x > 1.0 || texCoord.y < 0.0 || texCoord.y > 1.0)) { discard; }",
        "   vec4 tile = texture2D(tiles, texCoord);",
        "   if(tile.x == 1.0 && tile.y == 1.0) { discard; }",
        "   vec2 spriteOffset = floor(tile.xy * 256.0) * tileSize;",
        "   vec2 spriteCoord = mod(pixelCoord, tileSize);",
        "   gl_FragColor = texture2D(sprites, (spriteOffset + spriteCoord) * inverseSpriteTextureSize);",
        //"   gl_FragColor = tile;",
        "}"
    ].join("\n");

    /**
     * Creates and compiles a shader.
     *
     * @param {!WebGLRenderingContext} gl The WebGL Context.
     * @param {string} shaderSource The GLSL source code for the shader.
     * @param {number} shaderType The type of shader, VERTEX_SHADER or
     *     FRAGMENT_SHADER.
     * @return {!WebGLShader} The shader.
     */
    function compileShader(gl, shaderSource, shaderType) {
        // Create the shader object
        var shader = gl.createShader(shaderType);

        // Set the shader source code.
        gl.shaderSource(shader, shaderSource);

        // Compile the shader
        gl.compileShader(shader);

        // Check if it compiled
        var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if (!success) {
            // Something went wrong during compilation; get the error
            throw "could not compile shader:" + gl.getShaderInfoLog(shader);
        }

        return shader;
    }

    /**
     * Creates a program from 2 shaders.
     *
     * @param {!WebGLRenderingContext) gl The WebGL context.
     * @param {!WebGLShader} vertexShader A vertex shader.
     * @param {!WebGLShader} fragmentShader A fragment shader.
     * @return {!WebGLProgram} A program.
     */
    function createProgram(gl, vertexShader, fragmentShader) {
        // create a program.
        var program = gl.createProgram();

        // attach the shaders.
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);

        // link the program.
        gl.linkProgram(program);

        // Check if it linked.
        var success = gl.getProgramParameter(program, gl.LINK_STATUS);
        if (!success) {
            // something went wrong with the link
            throw ("program filed to link:" + gl.getProgramInfoLog (program));
        }

        return program;
    };

})();