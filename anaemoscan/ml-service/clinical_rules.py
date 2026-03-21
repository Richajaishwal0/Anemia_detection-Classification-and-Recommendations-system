# Clinical rule-based override layer
# Runs AFTER the model prediction and corrects misclassifications
# using established clinical diagnostic thresholds.
#
# Type codes:
#   1 = Iron Deficiency Anemia
#   2 = Folate Deficiency Anemia
#   3 = Vitamin B12 Deficiency Anemia
#
# Reference thresholds:
#   Ferritin low  : < 15 ng/mL
#   Folate low    : < 4.0 ng/mL
#   B12 low       : < 200 pg/mL
#   MCV high      : > 100 fL  (macrocytosis → Folate/B12)
#   MCV low       : < 80 fL   (microcytosis → Iron)
#   MCH high      : > 33 pg
#   MCH low       : < 27 pg

ANEMIA_TYPE_NAMES = {
    1: "Iron Deficiency Anemia",
    2: "Folate Deficiency Anemia",
    3: "Vitamin B12 Deficiency Anemia",
}

RECOMMENDATIONS = {
    1: [
        "Increase dietary iron: red meat, legumes, dark leafy greens, fortified cereals.",
        "Pair iron-rich foods with Vitamin C to enhance absorption.",
        "Avoid tea/coffee with meals — they inhibit iron absorption.",
        "Consider oral iron supplementation (ferrous sulfate) under medical supervision.",
        "Investigate sources of chronic blood loss (GI bleeding, heavy menstruation).",
        "Follow up with a hematologist for further evaluation.",
    ],
    2: [
        "Increase folate-rich foods: leafy greens, beans, citrus fruits, fortified grains.",
        "Avoid excessive alcohol — it depletes folate stores.",
        "Consult a physician about folic acid supplements (1mg daily; critical in pregnancy).",
        "Recheck serum folate levels after 8 weeks of supplementation.",
        "Rule out malabsorption disorders (celiac disease, Crohn's) as underlying cause.",
    ],
    3: [
        "Consume B12-rich foods: meat, fish, dairy, eggs, fortified plant-based alternatives.",
        "If vegetarian/vegan, B12 supplementation (cyanocobalamin 1000mcg daily) is essential.",
        "B12 injections (intramuscular) may be required if oral absorption is impaired (pernicious anemia).",
        "Test for intrinsic factor antibodies to rule out pernicious anemia.",
        "Neurological symptoms (tingling, numbness) require urgent B12 correction.",
        "Recheck serum B12 and CBC after 1–2 months of treatment.",
    ],
}


def _signals(data: dict) -> dict:
    """Extract and evaluate all clinical signals from input."""
    ferritte = data.get("FERRITTE")
    folate   = data.get("FOLATE")
    b12      = data.get("B12")
    mcv      = data.get("MCV")
    mch      = data.get("MCH")

    return {
        "folate_low":    folate   is not None and float(folate)   < 4.0,
        "b12_low":       b12      is not None and float(b12)      < 200.0,
        "ferritin_low":  ferritte is not None and float(ferritte) < 15.0,
        "ferritin_vlow": ferritte is not None and float(ferritte) < 12.0,
        "macrocytic":    mcv      is not None and float(mcv)      > 100.0,
        "macro_mch":     mch      is not None and float(mch)      > 33.0,
        "microcytic":    mcv      is not None and float(mcv)      < 80.0,
        "micro_mch":     mch      is not None and float(mch)      < 27.0,
    }


def apply_clinical_override(data: dict, model_type_code: int) -> int:
    """
    Returns the corrected type code (1/2/3) based on clinical rules.
    Works with or without biomarkers.
    """
    s = _signals(data)
    has_biomarkers = (
        data.get("FERRITTE") is not None and
        data.get("FOLATE")   is not None and
        data.get("B12")      is not None
    )

    if has_biomarkers:
        # Rule 1: Folate only low
        if s["folate_low"] and not s["b12_low"]:
            return 2

        # Rule 2: B12 only low
        if s["b12_low"] and not s["folate_low"]:
            return 3

        # Rule 3: Both low — pick more deficient by % below threshold
        if s["folate_low"] and s["b12_low"]:
            folate_pct = float(data["FOLATE"]) / 4.0
            b12_pct    = float(data["B12"])    / 200.0
            return 2 if folate_pct < b12_pct else 3

        # Rule 4: Iron via ferritin
        if s["ferritin_low"] and (s["microcytic"] or s["micro_mch"]):
            return 1
        if s["ferritin_vlow"]:
            return 1

        # Rule 5: Biomarkers all normal — use CBC morphology
        if s["microcytic"] or s["micro_mch"]:
            return 1
        if s["macrocytic"] or s["macro_mch"]:
            return 2  # Folate more common than B12

        # No clear signal — trust model
        return model_type_code if model_type_code in (1, 2, 3) else 1

    else:
        # CBC-only rules
        # Strong microcytic signal → Iron Deficiency
        if s["microcytic"] and s["micro_mch"]:
            return 1
        if s["microcytic"]:
            return 1

        # Strong macrocytic signal → Folate (more common) or B12
        if s["macrocytic"] and s["macro_mch"]:
            # Can't distinguish Folate vs B12 without biomarkers
            # Default Folate as statistically more common
            return 2
        if s["macrocytic"]:
            return 2

        # High RDW with low HGB suggests Iron (most common cause)
        rdw = data.get("RDW")
        hgb = data.get("HGB")
        if rdw is not None and hgb is not None:
            if float(rdw) > 14.5 and float(hgb) < 12.0:
                return 1

        # No CBC signal — trust model
        return model_type_code if model_type_code in (1, 2, 3) else 1


def get_corrected_prediction(data: dict, model_type_code: int) -> dict:
    corrected_code = apply_clinical_override(data, model_type_code)
    corrected_name = ANEMIA_TYPE_NAMES[corrected_code]
    has_biomarkers = (
        data.get("FERRITTE") is not None and
        data.get("FOLATE")   is not None and
        data.get("B12")      is not None
    )

    if corrected_code != model_type_code:
        probs = {name: 0.03 for name in ANEMIA_TYPE_NAMES.values()}
        # Higher confidence when biomarkers confirm, lower for CBC-only
        probs[corrected_name] = 0.88 if has_biomarkers else 0.65
    else:
        probs = None  # caller uses original model probs

    return {
        "type_code": corrected_code,
        "type_name": corrected_name,
        "override_probs": probs,
        "recommendations": RECOMMENDATIONS[corrected_code],
    }
