import json
import boto3
import requests
import logging
from datetime import datetime, timedelta
import hashlib
import os

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
ssm_client = boto3.client('ssm')
dynamodb = boto3.resource('dynamodb')

# Configuration
PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions"
CACHE_TABLE_NAME = "perplexity-cache"
RATE_LIMIT_TABLE_NAME = "perplexity-rate-limits"

# Rate limiting configuration
RATE_LIMIT_PER_MINUTE = 60
RATE_LIMIT_PER_HOUR = 1000
RATE_LIMIT_PER_DAY = 10000

def lambda_handler(event, context):
    """
    AWS Lambda function to proxy requests to Perplexity AI API
    Includes rate limiting, caching, and token management
    """
    
    try:
        # Parse the incoming request
        if isinstance(event.get('body'), str):
            body = json.loads(event['body'])
        else:
            body = event.get('body', {})
        
        logger.info(f"Perplexity request received: {body.get('model', 'unknown')}")
        
        # Validate request
        if not body.get('messages'):
            return create_response(400, {"error": "Messages are required"})
        
        # Check rate limits
        client_id = get_client_id(event)
        if not check_rate_limits(client_id):
            return create_response(429, {"error": "Rate limit exceeded"})
        
        # Check cache first
        cache_key = generate_cache_key(body)
        cached_response = get_cached_response(cache_key)
        if cached_response:
            logger.info("Returning cached response")
            return create_response(200, cached_response)
        
        # Get API key from Parameter Store
        api_key = "your_api_key_here"()
        if not api_key:
            return create_response(500, {"error": "API key not configured"})
        
        # Prepare request to Perplexity API
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        # Set default parameters if not provided
        perplexity_request = {
            "model": body.get("model", "llama-3.1-sonar-large-128k-online"),
            "messages": body.get("messages"),
            "max_tokens": body.get("max_tokens", 4096),
            "temperature": body.get("temperature", 0.2),
            "top_p": body.get("top_p", 0.9),
            "return_citations": body.get("return_citations", True),
            "search_domain_filter": body.get("search_domain_filter", ["pubmed.ncbi.nlm.nih.gov", "mayoclinic.org", "webmd.com"]),
            "return_images": body.get("return_images", False),
            "return_related_questions": body.get("return_related_questions", True),
            "search_recency_filter": body.get("search_recency_filter", "month"),
            "top_k": body.get("top_k", 0),
            "stream": False,
            "presence_penalty": body.get("presence_penalty", 0),
            "frequency_penalty": body.get("frequency_penalty", 1)
        }
        
        # Add health-specific system message if not present
        if not any(msg.get("role") == "system" for msg in perplexity_request["messages"]):
            system_message = {
                "role": "system",
                "content": "You are a helpful AI assistant specializing in health and medical information. Always provide accurate, evidence-based information and remind users to consult healthcare professionals for medical advice. Include citations from reputable medical sources when possible."
            }
            perplexity_request["messages"].insert(0, system_message)
        
        # Make request to Perplexity API
        response = requests.post(
            PERPLEXITY_API_URL,
            headers=headers,
            json=perplexity_request,
            timeout=30
        )
        
        # Update rate limits
        update_rate_limits(client_id)
        
        if response.status_code == 200:
            response_data = response.json()
            
            # Cache the response
            cache_response(cache_key, response_data)
            
            # Log usage
            log_usage(client_id, perplexity_request, response_data)
            
            return create_response(200, response_data)
        else:
            logger.error(f"Perplexity API error: {response.status_code} - {response.text}")
            return create_response(response.status_code, {"error": f"Perplexity API error: {response.text}"})
        
    except requests.exceptions.Timeout:
        logger.error("Perplexity API request timeout")
        return create_response(504, {"error": "Request timeout"})
    except requests.exceptions.RequestException as e:
        logger.error(f"Perplexity API request error: {str(e)}")
        return create_response(502, {"error": f"API request failed: {str(e)}"})
    except Exception as e:
        logger.error(f"Error processing Perplexity request: {str(e)}")
        return create_response(500, {"error": f"Internal server error: {str(e)}"})

def get_perplexity_api_key():
    """Get Perplexity API key from AWS Parameter Store"""
    try:
        response = ssm_client.get_parameter(
            Name='/stayfit/perplexity/api-key',
            WithDecryption=True
        )
        return response['Parameter']['Value']
    except Exception as e:
        logger.error(f"Error getting API key: {str(e)}")
        return None

def get_client_id(event):
    """Extract client ID from request for rate limiting"""
    # Use source IP as client ID (in production, use authenticated user ID)
    source_ip = event.get('requestContext', {}).get('identity', {}).get('sourceIp', 'unknown')
    return hashlib.md5(source_ip.encode()).hexdigest()

def check_rate_limits(client_id):
    """Check if client has exceeded rate limits"""
    try:
        table = dynamodb.Table(RATE_LIMIT_TABLE_NAME)
        now = datetime.now()
        
        # Check minute limit
        minute_key = f"{client_id}:{now.strftime('%Y-%m-%d-%H-%M')}"
        minute_response = table.get_item(Key={'id': minute_key})
        if minute_response.get('Item', {}).get('count', 0) >= RATE_LIMIT_PER_MINUTE:
            return False
        
        # Check hour limit
        hour_key = f"{client_id}:{now.strftime('%Y-%m-%d-%H')}"
        hour_response = table.get_item(Key={'id': hour_key})
        if hour_response.get('Item', {}).get('count', 0) >= RATE_LIMIT_PER_HOUR:
            return False
        
        # Check day limit
        day_key = f"{client_id}:{now.strftime('%Y-%m-%d')}"
        day_response = table.get_item(Key={'id': day_key})
        if day_response.get('Item', {}).get('count', 0) >= RATE_LIMIT_PER_DAY:
            return False
        
        return True
        
    except Exception as e:
        logger.error(f"Error checking rate limits: {str(e)}")
        return True  # Allow request if rate limit check fails

def update_rate_limits(client_id):
    """Update rate limit counters"""
    try:
        table = dynamodb.Table(RATE_LIMIT_TABLE_NAME)
        now = datetime.now()
        
        # Update minute counter
        minute_key = f"{client_id}:{now.strftime('%Y-%m-%d-%H-%M')}"
        table.update_item(
            Key={'id': minute_key},
            UpdateExpression='ADD #count :inc SET #ttl = :ttl',
            ExpressionAttributeNames={'#count': 'count', '#ttl': 'ttl'},
            ExpressionAttributeValues={
                ':inc': 1,
                ':ttl': int((now + timedelta(minutes=2)).timestamp())
            }
        )
        
        # Update hour counter
        hour_key = f"{client_id}:{now.strftime('%Y-%m-%d-%H')}"
        table.update_item(
            Key={'id': hour_key},
            UpdateExpression='ADD #count :inc SET #ttl = :ttl',
            ExpressionAttributeNames={'#count': 'count', '#ttl': 'ttl'},
            ExpressionAttributeValues={
                ':inc': 1,
                ':ttl': int((now + timedelta(hours=2)).timestamp())
            }
        )
        
        # Update day counter
        day_key = f"{client_id}:{now.strftime('%Y-%m-%d')}"
        table.update_item(
            Key={'id': day_key},
            UpdateExpression='ADD #count :inc SET #ttl = :ttl',
            ExpressionAttributeNames={'#count': 'count', '#ttl': 'ttl'},
            ExpressionAttributeValues={
                ':inc': 1,
                ':ttl': int((now + timedelta(days=2)).timestamp())
            }
        )
        
    except Exception as e:
        logger.error(f"Error updating rate limits: {str(e)}")

def generate_cache_key(request_body):
    """Generate cache key for request"""
    # Create hash of messages and key parameters
    cache_data = {
        "messages": request_body.get("messages"),
        "model": request_body.get("model", "llama-3.1-sonar-large-128k-online"),
        "temperature": request_body.get("temperature", 0.2),
        "max_tokens": request_body.get("max_tokens", 4096)
    }
    
    cache_string = json.dumps(cache_data, sort_keys=True)
    return hashlib.sha256(cache_string.encode()).hexdigest()

def get_cached_response(cache_key):
    """Get cached response if available and not expired"""
    try:
        table = dynamodb.Table(CACHE_TABLE_NAME)
        response = table.get_item(Key={'id': cache_key})
        
        if 'Item' in response:
            item = response['Item']
            # Check if cache is still valid (24 hours)
            cache_time = datetime.fromisoformat(item['timestamp'])
            if datetime.now() - cache_time < timedelta(hours=24):
                return json.loads(item['response'])
        
        return None
        
    except Exception as e:
        logger.error(f"Error getting cached response: {str(e)}")
        return None

def cache_response(cache_key, response_data):
    """Cache the response"""
    try:
        table = dynamodb.Table(CACHE_TABLE_NAME)
        
        # Set TTL for 48 hours
        ttl = int((datetime.now() + timedelta(hours=48)).timestamp())
        
        table.put_item(
            Item={
                'id': cache_key,
                'response': json.dumps(response_data),
                'timestamp': datetime.now().isoformat(),
                'ttl': ttl
            }
        )
        
    except Exception as e:
        logger.error(f"Error caching response: {str(e)}")

def log_usage(client_id, request_data, response_data):
    """Log API usage for monitoring and billing"""
    try:
        usage_data = {
            "client_id": client_id,
            "timestamp": datetime.now().isoformat(),
            "model": request_data.get("model"),
            "input_tokens": len(str(request_data.get("messages", ""))),
            "output_tokens": len(str(response_data.get("choices", [{}])[0].get("message", {}).get("content", ""))),
            "citations_count": len(response_data.get("citations", [])),
            "request_id": response_data.get("id", "")
        }
        
        # Log to CloudWatch (automatically done by Lambda)
        logger.info(f"Usage: {json.dumps(usage_data)}")
        
    except Exception as e:
        logger.error(f"Error logging usage: {str(e)}")

def create_response(status_code, body):
    """Create HTTP response"""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        'body': json.dumps(body)
    }
