"""
Ingestor Agent
Handles data ingestion, processing, and storage from multiple sensor sources
"""

from typing import Dict, List, Optional
from datetime import datetime
import json


class IngestorAgent:
    """
    Data ingestion and processing agent
    Collects, validates, transforms, and stores sensor data
    """
    
    def __init__(self):
        self.agent_name = "Data Ingestor v1.0"
        self.loaded = True
        self.supported_protocols = ["mqtt", "http", "websocket", "iot_hub"]
        self.data_buffer = []
        
    def ingest_sensor_data(self, data: Dict, source: str, protocol: str = "http") -> Dict:
        """
        Ingest sensor data from various sources
        
        Args:
            data: Raw sensor data
            source: Data source identifier (sensor ID, device name)
            protocol: Communication protocol used
            
        Returns:
            Ingestion result with processed data
        """
        timestamp = datetime.now()
        
        # Validate protocol
        if protocol not in self.supported_protocols:
            return {
                "agent": self.agent_name,
                "status": "error",
                "reason": f"Unsupported protocol: {protocol}",
                "supported_protocols": self.supported_protocols
            }
        
        # Transform and normalize data
        processed_data = self._transform_data(data, source)
        
        # Add metadata
        enriched_data = {
            **processed_data,
            "metadata": {
                "source": source,
                "protocol": protocol,
                "ingested_at": timestamp.isoformat(),
                "agent": self.agent_name
            }
        }
        
        # Store in buffer (in real system, would write to database)
        self.data_buffer.append(enriched_data)
        
        # Keep buffer size manageable
        if len(self.data_buffer) > 1000:
            self.data_buffer = self.data_buffer[-1000:]
        
        return {
            "agent": self.agent_name,
            "status": "success",
            "source": source,
            "protocol": protocol,
            "records_ingested": 1,
            "processed_data": processed_data,
            "timestamp": timestamp.isoformat(),
            "buffer_size": len(self.data_buffer)
        }
    
    def ingest_batch(self, data_batch: List[Dict], source: str) -> Dict:
        """
        Ingest multiple sensor readings in batch
        
        Args:
            data_batch: List of sensor readings
            source: Data source identifier
            
        Returns:
            Batch ingestion result
        """
        timestamp = datetime.now()
        successful = 0
        failed = 0
        errors = []
        
        for idx, data in enumerate(data_batch):
            try:
                result = self.ingest_sensor_data(data, source, "http")
                if result["status"] == "success":
                    successful += 1
                else:
                    failed += 1
                    errors.append({"index": idx, "error": result.get("reason", "Unknown error")})
            except Exception as e:
                failed += 1
                errors.append({"index": idx, "error": str(e)})
        
        return {
            "agent": self.agent_name,
            "status": "completed",
            "total_records": len(data_batch),
            "successful": successful,
            "failed": failed,
            "errors": errors,
            "timestamp": timestamp.isoformat(),
            "processing_time_ms": (datetime.now() - timestamp).total_seconds() * 1000
        }
    
    def _transform_data(self, raw_data: Dict, source: str) -> Dict:
        """
        Transform raw sensor data to standardized format
        
        Args:
            raw_data: Raw data from sensor
            source: Source identifier
            
        Returns:
            Transformed data in standard format
        """
        transformed = {}
        
        # Define field mappings (handle different sensor formats)
        field_mappings = {
            "temp": "temperature",
            "tmp": "temperature",
            "t": "temperature",
            "moist": "moisture",
            "soil_moist": "moisture",
            "hum": "humidity",
            "humid": "humidity",
            "n": "nitrogen",
            "p": "phosphorus",
            "k": "potassium",
            "ph_level": "ph",
            "rainfall_mm": "rainfall"
        }
        
        # Apply transformations
        for key, value in raw_data.items():
            # Normalize field names
            normalized_key = field_mappings.get(key.lower(), key.lower())
            
            # Convert to appropriate type
            try:
                if isinstance(value, str):
                    # Try to convert string to float
                    transformed[normalized_key] = float(value)
                else:
                    transformed[normalized_key] = value
            except (ValueError, TypeError):
                transformed[normalized_key] = value
        
        # Apply unit conversions if needed
        if "temperature" in transformed:
            # Ensure temperature is in Celsius
            if transformed["temperature"] > 100:  # Likely Fahrenheit
                transformed["temperature"] = (transformed["temperature"] - 32) * 5/9
        
        return transformed
    
    def query_recent_data(self, source: Optional[str] = None, 
                         limit: int = 100) -> Dict:
        """
        Query recently ingested data
        
        Args:
            source: Optional source filter
            limit: Maximum number of records to return
            
        Returns:
            Query results
        """
        # Filter by source if specified
        if source:
            filtered_data = [
                record for record in self.data_buffer 
                if record.get("metadata", {}).get("source") == source
            ]
        else:
            filtered_data = self.data_buffer
        
        # Get most recent records
        recent_data = filtered_data[-limit:]
        
        # Calculate statistics
        if recent_data:
            # Extract numeric fields for statistics
            numeric_data = {}
            for record in recent_data:
                for key, value in record.items():
                    if isinstance(value, (int, float)) and key != "metadata":
                        if key not in numeric_data:
                            numeric_data[key] = []
                        numeric_data[key].append(value)
            
            # Calculate averages
            statistics = {
                field: {
                    "average": sum(values) / len(values),
                    "min": min(values),
                    "max": max(values),
                    "count": len(values)
                }
                for field, values in numeric_data.items()
            }
        else:
            statistics = {}
        
        return {
            "agent": self.agent_name,
            "total_records": len(recent_data),
            "records": recent_data,
            "statistics": statistics,
            "query_timestamp": datetime.now().isoformat()
        }
    
    def get_ingestion_stats(self) -> Dict:
        """Get statistics about data ingestion"""
        total_records = len(self.data_buffer)
        
        # Count records by source
        sources = {}
        for record in self.data_buffer:
            source = record.get("metadata", {}).get("source", "unknown")
            sources[source] = sources.get(source, 0) + 1
        
        # Count records by protocol
        protocols = {}
        for record in self.data_buffer:
            protocol = record.get("metadata", {}).get("protocol", "unknown")
            protocols[protocol] = protocols.get(protocol, 0) + 1
        
        return {
            "agent": self.agent_name,
            "total_records_buffered": total_records,
            "records_by_source": sources,
            "records_by_protocol": protocols,
            "buffer_capacity": 1000,
            "buffer_usage_percent": (total_records / 1000) * 100,
            "timestamp": datetime.now().isoformat()
        }


# Global instance
agent = IngestorAgent()


def ingest(data, source, protocol="http"):
    """Wrapper function for easy usage"""
    return agent.ingest_sensor_data(data, source, protocol)
