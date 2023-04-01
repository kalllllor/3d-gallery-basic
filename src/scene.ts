import {
  AmbientLight,
  AxesHelper,
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
  sRGBEncoding,
  RepeatWrapping,
  Raycaster,
} from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";

import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

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
let thirdPointLight: PointLight;
let fourthPointLight: PointLight;
let camera: PerspectiveCamera;
let cameraControls: PointerLockControls;
let axesHelper: AxesHelper;
let pointLightHelper: PointLightHelper;
let gltfLoader: GLTFLoader;
let dracoLoader: DRACOLoader;
let textureLoader: TextureLoader;
let raycaster: Raycaster;
let paintings: any;
let paintingsOutlines: any;
let activePainting: any;
let balloonBoxes: any = [];
let moveForward: boolean = false;
let moveBackward: boolean = false;
let moveLeft: boolean = false;
let moveRight: boolean = false;
let canJump: boolean = false;

let prevTime = performance.now();
const velocity: Vector3 = new Vector3();
const direction: Vector3 = new Vector3();

const sizes: any = {
  width: window.innerWidth,
  height: window.innerHeight,
};

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
    renderer.outputEncoding = sRGBEncoding;

    scene = new Scene();
  }

  // ===== MODEL =====
  {
    gltfLoader = new GLTFLoader();
    textureLoader = new TextureLoader();
    dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath(
      "/examples/jsm/libs/draco"
    );
    gltfLoader.setDRACOLoader(dracoLoader);

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
        // envMap: hdrEquirect,
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

    const baseWallsReflectionTexture =
      textureLoader.load(
        "/texture/baked/wall-infinity-grey.001.png"
      );
    baseWallsReflectionTexture.flipY = false;

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

    const baseWallsReflectionMaterial =
      new MeshBasicMaterial({
        map: baseWallsReflectionTexture,
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
      "/model/galeria-baked-textures.glb",
      (gltf) => {
        // ==== outlines ====

        gltf.scene.traverse((child) => {
          if (child.name.includes("outline")) {
            child.visible = false;
          }

          if (child.name.includes("box")) {
            balloonBoxes.push(child);
          }
        });

        const baseWalls: any =
          gltf.scene.children.find(
            (child) =>
              child.name === "wall-infinity-biala"
          );

        const baseWallsReflection: any =
          gltf.scene.children.find(
            (child) =>
              child.name === "wall-infinit-grey"
          );

        const blackWalls: any =
          gltf.scene.children.find(
            (child) =>
              child.name === "UCX_Cube125"
          );

        const blueDogBox: any =
          gltf.scene.children.find(
            (child) =>
              child.name === "blue-dog_box"
          );

        const pinkDogBox: any =
          gltf.scene.children.find(
            (child) =>
              child.name === "pink-dog_box"
          );

        baseWalls &&
          (baseWalls.material =
            baseWallsMaterial);

        baseWallsReflection &&
          (baseWallsReflection.material =
            baseWallsReflectionMaterial);

        blackWalls &&
          (blackWalls.material =
            blackWallsMaterial);
        blueDogBox &&
          (blueDogBox.material =
            blueDogBoxMaterial);
        pinkDogBox &&
          (pinkDogBox.material =
            pinkDogBoxMaterial);

        paintings = gltf.scene.children.filter(
          (el) =>
            el.name.includes("obraz") ||
            el.name.includes("dog")
        );

        paintingsOutlines =
          gltf.scene.children.filter((el) =>
            el.name.includes("outline")
          );

        paintings = paintings.filter(function (
          el: any
        ) {
          return (
            paintingsOutlines.indexOf(el) < 0
          );
        });

        const outlineMat = new MeshBasicMaterial({
          color: 0xffffff,
        });

        for (const outline of paintingsOutlines) {
          outline.material = outlineMat;
        }

        scene.add(gltf.scene);
      },
      (xhr) => {
        const LoadingBarRef =
          document.getElementById("loading");
        LoadingBarRef &&
          (LoadingBarRef.innerHTML = `Loading ${Math.floor(
            (xhr.loaded / xhr.total) * 100
          )}%`);

        if (xhr.loaded / xhr.total > 0.99) {
          LoadingBarRef &&
            (LoadingBarRef.style.display =
              "none");
        }
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
      0.5,
      30
    );
    pointLight.position.set(0.15, 3, -17);

    secondPointLight = new PointLight(
      "#ffffff",
      0.5,
      30
    );
    secondPointLight.position.set(0, 3, 6);

    thirdPointLight = new PointLight(
      "#ffffff",
      0.5,
      30
    );
    thirdPointLight.position.set(0, 3, 29);

    fourthPointLight = new PointLight(
      "#ffffff",
      0.5,
      30
    );
    fourthPointLight.position.set(0, 3, 55);

    scene.add(
      ambientLight,
      pointLight,
      secondPointLight,
      thirdPointLight,
      fourthPointLight
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

  // ===== RAYCASTER =====
  {
    raycaster = new Raycaster();

    const descriptionRef =
      document.getElementById("painting-desc");

    const paintingTitleRef =
      document.getElementById("content_title");

    const paintingArtistRef =
      document.getElementById("content_artist");

    const paintingDescriptionRef =
      document.getElementById(
        "content_description"
      );

    const paintingImageRef = <HTMLImageElement>(
      document.getElementById("content_image")
    );

    const blockerRef =
      document.getElementById("blocker");

    const exitBtn = document.getElementById(
      "exit-button"
    );

    exitBtn &&
      (exitBtn.onclick = function () {
        activePainting = null;
        descriptionRef &&
          (descriptionRef.style.display = "none");
        cameraControls.lock();
      });

    const onClick = () => {
      if (
        !activePainting ||
        blockerRef?.style.display == "block"
      )
        return;

      paintingTitleRef &&
        (paintingTitleRef.innerHTML =
          "Artwork name");

      paintingArtistRef &&
        (paintingArtistRef.innerHTML = "Author");

      paintingDescriptionRef &&
        (paintingDescriptionRef.innerHTML =
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut quis mattis augue. Vivamus vel tellus porta sapien porttitor posuere. Aliquam non efficitur purus. Suspendisse vel enim id enim vulputate pharetra. Aliquam eu mauris mi. Sed interdum odio leo, sagittis elementum augue ullamcorper et. Curabitur luctus, turpis vitae tristique pharetra, ante tortor scelerisque ex, id lobortis turpis lectus ac est. Aliquam turpis lorem, congue sit amet hendrerit ut, posuere vel massa. Donec tincidunt lorem quis libero dapibus aliquam. In tempor tristique aliquam. Donec ullamcorper consequat sollicitudin.");

      paintingImageRef &&
        (paintingImageRef.src = `/texture/paintings/${activePainting.name}.jpg`);

      descriptionRef &&
        activePainting &&
        ((descriptionRef.style.display = "block"),
        cameraControls.unlock());
    };

    document.addEventListener("click", onClick);
  }

  // ===== 🕹️ CONTROLS =====
  {
    cameraControls = new PointerLockControls(
      camera,
      document.body
    );

    cameraControls.maxPolarAngle = Math.PI / 2;
    cameraControls.minPolarAngle = Math.PI / 2.5;

    const blockerRef =
      document.getElementById("blocker");
    const instructionsRef =
      document.getElementById("instructions");
    const paintingRef = document.getElementById(
      "painting-desc"
    );

    instructionsRef?.addEventListener(
      "click",
      function () {
        cameraControls.lock();
      }
    );

    cameraControls.addEventListener(
      "lock",
      function () {
        blockerRef &&
          (blockerRef.style.display = "none");
      }
    );

    cameraControls.addEventListener(
      "unlock",
      function () {
        blockerRef &&
          paintingRef?.style.display === "none" &&
          (blockerRef.style.display = "block");
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
  }

  // ===== 🪄 HELPERS =====
  {
    axesHelper = new AxesHelper(4);
    axesHelper.visible = false;
    scene.add(axesHelper);

    pointLightHelper = new PointLightHelper(
      fourthPointLight,
      undefined,
      "orange"
    );
    pointLightHelper.visible = true;
  }
}

function animate() {
  requestAnimationFrame(animate);
  const time = performance.now();

  if (cameraControls.isLocked === true) {
    const delta = (time - prevTime) / 1000;

    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;

    if (camera.position.z < -26.5) {
      camera.position.z = -26.49;
      velocity.z = 0;
    } else if (camera.position.z > 62.5) {
      camera.position.z = 62.49;
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
      sizes.width = window.innerWidth;
      sizes.height = window.innerHeight;
      const canvas = renderer.domElement;
      camera.aspect =
        canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }
  }

  raycaster.setFromCamera(new Vector2(), camera);

  if (paintings) {
    activePainting = null;
    const intersects: any =
      raycaster.intersectObjects(paintings);

    for (
      let i = 0;
      i < paintingsOutlines.length;
      i++
    ) {
      paintingsOutlines[i].visible = false;
    }

    for (
      let i = 0;
      i < balloonBoxes.length;
      i++
    ) {
      balloonBoxes[i].material.color.set(
        0xffffff
      );
    }

    if (intersects.length) {
      activePainting = intersects[0].object;
      if (activePainting.name.includes("obraz")) {
        const activeOutline =
          paintingsOutlines.find(
            (el: any) =>
              el.name ==
              activePainting.name + "_outline"
          );

        if (
          activePainting.position.distanceTo(
            camera.position
          ) < 10
        ) {
          activeOutline.visible = true;
        }
      } else if (
        activePainting.name.includes("dog")
      ) {
        const activeBox = balloonBoxes.find(
          (el: any) =>
            el.name.includes(activePainting.name)
        );

        activeBox.material.color.set(0x8c8c8c);
      }
    }
  }

  prevTime = time;

  renderer.render(scene, camera);
}
