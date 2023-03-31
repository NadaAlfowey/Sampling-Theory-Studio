
let normalizedValueSlider = document.getElementById("normalizedValue");
let normalizedValueDisplay = document.getElementById("normalizedValueDisplay");
let freqValueSlider = document.getElementById("freqValue");
let freqValueDisplay = document.getElementById("freqValueDisplay");
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
let samplingRInput = document.getElementById("sampling-rate-input");

let isFirst = true;
let sampledData = []; // create an empty array to store the sampled data
let signals = [];
let NumComposedSignals = 0;

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
normalizedValueSlider.addEventListener("input", () => {
  updateSamplingRateNormalized();
  // updateSamplingRateActual();
  // updateGraphs(); // Pass the numPoints variable as an argument
});
SNRrange.addEventListener("change", () => {
  SNRvalue.innerHTML = SNRrange.value;
  // calculate the power of signal (amplitude)
  //signal power = signal values ^2
  const squaredSignal = signals[0].y.map((signalAmplitude) =>
    Math.pow(signalAmplitude, 2)
  );
  // calculate the average of the squared samples
  const signalPower =
    squaredSignal.reduce((sum, value) => sum + value, 0) / signals[0].x.length;
  //generate noise
  let generatedNoiseArr = [];
  for (
    let generatedNoiseIndex = 0;
    generatedNoiseIndex < signals[0].x.length;
    generatedNoiseIndex++
  ) {
    //generate noise signal and scale noise signal to the range of the signal power.
    //scaling matches the amplitude range of the noise to the amplitude range of the signal so that signal does not completely become drowned out by noise
    const noiseValue = Math.random() * Math.sqrt(signalPower);
    generatedNoiseArr.push(noiseValue);
  }
  //calculate noise power
  const squaredNoise = generatedNoiseArr.map((noiseAmplitude) =>
    Math.pow(noiseAmplitude, 2)
  );
  const noisePower =
    squaredNoise.reduce((sum, value) => sum + value, 0) /
    generatedNoiseArr.length;
  //calculate attenuation factor SNR = signal power/ A * noise power
  //attenuation is used to scale the generated noise signal before adding it to the original signal.
  //This helps to achieve the desired SNR level while preserving the original characteristics of the signal.
  const attenuation = signalPower / (SNRrange.value * noisePower);
  //multiply each val in the noise by the attenuation factor
  generatedNoiseArr = generatedNoiseArr.map((noise) => noise * attenuation);
  //add the noise to the original signal
  let noisySignal = [];
  for (
    let noiseElementIndex = 0;
    noiseElementIndex < generatedNoiseArr.length;
    noiseElementIndex++
  ) {
    noisySignal.push(
      signals[0].y[noiseElementIndex] + generatedNoiseArr[noiseElementIndex]
    );
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
    data = reader.result
      .trim()
      .split("\n")
      .map((row) => {
        const [col1, col2] = row.split(",");
        return { col1: parseFloat(col1), col2: parseFloat(col2) };
      });
    convertCsvToTrace(data);
  };
});

signalComposerButton.addEventListener("click", () => {
  composeCosineSignal();
});
let maxComposedFrequency = 0;
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
    getMaxFrequency(signals);
  } else {
    NumComposedSignals++;
    updateSignalComponentsList(frequency, amplitude);
  }
  addSignals(wave);
  maxComposedFrequency = Math.max(maxComposedFrequency, parseFloat(frequency));
  console.log('Fmax', maxComposedFrequency, 'Hz');
}

function addSignals(newSignal) {
  if (signalGraph.data.length != 0) {
    for (let amp = 0; amp < newSignal.y.length; amp++) {
      newSignal.y[amp] = signalGraph.data[0].y[amp] + newSignal.y[amp];
    }
    Plotly.update(signalGraph, { y: [newSignal.y], x: [newSignal.x] }, {}, 0);
    if (signals.length != 0) {
      signals.pop();
      signals.push(newSignal);
    }
  } else Plotly.addTraces(signalGraph, newSignal);
}

function removeComponent(optionText) {
  const match = optionText.match(
    /Frequency:\s*(\d+)\s*Hz,\s*Amplitude:\s*(\d+)/
  );
  let amplitude, frequency;
  if (match) {
    frequency = parseInt(match[1]);
    amplitude = parseInt(match[2]);
  }
  let cosSignal = [];
  for (let i = 0; i < 1000; i++) {
    let t = i / 1000; // time x-axis =i/ numofsamples where i is the duration
    let value = amplitude * Math.cos(2 * Math.PI * frequency * t); //sample value y axis
    cosSignal.push(value);
  }
  let signalRemovedComponent = [];
  for (let amp = 0; amp < 1000; amp++) {
    signalRemovedComponent.push(signalGraph.data[0].y[amp] - cosSignal[amp]);
    signals[0].y[amp] = signals[0].y[amp] - cosSignal[amp];
  }
  Plotly.update(signalGraph, { y: [signalRemovedComponent] }, {}, 0);
}

function updateSignalComponentsList(frequency, amplitude) {
  const option = document.createElement("option");
  option.text = `Signal ${NumComposedSignals}: cos (Frequency: ${frequency} Hz, Amplitude: ${amplitude})`;
  option.selected = true;
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
  } else addSignals(uploadedSignal);
}

// Get the sampling rate from the input field and pass it to the sampleData function
samplingRInput.addEventListener("change", function () {
  let userSampRate = parseInt(this.value);
  sampleData(userSampRate);
  const reconstructedData = reconstructSignal(sampledData, sampledData.length);
  console.log("Reconstructed Data:", reconstructedData);

  if (reconstructedGraph.data.length != 0) {
    updateGraphs();
  } else {
    Plotly.addTraces(reconstructedGraph, {
      x: reconstructedData.x,
      y: reconstructedData.y,
    });
    Plotly.addTraces(differenceGraph, {
      x: signalGraph.data[0].x,
      y: signalGraph.data[0].y,
    });
    Plotly.addTraces(differenceGraph, {
      x: reconstructedGraph.data[0].x,
      y: reconstructedGraph.data[0].y,
    });
  }
});

function sampleData(samplingRate) {
  let numSamples = 0;
  let time = 0;
  //checks if it's not the first time the function is being called, and if so, deletes the last trace from the plot and clears the sampledData array
  if (!isFirst) {
    Plotly.deleteTraces(signalGraph, -1);
    sampledData = [];
  }
  for (let i = 0; i < 1000; i++) {
    time = i / 1000; 
  }
  //gets the last uploaded signal from the signals array
  const data = signals[signals.length - 1];
  //gets the duration of the signal, which is the last value in the x array
  const duration = data.x[data.x.length - 1];
  //calculates the number of samples to take by multiplying the time by the samplingRate
  numSamples = time * samplingRate;
  //calculates the time interval between each sample
  const sampleInterval = duration / numSamples;
  let t = 0;
  //starts a for loop that will iterate numSamples times, creating one sampled data point for each iteration
  for (let i = 0; i < numSamples; i++) {
    const x = t;
    //initializes the y-value of the sampled data point to NaN, indicating that it is currently unknown
    let y = NaN;
    //binary search function will iterate through each data point in the original signal to find the y-value of the current sampled data point
    //j is set to the index of the nearest value to x in data.x array, using the binarySearch function
    let j = binarySearch(data.x, x);
    //If j is within range of the data.x array, then y is calculated using linear interpolation between y values corresponding to x1 and x2 values
    if (j >= 0 && j < data.x.length - 1) {
      const x1 = data.x[j];
      const y1 = data.y[j];
      const x2 = data.x[j + 1];
      const y2 = data.y[j + 1];
      y = y1 + (y2 - y1) * (x - x1) / (x2 - x1);
    }
    //A new object with x and y properties is pushed to the sampledData array
    sampledData.push({
      x: x,
      y: y
    });
    // increment the time variable by the sample interval
    t += sampleInterval; 
  }
  //isFirst is set to false to indicate that this is not the first time sampleData is being called
  isFirst = false;
  // add a new trace to the plot
  Plotly.addTraces(signalGraph, {
    // extract the x-values and y-values from the sampled data array
    x: sampledData.map(d => d.x),
    y: sampledData.map(d => d.y),
    mode: "markers",
    marker: {
      color: "red",
      size: 5
    },
    name: "Sampled Data"
  });
}

function binarySearch(arr, x) {
  let start = 0;
  //end is set to the index of the last element in the array arr
  let end = arr.length - 1;

  while (start <= end) {
    let mid = Math.floor((start + end) / 2);

    if (arr[mid] === x) {
      return mid;
    } else if (arr[mid] < x) {
      start = mid + 1;
    } else {
      end = mid - 1;
    }
  }
  //If the function completes the loop without finding x, it returns the value of end. This value represents the index of the first element in the array that is greater than x
  return end;
}

// function getMaxFrequency(signal) {
//   const lastSignal = signal[signal.length - 1]; // get the last signal in the array
//   const duration = lastSignal.x[lastSignal.x.length - 1]; // duration of signal by getting the last value of the x array of the last signal in the array
//   const numSamples = lastSignal.x.length; //This line calculates the number of samples in the signal by getting the length of the x array of the last signal in the array
//   const period = duration / (numSamples - 1); // calculates the period of the signal by dividing the duration by the number of samples minus one
//   const maxFrequency = 1 / (2 * period); //calculates the Nyquist frequency, which is half the sampling rate, by dividing 1 by twice the period
//   return maxFrequency;
// }

function sinc(x) {
  if (x === 0) return 1;
  const piX = Math.PI * x;
  return Math.sin(piX) / piX;
}

function reconstructSignal(sampledData, numPoints) {
  console.log("Sampled Data:", sampledData);
  console.log("Num Points:", numPoints);
  const reconstructedData = { x: [], y: [] };
  const T = sampledData[1].x - sampledData[0].x;

  for (let i = 0; i < numPoints; i++) {
    const t = i * T;
    let sum = 0;

    for (let n = 0; n < sampledData.length; n++) {
      sum += sampledData[n].y * sinc((t - sampledData[n].x) / T);
    }

    reconstructedData.x.push(t);
    reconstructedData.y.push(sum);
  }

  return reconstructedData;
}
function calculateDifference(originalSignal, reconstructedSignal) {
  const differenceSignal = { x: [], y: [] };

  for (let i = 0; i < originalSignal.x.length; i++) {
    differenceSignal.x.push(i);
    differenceSignal.y.push(originalSignal.y[i] - reconstructedSignal.y[i]);
  }

  return differenceSignal;
}
// samplingFrequency.addEventListener("change", () => {
//   const signalData = signalGraph.data[0];
//   // const sampledSignal = sampleSignal(signalData, samplingFrequency.value);
//   const reconstructedSignal = reconstructSignal(sampledSignal, signalData.x.length);
//   const differenceSignal = calculateDifference(signalData, reconstructedSignal);

//   Plotly.update(signalGraph, { marker: { size: 6 } }, {}, [0]);
//   Plotly.update(reconstructedGraph, { x: reconstructedSignal.x, y: reconstructedSignal.y }, {}, [0]);
//   Plotly.update(differenceGraph, { x: differenceSignal.x, y: differenceSignal.y }, {}, [0]);
// });

removeSignalComponentButton.addEventListener("click", () => {
  const selectedIndex = signalComponentSelect.selectedIndex;
  const selectedComponentText =
    signalComponentSelect.options[selectedIndex].value;
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
  console.log('Updating graphs...');

  if (signalGraph.data.length === 0) {
    return; // If there is no data in the signalGraph, exit the function
  }
  const signalData = signalGraph.data[0];
  console.log('Signal data:', signalData);
  const numPoints = signalData.x.length;
  console.log('Number of points:', numPoints);
  console.log('Signal data:', signalData);
  console.log('Number of points:', numPoints);
  // Remove the direct call to sampleData
  // const sampledSignal = sampleData(samplingFrequency.value);

  // Check if sampledData is not empty
  if (signalData && sampledData.length > 0) {
    const reconstructedSignal = reconstructSignal(sampledData, signalData.length);

    Plotly.update(signalGraph, { marker: { size: 6 } }, {}, [0]);
    Plotly.update(reconstructedGraph, { x: reconstructedSignal.x, y: reconstructedSignal.y }, {}, [0]);
    Plotly.update(differenceGraph, [{ x: signalGraph.data[0].x, y: signalGraph.data[0].y },{x:reconstructedGraph.data[0].x, y:reconstructedGraph.data[0].y}], {}, [0,1]);
  }
}
// Update the graphs whenever a new signal is added, removed, or modified
signalComposerButton.addEventListener("click", updateGraphs);
removeSignalComponentButton.addEventListener("click", updateGraphs);
samplingFrequency.addEventListener("change", updateGraphs);

// Update the signal components list whenever a new signal is added or removed
//signalComposerButton.addEventListener("click", updateSignalComponentsList);
//removeSignalComponentButton.addEventListener("click", updateSignalComponentsList);


// freqValueSlider.addEventListener("input", () => {
  //   updateSamplingRateNormalized();
  //   updateSamplingRateActual();
  //   updateGraphs(); // Pass the numPoints variable as an argument
  // });
  // Get the new slider input elements and the span elements to display the values
  
  
  // Function to update the sampling rate based on the actual frequency slider value
  // function updateSamplingRateActual() {
    //   const sliderValue = parseFloat(freqValueSlider.value);

//   // Update the sampling rate input element and the displayed value
//   samplingRInput.value = sliderValue.toFixed(2);
//   freqValueDisplay.textContent = sliderValue.toFixed(2);

//   // Trigger the change event for the sampling rate input element
//   samplingRInput.dispatchEvent(new Event("change"));
// }

//Add event listeners for the new slider inputs
// normalizedValueSlider.addEventListener("input", updateSamplingRateNormalized);
// freqValueSlider.addEventListener("input", updateSamplingRateActual);

// function getFmax(sampleRate)
// {
//   const signal=signalGraph.data[0].y;
//   const signalLength = signalGraph.data[0].y.length;
//   const nyquistFrequency = sampleRate / 2;
//   const fft = new p5.FFT();
//   const spectrum = fft.analyze(signal);  
//   const maxBin = spectrum.indexOf(Math.max(...spectrum.slice(0, signalLength / 2)));
//   const maxFrequency = Math.abs(maxBin * nyquistFrequency / (signalLength / 2));
  
// console.log("fmax is here");
// console.log(signalLength);
// console.log(signal);
// console.log(maxFrequency);
// console.log("fmax done");
// return maxFrequency;
// }
// function getMaxFrequency(signal) {
//   const N = signal.length;
//   const Fs = N / signal[N-1].x; // sampling frequency
//   const df = Fs / N; // frequency resolution
//   let maxAmp = 0;
//   let maxFreq = 0;
//   for (let i = 0; i < N; i++) {
//     const amp = Math.sqrt(signal[i].y * signal[i].y + signal[i].x * signal[i].x);
//     if (amp > maxAmp) {
//       maxAmp = amp;
//       maxFreq = i * df;
//     }
//   }
//   // console.log('Fmax', maxFreq, 'Hz');
//   // return maxFreq;
// }
function getMaxFrequency(data) {
  // Calculate the time step between samples
  const dt = data.x[1] - data.x[0];

  // Determine the units of the x values
  const units = data.xUnits || '';

  // Convert the time step to seconds if necessary
  if (units === 'ms') {
    dt /= 1000;
  } else if (units === 'us') {
    dt /= 1000000;
  }

  // Calculate the sampling frequency
  const samplingFrequency = 1 / dt;

  // Calculate the Nyquist frequency
  const nyquistFrequency = samplingFrequency / 2;

  // Calculate the maximum frequency
  const maxFrequency = nyquistFrequency;
  return maxFrequency;
}



// Function to update the sampling rate based on the normalized slider value
function updateSamplingRateNormalized() {
console.log("Slider normalized value changed!");
const sliderValue = parseFloat(normalizedValueSlider.value);
const maxFrequency = getMaxFrequency(signalGraph.data[0]);
const newSamplingRate = sliderValue * maxFrequency;

// Update the sampling rate input element and the displayed value
samplingRInput.value = newSamplingRate.toFixed(2).toString();
normalizedValueDisplay.textContent = sliderValue.toFixed(2);

// Trigger the change event for the sampling rate input element
samplingRInput.dispatchEvent(new Event("change"));
}

function updateSamplingRateActual() {
// Define the maximum frequency range
const maxFrequencyRange = [0, 4 * getMaxFrequency(signalGraph.data[0])];

// Set the initial value of the slider to the midpoint of the range
freqValueSlider.value = (maxFrequencyRange[0] + maxFrequencyRange[1]) / 2;

// Set the minimum and maximum values of the slider
freqValueSlider.min = maxFrequencyRange[0];
freqValueSlider.max = maxFrequencyRange[1];

// Add an event listener to the slider to update the sampling frequency input
freqValueSlider.addEventListener('input', () => {
  // Retrieve the current value of the slider
  const currentMaxFrequency = freqValueSlider.value;

  // Calculate the new sampling frequency based on the current maximum frequency
  const newSamplingFrequency = currentMaxFrequency * 2;

  // Update the sampling frequency input with the new value
  samplingFrequency.value = newSamplingFrequency;

  // Update the graphs with the new sampling frequency
  updateGraphs();
});
}
