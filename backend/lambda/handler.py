import json
import boto3
import os
import uuid

s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
tables = {
    'sellers': dynamodb.Table(os.environ['SELLERS_TABLE']),
    'products': dynamodb.Table(os.environ['PRODUCTS_TABLE']),
    'orders': dynamodb.Table(os.environ['ORDERS_TABLE']),
    'customers': dynamodb.Table(os.environ['CUSTOMERS_TABLE'])
}
BUCKET_NAME = os.environ['BUCKET_NAME']

def handler(event, context):
    path = event.get('path', '').strip('/').split('/')
    method = event.get('httpMethod')
    
    # CORS headers
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
    }

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers}

    # Handle pre-signed URL request
    if len(path) > 1 and path[0] == 'upload-url':
        file_name = path[1]
        # Get content type from query string, default to image/png
        query_params = event.get('queryStringParameters') or {}
        content_type = query_params.get('contentType', 'image/png')
        
        # Boto3's generate_presigned_url for 'put_object' might not handle ContentType in Params correctly
        # for signature calculation. Let's try omitting it from signature if it's not strictly required,
        # or verify the exact boto3 syntax.
        # Actually, for S3 PUT, the signature is calculated over the headers.
        
        url = s3.generate_presigned_url('put_object', 
            Params={'Bucket': BUCKET_NAME, 'Key': file_name, 'ContentType': content_type}, 
            ExpiresIn=3600)
            
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'uploadUrl': url})}

    resource = path[0] if len(path) > 0 else None
    
    if resource not in tables:
        return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'message': 'Resource not found'})}
    
    table = tables[resource]
    # Simple CRUD routing
    if method == 'GET':
        response = table.scan()
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps(response.get('Items', []))}

    elif method == 'POST':
        data = json.loads(event['body'])
        if 'id' not in data:
            id_key = 'seller_id' if resource == 'sellers' else 'product_id' if resource == 'products' else 'id'
            data[id_key] = str(uuid.uuid4())
        table.put_item(Item=data)
        return {'statusCode': 201, 'headers': headers, 'body': json.dumps({'message': 'Created', 'item': data})}

    elif method == 'PUT':
        data = json.loads(event['body'])
        table.put_item(Item=data)
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'message': 'Updated', 'item': data})}

    elif method == 'DELETE':
        # Assuming ID is passed in path or body. For simplicity, expect ID in query parameter for now.
        id_val = event.get('queryStringParameters', {}).get('id')
        if not id_val:
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'message': 'ID required for deletion'})}

        id_key = 'seller_id' if resource == 'sellers' else 'product_id' if resource == 'products' else 'id'
        table.delete_item(Key={id_key: id_val})
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'message': 'Deleted'})}

    return {'statusCode': 405, 'headers': headers, 'body': json.dumps({'message': 'Method not allowed'})}

