document.addEventListener("DOMContentLoaded", () => {
  document.body.style.zoom = "75%";
});

const allowableStress = {
  "Carbon Steel": {
    100: 12.9,
    300: 12.9,
    500: 12.9,
    700: 11.5,
    900: 5.9
  },
  "Killed Carbon Steel": {
    100: 17.1,
    300: 17.1,
    500: 17.1,
    700: 14.3,
    900: 5.9
  },
  "Low Alloy Steel": {
    100: 17.1,
    300: 16.6,
    500: 16.6,
    700: 16.6,
    900: 13.6
  },
  "410 Stainless Steel": {
    100: 18.6,
    300: 17.8,
    500: 17.2,
    700: 16.2,
    900: 12.3
  },
  "304 Stainless Steel": {
    100: 20.0,
    300: 15.0,
    500: 12.9,
    700: 11.7,
    900: 10.8
  },
  "347 Stainless Steel": {
    100: 20.0,
    300: 17.1,
    500: 15.0,
    700: 13.8,
    900: 13.4
  },
  "321 Stainless Steel": {
    100: 20.0,
    300: 16.5,
    500: 14.3,
    700: 13.0,
    900: 12.3
  },
  "316 Stainless Steel": {
    100: 20.0,
    300: 15.6,
    500: 13.3,
    700: 12.1,
    900: 11.5
  }
};

const jointEfficiency = {
  "Double-welded butt joint or equivalent": {
    full: 1.0,
    spot: 0.85,
    none: 0.7
  },
  "Single-welded butt joint with backing strip": {
    full: 0.9,
    spot: 0.8,
    none: 0.65
  },
  "Single-welded butt joint without backing strip": {
    full: 'N/A',
    spot: 'N/A',
    none: 0.60
  },
  "Double fill fillet lap joint": {
    full: 'N/A',
    spot: 'N/A',
    none: 0.55
  },
  "Single full fillet lap joint with plug welds": {
    full: 'N/A',
    spot: 'N/A',
    none: 0.50
  },
  "Single full fillet lap joint without plug welds": {
    full: 'N/A',
    spot: 'N/A',
    none: 0.45
  }
};

calculateJointEfficiency();

/*function getValue(selector, defaultValue = null) {
  const el = document.querySelector(selector);
  if (!el) return defaultValue;

  if (el.value !== undefined && el.value !== "") {
    const v = parseFloat(el.value);
    if (!isNaN(v)) return v;
  }

  if (el.textContent.trim() !== "" && el.textContent.trim() !== "N/A") {
    const v = parseFloat(el.textContent);
    if (!isNaN(v)) return v;
  }

  return defaultValue;
}*/

function calculateDesignPressure() {
  const input = parseFloat(document.getElementById("inputPressure").value);
  const type = document.querySelector('input[name="pressureType"]:checked').value;
  const resultElement = document.getElementById("pressureDesignResult");

  let designPressure;

  if (type === "absolute") {
    designPressure = (input - 0.101325) * 1.1;
  } else if (type === "gauge") {
    designPressure = input * 1.1;
  }

  resultElement.value = designPressure.toFixed(4);
}

document.querySelector('.pressure-input-js').addEventListener('input', () => {
  calculateDesignPressure();
  calculateShellThickness();
  calculateHeadThickness();
  calculatePcHead()
});

document.querySelector('.pressure-type').addEventListener('change', () => {
  calculateDesignPressure();
  calculateShellThickness();
  calculateHeadThickness();
  calculatePcHead()
});


function calculateDesignTemperature() {
  const input = parseFloat(document.getElementById("inputTemperature").value);
  const resultElement = document.getElementById("temperatureResult");

  document.getElementById("inputTemperature").addEventListener("input", function () {
    if (parseFloat(this.value) > 854.9999) {
      this.value = 854.9999;
    }
  });

  let designTemperature = input + 45;
  if (designTemperature > 900) {
    designTemperature = 900;
  }

  resultElement.value = designTemperature.toFixed(4);
}

document.querySelector('.temperature-input-js').addEventListener('input', () => {
  calculateDesignTemperature();
  calculateHeadThickness();
  calculateShellThickness();
  calculatePcHead()
});

function getAllowableStress(material, designTemp) {
  const stressData = allowableStress[material];
  if (!stressData) return null;

  const temps = Object.keys(stressData).map(Number).sort((a, b) => a - b);
  let chosenTemp = temps[temps.length - 1];

  for (let t of temps) {
    if (designTemp <= t) {
      chosenTemp = t;
      break;
    }
  }

  return {stress: stressData[chosenTemp] };
}

function displayAllowableStress() {
  const tempEl = document.getElementById("temperatureResult");
  const materialEl = document.querySelector('input[name="material"]:checked');
  const stressResult = document.getElementById("stressResult");
  const stressResultMPa = document.getElementById("stressResultMPa");

  if (!tempEl || !materialEl || !stressResult || !stressResultMPa) {
    console.warn("One or more required elements for allowable stress calculation are missing.");
    return;
  }

  const inputTemp = parseFloat(tempEl.value);
  if (isNaN(inputTemp)) {
    stressResult.value = "";
    stressResultMPa.value = "";
    return;
  }

  const { stress } = getAllowableStress(materialEl.value, inputTemp) || {};
  if (stress === undefined || stress === null || stress === "N/A") {
    stressResult.value = "";
    stressResultMPa.value = "";
    return;
  }

  stressResult.value = stress;
  stressResultMPa.value = (stress * 6.8948).toFixed(4);

  calculateShellThickness();
  calculateHeadThickness();
  calculatePcHead()
}


document.getElementById("temperatureResult").addEventListener("input", displayAllowableStress);
document.getElementById("inputTemperature").addEventListener("input", displayAllowableStress);
document.querySelector(".material-type").addEventListener("change", displayAllowableStress);

document.getElementById("temperatureResult").addEventListener("input", function () {
  if (parseFloat(this.value) > 900) {
    this.value = 900;
  }
});

function calculateJointEfficiency() {
  const joint = document.querySelector('input[name="joint"]:checked');
  const degree = document.querySelector('input[name="degree"]:checked');
  const output = document.querySelector(".e-value output");

  if (!joint || !degree) {
    output.textContent = "";
    return;
  }

  const jointText = joint.nextSibling.textContent.trim();
  const degreeVal = degree.value.toLowerCase();

  const jointData = jointEfficiency[jointText];
  if (jointData && jointData[degreeVal] !== undefined) {
    output.textContent = jointData[degreeVal];
  } else {
    output.textContent = "N/A";
  }

  calculateShellThickness();
  calculateHeadThickness();
  calculatePcHead()
}

document.querySelectorAll('.joint-type input, .head-type input').forEach(el => {
  el.addEventListener("change", calculateJointEfficiency);
});

function calculateShellThickness() {
  const PdEl = document.getElementById("pressureDesignResult");
  const SEl = document.getElementById("stressResultMPa");
  const EEl = document.querySelector('.efficiencyOutput');
  const DEl = document.querySelector('.diameterValue');
  const typeEl = document.getElementById("diameterType");
  const outputEl = document.querySelector('.shellOutput');

  const Pd = parseFloat(PdEl.value);
  const S = parseFloat(SEl.value);
  const E = parseFloat(EEl.textContent);
  const D = parseFloat(DEl.value);
  const type = typeEl.value;

  if ([Pd, S, E, D].some(v => isNaN(v))) {
    outputEl.textContent = "";
    return;
  }

  let t;
  if (type === "Di") {
    t = (Pd * D / 2) / (S * E - 0.6 * Pd) + 2;
  } else if (type === "Do") {
    t = (Pd * D / 2) / (S * E + 0.4 * Pd) + 2;
  } else {
    outputEl.textContent = "Invalid input";
    return;
  }
  outputEl.textContent = Math.ceil(t);
}

document.querySelectorAll(
  "#pressureDesignResult, .diameterValue, .material-type, .head-type, .joint-type, #temperatureResult, #inputTemperature, #diameterType"
).forEach(el => {
  el.addEventListener("input", calculateShellThickness);
  el.addEventListener("change", calculateShellThickness);
});

function calculateHeadThickness() {
  const PdEl = document.getElementById("pressureDesignResult");
  const SEl = document.getElementById("stressResultMPa");
  const EEl = document.querySelector('.efficiencyOutput');
  const DEl = document.querySelector('.diameterValue');
  const typeEl = document.getElementById("diameterType");
  const outputEl = document.querySelector('.headOutput');
  const geometryEl = document.querySelector('.head-shape input:checked');

  const Pd = parseFloat(PdEl.textContent || PdEl.value);
  const S  = parseFloat(SEl.textContent || SEl.value);
  const E  = parseFloat(EEl.textContent || EEl.value);
  const D  = parseFloat(DEl.value);
  const type = typeEl.value;
  const geometry = geometryEl.value;

  if ([Pd, S, E, D].some(v => isNaN(v))) {
    outputEl.textContent = "";
    return;
  }

  let t;

  if (geometry === "Hemisphere") {
    if (type === "Di") {
      t = (Pd * D/2) / (2 * S * E - 0.2 * Pd) + 2;
    } else {
      t = (Pd * D/2) / (2 * S * E + 0.8 * Pd) + 2;
    }
  } else if (geometry === "Standard Ellipsoidal") {
    if (type === "Di") {
      t = (Pd * D) / (2 * S * E - 0.2 * Pd) + 2;
    } else {
      t = (Pd * D) / (2 * S * E + 1.8 * Pd) + 2;
    }
  } else if (geometry === "Ellipsoidal") {
    const K = calculateKvalue();
    if (type === "Di") {
      t = (Pd * D * K) / (2 * S * E - 0.2 * Pd) + 2;
    } else {
      t = (Pd * D * K) / (2 * S * E + 2 * Pd * (K - 0.1)) + 2;
    }
  }
  outputEl.textContent = Math.ceil(t);
}
  
function calculateKvalue () {
  const majorAxisE1 = document.getElementById("majorAxis");
  const minorAxisE1 = document.getElementById("minorAxis");
  const majorAxis = majorAxisE1.value;
  const minorAxis = minorAxisE1.value;

  const k = 0.167 * (2 + (majorAxis/(minorAxis)) ** 2);
  return k;
}

document.querySelectorAll(
  "#pressureDesignResult, .diameterValue, .material-type, .head-type, .joint-type, #temperatureResult, #inputTemperature, #diameterType, .head-shape"
).forEach(el => {
  el.addEventListener("input", calculateHeadThickness);
  el.addEventListener("change", calculateHeadThickness);
});


function calculateDo() {
  const type = document.getElementById("diameterType").value;
  const shellThickness = parseFloat(document.querySelector('.shellOutput').textContent);
  const D = parseFloat(document.querySelector('.diameterValue').value);

  let Do;
  if (type === 'Di') {
    Do = D + 2 * shellThickness;
  } else {
    Do = D;
  }

  return Do;
}

function calculatePcHead() {
  const EyEl = document.querySelector('.inputEy');
  const vEl = document.querySelector('.poissonInput');
  const shellThicknessEl = document.querySelector('.shellOutput');
  const outputEl = document.querySelector('.PcHeadOutput');
  const Rs = calculateRs();

  console.log(EyEl);
  console.log(vEl);
  console.log(shellThicknessEl);
  console.log(outputEl);
  console.log(Rs);

  const Ey = parseFloat(EyEl.value);
  const v = parseFloat(vEl.value);
  const t = parseFloat(shellThicknessEl.textContent);
  const Do = calculateDo();

  console.log(Ey);
  console.log(v);
  console.log(t);
  console.log(Do);

  const Pc = (2 * Ey * t**2) / ((Rs**2)*(Math.sqrt(3*(1-v**2))));
  outputEl.textContent = Pc.toFixed(4);
}

document.querySelectorAll(
  "#pressureDesignResult, .diameterValue, .material-type, .head-type, .joint-type, #temperatureResult, #inputTemperature, #diameterType, .poissonInput, .inputEy"
).forEach(el => {
  el.addEventListener("input", calculatePcHead);
  el.addEventListener("change", calculatePcHead);
});

function calculateRs() {
  const geometryEl = document.querySelector('.head-shape input:checked');

  const geometry = geometryEl.value;
  const majorAxisE1 = document.getElementById("majorAxis");
  const minorAxisE1 = document.getElementById("minorAxis");

  const majorAxis = parseFloat(majorAxisE1.value);
  const minorAxis = parseFloat(minorAxisE1.value);

  const Do = calculateDo();
  

  console.log(Do);

  let Rs;

  if (geometry === 'Hemisphere') {
    Rs = Do / 2;
  } else if (geometry === 'Ellipsoidal' || geometry === 'Standard Ellipsoidal') {
    const b = (minorAxis * Do) / majorAxis;
    Rs = (Do / 2) ** 2 / b;
  } else if (geometry === 'Standard Torisphere') {
    Rs = calculateDi();
  }

  return Rs;
}


function calculateDi() {
  const type = document.getElementById("diameterType").value;
  const shellThickness = parseFloat(document.querySelector('.shellOutput').textContent);
  const D = parseFloat(document.querySelector('.diameterValue').value);

  let Di;
  if (type === 'Do') {
    Di = D - 2 * shellThickness;
  } else {
    Di = D;
  }

  return Di;
}

function displayK() {
  const resultElement = document.querySelector('.kValueOutput');
  resultElement.textContent = calculateKvalue().toFixed(4);
}

document.querySelectorAll(
  "#majorAxis, #minorAxis"
).forEach(el => {
  el.addEventListener("input", displayK);
  el.addEventListener("change", displayK);
});

function calculateStiffeningRingDistance() {
  const vEl = document.querySelector('.poissonInput');
  const shellThicknessEl = document.querySelector('.shellOutput');
  const outputEl = document.querySelector('.LcOutput');


  const v = parseFloat(vEl.value);
  const t = parseFloat(shellThicknessEl.textContent);
  const Do = calculateDo();


  const Lc = ((4*Math.PI*Math.sqrt(6)*Do)/27)*((1-v**2)**(1/4))*(Math.sqrt(Do/t));

  outputEl.textContent = Lc.toFixed(4);
}

document.querySelectorAll(
  ".pressure-input-js, #pressureDesignResult, .diameterValue, .material-type, .head-type, .joint-type, #temperatureResult, #inputTemperature, #diameterType, .poissonInput, .inputEy"
).forEach(el => {
  el.addEventListener("input", calculateStiffeningRingDistance);
  el.addEventListener("change", calculateStiffeningRingDistance);
});

function calculateSFBasedOnExternal () {
  const PcShellEl = document.querySelector('.PcShellOutput');
  const PextEl = document.querySelector('.PExternalInput');
  const outputEl = document.querySelector('.SFExtOutput');

  if (!PcShellEl || !PextEl || !outputEl) {
    console.warn("Missing input or output element for SF calculation");
    return;
  }

  const PcShell = parseFloat(PcShellEl.textContent);
  const Pext = parseFloat(PextEl.value);

  if ([Pext, PcShell].some(val => isNaN(val))) {
    outputEl.textContent = "";
    return;
  }
  const SF = PcShell/Pext;

  outputEl.textContent = SF.toFixed(4);
}

document.querySelectorAll(".PcShellOutput, .PExternalInput").forEach(el => {
  el.addEventListener('input', calculateSFBasedOnExternal);
  el.addEventListener('change', calculateSFBasedOnExternal);
});

function calculateMaxOc() {
  const PdEl = document.getElementById("pressureDesignResult");
  const Rm = calculateDm() / 2;
  const tEl = document.querySelector('.shellOutput');
  const outputEl = document.querySelector('.OcOutput')


  const Pd = parseFloat(PdEl.value);
  const t = parseFloat(tEl.textContent);

  const Oc = Pd*Rm / t;

  outputEl.textContent = Oc.toFixed(4);
}

function calculateDm() {
  const type = document.getElementById("diameterType").value;
  const shellThickness = parseFloat(document.querySelector('.shellOutput').textContent);
  const D = parseFloat(document.querySelector('.diameterValue').value);

  let Dm;
  if (type === 'Di') {
    Dm = D + shellThickness;
  } else {
    Dm = D - shellThickness;
  }

  return Dm;
}

document.querySelectorAll("#pressureDesignResult, .pressure-input-js, .diameterValue, .shellOutput, #diameterType, #temperatureResult, #inputTemperature").forEach(el => {
  el.addEventListener('input', calculateMaxOc);
  el.addEventListener('change', calculateMaxOc);
});

function calculateSFBasedOnInternal () {
  const SEl = document.getElementById('stressResultMPa');
  const OcMaxEl = document.querySelector('.OcOutput');
  const outputEl = document.querySelector('.SFIntOutput');


  const S = parseFloat(SEl.textContent);
  const OcMax = parseFloat(OcMaxEl.value);

  const SF = OcMax/S;

  outputEl.textContent = SF.toFixed(4);
}

document.querySelectorAll("#pressureDesignResult, .pressure-input-js, .diameterValue, .shellOutput, #diameterType, #temperatureResult, #inputTemperature, OcOutput").forEach(el => {
  el.addEventListener('input', calculateSFBasedOnInternal);
  el.addEventListener('change', calculateSFBasedOnInternal);
});

function calculateNumberOfBolts() {
  const PresistingEl = document.querySelector('.boltSInput');
  const PdEl = document.getElementById("pressureDesignResult");
  const boltDEl = document.querySelector('.boltDInput');
  const outputEl = document.querySelector('.boltNOutput');


  const Presisting = parseFloat(PresistingEl.value);
  const Di = calculateDi();
  const Pd = parseFloat(PdEl.value);
  const boltD = parseFloat(boltDEl.value);

  if ([Presisting, Di, Pd, boltD].some(val => isNaN(val))) {
    outputEl.textContent = "";
    return;
  }

  const boltN = (Pd * Math.PI/4 * Di**2) / (Presisting * Math.PI/4 * boltD**2);

  outputEl.textContent = boltN.toFixed(4);
}

document.querySelectorAll("#pressureDesignResult, .pressure-input-js, .diameterValue, .shellOutput, #diameterType, #temperatureResult, #inputTemperature, .boltSInput, .boltDInput").forEach(el => {
  el.addEventListener('input', calculateNumberOfBolts);
  el.addEventListener('change', calculateNumberOfBolts);
});

document.addEventListener("DOMContentLoaded", function () {
  const ratioContainer = document.querySelector(".ratio-container");
  const headRadios = document.querySelectorAll('.head-shape input[name="groupName"]');

  headRadios.forEach(radio => {
    radio.addEventListener("change", function () {
      if (this.value === "Ellipsoidal") {
        ratioContainer.classList.add("active");
      } else {
        ratioContainer.classList.remove("active");
      }
    });
  });
});

document.addEventListener("DOMContentLoaded", function () {
  const shellType = document.querySelector(".shellType");
  const generalInputs = document.querySelector(".general-inputs");
  const kcInput = document.querySelector(".kc-input");

  function toggleInputs() {
    if (shellType.value === "general") {
      generalInputs.style.display = "block";
      kcInput.style.display = "none";
    } else if (shellType.value === "kc") {
      generalInputs.style.display = "none";
      kcInput.style.display = "block";
    }
  }

  shellType.addEventListener("change", toggleInputs);

  toggleInputs();
});

/*

function calculatePcShellKc () {
  const EyEl = document.querySelector('.inputEy');
  const shellThicknessEl = document.querySelector('.shellOutput');
  const KcEl = document.querySelector('.inputKc');


  const Kc = parseFloat(KcEl.value);
  const Ey = parseFloat(EyEl.value);
  const t = parseFloat(shellThicknessEl.textContent);
  const Do = calculateDo();


  const Pc = (Kc * Ey * (t / Do) ** 3).toFixed(4);

  document.querySelector('.PcShellOutput').textContent = Pc;

  calculateSFBasedOnExternal();
}

document.querySelectorAll(
  "#pressureDesignResult, .diameterValue, .material-type, .head-type, .joint-type, #temperatureResult, #inputTemperature, #diameterType, .poissonInput, .inputEy, .lobesInput, .shellType"
).forEach(el => {
  el.addEventListener("input", calculatePcShellKc);
  el.addEventListener("change", calculatePcShellKc);
});

function calculatePcShell () {
  const EyEl = document.querySelector('.inputEy');
  const vEl = document.querySelector('.poissonInput');
  const lobesEl = document.querySelector('.lobesInput');
  const shellThicknessEl = document.querySelector('.shellOutput');



  if (!EyEl || !vEl || !lobesEl || !shellThicknessEl) {
    console.warn("One or more required elements for Head thickness calculation are missing.");
    return;
  }

  const Ey = parseFloat(EyEl.value);
  const v = parseFloat(vEl.value);
  const lobes = parseFloat(lobesEl.value);
  const t = parseFloat(shellThicknessEl.textContent);
  const Do = calculateDo();


  if ([Ey, v, lobes, t, Do].some(val => isNaN(val))) {
  console.error("One of the values is NaN!", { Ey, v, lobes, t, Do });
}

  if ([Ey, v, lobes, t, Do].some(val => isNaN(val))) {
    document.querySelector('.PcShellOutput').textContent = "";
    return;
  }

  const Pc = ((1 / 3)*(((2*(Ey*1000)*(lobes ** 2 - 1)))/(1-v**2))*((t / Do) ** 3)).toFixed(4);

  document.querySelector('.PcShellOutput').textContent = Pc;

  calculateSFBasedOnExternal();
}

document.querySelectorAll(
  "#pressureDesignResult, .diameterValue, .material-type, .head-type, .joint-type, #temperatureResult, #inputTemperature, #diameterType, .poissonInput, .inputEy, .lobesInput, .shellType"
).forEach(el => {
  el.addEventListener("input", calculatePcShell);
  el.addEventListener("change", calculatePcShell);
});

*/

function calculatePcShellGeneral() {
  const EyEl = document.querySelector('.inputEy');
  const vEl = document.querySelector('.poissonInput');
  const lobesEl = document.querySelector('.lobesInput');
  const shellThicknessEl = document.querySelector('.shellOutput');

  if (!EyEl || !vEl || !lobesEl || !shellThicknessEl) {
    console.warn("Missing elements for PcShell General calculation");
    return;
  }

  const Ey = parseFloat(EyEl.value);
  const v = parseFloat(vEl.value); 
  const lobes = parseFloat(lobesEl.value);
  const t = parseFloat(shellThicknessEl.textContent);
  const Do = calculateDo();

  if ([Ey, v, lobes, t, Do].some(val => isNaN(val))) {
    document.querySelector('.PcShellOutput').textContent = "";
    return;
  }

  const Pc = ((1/3) * ((2 * (Ey * 1000) * (lobes ** 2 - 1)) / (1 - v ** 2)) * ((t / Do) ** 3)).toFixed(4);
  document.querySelector('.PcShellOutput').textContent = Pc;

  calculateSFBasedOnExternal();
}

function calculatePcShellKc() {
  const EyEl = document.querySelector('.inputEy');
  const shellThicknessEl = document.querySelector('.shellOutput');
  const KcEl = document.querySelector('.inputKc');

  if (!EyEl || !shellThicknessEl || !KcEl) {
    console.warn("Missing elements for PcShell Kc calculation");
    return;
  }

  const Ey = parseFloat(EyEl.value);
  const t = parseFloat(shellThicknessEl.textContent);
  const Do = calculateDo();
  const Kc = parseFloat(KcEl.value);

  if ([Ey, t, Do, Kc].some(val => isNaN(val))) {
    document.querySelector('.PcShellOutput').textContent = "";
    return;
  }

  const Pc = (Kc * Ey * (t / Do) ** 3).toFixed(4);
  document.querySelector('.PcShellOutput').textContent = Pc;

  calculateSFBasedOnExternal();
}

// Controller: chooses which one to call
function calculatePcShell() {
  const shellType = document.querySelector('.shellType').value;

  if (shellType === "general") {
    calculatePcShellGeneral();
  } else if (shellType === "kc") {
    calculatePcShellKc();
  }
}

// Attach only the controller to inputs
document.querySelectorAll(
  "#pressureDesignResult, .diameterValue, .material-type, .head-type, .joint-type, #temperatureResult, #inputTemperature, #diameterType, .poissonInput, .inputEy, .lobesInput, .inputKc, .shellType"
).forEach(el => {
  el.addEventListener("input", calculatePcShell);
  el.addEventListener("change", calculatePcShell);
});




