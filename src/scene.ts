import {
  AmbientLight,
  AxesHelper,
  Clock,
  PerspectiveCamera,
  PointLight,
  PointLightHelper,
  Scene,
  TextureLoader,
  WebGLRenderer,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  EquirectangularReflectionMapping,
  Vector2,
  Vector3,
  RepeatWrapping,
  Raycaster,
} from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";
import Stats from "three/examples/jsm/libs/stats.module";
import { toggleFullScreen } from "./helpers/fullscreen";
import { resizeRendererToDisplaySize } from "./helpers/responsiveness";

import "./style.css";

import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";

const CANVAS_ID = "scene";

let canvas: HTMLElement;
let renderer: WebGLRenderer;
let scene: Scene;
let ambientLight: AmbientLight;
let pointLight: PointLight;
let secondPointLight: PointLight;
let camera: PerspectiveCamera;
let cameraControls: PointerLockControls;
let axesHelper: AxesHelper;
let pointLightHelper: PointLightHelper;
let stats: Stats;
let gltfLoader: GLTFLoader;
let textureLoader: TextureLoader;

let moveForward: boolean = false;
let moveBackward: boolean = false;
let moveLeft: boolean = false;
let moveRight: boolean = false;
let canJump: boolean = false;

let prevTime = performance.now();
const velocity: Vector3 = new Vector3();
const direction: Vector3 = new Vector3();

const options = {
  enableSwoopingCamera: false,
  enableRotation: false,
  color: 0xffffff,
  metalness: 0,
  roughness: 0.2,
  transmission: 1,
  ior: 1.5,
  reflectivity: 0.5,
  thickness: 2.5,
  envMapIntensity: 1.5,
  clearcoat: 1,
  clearcoatRoughness: 0.1,
  normalScale: 0.3,
  clearcoatNormalScale: 0.2,
  normalRepeat: 5,
  bloomThreshold: 0.85,
  bloomStrength: 0.35,
  bloomRadius: 0.33,
};

init();
animate();

function init() {
  // ===== 🖼️ CANVAS, RENDERER, & SCENE =====
  {
    canvas = document.querySelector(
      `canvas#${CANVAS_ID}`
    )!;
    renderer = new WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, 2)
    );

    scene = new Scene();
  }

  // ===== MODEL =====
  {
    gltfLoader = new GLTFLoader();
    textureLoader = new TextureLoader();

    // GLASS
    const hdrEquirect = new RGBELoader().load(
      "/texture/empty_warehouse_01_2k.hdr",
      () => {
        hdrEquirect.mapping =
          EquirectangularReflectionMapping;
      }
    );

    const normalMapTexture = textureLoader.load(
      "/texture/normal.jpg"
    );
    normalMapTexture.wrapS = RepeatWrapping;
    normalMapTexture.wrapT = RepeatWrapping;
    normalMapTexture.repeat.set(
      options.normalRepeat,
      options.normalRepeat
    );

    const blackWallsMaterial =
      new MeshPhysicalMaterial({
        color: 0x1f1f1f,
        metalness: options.metalness,
        roughness: options.roughness,
        transmission: options.transmission,
        ior: options.ior,
        reflectivity: options.reflectivity,
        envMap: hdrEquirect,
        envMapIntensity: options.envMapIntensity,
        clearcoat: options.clearcoat,
        clearcoatRoughness:
          options.clearcoatRoughness,
        normalScale: new Vector2(
          options.normalScale
        ),
        normalMap: normalMapTexture,
        clearcoatNormalMap: normalMapTexture,
        clearcoatNormalScale: new Vector2(
          options.clearcoatNormalScale
        ),
      });

    // END OF GLASS

    // BAKED TEXTURES

    // TEXTURE LOADER

    const baseWallsTexture = textureLoader.load(
      "/texture/baked/sciana-infinity-01-biala.png"
    );
    baseWallsTexture.flipY = false;

    const baseWallsReverseTexture =
      textureLoader.load(
        "/texture/baked/wall-infinity-grey.001.png"
      );
    baseWallsReverseTexture.flipY = false;

    const blueDogBoxTexture = textureLoader.load(
      "/texture/baked/box-wiekszy-pies.png"
    );
    blueDogBoxTexture.flipY = false;

    const pinkDogBoxTexture = textureLoader.load(
      "/texture/baked/box-mniejszy-pies.png"
    );
    pinkDogBoxTexture.flipY = false;

    const baseWallsMaterial =
      new MeshBasicMaterial({
        map: baseWallsTexture,
      });

    const baseWallsReverseMaterial =
      new MeshBasicMaterial({
        map: baseWallsReverseTexture,
      });

    const blueDogBoxMaterial =
      new MeshBasicMaterial({
        map: blueDogBoxTexture,
      });

    const pinkDogBoxMaterial =
      new MeshBasicMaterial({
        map: pinkDogBoxTexture,
      });

    // mapping

    gltfLoader.load(
      "/model/galeria_nowa.glb",
      (gltf) => {
        const baseWalls: any =
          gltf.scene.children.find(
            (child) =>
              child.name === "UCX_Cube129"
          );

        const baseReverseWalls: any =
          gltf.scene.children.find(
            (child) =>
              child.name === "UCX_Cube11001"
          );

        const blackWalls: any =
          gltf.scene.children.find(
            (child) =>
              child.name === "UCX_Cube125"
          );

        const blueDogBox: any =
          gltf.scene.children.find(
            (child) =>
              child.name === "box-wiekszy-pies"
          );

        const pinkDogBox: any =
          gltf.scene.children.find(
            (child) =>
              child.name === "box-mniejszy-pies"
          );

        baseWalls &&
          (baseWalls.material =
            baseWallsMaterial);
        baseReverseWalls &&
          (baseReverseWalls.material =
            baseWallsReverseMaterial);
        blackWalls &&
          (blackWalls.material =
            blackWallsMaterial);
        blueDogBox &&
          (blueDogBox.material =
            blueDogBoxMaterial);
        pinkDogBox &&
          (pinkDogBox.material =
            pinkDogBoxMaterial);

        console.log(blueDogBox);
        scene.add(gltf.scene);
      },
      (xhr) => {
        console.log(
          (xhr.loaded / xhr.total) * 100 +
            "% loaded"
        );
      },
      () => {
        console.log("error");
      }
    );
  }

  // ===== 💡 LIGHTS =====
  {
    ambientLight = new AmbientLight("white", 0.5);
    pointLight = new PointLight(
      "#ffffff",
      1.2,
      30
    );
    pointLight.position.set(0.15, 1.5, 25);

    secondPointLight = new PointLight(
      "#ffffff",
      1.2,
      30
    );
    secondPointLight.position.set(0.15, 1.5, -43);
    scene.add(
      ambientLight,
      pointLight,
      secondPointLight
    );
  }

  // ===== 🎥 CAMERA =====
  {
    camera = new PerspectiveCamera(
      50,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, -3, 0);
  }

  // ===== 🕹️ CONTROLS =====
  {
    cameraControls = new PointerLockControls(
      camera,
      document.body
    );

    cameraControls.maxPolarAngle = Math.PI / 2;
    cameraControls.minPolarAngle = Math.PI / 2.5;

    const blocker =
      document.getElementById("blocker");
    const instructions = document.getElementById(
      "instructions"
    );

    instructions?.addEventListener(
      "click",
      function () {
        cameraControls.lock();
      }
    );

    cameraControls.addEventListener(
      "lock",
      function () {
        instructions &&
          (instructions.style.display = "none");
        blocker &&
          (blocker.style.display = "none");
      }
    );

    cameraControls.addEventListener(
      "unlock",
      function () {
        blocker &&
          (blocker.style.display = "block");
        instructions &&
          (instructions.style.display = "");
      }
    );

    scene.add(cameraControls.getObject());

    const onKeyDown = function (event: any) {
      switch (event.code) {
        case "ArrowUp":
        case "KeyW":
          moveForward = true;
          break;

        case "ArrowLeft":
        case "KeyA":
          moveLeft = true;
          break;

        case "ArrowDown":
        case "KeyS":
          moveBackward = true;
          break;

        case "ArrowRight":
        case "KeyD":
          moveRight = true;
          break;

        case "Space":
          if (canJump === true) velocity.y += 350;
          canJump = false;
          break;
      }
    };

    const onKeyUp = function (event: any) {
      switch (event.code) {
        case "ArrowUp":
        case "KeyW":
          moveForward = false;
          break;

        case "ArrowLeft":
        case "KeyA":
          moveLeft = false;
          break;

        case "ArrowDown":
        case "KeyS":
          moveBackward = false;
          break;

        case "ArrowRight":
        case "KeyD":
          moveRight = false;
          break;
      }
    };

    document.addEventListener(
      "keydown",
      onKeyDown
    );
    document.addEventListener("keyup", onKeyUp);

    raycaster = new Raycaster(
      new Vector3(),
      new Vector3(0, -1, 0),
      0,
      10
    );
    // Full screen
    window.addEventListener(
      "dblclick",
      (event) => {
        if (event.target === canvas) {
          toggleFullScreen(canvas);
        }
      }
    );
  }

  // ===== 🪄 HELPERS =====
  {
    axesHelper = new AxesHelper(4);
    axesHelper.visible = false;
    scene.add(axesHelper);

    pointLightHelper = new PointLightHelper(
      secondPointLight,
      undefined,
      "orange"
    );
    pointLightHelper.visible = true;
  }

  // ===== 📈 STATS & CLOCK =====
  {
    clock = new Clock();
    stats = Stats();
    document.body.appendChild(stats.dom);
  }
}

function animate() {
  requestAnimationFrame(animate);

  const time = performance.now();
  if (cameraControls.isLocked === true) {
    const delta = (time - prevTime) / 1000;

    velocity.x -= velocity.x * 10.0 * delta;
    camera.position.z > -57 &&
    camera.position.z < 35
      ? (velocity.z -= velocity.z * 10.0 * delta)
      : (velocity.z = 0);

    if (camera.position.z < -57) {
      camera.position.z = -56.99;
      velocity.z = 0;
    } else if (camera.position.z > 35) {
      camera.position.z = 34.99;
      velocity.z = 0;
    }

    if (camera.position.x > 6) {
      camera.position.x = 5.99;
      velocity.x = 0;
    } else if (camera.position.x < -5) {
      camera.position.x = -4.99;
      velocity.x = 0;
    }

    direction.z =
      Number(moveForward) - Number(moveBackward);
    direction.x =
      Number(moveRight) - Number(moveLeft);
    direction.normalize(); // this ensures consistent movements in all directions

    cameraControls.moveRight(-velocity.x * delta);
    cameraControls.moveForward(
      -velocity.z * delta
    );

    if (moveForward || moveBackward)
      velocity.z -= direction.z * 100.0 * delta;
    if (moveLeft || moveRight)
      velocity.x -= direction.x * 100.0 * delta;

    if (resizeRendererToDisplaySize(renderer)) {
      const canvas = renderer.domElement;
      camera.aspect =
        canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }
  }
  console.log(camera.position);
  prevTime = time;

  renderer.render(scene, camera);
}
