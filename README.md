# Sampling-Theory-Studio
## Table of contents:
- [Introduction](#introduction)
- [Project Features](#project-features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Team]()


### Introduction
This web application is designed to illustrate the process of signal sampling and recovery and showcase the importance and validation of the Nyquist rate. The application allows the user to load a mid-length signal, sample it via different frequencies, and recover the original signal using the Whittaker–Shannon interpolation formula. The Nyquist-Shannon sampling theorem provides assurance that if the sampling frequency is greater than or equal to the signal bandwidth (or twice the maximum frequency for real signals), the original signal can be completely recovered.

<!-- ### Quick Preview
Web application using frontend technologies & flask for illustrating how the sampling theory work,
applying Nyquist sampling, validating it and reconstructing the signal again from the sample points. It can also 
generate signals with various frequencies , amplitudes, sum them up or remove them to make a new signal.

The Sampling is done with Nyquist sampling while the reconstruction using Whittaker–Shannon
interpolation formula.

`Sampling Formula -> Fsample >= 2 * Fmaximum`

![](data/readme%20data/SampLab.gif) -->

### Project Features
In this web application you can
> 1. Upload signals from your device as a CSV file format:
![](data/readme%20data/upload.gif)
> 2. Generate random signals from signal composer:
![](data/readme%20data/composer.gif)
> 3. Sum signals using signal composer and save it as a CSV file on your device:
![](data/readme%20data/saving.gif)
> 4. Remove signal components from the current signal:
![](data/readme%20data/remove.gif)
> 5. Add Noise to the signal:
![](data/readme%20data/noise.gif)
> 6. Sample the signal, reconstruct it from sampled points, and display the difference between them:
![](data/readme%20data/sampling.gif)
> 7. Change the sampling rate using the normalized and actual frequency sliders:
![](data/readme%20data/sliders.gif)


### Project Structure
The Web Application is built using:
- Frontend:
  - BootStrap
  - HTML
  - CSS
  - JavaScript
- Backend framework:
  - Flask (Python)

The Frontend main function to set the structure of the page and plot the signals and mange
the user interface, while the backend is responsible for performing signal operations such as utilizing FFT to determine the highest frequency present in the signal.

```
master
├─ data
│  ├─ signals data
│  └─ readme data
├─ static (JS & CSS files)
│  ├─  css
│  └─  js
├─ template (HTML file)
├─ app.py (Back-End Server)
└─ README.md
```

### Getting Started
To get started with the Signal Sampling and Recovery Web Application, follow these steps:
1.Clone the repository:
``` 
git clone https://github.com/your-username/signal-sampling-recovery.git
``` 
2. Install Python3 in your computer
``` 
Download it from www.python.org/downloads/
```
3. Install the following packages:
   - Flask
   - scipy
   - numpy
   - panda
 - Open Project Terminal & Run
```
pip install -r requirements.txt
```
4. Start Server by Running 
```
python app.py
```

5. Open the application in your web browser by visiting:
 http://localhost:5000

### Note
The application has been tested on Google Chrome, Microsoft Edge and Mozilla Firefox web browsers.
### Team
Biomedical Signal Processing (SBEN311) class task created by:

| Team Members                                  
|-------------------------------------------------------
| [Nada Mohamed](https://github.com/NadaAlfowey)
| [Abdulmonem Elsherif](https://github.com/AbdulmonemElsherif)   
| [Asmaa Khalid](https://github.com/asmaakhaledd) 
| [Mariam Gamal](https://github.com/mariamgamal70)
      

     

### Submitted to:
- Dr. Tamer Basha & Eng. Christina Adly
