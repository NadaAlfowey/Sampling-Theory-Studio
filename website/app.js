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
samplingFrequency.addEventListener("click", sampleData);

let uploadedSignals = [];
let composedSignals = [];

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
      range: [0, 5],
      title: "Frequency (Hz)",
      zoom: 1000,
    },
    yaxis: {
      title: "Amplitude",
    },
    // dragmode: false,
    // zoommode: false,
  };
  Plotly.newPlot(graphElement, [], layout, {
    displaylogo: false,
    responsive: true,
    autosize: true,
  });
}

SNRrange.addEventListener("change", () => {
  SNRvalue.innerHTML = SNRrange.value;
  let signalData;
  console.log(signalGraph.data[0]);
  console.log(uploadedSignals);
  if (signalGraph.data[0].signalType === "composed") {
    signalData = composedSignals;
  }
  else {
    signalData = uploadedSignals;
  }
  // calculate the power of signal (amplitude)
  const squaredSignal = signalData[0].y.map((amplitude) => amplitude ** 2);
  // calculate the average of the squared samples
  const signalPower = squaredSignal.reduce((sum, value) => sum + value, 0) / signalData[0].x.length;
  //calculate noise power
  const noisePower = signalPower / SNRrange.value;

  const noisySignal = generateNoise(signalData, noisePower);
  update = { 'y': [noisySignal] };
  Plotly.update(signalGraph, update, {}, [0]);
});

// function calculateSignalPower(graphElement){
//   // calculate the power of signal (amplitude)
//   const squaredSignal = graphElement.data[0].y.map((amplitude) => amplitude ** 2);
//   // calculate the average of the squared samples
//   const averagePower = squaredSignal.reduce((sum, value) => sum + value, 0) / graphElement.data[0].x.length;
//   return averagePower;
// }

// function calculateNoisePower(graphElement,signalPower){
//     //const signalPower = calculateSignalPower(graphElement.data[0].y,graphElement.data[0].x);
//     const noisePower = signalPower / SNRrange.value;
//     const noisySignal = generateNoise(graphElement.data[0].x.length,noisePower);
// }

function generateNoise(signal, noisePower) {
  let noiseArr = [];
  console.log(signal[0].x.length);
  for (let i = 0; i < signal[0].x.length; i++) {
    //generate noise signal and scale noise signal to the range of the noise power.
    const noiseValue = Math.random() * Math.sqrt(noisePower);
    noiseArr.push(noiseValue);
  }
  const noisySignal = signal[0].y.map((amplitude, index) => amplitude + noiseArr[index]);
  return noisySignal;
}

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

// function composeCosineSignal() {
//   let frequency = composerFrequency.value; // frequency in Hz
//   let amplitude = composerAmplitude.value; // peak amplitude
//   let wave = { x: [], y: [], signalType: "" };
//   for (let i = 0; i < 1000; i++) {
//     let t = i / 1000; // time x-axis =i/ numofsamples where i is the duration
//     var value = amplitude * Math.cos(2 * Math.PI * frequency * t); //sample value y axis
//     wave.x.push(i);
//     wave.y.push(value);
//     wave.signalType = "composed";

//   }
//   composedSignals.push(wave);
//   Plotly.addTraces(signalGraph, wave);
// }
function composeCosineSignal() {
  let frequency = composerFrequency.value; // frequency in Hz
  let amplitude = composerAmplitude.value; // peak amplitude
  let wave = { x: [], y: [], signalType: "", frequency: 0, amplitude: 0 };
  for (let i = 0; i < 1000; i++) {
    let t = i / 1000; // time x-axis =i/ numofsamples where i is the duration
    var value = amplitude * Math.cos(2 * Math.PI * frequency * t); //sample value y axis
    wave.x.push(i);
    wave.y.push(value);
    wave.signalType = "composed";
    wave.frequency = frequency;
    wave.amplitude = amplitude;
  }
  composedSignals.push(wave);
  Plotly.addTraces(signalGraph, wave);
}

function updateSignalComponentsList() {
  signalComponentSelect.innerHTML = "";
  composedSignals.forEach((signal, index) => {
    const option = document.createElement("option");
    option.value = signal.signalType;
    option.text = `Signal ${index + 1}: ${signal.signalType} (Frequency: ${signal.frequency} Hz, Amplitude: ${signal.amplitude})`;
    signalComponentSelect.add(option);
  });
}
function convertCsvToTrace(csvdata) {
  let signal = {}; // create a new empty object
  let x = csvdata.map(arrRow => arrRow.col1); // extract the x-values from the CSV data and store them in an array
  let y = csvdata.map(arrRow => arrRow.col2); // extract the y-values from the CSV data and store them in an array
  signal["x"] = x; // add the x-values to the signal object
  signal["y"] = y; // add the y-values to the signal object
  signal["signalType"] = 'uploaded'; // add a new property to the signal object to indicate that it was uploaded
  console.log(signal); // log the signal object to the console for debugging purposes
  uploadedSignals.push(signal); // add the signal object to the uploadedSignals array
  Plotly.addTraces(signalGraph, signal); // add the signal trace to the plot
}

function sampleData() {
   // Determine sampling rate based on Nyquist–Shannon sampling theorem
   let maxFreq = getMaxFrequency(uploadedSignals); // get the maximum frequency of the uploaded signal using the Nyquist–Shannon sampling theorem
   let samplingRate = maxFreq * 2; // set the sampling rate to twice the maximum frequency of the signal
 
   // Perform sampling
   let sampledData = []; // create an empty array to store the sampled data
   let data = uploadedSignals[uploadedSignals.length - 1]; // get the last uploaded signal
   let numSamples = data.x.length; // get the number of samples in the signal
   let sampleInterval = 1 / samplingRate; // calculate the time interval between samples
   let t = 0; // initialize the time variable to zero
   for (let i = 0; i < numSamples; i++) {
     if (t >= data.x[i]) { // if the current time is greater than or equal to the current x-value
       sampledData.push({ // add the current x- and y-values to the sampled data array
         x: data.x[i],
         y: data.y[i]
       });
       t -= sampleInterval; // decrement the time variable by the sample interval
     }
     t += sampleInterval; // increment the time variable by the sample interval
   }
 
console.log(sampledData);
  // Plot sampled data
Plotly.addTraces(signalGraph, { // add a new trace to the plot
    x: sampledData.map(d => d.x), // extract the x-values from the sampled data array
    y: sampledData.map(d => d.y),
    mode: "markers",
    marker: {
      color: "red",
      size: 5
    },
    name: "Sampled Data"
  });
}



function getMaxFrequency(signal) {
  const lastSignal = signal[signal.length - 1]; // get the last signal in the array
  const duration = lastSignal.x[lastSignal.x.length - 1]; // duration of signal
  const numSamples = lastSignal.x.length;
  const period = duration / (numSamples - 1); // period of signal
  const maxFrequency = 1 / (2 * period); // Nyquist frequency
  return maxFrequency;
}




// function sampleSignal(signal, samplingFrequency) {
//   const sampledSignal = { x: [], y: [] };
//   const samplingPeriod = 1 / samplingFrequency;

//   for (let i = 0; i < signal.x.length; i++) {
//     if (i % samplingPeriod === 0) {
//       sampledSignal.x.push(signal.x[i]);
//       sampledSignal.y.push(signal.y[i]);
//     }
//   }

//   return sampledSignal;
// }
// function reconstructSignal(sampledSignal, originalSignalLength) {
//   const reconstructedSignal = { x: [], y: [] };

//   for (let i = 0; i < originalSignalLength; i++) {
//     let sum = 0;
//     for (let j = 0; j < sampledSignal.x.length; j++) {
//       const t = i - sampledSignal.x[j];
//       const sinc = t === 0 ? 1 : Math.sin(Math.PI * t) / (Math.PI * t);
//       sum += sampledSignal.y[j] * sinc;
//     }
//     reconstructedSignal.x.push(i);
//     reconstructedSignal.y.push(sum);
//   }

//   return reconstructedSignal;
// }
// function calculateDifference(originalSignal, reconstructedSignal) {
//   const differenceSignal = { x: [], y: [] };

//   for (let i = 0; i < originalSignal.x.length; i++) {
//     differenceSignal.x.push(i);
//     differenceSignal.y.push(originalSignal.y[i] - reconstructedSignal.y[i]);
//   }

//   return differenceSignal;
// }
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
  if (selectedIndex >= 0) {
    const selectedSignal = signalComponentSelect.options[selectedIndex].value;
    const signalIndex = composedSignals.findIndex(signal => signal.signalType === selectedSignal);
    if (signalIndex >= 0) {
      composedSignals.splice(signalIndex, 1);
      Plotly.deleteTraces(signalGraph, signalIndex);
    }
  }
});

signalComponentSelect.addEventListener("change", () => {
  const selectedIndex = signalComponentSelect.selectedIndex;
  if (selectedIndex >= 0) {
    const selectedSignal = signalComponentSelect.options[selectedIndex].value;
    const signalIndex = composedSignals.findIndex(signal => signal.signalType === selectedSignal);
    if (signalIndex >= 0) {
      Plotly.update(signalGraph, { visible: true }, {}, [signalIndex]);
    } else {
      Plotly.update(signalGraph, { visible: false }, {}, [signalIndex]);
    }
  }
});

// function updateSignalComponentsList() {
//   signalComponentSelect.innerHTML = "";
//   composedSignals.forEach((signal, index) => {
//     const option = document.createElement("option");
//     option.value = signal.signalType;
//     option.text = `Signal ${index + 1}: ${signal.signalType}`;
//     signalComponentSelect.add(option);
//   });
// }

// function updateGraphs() {
//   const signalData = signalGraph.data[0];
//   const sampledSignal = sampleSignal(signalData, samplingFrequency.value);
//   const reconstructedSignal = reconstructSignal(sampledSignal, signalData.x.length);
//   const differenceSignal = calculateDifference(signalData, reconstructedSignal);

//   Plotly.update(signalGraph, { marker: { size: 6 } }, {}, [0]);
//   Plotly.update(reconstructedGraph, { x: reconstructedSignal.x, y: reconstructedSignal.y }, {}, [0]);
//   Plotly.update(differenceGraph, { x: differenceSignal.x, y: differenceSignal.y }, {}, [0]);
// }

// Update the signal components list whenever a new signal is added or removed
signalComposerButton.addEventListener("click", updateSignalComponentsList);
removeSignalComponentButton.addEventListener("click", updateSignalComponentsList);

// Update the graphs whenever a new signal is added, removed, or modified
signalComposerButton.addEventListener("click", updateGraphs);
removeSignalComponentButton.addEventListener("click", updateGraphs);
// samplingFrequency.addEventListener("change", updateGraphs);
