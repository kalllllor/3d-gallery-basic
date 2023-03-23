import GUI from "lil-gui";
import {
  AmbientLight,
  AxesHelper,
  Clock,
  GridHelper,
  Mesh,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PointLight,
  PointLightHelper,
  Scene,
  TextureLoader,
  WebGLRenderer,
  MeshBasicMaterial,
  sRGBEncoding,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Stats from "three/examples/jsm/libs/stats.module";
import * as animations from "./animations";
import { toggleFullScreen } from "./helpers/fullscreen";
import { resizeRendererToDisplaySize } from "./helpers/responsiveness";

import "./style.css";

import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { FirstPersonControls } from "three/examples/jsm/controls/FirstPersonControls.js";

const CANVAS_ID = "scene";

let canvas: HTMLElement;
let renderer: WebGLRenderer;
let scene: Scene;

let ambientLight: AmbientLight;
let pointLight: PointLight;
let cube: Mesh;
let camera: PerspectiveCamera;
let cameraControls: OrbitControls;
let axesHelper: AxesHelper;
let pointLightHelper: PointLightHelper;
let clock: Clock;
let stats: Stats;
let gui: GUI;
let gltfLoader: GLTFLoader;
let textureLoader: TextureLoader;
let firstPersonControls: FirstPersonControls;

const animation = { enabled: false, play: true };

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
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFSoftShadowMap;
    scene = new Scene();
  }

  // ===== MODEL =====
  {
    gltfLoader = new GLTFLoader();
    textureLoader = new TextureLoader();

    // MATERIALS
    const baseWallsTexture = textureLoader.load(
      "/texture/baked/sciana-infinity-01-biala.png"
    );
    baseWallsTexture.encoding = sRGBEncoding;
    baseWallsTexture.flipY = false;
    const baseWallsMaterial =
      new MeshBasicMaterial({
        map: baseWallsTexture,
      });

    const blueDogTexture = textureLoader.load(
      "/texture/baked/blue-dog.png"
    );
    blueDogTexture.encoding = sRGBEncoding;
    blueDogTexture.flipY = false;
    const blueDogMaterial = new MeshBasicMaterial(
      {
        map: blueDogTexture,
      }
    );

    gltfLoader.load(
      "/model/galeria_nowa.glb",
      (gltf) => {
        gltf.scene.traverse((child) => {
          console.log(child.name);
          child.name === "UCX_Cube129" &&
            (child.material = baseWallsMaterial);

          child.name === "default2" &&
            (child.material = blueDogMaterial);
        });
        scene.add(gltf.scene);
        console.log(gltf.scene);
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
      100
    );
    pointLight.position.set(0.15, 1.5, 25);
    pointLight.castShadow = true;
    pointLight.shadow.radius = 4;
    pointLight.shadow.camera.near = 0.5;
    pointLight.shadow.camera.far = 4000;
    pointLight.shadow.mapSize.width = 2048;
    pointLight.shadow.mapSize.height = 2048;
    scene.add(ambientLight);
    scene.add(pointLight);
  }

  // ===== 🎥 CAMERA =====
  {
    camera = new PerspectiveCamera(
      50,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 50, 0);
  }

  // ===== 🕹️ CONTROLS =====
  {
    firstPersonControls = new FirstPersonControls(
      camera,
      renderer.domElement
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
      pointLight,
      undefined,
      "orange"
    );
    pointLightHelper.visible = true;
    scene.add(pointLightHelper);
  }

  // ===== 📈 STATS & CLOCK =====
  {
    clock = new Clock();
    stats = Stats();
    document.body.appendChild(stats.dom);
  }

  // ==== 🐞 DEBUG GUI ====
  {
    gui = new GUI({
      title: "🐞 Debug GUI",
      width: 300,
    });

    // persist GUI state in local storage on changes
    gui.onFinishChange(() => {
      const guiState = gui.save();
      localStorage.setItem(
        "guiState",
        JSON.stringify(guiState)
      );
    });

    // load GUI state if available in local storage
    const guiState =
      localStorage.getItem("guiState");
    if (guiState) gui.load(JSON.parse(guiState));

    // reset GUI state button
    const resetGui = () => {
      localStorage.removeItem("guiState");
      gui.reset();
    };
    gui
      .add({ resetGui }, "resetGui")
      .name("RESET");

    gui.close();
  }
}

function animate() {
  requestAnimationFrame(animate);

  stats.update();

  if (animation.enabled && animation.play) {
    animations.rotate(cube, clock, Math.PI / 3);
    animations.bounce(cube, clock, 1, 0.5, 0.5);
  }

  if (resizeRendererToDisplaySize(renderer)) {
    const canvas = renderer.domElement;
    camera.aspect =
      canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }
  firstPersonControls.update(0.1);
  renderer.render(scene, camera);
}
