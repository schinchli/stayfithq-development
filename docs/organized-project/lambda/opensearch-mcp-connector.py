import json
import boto3
import logging
from datetime import datetime
import requests
from requests.auth import HTTPBasicAuth
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

def lambda_handler(event, context):
    """
    OpenSearch MCP connector for health data search and indexing
    """
    try:
        # Parse the incoming request
        body = json.loads(event.get('body', '{}'))
        action = body.get('action', 'search')
        
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
    
    # Ensure index exists
    ensure_index_exists()
    
    # Perform semantic search
    search_results = perform_semantic_search(query, user_id, filters, limit)
    
    return create_response(200, {
        "results": search_results,
        "total": len(search_results),
        "query": query,
        "timestamp": datetime.utcnow().isoformat()
    })

def handle_index_request(body: Dict) -> Dict:
    """
    Handle health data indexing requests
    """
    health_data = body.get('data', {})
    user_id = body.get('user_id', 'anonymous')
    
    logger.info(f"Indexing health data for user {user_id}")
    
    # Ensure index exists
    ensure_index_exists()
    
    # Index the health data
    result = index_health_data(health_data, user_id)
    
    return create_response(200, {
        "indexed": True,
        "document_id": result.get('document_id'),
        "timestamp": datetime.utcnow().isoformat()
    })

def handle_health_check() -> Dict:
    """
    Check OpenSearch cluster health
    """
    try:
        health_url = f"{OPENSEARCH_ENDPOINT}/_cluster/health"
        response = requests.get(health_url, timeout=10)
        
        if response.status_code == 200:
            health_data = response.json()
            return create_response(200, {
                "status": "healthy",
                "cluster_status": health_data.get('status'),
                "number_of_nodes": health_data.get('number_of_nodes'),
                "timestamp": datetime.utcnow().isoformat()
            })
        else:
            return create_response(503, {
                "status": "unhealthy",
                "error": f"HTTP {response.status_code}"
            })
            
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return create_response(503, {
            "status": "unhealthy",
            "error": str(e)
        })

def ensure_index_exists():
    """
    Ensure the health data index exists with proper mapping
    """
    try:
        # Check if index exists
        index_url = f"{OPENSEARCH_ENDPOINT}/{HEALTH_INDEX}"
        response = requests.head(index_url, timeout=10)
        
        if response.status_code == 404:
            # Create the index with mapping
            index_mapping = {
                "mappings": {
                    "properties": {
                        "timestamp": {"type": "date"},
                        "user_id": {"type": "keyword"},
                        "data_type": {"type": "keyword"},
                        "value": {"type": "float"},
                        "unit": {"type": "keyword"},
                        "source": {"type": "keyword"},
                        "device": {"type": "keyword"},
                        "location": {"type": "geo_point"},
                        "tags": {"type": "keyword"},
                        "metadata": {
                            "type": "object",
                            "properties": {
                                "activity": {"type": "keyword"},
                                "sleep_stage": {"type": "keyword"},
                                "heart_rate_zone": {"type": "keyword"}
                            }
                        },
                        "embeddings": {
                            "type": "dense_vector",
                            "dims": 1536
                        },
                        "indexed_at": {"type": "date"},
                        "search_text": {"type": "text", "analyzer": "standard"}
                    }
                },
                "settings": {
                    "number_of_shards": 1,
                    "number_of_replicas": 0,
                    "analysis": {
                        "analyzer": {
                            "health_analyzer": {
                                "type": "custom",
                                "tokenizer": "standard",
                                "filter": ["lowercase", "stop"]
                            }
                        }
                    }
                }
            }
            
            create_response = requests.put(
                index_url,
                json=index_mapping,
                headers={'Content-Type': 'application/json'},
                timeout=30
            )
            
            if create_response.status_code in [200, 201]:
                logger.info(f"Created OpenSearch index: {HEALTH_INDEX}")
            else:
                logger.error(f"Failed to create index: {create_response.text}")
                
    except Exception as e:
        logger.error(f"Error ensuring index exists: {str(e)}")

def perform_semantic_search(query: str, user_id: str, filters: Dict, limit: int) -> List[Dict]:
    """
    Perform semantic search using embeddings and keyword matching
    """
    try:
        # Generate query embeddings
        query_embeddings = generate_embeddings(query)
        
        # Build search query
        search_query = {
            "size": limit,
            "query": {
                "bool": {
                    "must": [
                        {"term": {"user_id": user_id}}
                    ],
                    "should": [
                        # Keyword search
                        {
                            "multi_match": {
                                "query": query,
                                "fields": ["data_type^2", "search_text", "metadata.*"],
                                "type": "best_fields",
                                "boost": 2.0
                            }
                        },
                        # Semantic search using embeddings
                        {
                            "script_score": {
                                "query": {"match_all": {}},
                                "script": {
                                    "source": "cosineSimilarity(params.query_vector, 'embeddings') + 1.0",
                                    "params": {"query_vector": query_embeddings}
                                },
                                "boost": 1.5
                            }
                        }
                    ],
                    "minimum_should_match": 1
                }
            },
            "sort": [
                {"_score": {"order": "desc"}},
                {"timestamp": {"order": "desc"}}
            ]
        }
        
        # Add filters
        if filters:
            filter_clauses = []
            if filters.get('data_type'):
                filter_clauses.append({"term": {"data_type": filters['data_type']}})
            if filters.get('date_range'):
                filter_clauses.append({
                    "range": {
                        "timestamp": {
                            "gte": filters['date_range'].get('start'),
                            "lte": filters['date_range'].get('end')
                        }
                    }
                })
            
            if filter_clauses:
                search_query["query"]["bool"]["filter"] = filter_clauses
        
        # Execute search
        search_url = f"{OPENSEARCH_ENDPOINT}/{HEALTH_INDEX}/_search"
        response = requests.post(
            search_url,
            json=search_query,
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        
        if response.status_code == 200:
            results = response.json()
            hits = results.get('hits', {}).get('hits', [])
            
            # Format results
            formatted_results = []
            for hit in hits:
                source = hit['_source']
                formatted_results.append({
                    "id": hit['_id'],
                    "score": hit.get('_score', 0),
                    "data_type": source.get('data_type'),
                    "value": source.get('value'),
                    "unit": source.get('unit'),
                    "timestamp": source.get('timestamp'),
                    "source": source.get('source'),
                    "metadata": source.get('metadata', {}),
                    "relevance": "high" if hit.get('_score', 0) > 2.0 else "medium"
                })
            
            logger.info(f"Found {len(formatted_results)} results for query: {query}")
            return formatted_results
            
        else:
            logger.error(f"Search failed: {response.status_code} - {response.text}")
            return []
            
    except Exception as e:
        logger.error(f"Error in semantic search: {str(e)}")
        return []

def index_health_data(health_data: Dict, user_id: str) -> Dict:
    """
    Index health data with embeddings
    """
    try:
        # Prepare document
        document = {
            "timestamp": health_data.get('timestamp', datetime.utcnow().isoformat()),
            "user_id": user_id,
            "data_type": health_data.get('type', 'unknown'),
            "value": health_data.get('value'),
            "unit": health_data.get('unit', ''),
            "source": health_data.get('source', 'manual'),
            "device": health_data.get('device', ''),
            "tags": health_data.get('tags', []),
            "metadata": health_data.get('metadata', {}),
            "indexed_at": datetime.utcnow().isoformat()
        }
        
        # Create search text
        search_text = f"{document['data_type']} {document['value']} {document['unit']}"
        if document['metadata']:
            search_text += " " + " ".join(str(v) for v in document['metadata'].values())
        document['search_text'] = search_text
        
        # Generate embeddings
        embeddings = generate_embeddings(search_text)
        document['embeddings'] = embeddings
        
        # Generate document ID
        doc_id = hashlib.md5(f"{user_id}_{document['timestamp']}_{document['data_type']}".encode()).hexdigest()
        
        # Index document
        index_url = f"{OPENSEARCH_ENDPOINT}/{HEALTH_INDEX}/_doc/{doc_id}"
        response = requests.put(
            index_url,
            json=document,
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        
        if response.status_code in [200, 201]:
            result = response.json()
            logger.info(f"Indexed health data: {document['data_type']} for user {user_id}")
            return {"document_id": doc_id, "result": result.get('result')}
        else:
            raise Exception(f"Indexing failed: {response.status_code} - {response.text}")
            
    except Exception as e:
        logger.error(f"Error indexing health data: {str(e)}")
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
        
        logger.debug(f"Generated embeddings with dimension: {len(embeddings)}")
        return embeddings
        
    except Exception as e:
        logger.error(f"Error generating embeddings: {str(e)}")
        return [0.0] * 1536  # Return zero vector as fallback

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
