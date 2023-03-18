let signalGraph= document.getElementById('signal');
let reconstructedGraph = document.getElementById("reconstructed");
let differenceGraph = document.getElementById("difference");

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
    editable: true,
    displaylogo: false,
    modeBarButtonsToRemove: ["toImage", "zoom2d", "lasso2d"],
  };

  Plotly.newPlot(graphElement, [], layout, config);
}
