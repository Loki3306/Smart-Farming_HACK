"""
Auditor Agent
Monitors data quality, validates sensor readings, and ensures data integrity
"""

from typing import Dict, List, Tuple
from datetime import datetime


class AuditorAgent:
    """
    Data quality and integrity monitoring agent
    Validates sensor readings and flags anomalies
    """
    
    def __init__(self):
        self.agent_name = "Data Auditor v1.0"
        self.loaded = True
        
        # Define valid ranges for sensor data
        self.valid_ranges = {
            "moisture": (0, 100),
            "temperature": (-10, 60),
            "humidity": (0, 100),
            "nitrogen": (0, 500),
            "phosphorus": (0, 200),
            "potassium": (0, 1000),
            "ph": (3, 11),
            "ec": (0, 10),
            "rainfall": (0, 500)
        }
    
    def audit_sensor_data(self, sensor_data: Dict) -> Dict:
        """
        Validate sensor data and flag any anomalies
        
        Args:
            sensor_data: Dictionary of sensor readings
            
        Returns:
            Audit report with validation results
        """
        issues = []
        warnings = []
        validated_fields = []
        
        for field, value in sensor_data.items():
            if field not in self.valid_ranges:
                continue
                
            min_val, max_val = self.valid_ranges[field]
            
            # Check if value is within valid range
            if value < min_val or value > max_val:
                issues.append({
                    "field": field,
                    "value": value,
                    "expected_range": f"{min_val}-{max_val}",
                    "severity": "high",
                    "message": f"{field} value {value} is outside valid range [{min_val}, {max_val}]"
                })
            else:
                validated_fields.append(field)
                
                # Check for warning conditions (values near boundaries)
                if value < min_val * 1.1 or value > max_val * 0.9:
                    warnings.append({
                        "field": field,
                        "value": value,
                        "message": f"{field} is approaching boundary values"
                    })
        
        # Check for data consistency
        consistency_checks = self._check_data_consistency(sensor_data)
        issues.extend(consistency_checks)
        
        # Calculate data quality score
        total_fields = len(self.valid_ranges)
        quality_score = (len(validated_fields) / total_fields) * 100 if total_fields > 0 else 0
        
        return {
            "agent": self.agent_name,
            "timestamp": datetime.now().isoformat(),
            "data_quality_score": round(quality_score, 1),
            "validated_fields": len(validated_fields),
            "total_fields": total_fields,
            "issues": issues,
            "warnings": warnings,
            "status": "passed" if len(issues) == 0 else "failed",
            "recommendation": self._get_recommendation(issues, warnings)
        }
    
    def _check_data_consistency(self, sensor_data: Dict) -> List[Dict]:
        """Check for logical inconsistencies in data"""
        issues = []
        
        # Check moisture vs rainfall consistency
        if "moisture" in sensor_data and "rainfall" in sensor_data:
            if sensor_data["rainfall"] > 50 and sensor_data["moisture"] < 30:
                issues.append({
                    "field": "moisture_rainfall_inconsistency",
                    "severity": "medium",
                    "message": "High rainfall but low soil moisture - possible sensor error or drainage issue"
                })
        
        # Check temperature vs humidity consistency
        if "temperature" in sensor_data and "humidity" in sensor_data:
            if sensor_data["temperature"] > 35 and sensor_data["humidity"] > 90:
                issues.append({
                    "field": "temperature_humidity_inconsistency",
                    "severity": "low",
                    "message": "High temperature with very high humidity - verify sensor calibration"
                })
        
        # Check NPK balance
        if all(k in sensor_data for k in ["nitrogen", "phosphorus", "potassium"]):
            n, p, k = sensor_data["nitrogen"], sensor_data["phosphorus"], sensor_data["potassium"]
            if n > 200 and p < 10:
                issues.append({
                    "field": "npk_imbalance",
                    "severity": "medium",
                    "message": "Severe NPK imbalance detected - high nitrogen but very low phosphorus"
                })
        
        return issues
    
    def _get_recommendation(self, issues: List, warnings: List) -> str:
        """Generate recommendation based on audit results"""
        if len(issues) > 0:
            return f"❌ Data validation failed. {len(issues)} critical issue(s) found. Review sensor calibration and connections."
        elif len(warnings) > 0:
            return f"⚠️ {len(warnings)} warning(s) found. Monitor sensor readings closely."
        else:
            return "✅ All sensor data validated successfully. Data quality is good."
    
    def audit_historical_trend(self, readings: List[Dict]) -> Dict:
        """
        Audit historical data for trends and anomalies
        
        Args:
            readings: List of historical sensor readings
            
        Returns:
            Trend analysis report
        """
        if not readings:
            return {
                "status": "no_data",
                "message": "Insufficient historical data for trend analysis"
            }
        
        anomalies = []
        trends = {}
        
        # Simple anomaly detection: check for sudden spikes
        for field in ["moisture", "temperature", "nitrogen", "phosphorus", "potassium"]:
            values = [r.get(field, 0) for r in readings if field in r]
            
            if len(values) < 2:
                continue
                
            # Calculate rate of change
            for i in range(1, len(values)):
                change_rate = abs(values[i] - values[i-1]) / max(values[i-1], 1) * 100
                
                # Flag if change > 50% in single reading
                if change_rate > 50:
                    anomalies.append({
                        "field": field,
                        "reading_index": i,
                        "previous_value": values[i-1],
                        "current_value": values[i],
                        "change_percent": round(change_rate, 1),
                        "message": f"Sudden spike detected in {field}"
                    })
            
            # Calculate overall trend
            if values:
                avg_value = sum(values) / len(values)
                recent_avg = sum(values[-3:]) / min(3, len(values))
                trend = "increasing" if recent_avg > avg_value * 1.1 else "decreasing" if recent_avg < avg_value * 0.9 else "stable"
                trends[field] = {
                    "trend": trend,
                    "average": round(avg_value, 2),
                    "recent_average": round(recent_avg, 2)
                }
        
        return {
            "agent": self.agent_name,
            "readings_analyzed": len(readings),
            "anomalies_detected": len(anomalies),
            "anomalies": anomalies,
            "trends": trends,
            "confidence": 0.85
        }


# Global instance
agent = AuditorAgent()


def audit(sensor_data):
    """Wrapper function for easy usage"""
    return agent.audit_sensor_data(sensor_data)
