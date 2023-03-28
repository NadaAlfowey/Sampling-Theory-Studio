
let signalGraph = document.getElementById("signal");
let reconstructedGraph = document.getElementById("reconstructed");
let differenceGraph = document.getElementById("difference");

let uploadFile = document.getElementById("signaluploadfile");
let composerFrequency = document.getElementById("frequency");
let composerAmplitude = document.getElementById("amplitude");
let signalComposerButton = document.getElementById("addsignalcomposer");
let samplingFrequency = document.getElementById("samplingfrequency");
let SNRrange = document.getElementById("noise");
let SNRvalue = document.getElementById("noisevalue");
let signalComponentSelect = document.getElementById("components");
let removeSignalComponentButton = document.getElementById("removecomponent");

let signals=[];
let NumComposedSignals=0;

document.onload = createPlot(signalGraph);
document.onload = createPlot(reconstructedGraph);
document.onload = createPlot(differenceGraph);

function createPlot(graphElement) {
  let layout = {
    title: { title: "Click Here<br>to Edit Chart Title" },
    xaxis: {
        rangeslider: {
          range: [0, 1],
          visible: true,
          dragmode: false,
          zoom: false,
        },
      //range: [0, 5],
      title: "Frequency (Hz)",
      zoom: 1000,
    },
    yaxis: {
      title: "Amplitude",
    },
  };
  Plotly.newPlot(graphElement, [], layout, {
    displaylogo: false,
    responsive: true,
    autosize: true,
  });
}

SNRrange.addEventListener("change", () => {
  SNRvalue.innerHTML = SNRrange.value;
  // calculate the power of signal (amplitude)
  //signal power = signal values ^2
  const squaredSignal = signals[0].y.map((signalAmplitude) => Math.pow(signalAmplitude, 2));
  // calculate the average of the squared samples
  const signalPower = squaredSignal.reduce((sum, value) => sum + value, 0) / signals[0].x.length;
  //generate noise
  let generatedNoiseArr = [];
  for (let generatedNoiseIndex = 0; generatedNoiseIndex < signals[0].x.length; generatedNoiseIndex++) {
    //generate noise signal and scale noise signal to the range of the signal power.
    //scaling matches the amplitude range of the noise to the amplitude range of the signal so that signal does not completely become drowned out by noise
    const noiseValue = Math.random() * Math.sqrt(signalPower);
    generatedNoiseArr.push(noiseValue);
  }
  //calculate noise power
  const squaredNoise = generatedNoiseArr.map((noiseAmplitude) =>
    Math.pow(noiseAmplitude, 2)
  );
  const noisePower = squaredNoise.reduce((sum, value) => sum + value, 0) / generatedNoiseArr.length;
  //calculate attenuation factor SNR = signal power/ A * noise power
  //attenuation is used to scale the generated noise signal before adding it to the original signal. 
  //This helps to achieve the desired SNR level while preserving the original characteristics of the signal.
  const attenuation = signalPower / (SNRrange.value * noisePower);
  //multiply each val in the noise by the attenuation factor
  generatedNoiseArr = generatedNoiseArr.map((noise) => noise * attenuation);
  //add the noise to the original signal
  let noisySignal = [];
  for (let noiseElementIndex = 0; noiseElementIndex < generatedNoiseArr.length; noiseElementIndex++) {
    noisySignal.push(signals[0].y[noiseElementIndex] + generatedNoiseArr[noiseElementIndex]);
  }
  //const noisySignal = generateNoise(signalData, noisePower);
  update = { y: [noisySignal] };
  Plotly.update(signalGraph, update, {}, [0]);
});

uploadFile.addEventListener("change", (event) => {
  const file = event.target.files[0];
  const reader = new FileReader();
  reader.readAsText(file);
  let data;
  reader.onload = () => {
    // Parse the CSV data into an array of objects
    data = reader.result.trim().split('\n').map(row => {
      const [col1, col2] = row.split(',');
      return { col1: parseFloat(col1), col2: parseFloat(col2) };
    });
    convertCsvToTrace(data);
  }
});

signalComposerButton.addEventListener("click", () => {
  composeCosineSignal();
});

function composeCosineSignal() {
  let frequency = composerFrequency.value; // frequency in Hz
  let amplitude = composerAmplitude.value; // peak amplitude
  let wave = { x: [], y: [] }; //, signalType: "composed", frequency: frequency , amplitude: amplitude
  for (let i = 0; i < 1000; i++) {
    let t = i / 1000; // time x-axis =i/ numofsamples where i is the duration
    var value = amplitude * Math.cos(2 * Math.PI * frequency * t); //sample value y axis
    wave.x.push(t);
    wave.y.push(value);
  }
  if (signals.length == 0) {
    signals.push(wave);
  }
  else{
    NumComposedSignals++;
    updateSignalComponentsList(frequency,amplitude);
  }
  addSignals(wave);
}

function addSignals(newSignal){
  if(signalGraph.data.length!=0){
    for(let amp=0; amp<newSignal.y.length ; amp++){
      newSignal.y[amp]=signalGraph.data[0].y[amp] + newSignal.y[amp];
    }
    Plotly.update(signalGraph, { y: [newSignal.y], x: [newSignal.x] }, {}, 0);
    if(signals.length!=0){
      signals.pop();
      signals.push(newSignal);
    }
  }
  else
  Plotly.addTraces(signalGraph, newSignal);
}

function removeComponent(optionText) {
  const match = optionText.match(/Frequency:\s*(\d+)\s*Hz,\s*Amplitude:\s*(\d+)/);
  let amplitude,frequency;
  if (match) {
    frequency = parseInt(match[1]);
    amplitude = parseInt(match[2]);
  }
  let cosSignal=[]
  for (let i = 0; i < 1000; i++) {
    let t = i / 1000; // time x-axis =i/ numofsamples where i is the duration
    let value = amplitude * Math.cos(2 * Math.PI * frequency * t); //sample value y axis
    cosSignal.push(value);
  }
  let signalRemovedComponent=[];
  for (let amp = 0; amp < 1000; amp++) {
    signalRemovedComponent.push(signalGraph.data[0].y[amp] - cosSignal[amp]);
    signals[0].y[amp] = signals[0].y[amp]- cosSignal[amp];
  }
  Plotly.update(signalGraph, { y: [signalRemovedComponent]}, {}, 0);
}

function updateSignalComponentsList(frequency, amplitude) {
    const option = document.createElement("option");
    option.text = `Signal ${NumComposedSignals}: cos (Frequency: ${frequency} Hz, Amplitude: ${amplitude})`;
    option.selected=true;
    signalComponentSelect.add(option);
  //});
}

function convertCsvToTrace(csvdata) {
  let uploadedSignal = {};
  let x = csvdata.map((arrRow) => arrRow.col1).slice(0, 1000);
  let y = csvdata.map((arrRow) => arrRow.col2).slice(0, 1000);
  uploadedSignal["x"] = x;
  uploadedSignal["y"] = y;
  //signals.push(uploadedSignal);
  if (signals.length == 0) {
    signals.push(uploadedSignal);
    Plotly.addTraces(signalGraph, uploadedSignal);
  }
  else
  addSignals(uploadedSignal);
}

function sampleSignal(signal, samplingFrequency) {
  const sampledSignal = { x: [], y: [] };
  const samplingPeriod = 1 / samplingFrequency;

  for (let i = 0; i < signal.x.length; i++) {
    if (i % samplingPeriod === 0) {
      sampledSignal.x.push(signal.x[i]);
      sampledSignal.y.push(signal.y[i]);
    }
  }

  return sampledSignal;
}
function reconstructSignal(sampledSignal, originalSignalLength) {
  const reconstructedSignal = { x: [], y: [] };

  for (let i = 0; i < originalSignalLength; i++) {
    let sum = 0;
    for (let j = 0; j < sampledSignal.x.length; j++) {
      const t = i - sampledSignal.x[j];
      const sinc = t === 0 ? 1 : Math.sin(Math.PI * t) / (Math.PI * t);
      sum += sampledSignal.y[j] * sinc;
    }
    reconstructedSignal.x.push(i);
    reconstructedSignal.y.push(sum);
  }

  return reconstructedSignal;
}
function calculateDifference(originalSignal, reconstructedSignal) {
  const differenceSignal = { x: [], y: [] };

  for (let i = 0; i < originalSignal.x.length; i++) {
    differenceSignal.x.push(i);
    differenceSignal.y.push(originalSignal.y[i] - reconstructedSignal.y[i]);
  }

  return differenceSignal;
}
samplingFrequency.addEventListener("change", () => {
  const signalData = signalGraph.data[0];
  const sampledSignal = sampleSignal(signalData, samplingFrequency.value);
  const reconstructedSignal = reconstructSignal(sampledSignal, signalData.x.length);
  const differenceSignal = calculateDifference(signalData, reconstructedSignal);

  Plotly.update(signalGraph, { marker: { size: 6 } }, {}, [0]);
  Plotly.update(reconstructedGraph, { x: reconstructedSignal.x, y: reconstructedSignal.y }, {}, [0]);
  Plotly.update(differenceGraph, { x: differenceSignal.x, y: differenceSignal.y }, {}, [0]);
});

removeSignalComponentButton.addEventListener("click", () => {
  const selectedIndex = signalComponentSelect.selectedIndex;
  const selectedComponentText = signalComponentSelect.options[selectedIndex].value;
  removeComponent(selectedComponentText);
  signalComponentSelect.remove(selectedIndex);
});

// signalComponentSelect.addEventListener("change", () => {
//   const selectedIndex = signalComponentSelect.selectedIndex;
//   if (selectedIndex >= 0) {
//     const selectedSignal = signalComponentSelect.options[selectedIndex].value;
//     const signalIndex = composedSignals.findIndex(signal => signal.signalType === selectedSignal);
//     if (signalIndex >= 0) {
//       Plotly.update(signalGraph, { visible: true }, {}, [signalIndex]);
//     } else {
//       Plotly.update(signalGraph, { visible: false }, {}, [signalIndex]);
//     }
//   }
// });

// function updateSignalComponentsList() {
//   signalComponentSelect.innerHTML = "";
//   composedSignals.forEach((signal, index) => {
//     const option = document.createElement("option");
//     option.value = signal.signalType;
//     option.text = `Signal ${index + 1}: ${signal.signalType}`;
//     signalComponentSelect.add(option);
//   });
// }

function updateGraphs() {
  const signalData = signalGraph.data[0];
  const sampledSignal = sampleSignal(signalData, samplingFrequency.value);
  const reconstructedSignal = reconstructSignal(sampledSignal, signalData.x.length);
  const differenceSignal = calculateDifference(signalData, reconstructedSignal);

  Plotly.update(signalGraph, { marker: { size: 6 } }, {}, [0]);
  Plotly.update(reconstructedGraph, { x: reconstructedSignal.x, y: reconstructedSignal.y }, {}, [0]);
  Plotly.update(differenceGraph, { x: differenceSignal.x, y: differenceSignal.y }, {}, [0]);
}

// Update the signal components list whenever a new signal is added or removed
//signalComposerButton.addEventListener("click", updateSignalComponentsList);
//removeSignalComponentButton.addEventListener("click", updateSignalComponentsList);

// Update the graphs whenever a new signal is added, removed, or modified
signalComposerButton.addEventListener("click", updateGraphs);
removeSignalComponentButton.addEventListener("click", updateGraphs);
samplingFrequency.addEventListener("change", updateGraphs);
