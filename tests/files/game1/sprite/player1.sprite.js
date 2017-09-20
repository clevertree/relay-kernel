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

    function Player1(gl, scale, mPosition, mVelocity, mAcceleration) {
        var THIS = this;
        var Fragment = Config.fragment;

        // Local Variables
        mPosition = mPosition || [0, 0, 0];
        mVelocity = mVelocity || [0.1 * Math.random(), 0, 0];
        mAcceleration = mAcceleration || null;
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
                updateMotion(t, stage, flags);
            }
        };

        this.move = function(tx, ty, tz) {
            mPosition[0] += tx;
            mPosition[1] += ty;
            mPosition[2] += tz;
            fSpriteSheet.move(tx, ty, tz);
        };

        this.setScale = function(newScale) {
            fSpriteSheet.setScale(newScale);
        };

        // Physics

        function updateMotion(t, stage, flags) {
            var hitFloor = stage.testHit(mPosition[0], mPosition[1], mPosition[2]);
            if(!hitFloor) {
                // Fall
                if(!mAcceleration) {
                    mAcceleration = stage.mGravity;
                    if(!mVelocity) mVelocity = [0, 0, 0];
                }

            } else {
                // Standing
                if(mVelocity) // Collision
                    handleStageCollision(t, stage, flags);
            }

            // Acceleration
            if(mAcceleration)
                mVelocity = [mVelocity[0] + mAcceleration[0], mVelocity[1] + mAcceleration[1], mVelocity[2] + mAcceleration[2]]

            // Position
            if(mVelocity)
                THIS.move(mVelocity[0], mVelocity[1], mVelocity[2]);
        }

        function handleStageCollision(t, stage, flags) {
            mAcceleration = null;
            mVelocity = null;
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
                stage.testHit(mPosition[0], mPosition[1], mPosition[2]);
            }
        }
    }

})();