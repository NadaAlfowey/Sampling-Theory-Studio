from flask import Flask, render_template, request, jsonify
import numpy as np

app = Flask(__name__)

@app.route('/', methods=['GET'])
def index():
    return render_template("index.html")

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
