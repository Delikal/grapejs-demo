const socket = io();

// Funkce pro načtení stavu proměnné z localStorage nebo použití default hodnoty
function loadState(key, defaultValue) {
  const storedValue = localStorage.getItem(key);
  if (storedValue !== null) {
    return JSON.parse(storedValue); // Převede uložený řetězec zpět na boolean
  } else {
    localStorage.setItem(key, JSON.stringify(defaultValue)); // Uloží default hodnotu
    return defaultValue;
  }
}

// Načtení stavů proměnných z localStorage nebo nastavení výchozích hodnot
let reverse = loadState("reverse", false); // Zpátečka
let down_ligths = loadState("down_lights", false);
let motor_enable = loadState("motor_enable", false);
let reset_movement = loadState("reset_movement", false);
let tank_mode = loadState("tank_mode", false);
let first_speed = loadState("first_speed", false);
let second_speed = loadState("second_speed", false);
let third_speed = loadState("third_speed", false);
let reset_scanner = loadState("reset_scanner", false);
let baseSpeed = 0;

let foceni = loadState("foceni", false);
let etl = loadState("etl", false);

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

  // Inicializace proměnné pro upravenou hodnotu beta
  let adjustedBeta = 0;

  if (gamma > 0) {
    // Když je gamma kladná, používáme nulový stav bety od 180 nebo -180
    if (beta > 0) {
      // Pokud jsme v kladných číslech beta, nulový stav je od 180
      adjustedBeta = beta - 180;
    } else {
      // Pokud jsme v záporných číslech beta, nulový stav je od -180
      adjustedBeta = beta + 180;
    }
  } else {
    // Když je gamma záporná, používáme nulový stav od 0
    adjustedBeta = beta * -1;
  }
  const exponent = 0.5; // Zvolte exponent podle potřeby, například 1, 2, atd.
  adjustedBeta =
    Math.sign(adjustedBeta) * Math.exp(Math.abs(adjustedBeta) ** exponent);

  adjustedBeta = Math.round(adjustedBeta);

  // Inicializujeme proměnné pro motory
  let levymotor = document.getElementById("verticalSlider").value;
  let pravymotor = document.getElementById("verticalSlider").value;
  let dConstant = 2500;
  if (adjustedBeta > 0) {
    pravymotor =
      document.getElementById("verticalSlider").value *
      (1 + adjustedBeta / dConstant);
    levymotor =
      document.getElementById("verticalSlider").value *
      (1 - adjustedBeta / dConstant);
  } else {
    pravymotor =
      document.getElementById("verticalSlider").value *
      (1 + adjustedBeta / dConstant);
    levymotor =
      document.getElementById("verticalSlider").value *
      (1 - adjustedBeta / dConstant);
  }

  // Omezení hodnot motorů na rozsah 0 až 100
  levymotor = Math.max(Math.min(levymotor, 100), 0);
  pravymotor = Math.max(Math.min(pravymotor, 100), 0);

  if (reverse) {
    levymotor = levymotor * -1;
    pravymotor = pravymotor * -1;
  }

  if (tank_mode) {
    if (adjustedBeta > 0) {
      pravymotor =
        document.getElementById("verticalSlider").value *
        (1 + Math.abs(adjustedBeta) / dConstant) *
        -1;
      levymotor =
        document.getElementById("verticalSlider").value *
        (1 + Math.abs(adjustedBeta) / dConstant);
    } else {
      pravymotor =
        document.getElementById("verticalSlider").value *
        (1 + Math.abs(adjustedBeta) / dConstant);
      levymotor =
        document.getElementById("verticalSlider").value *
        (1 + Math.abs(adjustedBeta) / dConstant) *
        -1;
    }

    levymotor = Math.max(-100, Math.min(100, levymotor));
    pravymotor = Math.max(-100, Math.min(100, pravymotor));
  }

  document.getElementById("left-motor-speed").innerHTML = Math.round(levymotor);
  document.getElementById("right-motor-speed").innerHTML =
    Math.round(pravymotor);

  const data = {
    levymotor: Math.round(levymotor),
    pravymotor: Math.round(pravymotor),
  };

  // Odešlete upravená data z události deviceorientation na server
  socket.emit("deviceOrientation", data);
}

function handleSteeringInput() {
  // Inicializace proměnné pro upravenou hodnotu beta
  let adjustedBeta = document.getElementById("horizontalSlider").value;

  const exponent = 0.5; // Zvolte exponent podle potřeby, například 1, 2, atd.
  adjustedBeta =
    Math.sign(adjustedBeta) * Math.exp(Math.abs(adjustedBeta) ** exponent);

  adjustedBeta = Math.round(adjustedBeta);

  // Inicializujeme proměnné pro motory
  let levymotor = document.getElementById("verticalSlider").value;
  let pravymotor = document.getElementById("verticalSlider").value;
  let dConstant = 2500;
  if (adjustedBeta > 0) {
    pravymotor =
      document.getElementById("verticalSlider").value *
      (1 + adjustedBeta / dConstant);
    levymotor =
      document.getElementById("verticalSlider").value *
      (1 - adjustedBeta / dConstant);
  } else {
    pravymotor =
      document.getElementById("verticalSlider").value *
      (1 + adjustedBeta / dConstant);
    levymotor =
      document.getElementById("verticalSlider").value *
      (1 - adjustedBeta / dConstant);
  }

  // Omezení hodnot motorů na rozsah 0 až 100
  levymotor = Math.max(Math.min(levymotor, 100), 0);
  pravymotor = Math.max(Math.min(pravymotor, 100), 0);

  if (reverse) {
    levymotor = levymotor * -1;
    pravymotor = pravymotor * -1;
  }

  if (tank_mode) {
    if (adjustedBeta > 0) {
      pravymotor =
        document.getElementById("verticalSlider").value *
        (1 + Math.abs(adjustedBeta) / dConstant) *
        -1;
      levymotor =
        document.getElementById("verticalSlider").value *
        (1 + Math.abs(adjustedBeta) / dConstant);
    } else {
      pravymotor =
        document.getElementById("verticalSlider").value *
        (1 + Math.abs(adjustedBeta) / dConstant);
      levymotor =
        document.getElementById("verticalSlider").value *
        (1 + Math.abs(adjustedBeta) / dConstant) *
        -1;
    }

    levymotor = Math.max(-100, Math.min(100, levymotor));
    pravymotor = Math.max(-100, Math.min(100, pravymotor));
  }

  document.getElementById("left-motor-speed").innerHTML = Math.round(levymotor);
  document.getElementById("right-motor-speed").innerHTML =
    Math.round(pravymotor);

  const data = {
    levymotor: Math.round(levymotor),
    pravymotor: Math.round(pravymotor),
  };

  // Odešlete upravená data z události deviceorientation na server
  socket.emit("deviceOrientation", data);
}

document
  .getElementById("horizontalSlider")
  .addEventListener("change", handleSteeringInput);

document
  .getElementById("verticalSlider")
  .addEventListener("change", handleSteeringInput);

document
  .getElementById("horizontalSlider")
  .addEventListener("input", handleSteeringInput);

document
  .getElementById("verticalSlider")
  .addEventListener("input", handleSteeringInput);

// Zavolejte funkci pro ověření podpory
checkDeviceOrientationSupport();

// tlačítko ovladač
document.getElementById("button-movement").addEventListener("click", () => {
  reset_movement = !reset_movement;
  console.log(reset_movement);
  localStorage.setItem("reset_movement", JSON.stringify(reset_movement));
  if (reset_movement) {
    document.getElementById("button-movement").classList.add("active");
  } else {
    document.getElementById("button-movement").classList.remove("active");
  }
  socket.emit("buttonMovement", { message: "Ovladač připojen" });
});

if (reset_movement) {
  document.getElementById("button-movement").classList.add("active");
} else {
  document.getElementById("button-movement").classList.remove("active");
}

// tlačítko ovladač
document.getElementById("button-motor").addEventListener("click", () => {
  motor_enable = !motor_enable;
  localStorage.setItem("motor_enable", JSON.stringify(motor_enable));
  if (motor_enable) {
    document.getElementById("button-motor").classList.add("active");
  } else {
    document.getElementById("button-motor").classList.remove("active");
  }
  socket.emit("buttonMotor", { message: motor_enable });
});

if (motor_enable) {
  document.getElementById("button-motor").classList.add("active");
} else {
  document.getElementById("button-motor").classList.remove("active");
}

document.getElementById("button-firstspeed").addEventListener("click", () => {
  first_speed = !first_speed;
  localStorage.setItem("first_speed", JSON.stringify(first_speed));
  if (first_speed) {
    document.getElementById("button-firstspeed").classList.add("active");
  } else {
    document.getElementById("button-firstspeed").classList.remove("active");
  }
  socket.emit("buttonSpeed", { message: 100 });
});

if (first_speed) {
  document.getElementById("button-firstspeed").classList.add("active");
} else {
  document.getElementById("button-firstspeed").classList.remove("active");
}

document.getElementById("button-secondspeed").addEventListener("click", () => {
  second_speed = !second_speed;
  localStorage.setItem("second_speed", JSON.stringify(second_speed));
  if (second_speed) {
    document.getElementById("button-secondspeed").classList.add("active");
  } else {
    document.getElementById("button-secondspeed").classList.remove("active");
  }
  socket.emit("buttonSpeed", { message: 300 });
});

if (second_speed) {
  document.getElementById("button-secondspeed").classList.add("active");
} else {
  document.getElementById("button-secondspeed").classList.remove("active");
}

document.getElementById("button-thirdspeed").addEventListener("click", () => {
  third_speed = !third_speed;
  localStorage.setItem("third_speed", JSON.stringify(third_speed));
  if (third_speed) {
    document.getElementById("button-thirdspeed").classList.add("active");
  } else {
    document.getElementById("button-thirdspeed").classList.remove("active");
  }
  socket.emit("buttonSpeed", { message: 500 });
});

if (third_speed) {
  document.getElementById("button-thirdspeed").classList.add("active");
} else {
  document.getElementById("button-thirdspeed").classList.remove("active");
}

document.getElementById("button-resetscanner").addEventListener("click", () => {
  reset_scanner = !reset_scanner;
  localStorage.setItem("reset_scanner", JSON.stringify(reset_scanner));
  if (reset_scanner) {
    document.getElementById("button-resetscanner").classList.add("active");
  } else {
    document.getElementById("button-resetscanner").classList.remove("active");
  }
  socket.emit("buttonScanner", { message: reset_scanner });
});

if (reset_scanner) {
  document.getElementById("button-resetscanner").classList.add("active");
} else {
  document.getElementById("button-resetscanner").classList.remove("active");
}

// tlacitko zapni foceni kamer
// document.getElementById("button-foceni").addEventListener("click", () => {
//   foceni = !foceni;
//   localStorage.setItem("foceni", JSON.stringify(foceni));
//   if (foceni) {
//     document.getElementById("button-foceni").classList.add("active");
//   } else {
//     document.getElementById("button-foceni").classList.remove("active");
//   }
//   socket.emit("button-foceni", { message: foceni });
// });

// if (foceni) {
//   document.getElementById("button-foceni").classList.add("active");
// } else {
//   document.getElementById("button-foceni").classList.remove("active");
// }

// tlacitko zapni etl
// document.getElementById("button-etl").addEventListener("click", () => {
//   etl = !etl;
//   localStorage.setItem("etl", JSON.stringify(etl));
//   if (etl) {
//     document.getElementById("button-etl").classList.add("active");
//   } else {
//     document.getElementById("button-etl").classList.remove("active");
//   }
//   socket.emit("button-etl", { message: etl });
// });

// if (etl) {
//   document.getElementById("button-etl").classList.add("active");
// } else {
//   document.getElementById("button-etl").classList.remove("active");
// }

// tlačítko ovladač
document.getElementById("button-lights").addEventListener("click", () => {
  down_ligths = !down_ligths;
  localStorage.setItem("down_ligths", JSON.stringify(down_ligths));
  if (down_ligths) {
    document.getElementById("button-lights").classList.add("active");
  } else {
    document.getElementById("button-lights").classList.remove("active");
  }
  socket.emit("buttonLights", { message: down_ligths });
});

if (down_ligths) {
  document.getElementById("button-lights").classList.add("active");
} else {
  document.getElementById("button-lights").classList.remove("active");
}

// tlačítko ovladač
document.getElementById("button-reverse").addEventListener("click", () => {
  reverse = !reverse;
  console.log(reverse);
  localStorage.setItem("reverse", JSON.stringify(reverse));
  if (reverse) {
    document.getElementById("button-reverse").classList.add("active");
  } else {
    document.getElementById("button-reverse").classList.remove("active");
  }
});

if (reverse) {
  document.getElementById("button-reverse").classList.add("active");
} else {
  document.getElementById("button-reverse").classList.remove("active");
}

document.getElementById("button-tank").addEventListener("click", () => {
  tank_mode = !tank_mode;
  localStorage.setItem("tank_mode", JSON.stringify(tank_mode));
  if (tank_mode) {
    document.getElementById("button-tank").classList.add("active");
  } else {
    document.getElementById("button-tank").classList.remove("active");
  }
});

if (tank_mode) {
  document.getElementById("button-tank").classList.add("active");
} else {
  document.getElementById("button-tank").classList.remove("active");
}

document.getElementById("verticalSlider").oninput = function () {
  baseSpeed = this.value; // Vypíše hodnotu slideru do konzole
};
