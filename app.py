from flask import Flask, render_template, request, jsonify
from scipy.interpolate import interp1d
import numpy as np
import pandas as pd

app = Flask(__name__)

@app.route('/', methods=['GET'])
def index():
    return render_template("index.html")

# @app.route('/interpolate', methods=['POST'])
# def interpolate():
#     # Get the sampled data from the request
#     sampled_data = request.get_json()['sampled_data']
#     # Extract the x and y values from the sampled data
#     x = np.array([sample['x'] for sample in sampled_data])
#     y = np.array([sample['y'] for sample in sampled_data])
#     # Create a function for the spline interpolation
#     f = interp1d(x, y, kind='cubic')
#     # Generate the x values for the interpolated data
#     interpolated_x = np.linspace(x[0], x[-1], num=1000)
#     # Evaluate the interpolated function at the x values
#     interpolated_y = f(interpolated_x)
#     # Package the interpolated data into a response object
#     response_data = {'interpolated_data': [{'x': x_val, 'y': y_val} for x_val, y_val in zip(interpolated_x, interpolated_y)]}
#     # Return the response as a JSON object
#     return jsonify(response_data)

@app.route("/getMaxFreq",methods=['POST'])
def getMaxFreq():
    signal = request.get_json()
    time = signal['signalX']
    amplitude = signal['signalY']
    # Calculate the time step between samples
    timeStep = time[1] - time[0]
    # Perform the FFT on the amplitude data
    #phase/ array of complex numbers that represent the frequency components of the signal.
    spectrum = np.fft.fft(amplitude) 
    magnitudes = np.abs(spectrum)
    # Calculate the sampling frequency
    samplingFrequency = 1 / timeStep
    # Calculate the Nyquist frequency
    # nyquistFrequency = samplingFrequency / 2
    # Find the index of the frequency component with the highest magnitude
    fmaxIndex = np.argmax(magnitudes)
    # Convert the index to a frequency value
    # Converts the index of the maximum frequency component to a frequency value by multiplying it by the frequency resolution, which is the sampling frequency divided by the number of frequency bins in the FFT result.
    fmax = fmaxIndex * (samplingFrequency / len(magnitudes))
    # Return the frequency with the highest amplitude as a JSON response
    response = {'fmax': fmax}
    return jsonify(response)

if __name__ == "__main__":
    app.run(debug=True)
