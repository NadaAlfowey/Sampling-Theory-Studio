
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
let sampledData = [];
let signals = [];
let NumComposedSignals = 0;
let userSampRate;
let maxComposedFrequency = 0;
let isComposed = false;
let isUploaded = false;

document.onload = createPlot(signalGraph);
document.onload = createPlot(reconstructedGraph);
document.onload = createPlot(differenceGraph);

function createPlot(graphElement) {
  // Define the layout options for the plot
  let layout = {
    // Define the plot title and a placeholder to edit it
    title: { title: "Click Here<br>to Edit Chart Title" },
    // Define the x-axis options
    xaxis: {
      // Enable the range slider for the x-axis
      // rangeslider: {
      //   // Set the initial range of the slider to [0, 1]
      //   range: [0, 1],
      //   // Make the range slider visible
      //   visible: true,
      //   // Disable dragging of the range slider
      //   dragmode: false,
      //   // Disable zooming with the range slider
      //   zoom: false,
      // },
      // Set the title for the x-axis
      title: "Time (sec)",
      // Enable zooming for the x-axis with a max zoom level of 1000x
      zoom: 1000,
    },
    // Define the y-axis options
    yaxis: {
      // Set the title for the y-axis
      title: "Amplitude",
    },
  };
  // Create a new empty plot with the given layout options
  Plotly.newPlot(graphElement, [], layout, {
    // Disable the display of the plotly logo
    displaylogo: false,
    // Enable responsive sizing of the plot
    responsive: true,
    // Enable automatic resizing of the plot to fit its container element
    autosize: true,
    
  });
}

// Add an event listener to the normalized value slider to update the sampling frequency
normalizedValueSlider.addEventListener("input", () => {
  updateSamplingRateNormalized();
});

// Add an event listener to the actual value slider to update the sampling frequency input 
freqValueSlider.addEventListener('input', () => {
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
  updateDifferenceOne();
});

// Add an event listener to the file upload input element to trigger when a file is selected
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

// Add event listener to the signalComposerButton element that listens for a 'click' event
signalComposerButton.addEventListener("click", () => {
  // Call the composeCosineSignal() function to generate a new cosine signal with user-defined parameters
  composeCosineSignal();
  // Call the updateSignal() function to update the signal graph with the new data
  updateSignal();
});

// This function composes a cosine signal using the frequency and amplitude values from the composer form
function composeCosineSignal() {
  let frequency = composerFrequency.value; // get the frequency value in Hz from the composer form
  let amplitude = composerAmplitude.value; // get the peak amplitude value from the composer form
  let wave = { x: [], y: [] }; // initialize an empty wave object to hold the x and y data points
  // iterate over 1000 time durations to generate the signal
  for (let duration = 0; duration < 1000; duration++) {
  let timeValue = duration / 1000; // calculate the time value for the current duration
  var value = amplitude * Math.cos(2 * Math.PI * frequency * timeValue); // calculate the sample value using the time and frequency values
  wave.x.push(timeValue); // add the current time value to the x data array
  wave.y.push(value); // add the current sample value to the y data array
  }
  // check if any signals have been added before
  if (signals.length == 0) {
  signals.push(wave); // add the wave object to the signals array
  } else {
  NumComposedSignals++; // increase the count of the number of composed signals
  updateSignalComponentsList(frequency, amplitude); // update the list of signal components on the page
  }
  addSignals(wave); // add the wave object to the plot
  isComposed = true; // set the isComposed flag to true to indicate a composed signal is being displayed
  maxComposedFrequency = Math.max(maxComposedFrequency, parseFloat(frequency)); // update the maximum frequency of the composed signals
  }

function addSignals(newSignal) {
  // Check if there are existing signals on the graph
  if (signalGraph.data.length != 0) {
    // If there are existing signals, add the new signal to them
    for (let amplitude = 0; amplitude < newSignal.y.length; amplitude++) {
      newSignal.y[amplitude] = signalGraph.data[0].y[amplitude] + newSignal.y[amplitude];
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
    signalRemovedComponent.push(signalGraph.data[0].y[amplitude] - cosSignal[amplitude]); // Subtract the cosine signal value from the original signal value
    signals[0].y[amplitude] = signals[0].y[amplitude] - cosSignal[amplitude]; // Update the signal's data
  }
  // Update the plot with the new signal data
  Plotly.update(signalGraph, { y: [signalRemovedComponent] }, {}, 0);
}


// This function updates the signal components list with the new composed signal.
function updateSignalComponentsList(frequency, amplitude) {
  // Create a new option element
  const option = document.createElement("option");
  // Set the option text to display the frequency and amplitude of the new composed signal
  option.text = `Signal ${NumComposedSignals}: cos (Frequency: ${frequency} Hz, Amplitude: ${amplitude})`;
  // Set the option to be selected by default
  option.selected = true;
  // Add the new option to the signal component select element
  signalComponentSelect.add(option);
}


function convertCsvToTrace(csvdata) {
  let uploadedSignal = {}; // Create an empty object to hold the uploaded signal data
  let x = csvdata.map((arrRow) => arrRow.col1).slice(0, 1000); // Extract the x-values from the CSV data
  let y = csvdata.map((arrRow) => arrRow.col2).slice(0, 1000); // Extract the y-values from the CSV data
  uploadedSignal["x"] = x; // Assign the x-values to the "x" property of the uploadedSignal object
  uploadedSignal["y"] = y; // Assign the y-values to the "y" property of the uploadedSignal object
  if (signals.length == 0) { // If there are no existing signals, add the uploaded signal as a trace to the plot
    signals.push(uploadedSignal);
    Plotly.addTraces(signalGraph, uploadedSignal);
  } else { // If there are existing signals, add the uploaded signal as a component to the plot
    addSignals(uploadedSignal);
  }
}

// Get the sampling rate from the input field and pass it to the sampleData function
samplingRInput.addEventListener("change", function () {
  userSampRate = parseInt(this.value);
  sampleData(userSampRate);
  const reconstructedData = reconstructSignal(sampledData, sampledData.length);
  console.log("Reconstructed Data:", reconstructedData);

  if (reconstructedGraph.data.length != 0) {
    updateSignal();
  } else {
    Plotly.addTraces(reconstructedGraph, {
      x: reconstructedData.x,
      y: reconstructedData.y,
      mode: "lines",
      name: "spline",
      line: { shape: "spline" },
      type: "scatter",
    });
    Plotly.addTraces(differenceGraph, {
      x: signalGraph.data[0].x,
      y: signalGraph.data[0].y,
    });
    Plotly.addTraces(differenceGraph, {
      x: reconstructedGraph.data[0].x,
      y: reconstructedGraph.data[0].y,
      mode: "lines",
      name: "spline",
      line: { shape: "spline" },
      type: "scatter",
    });
  }
});

function sampleData(samplingRate) {
  let numSamples = 0;
  let totalDuration = 0;
  //checks if it's not the first time the function is being called, and if so, deletes the last trace from the plot and clears the sampledData array
  if (!isFirst) {
    Plotly.deleteTraces(signalGraph, -1);
    sampledData = [];
  }
  for (let duration = 0; duration <= 1000; duration++) {
    totalDuration = duration / 1000;
  }
  //gets the last uploaded signal from the signals array
  const data = signals[signals.length - 1];
  //gets the duration of the signal, which is the last value in the x array
  const duration = data.x[data.x.length - 1];
  //calculates the number of samples to take by multiplying the timeValue by the samplingRate
  numSamples = totalDuration * samplingRate;
  //calculates the timeValue interval between each sample
  const sampleInterval = duration / numSamples;
  let timeValue = 0;
  //starts a for loop that will iterate numSamples times, creating one sampled data point for each iteration
  for (let sampleCounter = 0; sampleCounter < numSamples; sampleCounter++) {
    const x = timeValue;
    //initializes the y-value of the sampled data point to NaN, indicating that it is currently unknown
    let y = NaN;
    //binary search function will iterate through each data point in the original signal to find the y-value of the current sampled data point
    //j is set to the index of the nearest value to x in data.x array, using the binarySearch function
    let nearestIndex = binarySearch(data.x, x);
    //If j is within range of the data.x array, then y is calculated using linear interpolation between y values corresponding to x1 and x2 values
    if (nearestIndex >= 0 && nearestIndex < data.x.length - 1) {
      const x1 = data.x[nearestIndex];
      const y1 = data.y[nearestIndex];
      const x2 = data.x[nearestIndex + 1];
      const y2 = data.y[nearestIndex + 1];
      y = y1 + (y2 - y1) * (x - x1) / (x2 - x1);
    }
    //A new object with x and y properties is pushed to the sampledData array
    sampledData.push({
      x: x,
      y: y
    });
    // increment the time variable by the sample interval
    timeValue += sampleInterval;
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

  for (let i = 0; i < signals[0].x.length; i++) {
    const t = signals[0].x[i];
    let sum = 0;

    for (let n = 0; n < sampledData.length; n++) {
      sum += sampledData[n].y * sinc((t - sampledData[n].x) / T);
    }

    reconstructedData.x.push(t);
    reconstructedData.y.push(sum);
  }
  return reconstructedData;
//   var layout = {
//     xaxis: {
//       title: 'Time (s)',
//       range: [0, reconstructedData.x[reconstructedData.x.length - 1]]
//     },
//     yaxis: {
//       title: 'Amplitude',
//       range: [-1.5, 1.5]
//     },
//     data: [
//       {
//         x: reconstructedData.x,
//         y: reconstructedData.y,
//         type: 'scatter',
//         mode: 'lines',
//         line: {
//           smoothing: 0.5,
//           interpolation: 'spline',
//           width: 2
//         }
//       }
//     ]
//   };

//  /// Plotly.u('plot', [layout.data], layout);
//   Plotly.update(reconstructedGraph, { x: reconstructedData.x, y: reconstructedData.y }, {}, [0]);
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

removeSignalComponentButton.addEventListener("click", () => { // add event listener to the remove signal component button
  const selectedIndex = signalComponentSelect.selectedIndex; // get the index of the selected signal component from the dropdown
  const selectedComponentText = signalComponentSelect.options[selectedIndex].value; // get the text of the selected signal component
  removeComponent(selectedComponentText); // remove the selected component from the signal graph
  signalComponentSelect.remove(selectedIndex); // remove the selected component from the dropdown
  updateSignal(); // update the signal graph after removing the component
});


function updateSignal() {
  // Update the plot with the current signal data
  Plotly.update(
    signalGraph,
    { y: [signalGraph.data[0].y], x: [signalGraph.data[0].x] },
    {},
    0
  );

  // Update the signal reconstruction plot
  updateReconstruction();

  // Update the signal difference plot (original signal - reconstructed signal)
  updateDifferenceOne();
}


function updateReconstruction() {
  if (reconstructedGraph.data.length != 0) { // check if there is data in the reconstructedGraph
    sampleData(userSampRate); // get sampled data with the current user-specified sampling rate
    const reconstructedSignal = reconstructSignal( // reconstruct the signal with the sampled data and its length
      sampledData,
      sampledData.length
    );
    Plotly.update(
      // update the reconstructedGraph with the new reconstructed signal
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
    updateDifferenceTwo(); // update the difference graph between the original and reconstructed signals
  }
}


function updateDifferenceOne() {
  if (differenceGraph.data.length != 0) // check if there is any data in the differenceGraph
    Plotly.update(
      differenceGraph,
      { x: [signalGraph.data[0].x], y: [signalGraph.data[0].y] }, // update differenceGraph with the x and y data from signalGraph
      {},
      0
    );
}


function updateDifferenceTwo() {
  // check if the differenceGraph has any data
  if (differenceGraph.data.length != 0)
    // update the differenceGraph with the x and y values of the reconstructedGraph
    Plotly.update(
      differenceGraph,
      { x: [reconstructedGraph.data[0].x], y: [reconstructedGraph.data[0].y] },
      {},  // empty options object
      1   // trace index to update
    );
}


function getMaxFrequency(data) {
  //If the signal is composed and not uploaded, returns the pre-determined maximum frequenc
  if (isComposed == true && isUploaded == false) {
    const maxFrequency = maxComposedFrequency;
    return maxFrequency;
  }
  else {

    // Calculate the time step between samples
    const timeStep = data.x[1] - data.x[0];

    // Determine the units of the x values
    const units = data.xUnits || '';

    // Convert the time step to seconds if necessary
    if (units === 'ms') {
      timeStep /= 1000;
    } else if (units === 'us') {
      timeStep /= 1000000;
    }

    // Calculate the sampling frequency
    const samplingFrequency = 1 / timeStep;

    // Calculate the Nyquist frequency
    const nyquistFrequency = samplingFrequency / 2;

    // Calculate the maximum frequency
    const maxFrequency = nyquistFrequency;
    return maxFrequency;
  }
}
// Function to update the sampling rate based on the normalized slider value
function updateSamplingRateNormalized() {
  console.log("Slider normalized value changed!");
  // Get the current value of the slider
  const sliderValue = parseFloat(normalizedValueSlider.value);
  // Get the maximum frequency from the signal data
  const maxFrequency = getMaxFrequency(signalGraph.data[0]);
  // Calculate the new sampling rate based on the slider value and the maximum frequency
  const newSamplingRate = sliderValue * maxFrequency;

  // Update the sampling rate input element and the displayed value
  samplingRInput.value = newSamplingRate.toFixed(2).toString();
  normalizedValueDisplay.textContent = sliderValue.toFixed(2);

  // Trigger the change event for the sampling rate input element
  samplingRInput.dispatchEvent(new Event("change"));

  // Update the graphs with the new sampling frequency
  updateReconstruction();
}

function updateSamplingRateActual() {
  // Get the current value of the slider
  const sliderValue = parseFloat(freqValueSlider.value);
  // Get the maximum frequency from the signal data
  const maxFrequency = getMaxFrequency(signalGraph.data[0]);
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

  // Update the graphs with the new sampling frequency
  updateReconstruction();
}
// Function to save signal data as CSV file
function saveSignalData() {
  // Get the signal data
  const signalData = signalGraph.data[0];
  // Create a CSV string from the signal data
  let csvString = "x,y\n";
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

// Add event listener to save button
const saveButton = document.getElementById("saveButton");
saveButton.addEventListener("click", saveSignalData);