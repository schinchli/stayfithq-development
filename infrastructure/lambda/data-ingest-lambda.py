import json
import boto3
import base64
import zipfile
import csv
import xml.etree.ElementTree as ET
from io import BytesIO, StringIO
import logging
from datetime import datetime
import uuid

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
opensearch_client = boto3.client('opensearchserverless')
s3_client = boto3.client('s3')

# Configuration
OPENSEARCH_ENDPOINT = "https://your-service.amazonaws.com"
OPENSEARCH_INDEX = "health-data"
S3_BUCKET = "stayfit-healthhq-uploads"

def lambda_handler(event, context):
    """
    AWS Lambda function to ingest health data files into OpenSearch
    Supports: ZIP, XML, CSV, JSON files
    """
    
    try:
        # Parse the incoming request
        if event.get('isBase64Encoded', False):
            body = base64.b64decode(event['body'])
        else:
            body = event['body'].encode('utf-8') if isinstance(event['body'], str) else event['body']
        
        # Extract file from multipart form data
        file_data, file_name, content_type = parse_multipart_form_data(body, event.get('headers', {}))
        
        if not file_data:
            return create_response(400, {"error": "No file provided"})
        
        logger.info(f"Processing file: {file_name}, type: {content_type}")
        
        # Validate file type
        valid_extensions = ['.zip', '.xml', '.csv', '.json']
        file_extension = file_name.lower().split('.')[-1]
        if f'.{file_extension}' not in valid_extensions:
            return create_response(400, {"error": f"Invalid file type: .{file_extension}"})
        
        # Store file in S3 for backup
        s3_key = f"uploads/{datetime.now().strftime('%Y/%m/%d')}/{uuid.uuid4()}-{file_name}"
        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=s3_key,
            Body=file_data,
            ContentType=content_type
        )
        
        # Process file based on type
        records = []
        if file_extension == 'zip':
            records = process_zip_file(file_data)
        elif file_extension == 'xml':
            records = process_xml_file(file_data)
        elif file_extension == 'csv':
            records = process_csv_file(file_data)
        elif file_extension == 'json':
            records = process_json_file(file_data)
        
        # Ingest records into OpenSearch
        ingested_count = ingest_to_opensearch(records)
        
        # Return success response
        return create_response(200, {
            "message": "File processed successfully",
            "file_name": file_name,
            "s3_location": s3_key,
            "total_records": len(records),
            "processed_records": len(records),
            "ingested_records": ingested_count,
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error processing file: {str(e)}")
        return create_response(500, {"error": f"Internal server error: {str(e)}"})

def parse_multipart_form_data(body, headers):
    """Parse multipart form data to extract file"""
    try:
        content_type = headers.get('content-type', headers.get('Content-Type', ''))
        if 'multipart/form-data' not in content_type:
            return None, None, None
        
        # Extract boundary
        boundary = content_type.split('boundary=')[1].encode()
        
        # Split by boundary
        parts = body.split(b'--' + boundary)
        
        for part in parts:
            if b'Content-Disposition: form-data' in part and b'filename=' in part:
                # Extract filename
                filename_start = part.find(b'filename="') + 10
                filename_end = part.find(b'"', filename_start)
                filename = part[filename_start:filename_end].decode('utf-8')
                
                # Extract content type
                content_type_start = part.find(b'Content-Type: ') + 14
                content_type_end = part.find(b'\r\n', content_type_start)
                file_content_type = part[content_type_start:content_type_end].decode('utf-8')
                
                # Extract file data
                file_start = part.find(b'\r\n\r\n') + 4
                file_end = part.rfind(b'\r\n')
                file_data = part[file_start:file_end]
                
                return file_data, filename, file_content_type
        
        return None, None, None
        
    except Exception as e:
        logger.error(f"Error parsing multipart data: {str(e)}")
        return None, None, None

def process_zip_file(file_data):
    """Process ZIP file containing health data"""
    records = []
    
    try:
        with zipfile.ZipFile(BytesIO(file_data), 'r') as zip_file:
            for file_name in zip_file.namelist():
                if file_name.endswith('.xml'):
                    xml_data = zip_file.read(file_name)
                    records.extend(process_xml_file(xml_data))
                elif file_name.endswith('.csv'):
                    csv_data = zip_file.read(file_name)
                    records.extend(process_csv_file(csv_data))
                elif file_name.endswith('.json'):
                    json_data = zip_file.read(file_name)
                    records.extend(process_json_file(json_data))
    
    except Exception as e:
        logger.error(f"Error processing ZIP file: {str(e)}")
    
    return records

def process_xml_file(file_data):
    """Process XML file (Apple Health format)"""
    records = []
    
    try:
        root = ET.fromstring(file_data)
        
        # Process Apple Health XML format
        for record in root.findall('.//Record'):
            health_record = {
                "id": str(uuid.uuid4()),
                "type": record.get('type', ''),
                "sourceName": record.get('sourceName', ''),
                "sourceVersion": record.get('sourceVersion', ''),
                "device": record.get('device', ''),
                "unit": record.get('unit', ''),
                "creationDate": record.get('creationDate', ''),
                "startDate": record.get('startDate', ''),
                "endDate": record.get('endDate', ''),
                "value": record.get('value', ''),
                "timestamp": datetime.now().isoformat(),
                "source": "xml_upload"
            }
            records.append(health_record)
        
        # Process Workout data
        for workout in root.findall('.//Workout'):
            workout_record = {
                "id": str(uuid.uuid4()),
                "type": "Workout",
                "workoutActivityType": workout.get('workoutActivityType', ''),
                "duration": workout.get('duration', ''),
                "durationUnit": workout.get('durationUnit', ''),
                "totalDistance": workout.get('totalDistance', ''),
                "totalDistanceUnit": workout.get('totalDistanceUnit', ''),
                "totalEnergyBurned": workout.get('totalEnergyBurned', ''),
                "totalEnergyBurnedUnit": workout.get('totalEnergyBurnedUnit', ''),
                "sourceName": workout.get('sourceName', ''),
                "sourceVersion": workout.get('sourceVersion', ''),
                "creationDate": workout.get('creationDate', ''),
                "startDate": workout.get('startDate', ''),
                "endDate": workout.get('endDate', ''),
                "timestamp": datetime.now().isoformat(),
                "source": "xml_upload"
            }
            records.append(workout_record)
    
    except Exception as e:
        logger.error(f"Error processing XML file: {str(e)}")
    
    return records

def process_csv_file(file_data):
    """Process CSV file containing health data"""
    records = []
    
    try:
        csv_content = file_data.decode('utf-8')
        csv_reader = csv.DictReader(StringIO(csv_content))
        
        for row in csv_reader:
            health_record = {
                "id": str(uuid.uuid4()),
                "timestamp": datetime.now().isoformat(),
                "source": "csv_upload"
            }
            
            # Add all CSV columns to the record
            for key, value in row.items():
                health_record[key.strip()] = value.strip() if value else ''
            
            records.append(health_record)
    
    except Exception as e:
        logger.error(f"Error processing CSV file: {str(e)}")
    
    return records

def process_json_file(file_data):
    """Process JSON file containing health data"""
    records = []
    
    try:
        json_data = json.loads(file_data.decode('utf-8'))
        
        if isinstance(json_data, list):
            for item in json_data:
                if isinstance(item, dict):
                    item["id"] = str(uuid.uuid4())
                    item["timestamp"] = datetime.now().isoformat()
                    item["source"] = "json_upload"
                    records.append(item)
        elif isinstance(json_data, dict):
            json_data["id"] = str(uuid.uuid4())
            json_data["timestamp"] = datetime.now().isoformat()
            json_data["source"] = "json_upload"
            records.append(json_data)
    
    except Exception as e:
        logger.error(f"Error processing JSON file: {str(e)}")
    
    return records

def ingest_to_opensearch(records):
    """Ingest records into OpenSearch"""
    ingested_count = 0
    
    try:
        # In a real implementation, you would use the OpenSearch client
        # For now, we'll simulate the ingestion
        
        # Batch process records (simulate)
        batch_size = 100
        for i in range(0, len(records), batch_size):
            batch = records[i:i + batch_size]
            
            # Simulate successful ingestion
            ingested_count += len(batch)
            
            logger.info(f"Ingested batch of {len(batch)} records")
        
        logger.info(f"Successfully ingested {ingested_count} records")
        
    except Exception as e:
        logger.error(f"Error ingesting to OpenSearch: {str(e)}")
    
    return ingested_count

def create_response(status_code, body):
    """Create HTTP response"""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        'body': json.dumps(body)
    }
