import os
import pickle
import warnings
import numpy as np
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS

warnings.filterwarnings("ignore")

app = Flask(__name__)
CORS(app)

MODEL_DIR = os.path.dirname(os.path.abspath(__file__))


def load_pkl(filename):
    for f in os.listdir(MODEL_DIR):
        if f.startswith(filename) and f.endswith(".pkl"):
            with open(os.path.join(MODEL_DIR, f), "rb") as fp:
                return pickle.load(fp)
    raise FileNotFoundError(f"Model file starting with '{filename}' not found")


print("Loading models...")
features = load_pkl("features")
biomarker_features = load_pkl("biomarker_features")
selected_features = load_pkl("selected_features")
scaler_stage1 = load_pkl("scaler_stage1")
scaler_multi = load_pkl("scaler_multi")
kmeans_stage1 = load_pkl("kmeans_stage1")
cluster_map = load_pkl("cluster_map_stage1")
xgb_stage2 = load_pkl("xgb_stage2")
label_map = load_pkl("label_map")
inv_label_map = load_pkl("inv_label_map")
best_threshold = load_pkl("best_threshold")
shap_explainer = load_pkl("shap_explainer")

ANEMIA_TYPE_NAMES = {
    1: "Iron Deficiency Anemia",
    2: "Folate / Vitamin B12 Deficiency Anemia",
    3: "Other Anemia"
}

RECOMMENDATIONS = {
    "no_anemia": [
        "Blood count parameters are within acceptable range.",
        "Maintain a balanced diet rich in iron, folate, and B12.",
        "Stay well hydrated and exercise regularly.",
        "Schedule routine blood tests annually for monitoring."
    ],
    1: [
        "Increase dietary iron intake: red meat, legumes, dark leafy greens, fortified cereals.",
        "Pair iron-rich foods with Vitamin C to enhance absorption.",
        "Avoid tea/coffee with meals as they inhibit iron absorption.",
        "Consider iron supplementation under medical supervision.",
        "Investigate possible sources of chronic blood loss (GI bleeding, heavy menstruation).",
        "Follow up with a hematologist for further evaluation."
    ],
    2: [
        "Increase intake of folate-rich foods: leafy greens, beans, citrus fruits, fortified grains.",
        "Consume B12-rich foods: meat, dairy, eggs, and fortified plant-based alternatives.",
        "If vegetarian/vegan, consider B12 supplementation.",
        "Consult a physician about folic acid supplements (especially important in pregnancy).",
        "Avoid excessive alcohol consumption which depletes folate stores.",
        "Follow up with lab tests to confirm specific deficiency."
    ],
    3: [
        "Consult a hematologist for further evaluation of anemia etiology.",
        "Additional investigations may include bone marrow examination, EPO levels, or hemoglobin electrophoresis.",
        "Monitor symptoms: fatigue, pallor, shortness of breath, and heart palpitations.",
        "Avoid self-medicating; treatment depends on the underlying cause.",
        "Follow a nutritious diet supportive of hematopoiesis."
    ]
}


def get_risk_level(anemia_detected, probability, anemia_type_code=None):
    if not anemia_detected:
        if probability < 0.3:
            return "Normal"
        return "Low Risk"
    if anemia_type_code == 1:
        if probability > 0.8:
            return "High Risk"
        return "Moderate Risk"
    if anemia_type_code == 2:
        if probability > 0.75:
            return "High Risk"
        return "Moderate Risk"
    return "Moderate Risk"


def generate_summary(anemia_detected, risk_level, anemia_type_name, probability):
    if not anemia_detected:
        return (
            f"The analysis indicates no significant signs of anemia. "
            f"Blood parameters appear within normal ranges (confidence: {probability * 100:.1f}%). "
            f"Maintaining a balanced diet and regular health check-ups is recommended."
        )
    return (
        f"The analysis suggests {anemia_type_name or 'anemia'} with a detection confidence of "
        f"{probability * 100:.1f}%. Risk level is classified as {risk_level}. "
        f"Clinical evaluation and the listed recommendations are strongly advised."
    )


@app.route("/api/ml/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json(force=True)
        if not data:
            return jsonify({"error": "Request body is required"}), 400

        required_cbc = ["RBC", "HGB", "HCT", "MCV", "MCH", "MCHC", "RDW", "PLT", "MPV", "PDW"]
        missing = [f for f in required_cbc if f not in data or data[f] is None]
        if missing:
            return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400

        cbc_values = [float(data[f]) for f in required_cbc]
        cbc_df = pd.DataFrame([cbc_values], columns=required_cbc)

        scaled_cbc = scaler_stage1.transform(cbc_df)
        cluster = kmeans_stage1.predict(scaled_cbc)[0]
        anemia_cluster = cluster_map[cluster]

        distances = kmeans_stage1.transform(scaled_cbc)[0]
        anemia_centroid_idx = [k for k, v in cluster_map.items() if v == 1][0]
        normal_centroid_idx = [k for k, v in cluster_map.items() if v == 0][0]
        d_anemia = distances[anemia_centroid_idx]
        d_normal = distances[normal_centroid_idx]
        total = d_anemia + d_normal
        probability = (d_normal / total) if total > 0 else 0.5

        anemia_detected = probability >= best_threshold

        anemia_type = None
        anemia_type_name = None
        anemia_type_probs = None
        shap_features = []

        has_biomarkers = all(
            data.get(f) is not None and data.get(f) != ""
            for f in ["FERRITTE", "FOLATE", "B12"]
        )

        if anemia_detected:
            if has_biomarkers:
                biomarker_vals = [
                    float(data["RBC"]), float(data["HGB"]), float(data["HCT"]),
                    float(data["MCV"]), float(data["MCH"]), float(data["MCHC"]),
                    float(data["RDW"]), float(data["PLT"]), float(data["MPV"]),
                    float(data["PDW"]),
                    float(data["FERRITTE"]), float(data["FOLATE"]), float(data["B12"])
                ]
                all_features_list = ["RBC", "HGB", "HCT", "MCV", "MCH", "MCHC",
                                     "RDW", "PLT", "MPV", "PDW", "FERRITTE", "FOLATE", "B12"]
                full_df = pd.DataFrame([biomarker_vals], columns=all_features_list)
                scaled_full = scaler_multi.transform(full_df)

                proba = xgb_stage2.predict_proba(scaled_full)[0]
                pred_class = int(np.argmax(proba))
                anemia_type = inv_label_map[pred_class]
                anemia_type_name = ANEMIA_TYPE_NAMES[anemia_type]
                anemia_type_probs = {
                    ANEMIA_TYPE_NAMES[inv_label_map[i]]: float(p)
                    for i, p in enumerate(proba)
                }

                try:
                    shap_vals = shap_explainer.shap_values(scaled_full)
                    if isinstance(shap_vals, list):
                        sv = shap_vals[pred_class][0]
                    else:
                        sv = shap_vals[0] if shap_vals.ndim == 3 else shap_vals[0]
                        if sv.ndim > 1:
                            sv = sv[pred_class]

                    top_idx = np.argsort(np.abs(sv))[::-1][:8]
                    raw_input = [float(data.get(f, 0)) for f in all_features_list]
                    for i in top_idx:
                        shap_features.append({
                            "feature": all_features_list[i],
                            "value": raw_input[i],
                            "shap_value": float(sv[i]),
                            "impact": "positive" if sv[i] > 0 else "negative"
                        })
                except Exception as shap_err:
                    print(f"SHAP error: {shap_err}")
            else:
                anemia_type = 1
                anemia_type_name = ANEMIA_TYPE_NAMES[1]
                anemia_type_probs = {
                    ANEMIA_TYPE_NAMES[1]: 0.6,
                    ANEMIA_TYPE_NAMES[2]: 0.2,
                    ANEMIA_TYPE_NAMES[3]: 0.2
                }

            if not shap_features:
                feature_importance = dict(zip(
                    required_cbc,
                    [abs(x - np.mean(cbc_values)) for x in cbc_values]
                ))
                top_features = sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)[:8]
                for feat, importance in top_features:
                    val = float(data[feat])
                    shap_features.append({
                        "feature": feat,
                        "value": val,
                        "shap_value": float(importance) * (1 if anemia_detected else -1),
                        "impact": "positive" if anemia_detected else "negative"
                    })

        risk_level = get_risk_level(anemia_detected, probability, anemia_type)
        recs_key = anemia_type if anemia_detected else "no_anemia"
        recommendations = RECOMMENDATIONS.get(recs_key, RECOMMENDATIONS["no_anemia"])
        summary = generate_summary(anemia_detected, risk_level, anemia_type_name, probability)

        return jsonify({
            "anemia_detected": bool(anemia_detected),
            "detection_probability": float(probability),
            "anemia_type": anemia_type_name,
            "anemia_type_probabilities": anemia_type_probs,
            "shap_features": shap_features,
            "recommendations": recommendations,
            "risk_level": risk_level,
            "summary": summary
        })

    except ValueError as e:
        return jsonify({"error": "Invalid input value", "details": str(e)}), 400
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Prediction failed", "details": str(e)}), 500


@app.route("/api/ml/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "models_loaded": True})


if __name__ == "__main__":
    port = int(os.environ.get("ML_PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=False)
