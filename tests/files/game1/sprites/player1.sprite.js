/**
 * Created by Ari on 12/30/2016.
 */

// Set up client-side listeners

(function() {
    window.games.game1.sprite.Player1 = Player1;

    function Player1(gl) {
        var Config = window.games.game1;
        this.triangle = Config.fragment.Fragment.addColorFragment(gl);

        this.triangle.setAcceleration(0,0,-0.001);
        this.triangle.setVelocity(-0.02,0,0.1);
        // this.rectangle = new Config.fragment.Rectangle(gl);
        this.hitBoxes = [];
    }

    Player1.prototype.addHitBox = function(sprite) {
        this.hitBoxes.push(sprite);
    };

    /**
     * Update Sprite Logic
     * @param duration
     */
    Player1.prototype.update = function(duration) {

    };

    /**
     * Render Sprite
     * @param e Event
     * @param gl WebGL Instance
     */
    Player1.prototype.render = function(e, gl) {
        // this.rectangle.render(e, gl);
        this.triangle.render(e, gl);
    };
})();