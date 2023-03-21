
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

SNRrange.addEventListener("change",()=>{
  SNRvalue.innerHTML = SNRrange.value;
  let signalData;
  console.log(signalGraph.data[0]);
  console.log(uploadedSignals);
  if(signalGraph.data[0].signalType==="composed"){
    signalData = composedSignals;
  }
  else{
    signalData = uploadedSignals;
  }
  // calculate the power of signal (amplitude)
  const squaredSignal = signalData[0].y.map((amplitude) => amplitude ** 2);
  // calculate the average of the squared samples
  const signalPower = squaredSignal.reduce((sum, value) => sum + value, 0) / signalData[0].x.length;
  //calculate noise power
  const noisePower = signalPower / SNRrange.value;

  const noisySignal = generateNoise(signalData, noisePower);
  update={'y':[noisySignal]};
  Plotly.update(signalGraph,update,{},[0]);
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

function generateNoise(signal,noisePower){
  let noiseArr= [];
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