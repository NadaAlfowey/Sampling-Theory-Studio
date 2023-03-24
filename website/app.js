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
let samplingRInput=document.getElementById("sampling-rate-input");

let signalUploaded = false; // add a flag to track whether a signal has been uploaded or not
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
  if (signalUploaded) { // check if a signal has already been uploaded
    alert("You can only upload one signal at a time.");
    return;
  }
  let signal = {}; // create a new empty object
  let x = csvdata.map(arrRow => arrRow.col1).slice(0, 1000); // extract the first 1000 x-values from the CSV data and store them in an array
  let y = csvdata.map(arrRow => arrRow.col2).slice(0, 1000); // extract the first 1000 y-values from the CSV data and store them in an array  let y = csvdata.map(arrRow => arrRow.col2); // extract the y-values from the CSV data and store them in an array

    // // Take a subset of the x and y arrays
    // const numSamples = 1000;
    // const stepSize = Math.floor(x.length / numSamples);
    // x = x.filter((val, i) => i % stepSize === 0);
    // y = y.filter((val, i) => i % stepSize === 0);

  signal["x"] = x; // add the x-values to the signal object
  signal["y"] = y; // add the y-values to the signal object
  signal["signalType"] = 'uploaded'; // add a new property to the signal object to indicate that it was uploaded
  console.log(signal); // log the signal object to the console for debugging purposes
  uploadedSignals.push(signal); // add the signal object to the uploadedSignals array
  Plotly.addTraces(signalGraph, signal); // add the signal trace to the plot

  signalUploaded = true; // set the signalUploaded flag to true to indicate that a signal has been uploaded
}
// Get the sampling rate from the input field and pass it to the sampleData function
samplingRInput.addEventListener("change", function() {
  let userSampRate = parseInt(this.value);
  sampleData(userSampRate);
});
let isFirst=true;
let sampledData = []; // create an empty array to store the sampled data
function sampleData(samplingRate) {
if (isFirst==false)
{
  Plotly.deleteTraces(signalGraph, sampledData.from({length: signalGraph.data.length}, (_, i) => i));
  sampledData = [];
}
  let maxFreq = getMaxFrequency(uploadedSignals);
  samplingRate =samplingRate|| maxFreq * 2;
  let data = uploadedSignals[uploadedSignals.length - 1]; // get the last uploaded signal
  let duration = data.x[data.x.length - 1]; // get the number of samples in the signal
  let numSamples = Math.floor(duration * samplingRate); // calculate the number of samples based on the duration and the desired sampling rate
  let sampleInterval = duration / numSamples; //calculates the interval between each sample by dividing the duration of the signal by the number of samples needed
  let t = 0; //will be used to calculate the x-value of each sampled data point
  for (let i = 0; i < numSamples; i++) { //starts a for loop that will iterate numSamples times, creating one sampled data point for each iteration
    let x = t; //sets the x-value of the sampled data point to the current value of the t variable
    let y = NaN; //initializes the y-value of the sampled data point to NaN, indicating that it is currently unknown
    for (let j = 0; j < data.x.length - 1; j++) { //starts another for loop that will iterate through each data point in the original signal to find the y-value of the current sampled data point
      if (x >= data.x[j] && x <= data.x[j+1]) { //checks if the x-value of the current sampled data point is within the range of x-values of two adjacent data points in the original signal
        let x1 = data.x[j];
        let y1 = data.y[j];
        let x2 = data.x[j+1];
        let y2 = data.y[j+1];
        y = y1 + (y2 - y1) * (x - x1) / (x2 - x1); //calculates the y-value of the sampled data point by linearly interpolating between the y-values of the two adjacent data points in the original signal
        break;
      }
    }
    sampledData.push({ // add the current x- and y-values to the sampled data array
      x: x,
      y: y
    });
    t += sampleInterval; // increment the time variable by the sample interval
  }
  // console.log(uploadedSignals);
  // console.log(uploadedSignals[uploadedSignals.length - 1]);
  // console.log(sampledData);
  isFirst=false;
  // Plot sampled data
  Plotly.addTraces(signalGraph, { // add a new trace to the plot
    x: sampledData.map(d => d.x), // extract the x-values from the sampled data array
    y: sampledData.map(d => d.y), // extract the y-values from the sampled data array
    mode: "markers", // set the plot mode to markers
    marker: {
      color: "red", // set the color of the markers to red
      size: 5 // set the size of the markers to 5
    },
    name: "Sampled Data" // set the name of the trace to "Sampled Data"
  });  
}

function getMaxFrequency(signal) {
  const lastSignal = signal[signal.length - 1]; // get the last signal in the array
  const duration = lastSignal.x[lastSignal.x.length - 1]; // duration of signal by getting the last value of the x array of the last signal in the array
  const numSamples = lastSignal.x.length; //This line calculates the number of samples in the signal by getting the length of the x array of the last signal in the array
  const period = duration / (numSamples - 1); // calculates the period of the signal by dividing the duration by the number of samples minus one
  const maxFrequency = 1 / (2 * period); //calculates the Nyquist frequency, which is half the sampling rate, by dividing 1 by twice the period
  return maxFrequency;
}

//   return differenceSignal;
// }
// samplingFrequency.addEventListener("change", () => {
//   const signalData = signalGraph.data[0];
//   const sampledSignal = sampleSignal(signalData, samplingFrequency.value);
//   const reconstructedSignal = reconstructSignal(sampledSignal, signalData.x.length);
//   const differenceSignal = calculateDifference(signalData, reconstructedSignal);

//   Plotly.update(signalGraph, { marker: { size: 6 } }, {}, [0]);
//   Plotly.update(reconstructedGraph, { x: reconstructedSignal.x, y: reconstructedSignal.y }, {}, [0]);
//   Plotly.update(differenceGraph, { x: differenceSignal.x, y: differenceSignal.y }, {}, [0]);
// });

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
