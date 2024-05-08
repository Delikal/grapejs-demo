// Přidání události pro kliknutí na tlačítko
let buttonMotor = document.getElementById("button-motor");
buttonMotor.addEventListener("click", function () {
  // Změna textu tlačítka
  if (buttonMotor.textContent === "Motor ON") {
    buttonMotor.textContent = "Motor OFF";
  } else {
    buttonMotor.textContent = "Motor ON";
  }
});

// Přidání události pro kliknutí na tlačítko
let buttonTank = document.getElementById("button-tank");
buttonTank.addEventListener("click", function () {
  // Změna textu tlačítka
  if (buttonTank.textContent === "Tank mode ON") {
    buttonTank.textContent = "Tank mode OFF";
  } else {
    buttonTank.textContent = "Tank mode ON";
  }
});

// Přidání události pro kliknutí na tlačítko
let buttonLights = document.getElementById("button-lights");
buttonLights.addEventListener("click", function () {
  // Změna textu tlačítka
  if (buttonLights.textContent === "Car light ON") {
    buttonLights.textContent = "Car light OFF";
  } else {
    buttonLights.textContent = "Car light ON";
  }
});

// Přidání události pro kliknutí na tlačítko
let buttonReverse = document.getElementById("button-reverse");
buttonReverse.addEventListener("click", function () {
  // Změna textu tlačítka
  if (buttonReverse.textContent === "  Reverse ON") {
    buttonReverse.textContent = "  Reverse OFF";
  } else {
    buttonReverse.textContent = "  Reverse ON";
  }
});

// Přidání události pro kliknutí na tlačítko
let buttonMovement = document.getElementById("button-movement");
buttonMovement.addEventListener("click", function () {
  // Změna textu tlačítka
  if (buttonMovement.textContent === "Controls ON") {
    buttonMovement.textContent = "Controls OFF";
  } else {
    buttonMovement.textContent = "Controls ON";
  }
});

// Button animation scale on hover
var button = document.getElementById("button-ovladac");

// Přidání události pro najetí myší
button.addEventListener("mouseenter", function () {
  // Zvětšení tlačítka
  button.style.transform = "scale(1.1)";
});

// Přidání události pro opuštění tlačítka myší
button.addEventListener("mouseleave", function () {
  // Zmenšení tlačítka zpět na původní velikost
  button.style.transform = "scale(1)";
});

// Přidání události pro stisknutí tlačítka (pro mobilní/tablet)
button.addEventListener("touchstart", function () {
  // Zvětšení tlačítka
  button.style.transform = "scale(1.1)";

  // Po 1 sekundě se tlačítko vrátí zpět na původní velikost
  setTimeout(function () {
    button.style.transform = "scale(1)";
  }, 1000);
});
