from flask import Flask, render_template, request, jsonify
from scipy.interpolate import interp1d
import numpy as np

app = Flask(__name__)

@app.route('/', methods=['GET'])
def index():
    return render_template("index.html")

@app.route('/interpolate', methods=['POST'])
def interpolate():
    # Get the sampled data from the request
    sampled_data = request.get_json()['sampled_data']
    
    # Extract the x and y values from the sampled data
    x = np.array([sample['x'] for sample in sampled_data])
    y = np.array([sample['y'] for sample in sampled_data])
    # Create a function for the spline interpolation
    f = interp1d(x, y, kind='cubic')
    
    # Generate the x values for the interpolated data
    interpolated_x = np.linspace(x[0], x[-1], num=1000)
    
    # Evaluate the interpolated function at the x values
    interpolated_y = f(interpolated_x)
    
    # Package the interpolated data into a response object
    response_data = {'interpolated_data': [{'x': x_val, 'y': y_val} for x_val, y_val in zip(interpolated_x, interpolated_y)]}
    
    # Return the response as a JSON object
    return jsonify(response_data)

if __name__ == "__main__":
    app.run(debug=True)
