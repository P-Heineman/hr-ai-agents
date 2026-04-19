from typing import List, Dict, Any


class OutputValidator:
    ALLOWED_STATUSES = {"מתאים מאוד", "בינוני", "לא מתאים"}

    REQUIRED_GRAPH_FIELDS = {
        "communication", "confidence", "reliability", "role_fit",
        "motivation", "availability", "stability",
        "customer_orientation", "clarity", "engagement"
    }

    def validate(self, output: Dict[str, Any]) -> List[str]:
        errors = []

        if not isinstance(output, dict):
            return ["שגיאה קריטית: הפלט אינו אובייקט JSON תקין"]

        if "dashboard_view" not in output:
            errors.append("חסר dashboard_view")
        else:
            errors.extend(self._validate_dashboard(output["dashboard_view"]))

        if "interview_details" not in output:
            errors.append("חסר interview_details")
        else:
            errors.extend(self._validate_details(output["interview_details"]))

        return errors

    def _validate_dashboard(self, dashboard: Dict[str, Any]) -> List[str]:
        errors = []

        status = dashboard.get("status")
        if status not in self.ALLOWED_STATUSES:
            allowed_str = ", ".join(self.ALLOWED_STATUSES)
            errors.append(f"סטטוס לא חוקי: {status}. מותר: {allowed_str}")

        try:
            match_val = float(dashboard.get("match_percent", 0))
            if not (0 <= match_val <= 10):
                errors.append(f"match_percent ({match_val}) חייב להיות בין 0 ל-10")
        except (ValueError, TypeError):
            bad_val = dashboard.get('match_percent')
            errors.append(f"match_percent חייב להיות מספר (קיבלנו: {bad_val})")

        return errors

    def _validate_details(self, details: Dict[str, Any]) -> List[str]:
        errors = []
        graph = details.get("graph", {})

        if not isinstance(graph, dict):
            errors.append("הגרף חייב להיות אובייקט מילון")
            return errors

        for field in self.REQUIRED_GRAPH_FIELDS:
            if field not in graph:
                errors.append(f"חסר מאפיין בגרף: {field}")

        for key, value in graph.items():
            try:
                num_val = float(value)
                if not (0 <= num_val <= 10):
                    errors.append(f"הערך של {key} בגרף חורג מהטווח: {value}")
            except (ValueError, TypeError):
                errors.append(f"הערך של {key} בגרף חייב להיות מספר: {value}")

        return errors
