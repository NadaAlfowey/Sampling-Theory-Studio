
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

document.onload = createPlot(signalGraph);
document.onload = createPlot(reconstructedGraph);
document.onload = createPlot(differenceGraph);

function createPlot(graphElement) {
  let layout = {
    title: { title: "Click Here<br>to Edit Chart Title" },
    xaxis: {
      //   rangeslider: {
      //     range: [0, 1],
      //     visible: true,
      //     dragmode: false,
      //     zoom: false,
      //   },
      range: [0, 5],
      //   rangemode: "tozero",
      title: "Time (s)",
      zoom: 1000,
      //   fixedrange: true,
    },
    yaxis: {
      title: "Amplitude",
      //   fixedrange: true,
    },
    // dragmode: false,
    // zoommode: false,
  };
  let config = {
    //editable: true,
    displaylogo: false,
    modeBarButtonsToRemove: ["toImage", "zoom2d", "lasso2d"],
    responsive: true,
  };

  Plotly.newPlot(graphElement, [], layout, {
    displaylogo: false,
    responsive: true,
    autosize: true,
  });
  // window.onresize = function () {
  //   Plotly.relayout(graphElement, {
  //     "xaxis.autorange": true,
  //     "yaxis.autorange": true,
  //   });
  // };
}

SNRrange.addEventListener("change",()=>{SNRvalue.innerHTML = SNRrange.value;})
signalComposerButton.addEventListener("click",()=>{
  frequency.value;
  amplitude.value;
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
  let frequency = composerFrequency.value; // frequency in Hz
  let amplitude = composerAmplitude.value; // peak amplitude
  let wave = {x:[],y:[]};
  for (var i = 0; i < 1000; i++) {
    let t = i/1000;// time x-axis =i/ numofsamples where i is the duration
    var value = amplitude * Math.cos(2 * Math.PI * frequency * t); //sample value y axis
    wave.x.push(i);
    wave.y.push(value);
  }
  Plotly.addTraces(signalGraph, wave);
});

function convertCsvToTrace(csvdata) {
  let signal = {};
  let x=csvdata.map(arrRow => arrRow.col1);
  let y=csvdata.map(arrRow => arrRow.col2);
  signal["x"] = x;
  signal["y"] = y;
  Plotly.addTraces(signalGraph, signal);
}