const { spawn } = require("child_process");
const path = require("path");
const axios = require("axios");

// CALL PYTHON SCRIPT
exports.analyzeCSV = (filePath) => {
  return new Promise((resolve, reject) => {

    const python = spawn("python", [
      path.join(__dirname, "../../python-ai/analyze.py"),
      filePath
    ]);

    let result = "";
    let error = "";

    python.stdout.on("data", (data) => {
      result += data.toString();
    });

    python.stderr.on("data", (data) => {
      error += data.toString();
    });

    python.on("close", (code) => {
      if (code !== 0) {
        return reject(error);
      }
      resolve(result);
    });

  });
};

//GET ANALYSIS FROM FLASK APP (FIXED)
exports.getAnalysis = async (data) => {
  try {
    const response = await axios.post("http://127.0.0.1:5001/analyze", data);
    return response.data;
  } catch (error) {
    console.error("Warning: Python Flask app not reachable, using fallback.", error.message);
    
    // Fallback if Python server is not running
    const income = data.income || 0;
    const expenses = data.expenses || 0;
    const investment = data.investment || 0;
    
    if (income === 0) return { risk: "High", roi: 0 };
    
    const risk_ratio = (expenses / income) * 100;
    let risk = "Low";
    if (risk_ratio > 70) risk = "High";
    else if (risk_ratio > 40) risk = "Medium";
    
    const roi = investment > 0 ? 20.0 : 0;
    return { risk, roi };
  }
};