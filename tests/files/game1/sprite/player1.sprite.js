/**
 * Created by Ari on 12/30/2016.
 */

// Set up client-side listeners

(function() {
    var Config = window.games.game1;
    var Util = Config.util;
    var ROOT = Config.path.root;
    var SPRITE_RESOLUTION = 128;
    var DIR_CHARACTER = ROOT + 'sprite/';
    var DIR_SHEET = DIR_CHARACTER + 'sheet/lem/lem-default.'+SPRITE_RESOLUTION+'.sprite-sheet.png';
    Config.character.Player1 = Player1;
    var PIXELS_PER_UNIT = Config.constants.PIXELS_PER_UNIT;

    function Player1(gl, pos, scale) {
        var THIS = this;
        var Fragment = Config.fragment;

        // Local Variables
        pos = pos || [0, 0, 0];
        scale = scale || 1;

        // Textures
        var tSpriteSheet = Fragment.SpriteSheet.loadTexture(gl, DIR_SHEET);

        // Sprite Sheet
        var fSpriteSheet = new Fragment.SpriteSheet(gl, tSpriteSheet, SPRITE_RESOLUTION, (1/16 * 1000));
        setScale(scale);
        // move(6, 60, 0);


        /**
         * Render Sprite
         * @param t time elapsed
         * @param gl WebGL Instance
         * @param stage
         * @param flags
         */
        function render(t, gl, stage, flags) {
            fSpriteSheet.render(t, gl, stage, flags);
        }

        /**
         * Update Sprite Logic
         * @param t
         * @param stage
         * @param flags
         */
        function update(t, stage, flags) {
            if(flags & Config.flags.RENDER_SELECTED) {
                updateEditor(t, stage, flags);
            }
        }

        var CHAR_SHIFT = 16;
        function updateEditor(t, stage, flags) {
            var pressedKeys = Config.input.pressedKeys;
            if(pressedKeys[39])     move(0.1,  0.0,  0.0);  // Right:
            if(pressedKeys[37])     move(-0.1, 0.0,  0.0);  // Left:
            if(pressedKeys[40])     move(0.0, -0.1,  0.0);  // Down:
            if(pressedKeys[38])     move(0.0,  0.1,  0.0);  // Up:
            if(pressedKeys[34])     move(0.0,  0.0, -0.1);  // Page Down:
            if(pressedKeys[33])     move(0.0,  0.0,  0.1);  // Page Up:
        }

        function move(tx, ty, tz) {
            pos[0] += tx;
            pos[1] += ty;
            pos[2] += tz;
            fSpriteSheet.move(tx, ty, tz);
        }

        function setScale(newScale) {
            fSpriteSheet.setScale(newScale);
        }

        this.update = update;
        this.render = render;
        this.move = move;
        this.setScale = setScale;
    }

})();