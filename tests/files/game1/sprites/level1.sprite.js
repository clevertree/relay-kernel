/**
 * Created by Ari on 12/30/2016.
 */

// Set up client-side listeners

(function() {
    window.games.game1.sprite.Level1 = Level1;

    function Level1(gl) {
        var Config = window.games.game1;
        var Util = Config.util;
        window.games.game1.sprite.Level1 = Level1;
        this.gradientRenderer = Util.getGradientRenderer(
            gl,
            this.positionHandler,
            this.povHandler,
            this.colorHandler
        )
    }

    Level1.prototype.positionHandler = function() {
        return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, -6, 1];
    };

    Level1.prototype.povHandler = function() {
        return [1.8106601717798214, 0, 0, 0, 0, 2.4142135623730954, 0, 0, 0, 1, -1.002002002002002, -1, 0, 0, -0.20020020020020018, 0];
    };

    Level1.prototype.colorHandler = function() {
        return [
            0.4,  0.5,  0.6,  1.0,    // white
            0.4,  0.5,  0.4,  1.0,    // white
            0.0,  0.0,  0.0,  1.0,    // green
            0.0,  0.0,  0.0,  1.0     // blue
        ];
    };


    /**
     * Update Sprite Logic
     * @param duration
     */
    Level1.prototype.update = function(duration) {

    };

    /**
     * Render Sprite
     * @param e Event
     * @param gl WebGL Instance
     */
    Level1.prototype.render = function(e, gl) {
        this.gradientRenderer(e, gl);
    };
})();