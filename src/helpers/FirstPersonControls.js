class InputController {
  constructor() {
    this.initialize_();
    this.current_ = {};
  }

  initialize_() {
    this.current_ = {
      leftButton: false,
      rightButton: false,
      mouseX: 0,
      mouseY: 0,
    };

    this.previous_ = null;
    this.keys_ = {};
    this.previousKeys_ = {};

    document.addEventListener(
      "mousedown",
      (e) => this.onMouseDown_(e),
      false
    );
    document.addEventListener(
      "mouseup",
      (e) => this.onMouseUp_(e),
      false
    );
    document.addEventListener(
      "mousemove",
      (e) => this.onMouseMove_(e),
      false
    );
    document.addEventListener(
      "keydown",
      (e) => this.onKeyDown_(e),
      false
    );
    document.addEventListener(
      "keyup",
      (e) => this.onKeyUp_(e),
      false
    );
  }

  onMouseDown_(e) {
    switch (e.button) {
      case 0: {
        this.current_.leftButton = true;
        break;
      }
      case 2: {
        this.current_.rightButton = true;
        break;
      }
    }
  }

  onMouseUp_(e) {
    switch (e.button) {
      case 0: {
        this.current_.leftButton = false;
        break;
      }
      case 2: {
        this.current_.rightButton = false;
        break;
      }
    }
  }

  onMouseMove_(e) {
    this.current_.mouseX =
      e.pageX - window.innerWidth / 2;
    this.current_.mouseY =
      e.pageY - window.innerHeight / 2;
  }

  onKeyDown_(e) {
    this.keys_[e.keyCode] = true;
  }
  onKeyUp_(e) {
    this.keys_[e.keyCode] = false;
  }

  update() {}
}

export default class FirstPersonCamera {
  constructor(camera) {
    this.camera_ = camera;
  }
}
