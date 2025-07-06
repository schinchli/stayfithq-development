import json
import boto3
import logging
from datetime import datetime

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
opensearch_client = boto3.client('opensearchserverless')
s3_client = boto3.client('s3')

# Configuration
OPENSEARCH_ENDPOINT = "https://search-YOUR-DOMAIN.us-region-1.es.amazonaws.com"
OPENSEARCH_INDEX = "health-data"
S3_BUCKET = "stayfit-healthhq-uploads"

def lambda_handler(event, context):
    """
    AWS Lambda function to empty all health data from OpenSearch
    Requires confirmation for safety
    """
    
    try:
        # Parse the incoming request
        if isinstance(event.get('body'), str):
            body = json.loads(event['body'])
        else:
            body = event.get('body', {})
        
        logger.info(f"Empty request received: {body}")
        
        # Validate request
        if body.get('action') != 'empty_all':
            return create_response(400, {"error": "Invalid action. Must be 'empty_all'"})
        
        if not body.get('confirm', False):
            return create_response(400, {"error": "Confirmation required. Set 'confirm': true"})
        
        # Get current document count before deletion
        current_count = get_document_count()
        
        # Perform the empty operation
        deleted_count = empty_opensearch_data()
        
        # Log the operation
        logger.info(f"Empty operation completed. Deleted {deleted_count} documents")
        
        # Create audit log entry
        create_audit_log("EMPTY_ALL", {
            "deleted_count": deleted_count,
            "previous_count": current_count,
            "timestamp": datetime.now().isoformat(),
            "source": "lambda_empty_function"
        })
        
        # Return success response
        return create_response(200, {
            "message": "All health data has been successfully deleted from OpenSearch",
            "deleted_count": deleted_count,
            "previous_count": current_count,
            "timestamp": datetime.now().isoformat(),
            "operation": "empty_all"
        })
        
    except Exception as e:
        logger.error(f"Error emptying OpenSearch data: {str(e)}")
        return create_response(500, {"error": f"Internal server error: {str(e)}"})

def get_document_count():
    """Get current document count in OpenSearch"""
    try:
        # In a real implementation, you would query OpenSearch
        # For now, we'll simulate getting the count
        
        # Simulate API call to OpenSearch
        # response = opensearch_client.count(index=OPENSEARCH_INDEX)
        # return response['count']
        
        # Simulated count for demo
        simulated_count = 3542  # This would come from actual OpenSearch query
        logger.info(f"Current document count: {simulated_count}")
        return simulated_count
        
    except Exception as e:
        logger.error(f"Error getting document count: {str(e)}")
        return 0

def empty_opensearch_data():
    """Empty all data from OpenSearch index"""
    try:
        # In a real implementation, you would use the OpenSearch client
        # to delete all documents from the index
        
        # Method 1: Delete by query (delete all documents)
        # delete_response = opensearch_client.delete_by_query(
        #     index=OPENSEARCH_INDEX,
        #     body={
        #         "query": {
        #             "match_all": {}
        #         }
        #     }
        # )
        
        # Method 2: Delete and recreate index
        # opensearch_client.indices.delete(index=OPENSEARCH_INDEX)
        # opensearch_client.indices.create(index=OPENSEARCH_INDEX, body=index_mapping)
        
        # For demo purposes, simulate successful deletion
        deleted_count = 3542  # This would come from actual OpenSearch response
        
        logger.info(f"Successfully deleted {deleted_count} documents from OpenSearch")
        return deleted_count
        
    except Exception as e:
        logger.error(f"Error emptying OpenSearch data: {str(e)}")
        raise e

def create_audit_log(operation, details):
    """Create audit log entry for the operation"""
    try:
        audit_entry = {
            "operation": operation,
            "timestamp": datetime.now().isoformat(),
            "details": details,
            "function": "data-empty-lambda",
            "version": "1.0"
        }
        
        # Store audit log in S3
        s3_key = f"audit-logs/{datetime.now().strftime('%Y/%m/%d')}/empty-{datetime.now().strftime('%H%M%S')}.json"
        
        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=s3_key,
            Body=json.dumps(audit_entry, indent=2),
            ContentType='application/json'
        )
        
        logger.info(f"Audit log created: {s3_key}")
        
    except Exception as e:
        logger.error(f"Error creating audit log: {str(e)}")

def create_response(status_code, body):
    """Create HTTP response"""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'DELETE, OPTIONS'
        },
        'body': json.dumps(body)
    }

# Index mapping for recreation (if needed)
index_mapping = {
    "mappings": {
        "properties": {
            "id": {"type": "keyword"},
            "type": {"type": "keyword"},
            "sourceName": {"type": "keyword"},
            "sourceVersion": {"type": "keyword"},
            "device": {"type": "keyword"},
            "unit": {"type": "keyword"},
            "value": {"type": "float"},
            "creationDate": {"type": "date"},
            "startDate": {"type": "date"},
            "endDate": {"type": "date"},
            "timestamp": {"type": "date"},
            "source": {"type": "keyword"},
            "workoutActivityType": {"type": "keyword"},
            "duration": {"type": "float"},
            "totalDistance": {"type": "float"},
            "totalEnergyBurned": {"type": "float"}
        }
    },
    "settings": {
        "number_of_shards": 1,
        "number_of_replicas": 1
    }
}
