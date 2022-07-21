import * as THREE from "three";
import { OrbitControls } from 'https://unpkg.com/three@0.139.2/examples/jsm/controls/OrbitControls.js';

function Car(carType, x, y, z, rotX, rotY, rotZ) {
    this.carType = carType;
    this.base = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 0.8, 4.8),
        new THREE.MeshPhongMaterial({ color: 0x00ff00 })
    );
    this.body = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 1.1, 4.0),
        new THREE.MeshPhongMaterial({ color: 0x00ff00 })
    );
    this.group = new THREE.Group();
    this.group.add(this.base);
    this.group.add(this.body);
    this.base.position.set(0, 0.4, 0);
    this.body.position.set(0, 1.2, 0.2);

    this.group.position.set(x, y, z);
    this.group.rotation.set(rotX, rotY, rotZ);
}

function Player(x, y, z, rotX, rotY, rotZ) {
    const height = 1.7;
    const headRadius = 0.2
    this.body = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, height, 0.3),
        new THREE.MeshPhongMaterial({ color: 0xff0000 })
    );
    this.body.position.set(0, -height/2, 0);

    this.head = new THREE.Mesh(
        new THREE.SphereGeometry(headRadius, 30, 30),
        new THREE.MeshPhongMaterial( {color: 0xff0000 })
    );
    this.head.position.set(0, 0, 0);
    this.viewLaser = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.1, 2),
        new THREE.MeshPhongMaterial( {color: 0xff4a4a })
    );
    this.viewLaser.position.set(0, 0, 1);
    this.headAndViewLaser = new THREE.Group();
    this.headAndViewLaser.add(this.head);
    this.headAndViewLaser.add(this.viewLaser);

    this.group = new THREE.Group();
    this.group.add(this.body);
    this.group.add(this.headAndViewLaser);
    this.group.position.set(x, y, z);
    this.viewLaserRotate = function(x, y, z) {
        const vec = new THREE.Vector3(x, y, z);
        const newVec = this.group.position.clone().add(vec);
        this.headAndViewLaser.lookAt(newVec);
    }
}

function Waiting(scene) {
    this.car = new Car("Normal", 0, 0, -10, 0, -Math.PI, 0);
    scene.add(this.car.group);

    this.human = new Player(0, 1.7, 0, 0, 0, 0);
    scene.add(this.human.group);

    this.loop = () => {
        this.car.group.rotation.y += 0.01;
    };
    this.end = () => {
        scene.remove(this.car.group);
        scene.remove(this.human.group);
    };
}

function Replay(scene, db, gameid) {
    const stmt = db.prepare("SELECT * FROM games WHERE gameid = :gameid;");
    const result = stmt.getAsObject({':gameid': gameid});
    stmt.free();
    const attributes = ["age", "car_type", "date", "finsh_time", "gameid", "hit_object", "hit_time", "license", "playerid", "run_pattern", "sex", "stageid", "whether"];
    for (let i in attributes) {
        document.getElementById(attributes[i]).textContent = result[attributes[i]];
    }

    const playerlog = db.exec(`SELECT * FROM playerlog WHERE gameid = ${gameid} ORDER BY timestamp;`);
    this.playerlog = playerlog[0].values;

    this.objectlogs = []
    for (let i=0; i<=13; i++) {
        const objectlog = db.exec(`SELECT * FROM objectlog WHERE gameid = ${gameid} AND carID = ${i} ORDER BY timestamp;`);
        if (objectlog.length > 0) {
            this.objectlogs.push(objectlog[0].values);
        }
    }

    this.player = new Player(
        playerlog[0].values[0][2], playerlog[0].values[0][3], playerlog[0].values[0][4],
        0, 0, 0
    );
    scene.add(this.player.group);

    this.objects = [];
    for (let i=0; i < this.objectlogs.length; i++) {
        const objectlog = this.objectlogs[i];
        const object = new Car("Standard", 
            objectlog[0][3], 0, objectlog[0][4],
            0, Math.PI / 2, 0
        );
        this.objects.push(object);
        scene.add(this.objects[i].group);
    }

    this.playerTrajectory = [];

    this.startTime = new Date();
    
    this.loop = () => {
        let now = new Date();
        let timedelta = (now.getTime() - this.startTime.getTime());
        for (let i=1; i < this.playerlog.length; i++) {
            const timelineStr = this.playerlog[i][1]
            const timeline = 60 * 1000 * parseInt(timelineStr.substring(3, 5)) +
                1000 * parseInt(timelineStr.substring(6, 8)) +
                parseInt(timelineStr.substring(9, 11)) * 10;
            if (timedelta >= timeline) {
                /*
                 * | timeline |
                 * |    00.30 | timedelta
                 * |    01.00 |
                 * |    01.30 |
                 * |    02.00 |
                 * |    02.30 |
                 * |    03.00 |
                 */
                this.player.group.position.set(
                    this.playerlog[i][2], this.playerlog[i][3], this.playerlog[i][4]
                );
                this.player.viewLaserRotate(
                    this.playerlog[i][5], this.playerlog[i][6], this.playerlog[i][7]
                );
            }
        }
        for (let i=0; i < this.objects.length; i++) {
            for (let j=0; j < this.objectlogs[i].length; j++) {
                const timelineStr = this.objectlogs[i][j][1]
                const timeline = 60 * 1000 * parseInt(timelineStr.substring(3, 5)) +
                    1000 * parseInt(timelineStr.substring(6, 8)) +
                    parseInt(timelineStr.substring(9, 11)) * 10;
                if (timedelta >= timeline) {
                    this.objects[i].group.position.set(
                        this.objectlogs[i][j][3], 0, this.objectlogs[i][j][4],
                    );
                }
            }
        }
    }

    this.end = () => {
        scene.remove(this.player.group);
        for (let i=0; i < this.objects.length; i++) {
            scene.remove(this.objects[i].group);
        }
    };
}

class App {

    init = () => {
        this.createCanvas();
        this.setupThreeJS();
        requestAnimationFrame(this.render);
    }

    createCanvas() {
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            preserveDrawingBuffer: true,
        });
        this.renderer.autoClear = false;
        this.resizeCanvas();
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        document.getElementById("cvs").appendChild(this.renderer.domElement);
    }

    resizeCanvas() {
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth * 0.75, window.innerHeight * 0.90);
    }

    setupThreeJS() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color( 0x000000 );

        this.camera = new THREE.PerspectiveCamera();
        this.camera.position.set(0, 30, 0);
        this.camera.lookAt(new THREE.Vector3(0, 0, 0));
        
        this.scene.add(this.camera);

        this.light = new THREE.AmbientLight(0xffffff, 1);
        this.light.position.set(0, 0, 0);
        this.scene.add(this.light);

        this.currentScene = new Waiting(this.scene);

        this.floorBox = new THREE.Mesh(
            new THREE.BoxGeometry(500, 0.01, 500),
           new THREE.MeshPhongMaterial({ color: 0x45ffa8 })
        );
        this.floorBox.position.set(0, -0.02, 0);
        this.scene.add(this.floorBox);

        this.roadBox = new THREE.Mesh(
            new THREE.BoxGeometry(500, 0.01, 6),
            new THREE.MeshPhongMaterial({ color: 0x9fa6a3}),
        );
        this.roadBox.position.set(0, -0.01, 3.3);
        this.scene.add(this.roadBox);

        this.controls = new OrbitControls( this.camera, this.renderer.domElement );
        this.controls.listenToKeyEvents( window );

        this.controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
        this.controls.dampingFactor = 0.05;

        this.controls.screenSpacePanning = false;

        this.controls.minDistance = 30;
        this.controls.maxDistance = 200;

        this.controls.maxPolarAngle = Math.PI / 2;

    }

    render = () => {
        requestAnimationFrame(this.render);
        this.currentScene.loop();
        this.renderer.render(this.scene, this.camera);
    }

    onGameIDSelected = (gameid) => {
        this.currentScene.end();
        this.currentScene = new Replay(this.scene, this.db, gameid);
    }

}

window.app = new App();
window.app.init();

window.addEventListener("resize", () => {
    window.app.resizeCanvas();
});

const SQL = await initSqlJs({
    locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.6.2/${file}`
});

const dbpath = "/vroudan.sqlite3";

let xhr = new XMLHttpRequest();
xhr.open('GET', dbpath, true);
xhr.responseType = 'arraybuffer';
xhr.onload = function() {
    let data = new Uint8Array(this.response);
    let db = new SQL.Database(data);
    const result = db.exec("SELECT gameid FROM games;");
    let gamelist = document.getElementById("gamelist");
    for (let i in result[0].values) {
        const game = result[0].values[i][0];
        const opt = document.createElement("option");
        opt.value = game;
        opt.innerHTML = game;
        gamelist.appendChild(opt);
    }
    window.app.db = db;
};
xhr.send();

document.getElementById("gamelist").addEventListener("change", (event) => {
    window.app.onGameIDSelected(event.target.value);
});
