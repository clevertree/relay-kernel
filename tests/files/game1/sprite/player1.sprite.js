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

        // Sprite Sheet
        var fSpriteSheet = new Fragment.SpriteSheet(gl, DIR_SHEET, SPRITE_RESOLUTION, (1/16 * 1000));
        // setScale(scale);
        // move(0, 12, 0);


        /**
         * Render Sprite
         * @param t time elapsed
         * @param gl WebGL Instance
         * @param stage
         * @param flags
         */
        this.render = function(t, gl, stage, flags) {
            fSpriteSheet.render(t, gl, stage, flags);
        };

        /**
         * Update Sprite Logic
         * @param t
         * @param stage
         * @param flags
         */
        this.update = function(t, stage, flags) {
            if(flags & Config.flags.RENDER_SELECTED) {
                updateEditor(t, stage, flags);
            } else {
                updateGravity(t, stage, flags);
            }
        };

        this.move = function(tx, ty, tz) {
            pos[0] += tx;
            pos[1] += ty;
            pos[2] += tz;
            fSpriteSheet.move(tx, ty, tz);
        };

        this.setScale = function(newScale) {
            fSpriteSheet.setScale(newScale);
        };

        // Physics

        function updateGravity(t, stage, flags) {
            var hitFloor = stage.testHit(pos[0], pos[1], pos[2]);
            if(!hitFloor) {
                THIS.move(0, -0.02, 0);
                // Fall
            } else {
                // Standing
            }
        }

        // Editor

        var CHAR_SHIFT = 16;
        var lastKeyCount = 0;
        function updateEditor(t, stage, flags) {
            var pressedKeys = Config.input.pressedKeys;
            if(pressedKeys[39])     THIS.move(0.1,  0.0,  0.0);  // Right:
            if(pressedKeys[37])     THIS.move(-0.1, 0.0,  0.0);  // Left:
            if(pressedKeys[40])     THIS.move(0.0, -0.1,  0.0);  // Down:
            if(pressedKeys[38])     THIS.move(0.0,  0.1,  0.0);  // Up:
            if(pressedKeys[34])     THIS.move(0.0,  0.0, -0.1);  // Page Down:
            if(pressedKeys[33])     THIS.move(0.0,  0.0,  0.1);  // Page Up:
            if(lastKeyCount < Config.input.keyEvents) {
                lastKeyCount = Config.input.keyEvents;
                stage.testHit(pos[0], pos[1], pos[2]);
            }
        }
    }

})();