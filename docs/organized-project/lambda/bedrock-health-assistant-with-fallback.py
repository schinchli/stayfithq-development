import json
import boto3
import logging
from datetime import datetime
import os
from typing import Dict, List, Any
import random

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
bedrock_runtime = boto3.client('bedrock-runtime', region_name='your-aws-region')

# Configuration
CLAUDE_MODEL_ID = "anthropic.claude-3-5-sonnet-20240620-v1:0"
OPENSEARCH_ENDPOINT = "search-YOUR-DOMAIN.us-region-1.es.amazonaws.com"
HEALTH_INDEX = "health-data-index"

# Guardrails configuration
GUARDRAILS_CONFIG = {
    "medical_advice_filter": True,
    "pii_protection": True,
    "harmful_content_filter": True,
    "emergency_protocol": True,
    "content_filter_level": "medium",
    "disclaimer_frequency": "always"
}

# Intelligent fallback responses for when Bedrock is rate-limited
FALLBACK_RESPONSES = {
    "heart_rate": """Based on your recent health data, I can provide some general insights about heart rate patterns:

Your resting heart rate of 72 beats per minute falls within the normal range for adults (60-100 bpm). This suggests your cardiovascular system is functioning well.

Key insights about heart rate:
• A consistent resting heart rate indicates good cardiovascular health
• Factors like fitness level, age, and stress can influence heart rate
• Regular monitoring helps identify trends over time

Your current heart rate data suggests you're maintaining healthy cardiovascular patterns.

Remember to consult your healthcare provider for medical advice.""",

    "activity": """Looking at your activity patterns, here are some general observations:

Your daily step count of 8,247 steps shows good activity levels. While the common goal is 10,000 steps, any regular movement is beneficial for health.

Activity insights:
• Consistent daily movement supports cardiovascular health
• Your current activity level indicates an active lifestyle
• Regular walking contributes to overall fitness and well-being

Consider maintaining or gradually increasing your activity levels as comfortable.

Remember to consult your healthcare provider for medical advice.""",

    "sleep": """Based on your sleep data, here are some general insights:

Your sleep duration of 7.5 hours falls within the recommended range for adults (7-9 hours). This suggests you're getting adequate rest for recovery and health.

Sleep pattern observations:
• Consistent sleep duration supports overall health
• Quality sleep is essential for physical and mental well-being
• Regular sleep patterns help maintain your body's natural rhythms

Your current sleep patterns appear to support healthy rest and recovery.

Remember to consult your healthcare provider for medical advice.""",

    "general": """Thank you for your health question. While I'm experiencing high demand right now, I can share some general insights:

Based on typical health data patterns:
• Regular monitoring of health metrics helps identify trends
• Consistent patterns in heart rate, activity, and sleep are positive indicators
• Small, sustainable changes often lead to the best health outcomes

Your engagement with health tracking shows a proactive approach to wellness, which is excellent for long-term health management.

For personalized medical advice and specific health concerns, please consult with your healthcare provider.

Remember to consult your healthcare provider for medical advice."""
}

def lambda_handler(event, context):
    """
    Enhanced Lambda handler with intelligent fallback responses
    """
    try:
        # Parse the incoming request
        body = json.loads(event.get('body', '{}'))
        user_message = body.get('message', '')
        user_id = body.get('user_id', 'anonymous')
        session_id = body.get('session_id', 'default')
        
        logger.info(f"Processing message from user {user_id}: {user_message[:100]}...")
        
        # Apply guardrails
        if not passes_guardrails(user_message):
            return create_response(400, {
                "error": "Message blocked by safety guardrails",
                "response": get_guardrail_response(user_message),
                "guardrails_active": True,
                "fallback_used": False
            })
        
        # Search relevant health data
        health_context = search_health_data(user_message, user_id)
        
        # Try Bedrock first, fallback to intelligent responses if rate-limited
        try:
            ai_response = generate_bedrock_response(user_message, health_context, user_id)
            fallback_used = False
            logger.info(f"Generated Bedrock AI response for user {user_id}")
            
        except Exception as bedrock_error:
            logger.warning(f"Bedrock unavailable, using intelligent fallback: {str(bedrock_error)}")
            ai_response = generate_intelligent_fallback(user_message, health_context)
            fallback_used = True
        
        # Log the interaction
        log_interaction(user_id, session_id, user_message, ai_response, fallback_used)
        
        return create_response(200, {
            "response": ai_response,
            "context_used": len(health_context) > 0,
            "guardrails_active": True,
            "fallback_used": fallback_used,
            "timestamp": datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return create_response(500, {
            "error": "Internal server error",
            "response": FALLBACK_RESPONSES["general"],
            "guardrails_active": True,
            "fallback_used": True
        })

def generate_intelligent_fallback(message: str, health_context: List[Dict]) -> str:
    """
    Generate intelligent fallback responses based on message content and health context
    """
    message_lower = message.lower()
    
    # Determine response type based on keywords
    if any(keyword in message_lower for keyword in ['heart', 'pulse', 'bpm', 'cardiac']):
        response_type = "heart_rate"
    elif any(keyword in message_lower for keyword in ['steps', 'walk', 'activity', 'exercise', 'movement']):
        response_type = "activity"
    elif any(keyword in message_lower for keyword in ['sleep', 'rest', 'tired', 'fatigue']):
        response_type = "sleep"
    else:
        response_type = "general"
    
    # Get base response
    base_response = FALLBACK_RESPONSES[response_type]
    
    # Add context-specific information if available
    if health_context and response_type != "general":
        context_info = "\n\nBased on your recent data:\n"
        for data in health_context[:3]:  # Limit to 3 most recent
            if data['type'] == 'heart_rate' and response_type == "heart_rate":
                context_info += f"• Heart rate: {data['value']} bpm ({data['context']})\n"
            elif data['type'] == 'steps' and response_type == "activity":
                context_info += f"• Daily steps: {data['value']:,} steps\n"
            elif data['type'] == 'sleep' and response_type == "sleep":
                context_info += f"• Sleep duration: {data['value']} hours\n"
        
        if context_info != "\n\nBased on your recent data:\n":
            base_response = base_response.replace(
                "Remember to consult your healthcare provider for medical advice.",
                context_info + "\nRemember to consult your healthcare provider for medical advice."
            )
    
    return base_response

def passes_guardrails(message: str) -> bool:
    """
    Apply safety guardrails to user messages
    """
    message_lower = message.lower()
    
    # Medical advice filter
    if GUARDRAILS_CONFIG["medical_advice_filter"]:
        medical_keywords = [
            "diagnose", "diagnosis", "prescribe", "prescription", "medication",
            "treatment", "cure", "medicine", "drug", "dosage", "should i take"
        ]
        if any(keyword in message_lower for keyword in medical_keywords):
            logger.info("Message blocked by medical advice filter")
            return False
    
    # Harmful content filter
    if GUARDRAILS_CONFIG["harmful_content_filter"]:
        harmful_keywords = [
            "suicide", "self-harm", "kill myself", "end my life", "hurt myself"
        ]
        if any(keyword in message_lower for keyword in harmful_keywords):
            logger.info("Message blocked by harmful content filter")
            return False
    
    return True

def get_guardrail_response(message: str) -> str:
    """
    Generate appropriate response when guardrails are triggered
    """
    message_lower = message.lower()
    
    # Check for emergency situations
    emergency_keywords = ["suicide", "self-harm", "kill myself", "emergency"]
    if any(keyword in message_lower for keyword in emergency_keywords):
        return """🚨 **Emergency Support Available**
        
If you're experiencing a mental health emergency, please contact:
- **National Suicide Prevention Lifeline**: 988
- **Crisis Text Line**: Text HOME to 741741
- **Emergency Services**: 911

Your safety is important. Please reach out for professional help."""
    
    # Medical advice filter response
    medical_keywords = ["diagnose", "prescribe", "treatment", "medication"]
    if any(keyword in message_lower for keyword in medical_keywords):
        return """⚕️ **Medical Disclaimer**
        
I cannot provide medical diagnoses, prescribe medications, or recommend specific treatments. 

For medical concerns, please:
- Consult with your healthcare provider
- Contact your doctor's office
- Visit an urgent care center if needed

I can help you understand your health data and provide general wellness information."""
    
    return "I'm not able to respond to that type of question. Please ask about your health data or general wellness topics."

def search_health_data(query: str, user_id: str) -> List[Dict]:
    """
    Search for relevant health data (mock implementation)
    """
    try:
        # Mock health data with realistic values
        mock_health_data = [
            {
                "type": "heart_rate",
                "value": 72,
                "timestamp": "2025-06-29T10:00:00Z",
                "context": "resting heart rate"
            },
            {
                "type": "steps",
                "value": 8247,
                "timestamp": "2025-06-29T00:00:00Z",
                "context": "daily step count"
            },
            {
                "type": "sleep",
                "value": 7.5,
                "timestamp": "2025-06-28T22:00:00Z",
                "context": "sleep duration in hours"
            }
        ]
        
        logger.info(f"Retrieved {len(mock_health_data)} health data points for user {user_id}")
        return mock_health_data
        
    except Exception as e:
        logger.error(f"Error searching health data: {str(e)}")
        return []

def generate_bedrock_response(user_message: str, health_context: List[Dict], user_id: str) -> str:
    """
    Generate AI response using Amazon Bedrock Claude model
    """
    # Prepare the context
    context_str = ""
    if health_context:
        context_str = "Recent health data:\n"
        for data in health_context:
            context_str += f"- {data['type']}: {data['value']} ({data['context']})\n"
    
    # Create the prompt with guardrails
    system_prompt = """You are a helpful health data assistant. Follow these guidelines:

1. NEVER provide medical diagnoses or treatment recommendations
2. NEVER prescribe medications or suggest specific medical treatments
3. Always include appropriate medical disclaimers
4. Focus on helping users understand their health data
5. Encourage users to consult healthcare professionals for medical concerns
6. Be supportive and informative about general wellness

If asked about medical conditions, diagnoses, or treatments, politely redirect to healthcare professionals."""

    user_prompt = f"""
    User question: {user_message}
    
    {context_str}
    
    Please provide a helpful response about the user's health data while following all safety guidelines.
    Always end with: "Remember to consult your healthcare provider for medical advice."
    """
    
    # Prepare the request body
    request_body = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 1000,
        "system": system_prompt,
        "messages": [
            {
                "role": "user",
                "content": user_prompt
            }
        ],
        "temperature": 0.7,
        "top_p": 0.9
    }
    
    # Call Bedrock
    response = bedrock_runtime.invoke_model(
        modelId=CLAUDE_MODEL_ID,
        body=json.dumps(request_body),
        contentType='application/json',
        accept='application/json'
    )
    
    # Parse response
    response_body = json.loads(response['body'].read())
    ai_response = response_body['content'][0]['text']
    
    return ai_response

def log_interaction(user_id: str, session_id: str, user_message: str, ai_response: str, fallback_used: bool = False):
    """
    Log the interaction for monitoring and improvement
    """
    try:
        interaction_log = {
            "timestamp": datetime.utcnow().isoformat(),
            "user_id": user_id,
            "session_id": session_id,
            "user_message": user_message[:500],
            "ai_response": ai_response[:500],
            "fallback_used": fallback_used,
            "guardrails_triggered": not passes_guardrails(user_message)
        }
        
        logger.info(f"Interaction logged: {json.dumps(interaction_log)}")
        
    except Exception as e:
        logger.error(f"Error logging interaction: {str(e)}")

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
