//---------------------------------DOM VARIABLES-----------------------------------------------

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
const saveButton = document.getElementById("saveButton");

//---------------------------------VARIABLE INITIALIZATION-------------------------------------
let sampledData = [];
let signals = []; //store signal with no effect of noise
let NumComposedSignals = 0; //number of signals to add to remove component list
let userSampRate;
let maxComposedFrequency = 0;
let isFirst = true;
let isComposed = false;
let isUploaded = false;

//----------------------------------EVENTLISTENERS---------------------------------------------
//create initial plots and names them
window.addEventListener("load", function () {
  createPlot(signalGraph);
  Plotly.relayout(signalGraph, { title: "Signal" });
  createPlot(reconstructedGraph);
  Plotly.relayout(reconstructedGraph, { title: "Reconstructed" });
  createPlot(differenceGraph);
  Plotly.relayout(differenceGraph, { title: "Difference" });
});

// update the sampling frequency according to normalized value slider
normalizedValueSlider.addEventListener("input", () => {
  updateSamplingRateNormalized();
});

// update the sampling frequency input according to actual value slider
freqValueSlider.addEventListener("input", () => {
  updateSamplingRateActual();
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
    const noiseValue = Math.random() * Math.sqrt(signalPower); //0->1
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
  //attenuation factor is a measure of signal loss, while SNR is a measure of the signal quality in relation to the noise level.
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
  updateDifferenceOne();
});

// event listener to the file upload input element to trigger when a file is selected
uploadFile.addEventListener("change", (event) => {
  // Set the isUploaded flag to true when a file is selected
  isUploaded = true;
  // Retrieve the file object from the event target
  const file = event.target.files[0];
  // Create a new file reader instance
  const reader = new FileReader();
  // Read the file as text
  reader.readAsText(file);
  let data;
  // Trigger this function when the file is loaded
  reader.onload = () => {
    // Parse the CSV data into an array of objects
    data = reader.result
      .trim()
      .split("\n")
      .map((row) => {
        // Split each row by comma and convert the values to numbers
        const [col1, col2] = row.split(",");
        return { col1: parseFloat(col1), col2: parseFloat(col2) };
      });
    // Convert the CSV data to a trace and update the graph
    convertCsvToTrace(data);
  };
});

// event listener to the signalComposerButton element that listens for a 'click' event
signalComposerButton.addEventListener("click", () => {
  // Call the composeCosineSignal() function to generate a new cosine signal with user-defined parameters
  composeCosineSignal();
  // Call the updateSignal() function to update the signal graph with the new data
  updateSignal();
});

// event listener to the removeComponentButton element that listens for a 'click' event
removeSignalComponentButton.addEventListener("click", () => {
  // get the index of the selected signal component from the dropdown
  const selectedIndex = signalComponentSelect.selectedIndex;
  // get the text of the selected signal component
  const selectedComponentText =
    signalComponentSelect.options[selectedIndex].value;
  // remove the selected component from the signal graph
  removeComponent(selectedComponentText);
  // remove the selected component from the dropdown
  signalComponentSelect.remove(selectedIndex);
  // update the signal graph after removing the component
  updateSignal();
});

// event listener to the savebutton element that listens for a 'click' event
saveButton.addEventListener("click", saveSignalData);

// Get the sampling rate from the input field and pass it to the sampleData function
samplingRInput.addEventListener("change", async function () {
  userSampRate = parseInt(this.value);
  //sample and reconstruct
  sampleData(userSampRate);
  const reconstructedData = reconstructSignal(sampledData, sampledData.length);
  //if reconstructed graph not empty , update the graphs else , add to graphs
  if (reconstructedGraph.data.length != 0) {
    updateSignal();
    updateReconstruction();
  } else {
    Plotly.addTraces(reconstructedGraph, {
      x: reconstructedData.x,
      y: reconstructedData.y,
      mode: "lines",
      name: "spline",
      line: { shape: "spline", color: "orange" },
      type: "scatter",
    });
    const differenceData = calculateDifference();
    Plotly.addTraces(differenceGraph, {
      x: differenceData.x,
      y: differenceData.y,
      name: "spline",
      line: { shape: "spline", color: "green" },
      type: "scatter",
    });
  }
  //await updateSamplingRateNormalized();
});

//---------------------------------------UTITILITY FUNCTIONS------------------------------------------------
function createPlot(graphElement) {
  let layout = {
    xaxis: {
      title: "Time (sec)",
      zoom: 1000,
    },
    yaxis: {
      title: "Amplitude",
    },
  };
  Plotly.newPlot(graphElement, [], layout, {
    displaylogo: false,
    // Enable responsive sizing of the plot
    responsive: true,
    // Enable automatic resizing of the plot to fit its container element
    autosize: true,
  });
}

function convertCsvToTrace(csvdata) {
  // Extract data from the CSV data
  let x = csvdata.map((arrRow) => arrRow.col1).slice(0, 1000);
  let y = csvdata.map((arrRow) => arrRow.col2).slice(0, 1000);
  let uploadedSignal = { name: "Original Signal", x: x, y: y };
  // If there are no existing signals, add the uploaded signal as a trace to the plot else add the uploaded signal as a component to the plot
  if (signals.length == 0) {
    signals.push(uploadedSignal);
    Plotly.addTraces(signalGraph, uploadedSignal);
  } else {
    addComponent(uploadedSignal);
  }
}

// This function to save signal data as CSV file
function saveSignalData() {
  // Get the signal data
  const signalData = signalGraph.data[0];
  // Create a CSV string from the signal data
  let csvString = "";
  for (let i = 0; i < signalData.x.length; i++) {
    csvString += signalData.x[i] + "," + signalData.y[i] + "\n";
  }
  // Create a blob from the CSV string
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8" });
  // Create a download link for the CSV file
  const downloadLink = document.createElement("a");
  downloadLink.href = URL.createObjectURL(blob);
  downloadLink.download = "signal_data.csv";
  // Click the download link to download the CSV file
  downloadLink.click();
}

// This function composes a cosine signal using the frequency and amplitude values from the composer
function composeCosineSignal() {
  let frequency = composerFrequency.value;
  let amplitude = composerAmplitude.value;
  let wave = { x: [], y: [], name: "original signal" };
  // iterate over 1000 time durations to generate the signal of 1000 sample
  for (let duration = 0; duration < 1000; duration++) {
    // calculate the time value for the current duration
    let timeValue = duration / 1000;
    // calculate the cosine value using the time and frequency values
    var value = amplitude * Math.cos(2 * Math.PI * frequency * timeValue);
    wave.x.push(timeValue);
    wave.y.push(value);
  }
  // check if any signals have been added before,if no add to signals array else update the component list
  if (signals.length == 0) {
    signals.push(wave);
  } else {
    NumComposedSignals++;
    updateSignalComponentsList(frequency, amplitude); // update the list of signal components on the page
  }
  // add the component to the plot
  addComponent(wave);
  isComposed = true;
  // update the maximum frequency of the composed signals
  maxComposedFrequency = Math.max(maxComposedFrequency, parseFloat(frequency));
}

//This function adds componenets to the signal; either cosine componenets or uploaded signal
function addComponent(newSignal) {
  if (signalGraph.data.length != 0) {
    // If there are existing signals, add the new signal to them by summing amplitudes
    for (let amplitude = 0; amplitude < newSignal.y.length; amplitude++) {
      newSignal.y[amplitude] =
        signalGraph.data[0].y[amplitude] + newSignal.y[amplitude];
    }
    // Update the signal graph with the new signal data
    Plotly.update(signalGraph, { y: [newSignal.y], x: [newSignal.x] }, {}, 0);
    // If there are signals in the signals array, replace the last one with the new signal
    if (signals.length != 0) {
      signals.pop();
      signals.push(newSignal);
    }
  } else {
    // If there are no existing signals on the graph, add the new signal as a new trace
    Plotly.addTraces(signalGraph, newSignal);
  }
}

//This function removes component from the displayed signal
function removeComponent(optionText) {
  // Extract frequency and amplitude from the selected option's text
  const match = optionText.match(
    /Frequency:\s*(\d+)\s*Hz,\s*Amplitude:\s*(\d+)/
  );
  let amplitude, frequency;
  if (match) {
    frequency = parseInt(match[1]);
    amplitude = parseInt(match[2]);
  }
  // Create a cosine signal with the extracted frequency and amplitude
  let cosSignal = [];
  for (let duration = 0; duration < 1000; duration++) {
    let timeValue = duration / 1000; // Calculate time value for x-axis
    let value = amplitude * Math.cos(2 * Math.PI * frequency * timeValue); // Calculate sample value for y-axis
    cosSignal.push(value);
  }
  // Subtract the cosine signal from the existing signal
  let signalRemovedComponent = [];
  for (let amplitude = 0; amplitude < 1000; amplitude++) {
    signalRemovedComponent.push(
      signalGraph.data[0].y[amplitude] - cosSignal[amplitude]
    ); // Subtract the cosine signal value from the original signal value
    signals[0].y[amplitude] = signals[0].y[amplitude] - cosSignal[amplitude]; // Update the signal's data
  }
  // Update the plot with the new signal data
  Plotly.update(signalGraph, { y: [signalRemovedComponent] }, {}, 0);
}

// This function updates the signal components list with the new composed signal.
function updateSignalComponentsList(frequency, amplitude) {
  const option = document.createElement("option");
  // Set the option text to display the frequency and amplitude of the new composed signal
  option.text = `Signal ${NumComposedSignals}: cos (Frequency: ${frequency} Hz, Amplitude: ${amplitude})`;
  // Set the option to be selected by default
  option.selected = true;
  // Add the new option to the signal component select element
  signalComponentSelect.add(option);
}

//---------------------------------------SIGNAL PROCESSING FUNCTIONS-------------------------------------
//This function applys sampling using the sampling frequency entered
function sampleData(samplingRate) {
  let numSamples = 0;
  //checks if it's not the first time the function is being called, and if so, deletes the last trace from the plot and clears the sampledData array
  if (!isFirst) {
    Plotly.deleteTraces(signalGraph, -1);
    sampledData = [];
  }
  //gets the last uploaded signal from the signals array
  const data = signals[signals.length - 1];
  //gets the duration of the signal, which is the last value in the x array
  const duration = data.x[data.x.length - 1];
  //calculates the number of samples to take by multiplying the timeValue by the samplingRate
  numSamples = duration * samplingRate;
  //calculates the time interval between each sample
  const sampleInterval = duration / numSamples;
  let timeValue = 0;
  //starts a for loop that will iterate numSamples times, creating one sampled data point for each iteration
  for (let sampleCounter = 0; sampleCounter <= numSamples; sampleCounter++) {
    const x = timeValue;
    //initializes the y-value of the sampled data point to NaN, indicating that it is currently unknown
    let y = NaN;
    //binary search function will iterate through each data point in the original signal to find the nearest x-value of the current sampled data point
    //j is set to the index of the nearest value to x in data.x array, using the binarySearch function
    let nearestIndex = binarySearch(data.x, x);
    //If j is within range of the data.x array, then y is calculated using linear interpolation between y values corresponding to x1 and x2 values
    if (nearestIndex >= 0 && nearestIndex < data.x.length - 1) {
      const x1 = data.x[nearestIndex];
      const y1 = data.y[nearestIndex];
      const x2 = data.x[nearestIndex + 1];
      const y2 = data.y[nearestIndex + 1];
      y = y1 + ((y2 - y1) * (x - x1)) / (x2 - x1);
    }
    //A new object with x and y properties is pushed to the sampledData array
    sampledData.push({
      x: x,
      y: y,
    });
    // increment the time variable by the sample interval
    timeValue += sampleInterval;
  }
  //isFirst is set to false to indicate that this is not the first time sampleData is being called
  isFirst = false;
  // add a new trace to the plot
  Plotly.addTraces(signalGraph, {
    // extract the x-values and y-values from the sampled data array; from array of objects to 2 arrays
    x: sampledData.map((d) => d.x),
    y: sampledData.map((d) => d.y),
    mode: "markers",
    marker: {
      color: "red",
      size: 5,
    },
    name: "Sampled Data",
  });
}

//This function applies binary search using element x on the arr to find equivalent x values in sampling
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

//This function applies sinc interpolation on x
function sinc(x) {
  if (x === 0) return 1;
  const piX = Math.PI * x; //x is the distance between the current point and the nearest sample point
  return Math.sin(piX) / piX;
}

//This function applies reconstruction using the sampled data
function reconstructSignal(sampledData, numPoints) {
  const reconstructedData = { x: [], y: [] };
  //sampling period
  const samplingPeriod = sampledData[1].x - sampledData[0].x;
  //calculate the reconstructed signal value at each time value
  // for (let i = 0; i < numPoints; i++) {
  //   const t = i * T;
  for (let timeIndex = 0; timeIndex < signals[0].x.length; timeIndex++) {
    // QUESTION TO ASK
    const time = signals[0].x[timeIndex];
    let sum = 0;

    for (let sampleIndex = 0; sampleIndex < sampledData.length; sampleIndex++) {
      sum +=
        sampledData[sampleIndex].y *
        sinc((time - sampledData[sampleIndex].x) / samplingPeriod);
      //divided by the sampling period T to obtain a normalized distance between the sample and the current reconstruction time.
    }
    reconstructedData.x.push(time);
    reconstructedData.y.push(sum);
  }
  return reconstructedData;
}

//This function calculates the difference between original and reconstructed to display on differenceGraph
function calculateDifference() {
  let differenceData = { x: [], y: [] };
  let signalX = signals[0].x;
  let signalY = signals[0].y;
  let reconstructedDataY = reconstructedGraph.data[0].y;
  for (let i = 0; i < signalX.length; i++) {
    differenceData.y.push(signalY[i] - reconstructedDataY[i]);
    differenceData.x = signalX;
  }
  return differenceData;
}

//This function is used to get the maximum frequency of the current signal
async function getMaxFrequency() {
  //If the signal is composed and not uploaded, returns the pre-determined maximum frequency
  let maxFrequency;
  if (isComposed == true && isUploaded == false) {
    maxFrequency = maxComposedFrequency;
    //return maxFrequency;
  } else {
    const response = await fetch("/getMaxFreq", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ signalX: signals[0].x, signalY: signals[0].y }),
    });
    const data = await response.json();
    maxFrequency = data.fmax;
    //return maxFrequency;
  }
    return maxFrequency;

}

//--------------------------------------UPDATE FUNCTIONS----------------------------------------
//This function updates signals graphs
function updateSignal() {
  // Update the signalGraph plot with the current signal data
  Plotly.update(
    signalGraph,
    { y: [signalGraph.data[0].y], x: [signalGraph.data[0].x] },
    {},
    0
  );
  // if there is data in the reconstructedGraph, update it
  if (reconstructedGraph.data.length != 0) {
    // Update the signal reconstruction plot
    updateReconstruction();
  }
}

//This function updates reconstructedGraph and then the differenceGraph
function updateReconstruction() {
  // get sampled data with the current user-specified sampling rate
  sampleData(userSampRate);
  // reconstruct the signal with the sampled data and its length
  const reconstructedSignal = reconstructSignal(
    sampledData,
    sampledData.length
  );
  Plotly.update(
    reconstructedGraph,
    {
      x: [reconstructedSignal.x],
      y: [reconstructedSignal.y],
      mode: "lines",
      name: "Reconstructed + Sampled",
      //line: { shape: "spline" },
      type: "scatter",
    },
    {},
    0
  );
  const differenceData = calculateDifference();
  // update the differenceGraph
  // check if the differenceGraph has any data
  if (differenceGraph.data.length != 0) {
    updateDifferenceGraph(differenceData);
  }
}

//This function updates the differenceGraph with the x and y values of the calculated differenceData
function updateDifferenceGraph(differenceData) {
  Plotly.update(
    differenceGraph,
    { x: [differenceData.x], y: [differenceData.y] },
    {},
    0
  );
}

//This function to update the sampling rate based on the normalized slider value
async function updateSamplingRateNormalized() {
  // Get the current value of the slider
  const sliderValue = parseFloat(normalizedValueSlider.value);
  // Get the maximum frequency from the signal data
  const maxFrequency = await getMaxFrequency();
  console.log(maxFrequency);
  // Calculate the new sampling rate based on the slider value and the maximum frequency
  const newSamplingRate = sliderValue * maxFrequency;
  // Update the sampling rate input element and the displayed value
  samplingRInput.value = newSamplingRate.toFixed(2).toString();
  normalizedValueDisplay.textContent = sliderValue.toFixed(2);
  // Trigger the change event for the sampling rate input element
  samplingRInput.dispatchEvent(new Event("change"));
  // Update the necessary graphs with the new sampling frequency
  //updateReconstruction();
}

//This function to update the sampling rate based on the actual slider value
async function updateSamplingRateActual() {
  // Get the current value of the slider
  const sliderValue = parseFloat(freqValueSlider.value);
  // Get the maximum frequency from the signal data
  const maxFrequency = await getMaxFrequency();
  //console.log(maxFrequency);
  //Defines the range that will be used in the slider
  const maxFrequencyRange = [0, 4 * maxFrequency];
  // Set the minimum and maximum values of the slider
  freqValueSlider.min = maxFrequencyRange[0];
  freqValueSlider.max = maxFrequencyRange[1];
  // Calculate the new sampling frequency based on the current maximum frequency
  const newSamplingRate = sliderValue;
  // Update the sampling rate input element and the displayed value
  samplingRInput.value = newSamplingRate.toFixed(2).toString();
  freqValueDisplay.textContent = sliderValue.toFixed(2);
  // Trigger the change event for the sampling rate input element
  samplingRInput.dispatchEvent(new Event("change"));
  // Update the necessary graphs with the new sampling frequency
  //updateReconstruction();
}
