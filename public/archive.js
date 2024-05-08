const socket = io();

let reverse = false; // Zpátečka
let down_ligths = false;
let motor_enable = false;
let reset_movement = false;

document
  .getElementById("requestPermissionButton")
  .addEventListener("click", function () {
    if (typeof DeviceOrientationEvent.requestPermission === "function") {
      // Požádání o povolení pro iOS 13+
      DeviceOrientationEvent.requestPermission()
        .then((permissionState) => {
          if (permissionState === "granted") {
            // Uživatel udělil povolení, můžeme přidat posluchač události
            window.addEventListener(
              "deviceorientation",
              handleDeviceOrientation,
              false
            );
            console.log("Permission granted");
          } else {
            // Uživatel povolení neudělil
            console.log("Permission not granted");
          }
        })
        .catch(console.error);
    } else {
      // Systémy, které nevyžadují explicitní povolení
      window.addEventListener(
        "deviceorientation",
        handleDeviceOrientation,
        false
      );
      console.log("Permission request not required");
    }
  });

function checkDeviceOrientationSupport() {
  if ("DeviceOrientationEvent" in window) {
    // Kontrola, zda je požadována explicitní žádost o povolení
    if (typeof DeviceOrientationEvent.requestPermission === "function") {
      DeviceOrientationEvent.requestPermission()
        .then((permissionState) => {
          if (permissionState === "granted") {
            // Povolení bylo uděleno, můžeme zaregistrovat posluchače události
            window.addEventListener(
              "deviceorientation",
              handleDeviceOrientation,
              false
            );

            // Informování serveru o podpoře a povolení deviceorientation
            socket.emit("deviceOrientationSupport", {
              supported: true,
              granted: true,
            });
          } else {
            // Uživatel povolení neudělil
            socket.emit("deviceOrientationSupport", {
              supported: true,
              granted: false,
            });
          }
        })
        .catch((error) => {
          console.error(
            `DeviceOrientationEvent.requestPermission error: ${error}`
          );
          socket.emit("deviceOrientationSupport", {
            supported: true,
            granted: false,
            error: error.toString(),
          });
        });
    } else {
      // Prohlížeče, které nevyžadují explicitní povolení
      window.addEventListener(
        "deviceorientation",
        handleDeviceOrientation,
        false
      );
      socket.emit("deviceOrientationSupport", {
        supported: true,
        granted: "not_required",
      });
    }
  } else {
    // DeviceOrientation není podporován
    socket.emit("deviceOrientationSupport", { supported: false });
  }
}

function handleDeviceOrientation(event) {
  const gamma = Math.round(event.gamma);
  const beta = Math.round(event.beta);

  // Základní rychlost motorů před aplikací zatáčení
  let baseSpeed = 0;

  // Pohyb dopředu a dozadu založený na gamma
  if (gamma >= -89 && gamma <= -40) {
    baseSpeed = Math.round(((gamma + 89) / 49) * 100);
  } else if (gamma >= -39 && gamma <= -1) {
    baseSpeed = 100;
  }

  // Dynamicky upravíme rozdíl v rychlosti motorů na základě baseSpeed
  const speedAdjustmentFactor = 1 - baseSpeed / 100; // Tímto vytvoříme inverzní vztah

  // Inicializujeme proměnné pro motory
  let levymotor = baseSpeed;
  let pravymotor = baseSpeed;

  // Normalizace beta pro zatáčení: od 0 do 30 a od 0 do -30
  let turnAdjustment = 0;
  if (beta > 0 && beta <= 30) {
    // Zatáčení doleva
    turnAdjustment = (beta / 30) * 100 * speedAdjustmentFactor;
    levymotor -= turnAdjustment; // Upravujeme levý motor
    pravymotor += Math.min(turnAdjustment, 10); // Zajistíme, že pravý motor se zvyšuje maximálně o 10%
  } else if (beta < 0 && beta >= -30) {
    // Zatáčení doprava
    turnAdjustment = (Math.abs(beta) / 30) * 100 * speedAdjustmentFactor;
    pravymotor -= turnAdjustment; // Upravujeme pravý motor
    levymotor += Math.min(turnAdjustment, 10); // Zajistíme, že levý motor se zvyšuje maximálně o 10%
  }

  // Omezení hodnot motorů na rozsah 0 až 100
  levymotor = Math.max(Math.min(levymotor, 100), 0);
  pravymotor = Math.max(Math.min(pravymotor, 100), 0);

  if (reverse) {
    levymotor = levymotor * -1;
    pravymotor = pravymotor * -1;
  }

  document.getElementById("left-motor-speed").innerHTML = Math.round(levymotor);
  document.getElementById("right-motor-speed").innerHTML =
    Math.round(pravymotor);

  const data = {
    //alpha: Math.round(event.alpha),
    //beta: beta,
    //gamma: gamma,
    levymotor: Math.round(levymotor),
    pravymotor: Math.round(pravymotor),
  };

  // Odešlete upravená data z události deviceorientation na server
  socket.emit("deviceOrientation", data);
}

// Zavolejte funkci pro ověření podpory
checkDeviceOrientationSupport();

// tlačítko ovladač
document.getElementById("button-movement").addEventListener("click", () => {
  reset_movement = !reset_movement;
  if (reset_movement) {
    document.getElementById("button-movement").classList.add("active");
  } else {
    document.getElementById("button-movement").classList.remove("active");
  }
  socket.emit("buttonMovement", { message: "Ovladač připojen" });
});

// tlačítko ovladač
document.getElementById("button-motor").addEventListener("click", () => {
  motor_enable = !motor_enable;
  if (motor_enable) {
    document.getElementById("button-motor").classList.add("active");
  } else {
    document.getElementById("button-motor").classList.remove("active");
  }
  socket.emit("buttonMotor", { message: "Ovladač připojen" });
});

// tlačítko ovladač
document.getElementById("button-lights").addEventListener("click", () => {
  down_ligths = !down_ligths;
  if (down_ligths) {
    document.getElementById("button-lights").classList.add("active");
  } else {
    document.getElementById("button-lights").classList.remove("active");
  }
  socket.emit("buttonLights", { message: down_ligths });
});

// tlačítko ovladač
document.getElementById("button-reverse").addEventListener("click", () => {
  reverse = !reverse;
  if (reverse) {
    document.getElementById("button-reverse").classList.add("active");
  } else {
    document.getElementById("button-reverse").classList.remove("active");
  }
});
