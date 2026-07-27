import json
import boto3
import os
import uuid
from datetime import datetime, timezone

s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
tables = {
    'sellers': dynamodb.Table(os.environ['SELLERS_TABLE']),
    'products': dynamodb.Table(os.environ['PRODUCTS_TABLE']),
    'orders': dynamodb.Table(os.environ['ORDERS_TABLE']),
    'customers': dynamodb.Table(os.environ['CUSTOMERS_TABLE'])
}
BUCKET_NAME = os.environ['BUCKET_NAME']

KEY_MAP = {
    'sellers': 'seller_id',
    'products': 'product_id',
    'orders': 'order_id',
    'customers': 'customer_id'
}

def handler(event, context):
    path = event.get('path', '').strip('/').split('/')
    method = event.get('httpMethod')
    
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    }

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers}

    if len(path) > 1 and path[0] == 'upload-url':
        file_name = path[1]
        query_params = event.get('queryStringParameters') or {}
        content_type = query_params.get('contentType', 'image/png')
        
        url = s3.generate_presigned_url(
            'put_object', 
            Params={'Bucket': BUCKET_NAME, 'Key': file_name, 'ContentType': content_type}, 
            ExpiresIn=3600
        )
            
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'uploadUrl': url})}

    resource = path[0] if len(path) > 0 else None
    
    if resource not in tables:
        return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'message': 'Resource not found'})}
    
    table = tables[resource]
    pk_field = KEY_MAP.get(resource, 'id')
    now = datetime.now(timezone.utc).isoformat()

    if method == 'GET':
        response = table.scan()
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps(response.get('Items', []))}

    elif method == 'POST':
        data = json.loads(event.get('body') or '{}')
        if pk_field not in data or not data[pk_field]:
            data[pk_field] = str(uuid.uuid4())
        
        data['created_at'] = data.get('created_at', now)
        data['updated_at'] = now
        
        # Resource-specific default values
        if resource == 'sellers':
            data.setdefault('status', 'ACTIVE')
            data.setdefault('commission_rate', 10.0)
        elif resource == 'products':
            data.setdefault('status', 'PUBLISHED')
        elif resource == 'orders':
            data.setdefault('status', 'PROCESSING')
            data.setdefault('payment_status', 'PAID')

        table.put_item(Item=data)
        return {'statusCode': 201, 'headers': headers, 'body': json.dumps({'message': 'Created', 'item': data})}

    elif method == 'PUT':
        data = json.loads(event.get('body') or '{}')
        data['updated_at'] = now
        table.put_item(Item=data)
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'message': 'Updated', 'item': data})}

    elif method == 'DELETE':
        id_val = event.get('queryStringParameters', {}).get('id')
        if not id_val:
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'message': 'ID required for deletion'})}

        table.delete_item(Key={pk_field: id_val})
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'message': 'Deleted'})}

    return {'statusCode': 405, 'headers': headers, 'body': json.dumps({'message': 'Method not allowed'})}


