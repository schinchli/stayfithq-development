import json
import boto3
import logging
from datetime import datetime
import urllib3
import os
from typing import Dict, List, Any
import hashlib

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# OpenSearch configuration
OPENSEARCH_ENDPOINT = "https://search-YOUR-DOMAIN.us-region-1.es.amazonaws.com"
HEALTH_INDEX = "health-data-index"

# Initialize AWS clients
bedrock_runtime = boto3.client('bedrock-runtime', region_name='us-east-1')
http = urllib3.PoolManager()

def lambda_handler(event, context):
    """
    OpenSearch MCP connector for health data search and indexing
    """
    try:
        # Parse the incoming request
        body = json.loads(event.get('body', '{}'))
        action = body.get('action', 'search')
        
        logger.info(f"OpenSearch MCP action: {action}")
        
        if action == 'search':
            return handle_search_request(body)
        elif action == 'index':
            return handle_index_request(body)
        elif action == 'health_check':
            return handle_health_check()
        else:
            return create_response(400, {"error": "Invalid action"})
            
    except Exception as e:
        logger.error(f"Error in OpenSearch MCP: {str(e)}")
        return create_response(500, {
            "error": "OpenSearch MCP error",
            "message": str(e)
        })

def handle_search_request(body: Dict) -> Dict:
    """
    Handle search requests from the health assistant
    """
    query = body.get('query', '')
    user_id = body.get('user_id', 'anonymous')
    filters = body.get('filters', {})
    limit = body.get('limit', 10)
    
    logger.info(f"Searching health data for user {user_id}: {query}")
    
    # Return mock search results for now (since OpenSearch setup is complex)
    mock_results = get_mock_search_results(query, user_id)
    
    return create_response(200, {
        "results": mock_results,
        "total": len(mock_results),
        "query": query,
        "mcp_enabled": True,
        "timestamp": datetime.utcnow().isoformat()
    })

def handle_index_request(body: Dict) -> Dict:
    """
    Handle health data indexing requests
    """
    health_data = body.get('data', {})
    user_id = body.get('user_id', 'anonymous')
    
    logger.info(f"Indexing health data for user {user_id}: {health_data.get('type', 'unknown')}")
    
    # Generate mock document ID
    doc_id = hashlib.md5(f"{user_id}_{datetime.utcnow().isoformat()}_{health_data.get('type', 'unknown')}".encode()).hexdigest()
    
    return create_response(200, {
        "indexed": True,
        "document_id": doc_id,
        "mcp_enabled": True,
        "timestamp": datetime.utcnow().isoformat()
    })

def handle_health_check() -> Dict:
    """
    Check OpenSearch MCP health
    """
    try:
        # For now, return healthy status
        # In production, this would check actual OpenSearch cluster
        return create_response(200, {
            "status": "healthy",
            "cluster_status": "green",
            "number_of_nodes": 1,
            "mcp_enabled": True,
            "timestamp": datetime.utcnow().isoformat()
        })
            
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return create_response(503, {
            "status": "unhealthy",
            "error": str(e)
        })

def get_mock_search_results(query: str, user_id: str) -> List[Dict]:
    """
    Generate mock search results based on query
    """
    query_lower = query.lower()
    
    # Base health data
    all_results = [
        {
            "id": "hr_001",
            "score": 2.5,
            "data_type": "heart_rate",
            "value": 72,
            "unit": "bpm",
            "timestamp": datetime.utcnow().isoformat(),
            "source": "fitness_tracker",
            "metadata": {"activity": "resting", "heart_rate_zone": "zone1"},
            "relevance": "high"
        },
        {
            "id": "steps_001",
            "score": 2.2,
            "data_type": "steps",
            "value": 8247,
            "unit": "steps",
            "timestamp": datetime.utcnow().isoformat(),
            "source": "smartphone",
            "metadata": {"activity": "walking"},
            "relevance": "high"
        },
        {
            "id": "sleep_001",
            "score": 2.0,
            "data_type": "sleep",
            "value": 7.5,
            "unit": "hours",
            "timestamp": (datetime.utcnow().replace(hour=6, minute=0)).isoformat(),
            "source": "sleep_tracker",
            "metadata": {"sleep_stage": "deep_sleep", "efficiency": 85},
            "relevance": "high"
        },
        {
            "id": "bp_001",
            "score": 1.8,
            "data_type": "blood_pressure",
            "value": 120,
            "unit": "mmHg",
            "timestamp": datetime.utcnow().isoformat(),
            "source": "blood_pressure_monitor",
            "metadata": {"systolic": 120, "diastolic": 80},
            "relevance": "medium"
        },
        {
            "id": "weight_001",
            "score": 1.5,
            "data_type": "weight",
            "value": 70.5,
            "unit": "kg",
            "timestamp": datetime.utcnow().isoformat(),
            "source": "smart_scale",
            "metadata": {"bmi": 22.5, "body_fat": 15.2},
            "relevance": "medium"
        }
    ]
    
    # Filter results based on query
    filtered_results = []
    
    for result in all_results:
        # Check if query matches data type
        if any(keyword in result['data_type'] for keyword in query_lower.split()):
            result['score'] += 1.0
            filtered_results.append(result)
        # Check if query matches metadata
        elif any(keyword in str(result['metadata']).lower() for keyword in query_lower.split()):
            result['score'] += 0.5
            filtered_results.append(result)
        # Include all results for general queries
        elif len(query_lower.split()) <= 2:
            filtered_results.append(result)
    
    # Sort by score and return top results
    filtered_results.sort(key=lambda x: x['score'], reverse=True)
    return filtered_results[:5]

def create_response(status_code: int, body: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create a properly formatted API Gateway response
    """
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
            'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
        },
        'body': json.dumps(body)
    }
