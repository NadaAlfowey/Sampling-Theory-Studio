
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

let uploadedSignals=[];
let composedSignals=[];

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
    // dragmode: false,
    // zoommode: false,
  };
  Plotly.newPlot(graphElement, [], layout, {
    displaylogo: false,
    responsive: true,
    autosize: true,
  });
}

SNRrange.addEventListener("change",()=>{
  SNRvalue.innerHTML = SNRrange.value;
  let signalData;
  if (signalGraph.data[0].signalType === "composed") {
    signalData = composedSignals;
  } else {
    signalData = uploadedSignals;
  }
  // calculate the power of signal (amplitude)
  //signal power = signal values ^2
  const squaredSignal = signalData[0].y.map((signalAmplitude) =>
    Math.pow(signalAmplitude, 2)
  );
  // calculate the average of the squared samples
  const signalPower =
    squaredSignal.reduce((sum, value) => sum + value, 0) /
    signalData[0].x.length;
  //generate noise
  let noiseArr = [];
  for (let i = 0; i < signalData[0].x.length; i++) {
    //generate noise signal and scale noise signal to the range of the signal power.
    //scaling matches the amplitude range of the noise to the amplitude range of the signal so that signal does not completely become drowned out by noise
    const noiseValue = Math.random() * Math.sqrt(signalPower);
    noiseArr.push(noiseValue);
  }
  //calculate noise power
  const squaredNoise = noiseArr.map((noiseAmplitude) =>
    Math.pow(noiseAmplitude, 2)
  );
  const noisePower =
    squaredNoise.reduce((sum, value) => sum + value, 0) / noiseArr.length;
  //calculate attenuation factor SNR = signal power/ A * noise power
  //attenuation is used to scale the generated noise signal before adding it to the original signal. 
  //This helps to achieve the desired SNR level while preserving the original characteristics of the signal.
  const attenuation = signalPower / (SNRrange.value * noisePower);
  //multiply each val in the noise by the attenuation factor
  noiseArr = noiseArr.map((noise) => noise * attenuation);
  //add the noise to the original signal
  let noisySignal = [];
  for (let i = 0; i < noiseArr.length; i++) {
    noisySignal.push(signalData[0].y[i] + noiseArr[i]);
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

signalComposerButton.addEventListener("click",()=>{
  composeCosineSignal();
});

function composeCosineSignal(){
 let frequency = composerFrequency.value; // frequency in Hz
 let amplitude = composerAmplitude.value; // peak amplitude
  let wave = { x: [], y: [], signalType:"" };
  for (let i = 0; i < 1000; i++) {
   let t = i / 1000; // time x-axis =i/ numofsamples where i is the duration
   var value = amplitude * Math.cos(2 * Math.PI * frequency * t); //sample value y axis
    wave.x.push(i);
    wave.y.push(value);
    wave.signalType = "composed";

  }
  composedSignals.push(wave);
 Plotly.addTraces(signalGraph, wave);
}

function convertCsvToTrace(csvdata) {
  let signal = {};
  let x=csvdata.map(arrRow => arrRow.col1);
  let y=csvdata.map(arrRow => arrRow.col2);
  signal["x"] = x;
  signal["y"] = y;
  signal["signalType"]='uploaded';
  console.log(signal);
  uploadedSignals.push(signal);
  Plotly.addTraces(signalGraph, signal);
}