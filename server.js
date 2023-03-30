const port = 5501;

/*INCLUDE MODULES*/
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const multer = require("multer");
const upload = multer({ dest: "uploads/" }); //dest is a property in multer has full path and name of file
const csv = require("csv-parser");
const fs = require("fs");
const path = require("path");
const Spline = require("spline");
const app = express();
//const PDFDocument = require('pdfkit');
const plotly = require("plotly");

/*USING MIDDLEWARES*/
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

/*CONNECTS STATIC FILES TO BACKEND */
app.use(express.static("website"));

/*ENDPOINTS*/
app.post(
  "/",
  upload.fields([
    { name: "firstsignalinput", maxCount: 1 },
    { name: "secondsignalinput", maxCount: 1 },
  ]),
  (req, res) => {
    const firstFile = req.files["firstsignalinput"]
      ? req.files["firstsignalinput"][0]
      : null;
    const secondFile = req.files["secondsignalinput"]
      ? req.files["secondsignalinput"][0]
      : null;
    const file = firstFile || secondFile;
    if (file) {
      const fileExtension = path.extname(file.originalname);
      if (fileExtension === ".csv") {
        const resultArr = [];
        fs.createReadStream(file.path)
          .pipe(csv())
          .on("data", (data) => {
            resultArr.push(Object.values(data).map(Number));
          })
          .on("end", () => {
            res.send(resultArr);
          });
      }
    } else {
      res.status(400).send("No file uploaded");
    }
  }
);

app.post("/reconstruct",(req,res)=>{
  let sampledData=req.body;
  console.log(sampledData);
  const controlPoints = spline.getNaturalKs(
    sampledData.map((point) => point.x),
    sampledData.map((point) => point.y)
  );
  const interpolate = x => spline.getSplineYAtX(x, sampledData.map(point => point.x), controlPoints);

})
app.listen(port, () => {
  console.log(`server is on http://localhost:${port}`);
});
