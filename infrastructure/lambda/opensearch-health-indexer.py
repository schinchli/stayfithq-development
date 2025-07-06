import json
import boto3
import logging
from datetime import datetime
import requests
from requests.auth import HTTPBasicAuth
import os
from typing import Dict, List, Any

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# OpenSearch configuration
OPENSEARCH_ENDPOINT = "https://search-YOUR-DOMAIN.us-region-1.es.amazonaws.com"
HEALTH_INDEX = "health-data-index"

# Initialize AWS clients
bedrock_runtime = boto3.client('bedrock-runtime', region_name='us-east-1')

def lambda_handler(event, context):
    """
    Lambda handler for indexing health data into OpenSearch
    """
    try:
        # Parse the incoming health data
        body = json.loads(event.get('body', '{}'))
        
        # Index the health data
        result = index_health_data(body)
        
        return create_response(200, {
            "message": "Health data indexed successfully",
            "indexed_count": result.get('indexed_count', 0),
            "timestamp": datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error indexing health data: {str(e)}")
        return create_response(500, {
            "error": "Failed to index health data",
            "message": str(e)
        })

def index_health_data(health_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Index health data into OpenSearch
    """
    try:
        # Prepare the document
        document = {
            "timestamp": datetime.utcnow().isoformat(),
            "user_id": health_data.get('user_id', 'anonymous'),
            "data_type": health_data.get('type', 'unknown'),
            "value": health_data.get('value'),
            "unit": health_data.get('unit', ''),
            "source": health_data.get('source', 'manual'),
            "metadata": health_data.get('metadata', {}),
            "indexed_at": datetime.utcnow().isoformat()
        }
        
        # Generate embeddings for semantic search
        embeddings = generate_embeddings(json.dumps(document))
        document['embeddings'] = embeddings
        
        # Index the document
        response = index_document(document)
        
        logger.info(f"Indexed health data: {document['data_type']} for user {document['user_id']}")
        
        return {
            "indexed_count": 1,
            "document_id": response.get('_id'),
            "status": "success"
        }
        
    except Exception as e:
        logger.error(f"Error in index_health_data: {str(e)}")
        raise

def generate_embeddings(text: str) -> List[float]:
    """
    Generate embeddings using Amazon Bedrock Titan Embeddings
    """
    try:
        request_body = {
            "inputText": text
        }
        
        response = bedrock_runtime.invoke_model(
            modelId="amazon.titan-embed-text-v1",
            body=json.dumps(request_body),
            contentType='application/json',
            accept='application/json'
        )
        
        response_body = json.loads(response['body'].read())
        embeddings = response_body.get('embedding', [])
        
        logger.info(f"Generated embeddings with dimension: {len(embeddings)}")
        return embeddings
        
    except Exception as e:
        logger.error(f"Error generating embeddings: {str(e)}")
        return []

def index_document(document: Dict[str, Any]) -> Dict[str, Any]:
    """
    Index a document into OpenSearch
    """
    try:
        # Create index if it doesn't exist
        create_index_if_not_exists()
        
        # Index the document
        url = f"{OPENSEARCH_ENDPOINT}/{HEALTH_INDEX}/_doc"
        
        headers = {
            'Content-Type': 'application/json'
        }
        
        # Use AWS SigV4 authentication (in production)
        # For now, using basic auth or IAM roles
        response = requests.post(
            url,
            json=document,
            headers=headers,
            timeout=30
        )
        
        if response.status_code in [200, 201]:
            return response.json()
        else:
            raise Exception(f"OpenSearch indexing failed: {response.status_code} - {response.text}")
            
    except Exception as e:
        logger.error(f"Error indexing document: {str(e)}")
        raise

def create_index_if_not_exists():
    """
    Create the health data index if it doesn't exist
    """
    try:
        # Check if index exists
        url = f"{OPENSEARCH_ENDPOINT}/{HEALTH_INDEX}"
        response = requests.head(url, timeout=10)
        
        if response.status_code == 404:
            # Create the index with proper mapping
            index_mapping = {
                "mappings": {
                    "properties": {
                        "timestamp": {"type": "date"},
                        "user_id": {"type": "keyword"},
                        "data_type": {"type": "keyword"},
                        "value": {"type": "float"},
                        "unit": {"type": "keyword"},
                        "source": {"type": "keyword"},
                        "metadata": {"type": "object"},
                        "indexed_at": {"type": "date"},
                        "embeddings": {
                            "type": "dense_vector",
                            "dims": 1536
                        }
                    }
                }
            }
            
            create_response = requests.put(
                url,
                json=index_mapping,
                headers={'Content-Type': 'application/json'},
                timeout=30
            )
            
            if create_response.status_code in [200, 201]:
                logger.info(f"Created index: {HEALTH_INDEX}")
            else:
                logger.error(f"Failed to create index: {create_response.text}")
                
    except Exception as e:
        logger.error(f"Error creating index: {str(e)}")

def search_health_data(query: str, user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
    """
    Search health data using semantic and keyword search
    """
    try:
        # Generate query embeddings
        query_embeddings = generate_embeddings(query)
        
        # Construct search query
        search_query = {
            "size": limit,
            "query": {
                "bool": {
                    "must": [
                        {"term": {"user_id": user_id}}
                    ],
                    "should": [
                        {
                            "multi_match": {
                                "query": query,
                                "fields": ["data_type", "metadata.*"],
                                "boost": 2.0
                            }
                        },
                        {
                            "script_score": {
                                "query": {"match_all": {}},
                                "script": {
                                    "source": "cosineSimilarity(params.query_vector, 'embeddings') + 1.0",
                                    "params": {"query_vector": query_embeddings}
                                },
                                "boost": 1.0
                            }
                        }
                    ]
                }
            },
            "sort": [
                {"timestamp": {"order": "desc"}}
            ]
        }
        
        # Execute search
        url = f"{OPENSEARCH_ENDPOINT}/{HEALTH_INDEX}/_search"
        response = requests.post(
            url,
            json=search_query,
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        
        if response.status_code == 200:
            results = response.json()
            hits = results.get('hits', {}).get('hits', [])
            
            # Extract and format results
            formatted_results = []
            for hit in hits:
                source = hit['_source']
                formatted_results.append({
                    "type": source.get('data_type'),
                    "value": source.get('value'),
                    "timestamp": source.get('timestamp'),
                    "unit": source.get('unit'),
                    "score": hit.get('_score', 0),
                    "metadata": source.get('metadata', {})
                })
            
            logger.info(f"Found {len(formatted_results)} health data points for query: {query}")
            return formatted_results
            
        else:
            logger.error(f"Search failed: {response.status_code} - {response.text}")
            return []
            
    except Exception as e:
        logger.error(f"Error searching health data: {str(e)}")
        return []

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
