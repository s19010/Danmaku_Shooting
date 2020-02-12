'use strict';

class TextLabel extends Actor {
    constructor(x, y, text) {
        const hitArea = new Rectangle(0, 0, 0, 0);
        super(x, y, hitArea);

        this.text = text;
    }

    render(target) {
        const context = target.getContext('2d');
        context.font = '25px sans-serif';
        context.fillStyle = 'white';
        context.fillText(this.text, this.x, this.y);
    }
}

class Bullet extends SpriteActor {
    constructor(x, y) {
        const sprite = new Sprite(assets.get('sprite'), new Rectangle(0, 16, 16, 16));
        // const sprite = new Sprite(assets.get('sprite'), new Rectangle(16, 16, 16, 16)); // （スキンA)
        // const sprite = new Sprite(assets.get('sprite'), new Rectangle(0, 16, 16, 16)); // （スキンB)
        // const sprite = new Sprite(assets.get('sprite'), new Rectangle(16, 0, 16, 16)); // （スキンC)
        const hitArea = new Rectangle(4, 0, 8, 16);
        super(x, y, sprite, hitArea, ['playerBullet']);

        this._speed = 6; // 自機が撃つ弾の速度（デフォルト）
        // this._speed = 15;    // 〃（少し速い）
        // this._speed = 1;     // 〃（とても遅い）
        // this._speed = 30;    //〃（とても速い）

        this.addEventListener('hit', (e) => {
            if(e.target.hasTag('enemy')) { this.destroy(); }
        });
    }

    update(gameInfo, input) {
        this.y -= this._speed;
        if(this.isOutOfBounds(gameInfo.screenRectangle)) {
            this.destroy();
        }
    }
}

class Fighter extends SpriteActor {
    constructor(x, y) {
        const sprite = new Sprite(assets.get('sprite'), new Rectangle(0, 0, 16, 16)); // （デフォルト）
        // const sprite = new Sprite(assets.get('sprite'), new Rectangle(16, 0, 16, 16)); // （スキンA）
        // const sprite = new Sprite(assets.get('sprite'), new Rectangle(16, 16, 16, 16)); // （スキンB)
        // const sprite = new Sprite(assets.get('sprite'), new Rectangle(0, 16, 16, 16)); // （スキンC)
        const hitArea = new Rectangle(8, 8, 2, 2);
        super(x, y, sprite, hitArea);

        this._interval = 5; // 自機が弾を撃ち出す間隔（デフォルト）
        // this._interval = 100;　// 〃 間隔（ハードモードβ）
        // this._interval = ;　2.5　// 〃 間隔（イージーモードα）
        // this._interval = 0.1;　// 〃 間隔（イージーモードθ）
        this._timeCount = 0;
        this._speed = 3; // 自機の動く速度（デフォルト）
        // this._speed = 10; // 〃 （少し速い）
        // this._speed = 22; // 〃 （とても速い）
        this._velocityX = 0;
        this._velocityY = 0;

        this.addEventListener('hit', (e) => {
            if(e.target.hasTag('enemyBullet')) {
                this.destroy();
            }
        });
    }

    update(gameInfo, input) {
        this._velocityX = 0;
        this._velocityY = 0;

        if(input.getKey('ArrowUp')) { this._velocityY = -this._speed; }
        if(input.getKey('ArrowDown')) { this._velocityY = this._speed; }
        if(input.getKey('ArrowRight')) { this._velocityX = this._speed; }
        if(input.getKey('ArrowLeft')) { this._velocityX = -this._speed; }

        this.x += this._velocityX;
        this.y += this._velocityY;

        const boundWidth = gameInfo.screenRectangle.width - this.width;
        const boundHeight = gameInfo.screenRectangle.height - this.height;
        const bound = new Rectangle(this.width, this.height, boundWidth, boundHeight);

        if(this.isOutOfBounds(bound)) {
            this.x -= this._velocityX;
            this.y -= this._velocityY;
        }

        this._timeCount++;
        const isFireReady = this._timeCount > this._interval;
        if(isFireReady && input.getKey(' ')) {
            const bullet = new Bullet(this.x, this.y);
            this.spawnActor(bullet);
            this._timeCount = 0;
        }
    }
}

class EnemyBullet extends SpriteActor {
    constructor(x, y, velocityX, velocityY) {
        const sprite = new Sprite(assets.get('sprite'), new Rectangle(16, 16, 16, 16)); // （デフォルト）
        // const sprite = new Sprite(assets.get('sprite'), new Rectangle(0, 16, 16, 16)); // （スキンA）
        // const sprite = new Sprite(assets.get('sprite'), new Rectangle(16, 0, 16, 16)); // （スキンB)
        // const sprite = new Sprite(assets.get('sprite'), new Rectangle(0, 0, 16, 16)); // （スキンC)
        const hitArea = new Rectangle(4, 4, 8, 8);
        super(x, y, sprite, hitArea, ['enemyBullet']);

        this.velocityX = velocityX;
        this.velocityY = velocityY;
    }

    update(gameInfo, input) {
        this.x += this.velocityX;
        this.y += this.velocityY;

        if(this.isOutOfBounds(gameInfo.screenRectangle)) {
            this.destroy();
        }
    }
}

class FireworksBullet extends EnemyBullet {
    constructor(x, y, velocityX, velocityY, explosionTime) {
        super(x, y, velocityX, velocityY);

        this._elapsedTime = 0;
        this.explosionTime = explosionTime;
    }

    shootBullet(degree, speed) {
        const rad = degree / 180 * Math.PI;
        const velocityX = Math.cos(rad) * speed;
        const velocityY = Math.sin(rad) * speed;

        const bullet = new EnemyBullet(this.x, this.y, velocityX, velocityY);
        this.spawnActor(bullet);
    }

    shootCircularBullets(num, speed) {
        const degree = 360 / num;
        for(let i = 0; i < num; i++) {
            this.shootBullet(degree * i, speed);
        }
    }

    update(gameInfo, input) {
        super.update(gameInfo, input);

        this._elapsedTime++;

        if(this._elapsedTime > this.explosionTime) {
            this.shootCircularBullets(10, 2);
            this.destroy();
        }
    }
}

class Enemy extends SpriteActor {
    constructor(x, y) {
        const sprite = new Sprite(assets.get('sprite'), new Rectangle(16, 0, 16, 16)); // （デフォルト）
        // const sprite = new Sprite(assets.get('sprite'), new Rectangle(0, 0, 16, 16)); // （スキンA)
        // const sprite = new Sprite(assets.get('sprite'), new Rectangle(0, 16, 16, 16)); // （スキンB)
        // const sprite = new Sprite(assets.get('sprite'), new Rectangle(16, 16, 16, 16)); // （スキンC)
        const hitArea = new Rectangle(0, 0, 16, 16); // （敵本体の当たり判定）
        // const hitArea = new Rectangle(16, 0, 16, 16); // （〃 を無しにする）
        super(x, y, sprite, hitArea, ['enemy']);

        this.maxHp = 50;　// 敵のＨＰ（デフォルト）
        // this.maxHp = 1000; // 〃（ハードモード）
        this.currentHp = this.maxHp;

        this._interval = 100; // 敵が弾を撃ち出す間隔（デフォルト）
        // this._interval = 10; // 〃（ハードモード）
        // this._interval = 240; // 〃（イージーモード）
        this._timeCount = 0;

        this.addEventListener('hit', (e) => {
            if(e.target.hasTag('playerBullet')) {
                this.currentHp--;
                this.dispatchEvent('changehp', new GameEvent(this));
            }
        });
    }

    update(gameInfo, input) {
        /**
        // 敵の左右への移動
        this.x += this._velocityX;
        if(this.x <= 245 || this.x >= 460) { this._velocityX *= -1; } // 敵が左右へ移動する範囲
        // if(this.x <= 100 || this.x >= 200) { this._velocityX *= -1; } // 敵が左右へ移動しない（イージーモード）
        */

        this._timeCount++;
        if(this._timeCount > this._interval) {
            const spdX = Math.random() * 4 - 2;
            const spdY = Math.random() * 4 - 2;
            const explosionTime = 50;
            const bullet = new FireworksBullet(this.x, this.y, spdX, spdY, explosionTime);
            this.spawnActor(bullet);
            this._timeCount = 0;
        }

        if(this.currentHp <= 0) {
            this.destroy();
        }
    }
}

class EnemyHpBar extends Actor {
    constructor(x, y, enemy) {
        const hitArea = new Rectangle(0, 0, 0, 0);
        super(x, y, hitArea);

        this._width = 200; // ＨＰバーの長さ
        this._height = 10; // 〃 の高さ
        this._innerWidth = this._width;

        //　画面上に表示された敵のＨＰバーの長さを残りのＨＰと連動させて変更する
        enemy.addEventListener('changehp', (e) => {
            const maxHp = e.target.maxHp;
            const hp = e.target.currentHp;
            this._innerWidth = this._width * (hp / maxHp);
        });
    }

    render(target) {
        const context = target.getContext('2d');
        context.strokeStyle = 'red' // ＨＰバーの枠線の色
        context.fillStyle = 'red'; // 〃 の中身の色

        context.strokeRect(this.x, this.y, this._width, this._height); // ＨＰバーをどの場所に表示させるか（枠線）
        context.fillRect(this.x, this.y, this._innerWidth, this._height); // 〃 をどの場所に表示させるか（中身）
    }
}

class DanmakuStgEndScene extends Scene {
    constructor(renderingTarget) {
        super('クリア', 'black', renderingTarget);
        const text = new TextLabel(175, 200, 'Game Clear！');
        this.add(text);
    }
}

class DanmakuStgGameOverScene extends Scene {
    constructor(renderingTarget) {
        super('ゲームオーバー', 'black', renderingTarget);
        const text = new TextLabel(175, 200, 'Game Over_');
        this.add(text);
    }
}

class DanmakuStgMainScene extends Scene {
    constructor(renderingTarget) {
        super('メイン', 'black', renderingTarget);
        const fighter = new Fighter(245, 565);
        const enemy = new Enemy(245, 150);
        const hpBar = new EnemyHpBar(150, 50, enemy);
        this.add(fighter);
        this.add(enemy);
        this.add(hpBar);

        fighter.addEventListener('destroy', (e) => {
            const scene = new DanmakuStgGameOverScene(this.renderingTarget);
            this.changeScene(scene);
        });

        enemy.addEventListener('destroy', (e) => {
            const scene = new DanmakuStgEndScene(this.renderingTarget);
            this.changeScene(scene);
        });
    }
}

class DanmakuStgTitleScene extends Scene {
    constructor(renderingTarget) {
        super('タイトル', 'black', renderingTarget);
        const title = new TextLabel(100, 270, 'Barrage  Shooting  Game');
        this.add(title);
    }

    update(gameInfo, input) {
        super.update(gameInfo, input);
        if(input.getKeyDown(' ')) {
            const mainScene = new DanmakuStgMainScene(this.renderingTarget);
            this.changeScene(mainScene);
        }
    }
}

class DanmakuStgGame extends Game {
    constructor() {
        super('弾幕シューティングゲーム', 490, 920, 60);
        const titleScene = new DanmakuStgTitleScene(this.screenCanvas);
        this.changeScene(titleScene);
    }
}

assets.addImage('sprite', 'sprite.png');
assets.loadAll().then((a) => {
    const game = new DanmakuStgGame();
    document.body.appendChild(game.screenCanvas);
    game.start();
});
