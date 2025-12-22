"""
Gatekeeper Agent
Security and access control for farming data and operations
"""

from typing import Dict, List, Optional
from datetime import datetime, timedelta
import hashlib


class GatekeeperAgent:
    """
    Security agent for access control and data protection
    Manages permissions, validates requests, and monitors security events
    """
    
    def __init__(self):
        self.agent_name = "Gatekeeper v1.0"
        self.loaded = True
        self.access_log = []
        
        # Define permission levels
        self.permission_levels = {
            "admin": ["read", "write", "delete", "configure", "export"],
            "farmer": ["read", "write", "export"],
            "viewer": ["read"],
            "sensor": ["write"]
        }
    
    def validate_access(self, user_role: str, operation: str, 
                       resource: str, user_id: str = None) -> Dict:
        """
        Validate if user has permission to perform operation
        
        Args:
            user_role: Role of the user (admin, farmer, viewer, sensor)
            operation: Operation to perform (read, write, delete, configure, export)
            resource: Resource being accessed (sensor_data, farm_config, etc.)
            user_id: Optional user identifier
            
        Returns:
            Dictionary with validation result
        """
        timestamp = datetime.now()
        
        # Check if role exists
        if user_role not in self.permission_levels:
            self._log_access_attempt(user_id, user_role, operation, resource, False, "invalid_role")
            return {
                "agent": self.agent_name,
                "access_granted": False,
                "reason": f"Invalid user role: {user_role}",
                "timestamp": timestamp.isoformat(),
                "recommendation": "Contact administrator to assign valid role"
            }
        
        # Check if operation is allowed for role
        allowed_operations = self.permission_levels[user_role]
        
        if operation not in allowed_operations:
            self._log_access_attempt(user_id, user_role, operation, resource, False, "insufficient_permissions")
            return {
                "agent": self.agent_name,
                "access_granted": False,
                "reason": f"Role '{user_role}' does not have permission for operation '{operation}'",
                "allowed_operations": allowed_operations,
                "timestamp": timestamp.isoformat(),
                "recommendation": f"Required permission: {operation}. Your permissions: {', '.join(allowed_operations)}"
            }
        
        # Additional checks for sensitive operations
        if operation in ["delete", "configure"]:
            warning = f"⚠️ Sensitive operation '{operation}' on resource '{resource}'"
        else:
            warning = None
        
        # Access granted
        self._log_access_attempt(user_id, user_role, operation, resource, True, "granted")
        
        return {
            "agent": self.agent_name,
            "access_granted": True,
            "user_role": user_role,
            "operation": operation,
            "resource": resource,
            "timestamp": timestamp.isoformat(),
            "warning": warning,
            "session_id": self._generate_session_id(user_id, timestamp)
        }
    
    def validate_sensor_data_integrity(self, data: Dict, checksum: Optional[str] = None) -> Dict:
        """
        Validate integrity of sensor data
        
        Args:
            data: Sensor data to validate
            checksum: Optional checksum for verification
            
        Returns:
            Validation result
        """
        # Generate checksum from data
        data_str = str(sorted(data.items()))
        calculated_checksum = hashlib.sha256(data_str.encode()).hexdigest()[:16]
        
        if checksum and checksum != calculated_checksum:
            return {
                "agent": self.agent_name,
                "integrity_verified": False,
                "reason": "Checksum mismatch - data may have been tampered with",
                "expected_checksum": checksum,
                "calculated_checksum": calculated_checksum,
                "recommendation": "Reject this data and request fresh reading from sensor"
            }
        
        # Check for suspicious patterns
        suspicious_indicators = []
        
        # Check for all zeros or same values
        values = [v for v in data.values() if isinstance(v, (int, float))]
        if values and len(set(values)) == 1:
            suspicious_indicators.append("All sensor values are identical - possible sensor malfunction")
        
        # Check for impossible value combinations
        if "moisture" in data and "temperature" in data:
            if data["moisture"] < 5 and data["temperature"] < 0:
                suspicious_indicators.append("Frozen soil detected - verify environmental conditions")
        
        return {
            "agent": self.agent_name,
            "integrity_verified": True,
            "checksum": calculated_checksum,
            "suspicious_indicators": suspicious_indicators,
            "risk_level": "low" if not suspicious_indicators else "medium",
            "timestamp": datetime.now().isoformat()
        }
    
    def monitor_rate_limiting(self, user_id: str, window_minutes: int = 5) -> Dict:
        """
        Check if user is making too many requests (rate limiting)
        
        Args:
            user_id: User identifier
            window_minutes: Time window for rate limiting check
            
        Returns:
            Rate limit status
        """
        current_time = datetime.now()
        window_start = current_time - timedelta(minutes=window_minutes)
        
        # Count recent access attempts by this user
        recent_attempts = [
            log for log in self.access_log 
            if log["user_id"] == user_id and log["timestamp"] > window_start
        ]
        
        request_count = len(recent_attempts)
        rate_limit = 100  # Max 100 requests per 5 minutes
        
        if request_count > rate_limit:
            return {
                "agent": self.agent_name,
                "rate_limit_exceeded": True,
                "request_count": request_count,
                "rate_limit": rate_limit,
                "window_minutes": window_minutes,
                "recommendation": f"Rate limit exceeded. Please wait {window_minutes} minutes before retrying.",
                "retry_after": (window_start + timedelta(minutes=window_minutes)).isoformat()
            }
        
        return {
            "agent": self.agent_name,
            "rate_limit_exceeded": False,
            "request_count": request_count,
            "rate_limit": rate_limit,
            "remaining_requests": rate_limit - request_count,
            "window_minutes": window_minutes
        }
    
    def _log_access_attempt(self, user_id: str, role: str, operation: str, 
                           resource: str, granted: bool, reason: str):
        """Log access attempt for audit trail"""
        self.access_log.append({
            "user_id": user_id,
            "role": role,
            "operation": operation,
            "resource": resource,
            "granted": granted,
            "reason": reason,
            "timestamp": datetime.now()
        })
        
        # Keep only last 1000 logs
        if len(self.access_log) > 1000:
            self.access_log = self.access_log[-1000:]
    
    def _generate_session_id(self, user_id: str, timestamp: datetime) -> str:
        """Generate unique session ID"""
        session_str = f"{user_id}_{timestamp.isoformat()}"
        return hashlib.sha256(session_str.encode()).hexdigest()[:16]
    
    def get_access_logs(self, user_id: Optional[str] = None, 
                       limit: int = 50) -> Dict:
        """Retrieve access logs for audit"""
        logs = self.access_log
        
        if user_id:
            logs = [log for log in logs if log["user_id"] == user_id]
        
        # Get most recent logs
        recent_logs = logs[-limit:]
        
        # Calculate statistics
        total_attempts = len(recent_logs)
        granted_count = sum(1 for log in recent_logs if log["granted"])
        denied_count = total_attempts - granted_count
        
        return {
            "agent": self.agent_name,
            "total_attempts": total_attempts,
            "granted": granted_count,
            "denied": denied_count,
            "logs": [
                {
                    "user_id": log["user_id"],
                    "operation": log["operation"],
                    "resource": log["resource"],
                    "granted": log["granted"],
                    "timestamp": log["timestamp"].isoformat()
                }
                for log in recent_logs
            ]
        }


# Global instance
agent = GatekeeperAgent()


def validate(user_role, operation, resource, user_id=None):
    """Wrapper function for easy usage"""
    return agent.validate_access(user_role, operation, resource, user_id)
