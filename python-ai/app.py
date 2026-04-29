from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/')
def home():
    return "AI Financial Service Running on port 5001"

@app.route('/analyze', methods=['POST'])
def analyze():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data received"}), 400

        income     = float(data.get('income', 0))
        expenses   = float(data.get('expenses', 0))
        investment = float(data.get('investment', 0))

        if income == 0:
            return jsonify({"risk": "High", "roi": 0})

        risk_ratio = (expenses / income) * 100
        if risk_ratio > 70:
            risk = "High"
        elif risk_ratio > 40:
            risk = "Medium"
        else:
            risk = "Low"

        roi = 20.0 if investment > 0 else 0

        return jsonify({"risk": risk, "roi": round(roi, 2)})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5001, debug=False)
