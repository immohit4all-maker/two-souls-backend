import json
import boto3
import os
import traceback
import uuid
from datetime import datetime, timezone
from decimal import Decimal

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

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
}


def _decimal_default(value):
    """
    DynamoDB returns every number as a Decimal, which the stdlib JSON encoder cannot handle.
    Whole values are emitted as ints so a quantity of 3 does not come back as 3.0.
    """
    if isinstance(value, Decimal):
        return int(value) if value == value.to_integral_value() else float(value)
    raise TypeError(f'Object of type {type(value).__name__} is not JSON serializable')


def _dumps(payload):
    return json.dumps(payload, default=_decimal_default)


def _loads(body):
    """
    Parse a request body, turning JSON numbers into Decimal.

    boto3's resource API rejects Python floats outright, so any numeric value that reached
    put_item as a float would raise TypeError and surface to the caller as a 502.
    """
    return json.loads(body or '{}', parse_float=Decimal)


def handler(event, context):
    """
    Thin wrapper so an unexpected exception returns a JSON 500 *with CORS headers* rather than
    an empty 502. Without this the browser reports a CORS failure and hides the real error.
    """
    try:
        return _handle(event, context)
    except Exception:
        print('Unhandled error:\n' + traceback.format_exc())
        return {
            'statusCode': 500,
            'headers': CORS_HEADERS,
            'body': _dumps({'message': 'Internal server error'})
        }


def _handle(event, context):
    path = event.get('path', '').strip('/').split('/')
    method = event.get('httpMethod')

    headers = CORS_HEADERS

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
            
        return {'statusCode': 200, 'headers': headers, 'body': _dumps({'uploadUrl': url})}

    resource = path[0] if len(path) > 0 else None

    # Handle Admin Login endpoint
    if resource == 'login':
        if method == 'POST':
            body = _loads(event.get('body'))
            username = body.get('username')
            password = body.get('password')
            
            admin_user = os.environ.get('ADMIN_USERNAME', 'admin')
            admin_pass = os.environ.get('ADMIN_PASSWORD', 'TwoSouls@2026!')

            if username == admin_user and password == admin_pass:
                # Generate simple auth token for session
                session_token = str(uuid.uuid4())
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': _dumps({
                        'success': True,
                        'message': 'Authentication successful',
                        'token': session_token,
                        'user': { 'username': admin_user }
                    })
                }
            else:
                return {
                    'statusCode': 401,
                    'headers': headers,
                    'body': _dumps({'success': False, 'message': 'Invalid username or password'})
                }
        return {'statusCode': 405, 'headers': headers, 'body': _dumps({'message': 'Method not allowed'})}
    
    if resource not in tables:
        return {'statusCode': 404, 'headers': headers, 'body': _dumps({'message': 'Resource not found'})}
    
    table = tables[resource]
    pk_field = KEY_MAP.get(resource, 'id')
    now = datetime.now(timezone.utc).isoformat()

    if method == 'GET':
        response = table.scan()
        return {'statusCode': 200, 'headers': headers, 'body': _dumps(response.get('Items', []))}

    elif method == 'POST':
        data = _loads(event.get('body'))
        if pk_field not in data or not data[pk_field]:
            data[pk_field] = str(uuid.uuid4())
        
        data['created_at'] = data.get('created_at', now)
        data['updated_at'] = now
        
        # Resource-specific default values.
        # Note: sellers previously defaulted commission_rate to the float 10.0. That field is
        # retired on the client, so every new record hit the default — and boto3 rejects floats,
        # which surfaced as a 502 on every "add dealer". Removed rather than converted: nothing
        # should be inventing a rate for a supplier record.
        if resource == 'sellers':
            data.setdefault('status', 'ACTIVE')
        elif resource == 'products':
            data.setdefault('status', 'PUBLISHED')
        elif resource == 'orders':
            data.setdefault('status', 'PROCESSING')
            data.setdefault('payment_status', 'PAID')

        table.put_item(Item=data)
        return {'statusCode': 201, 'headers': headers, 'body': _dumps({'message': 'Created', 'item': data})}

    elif method == 'PUT':
        data = _loads(event.get('body'))
        data['updated_at'] = now
        table.put_item(Item=data)
        return {'statusCode': 200, 'headers': headers, 'body': _dumps({'message': 'Updated', 'item': data})}

    elif method == 'DELETE':
        id_val = event.get('queryStringParameters', {}).get('id')
        if not id_val:
            return {'statusCode': 400, 'headers': headers, 'body': _dumps({'message': 'ID required for deletion'})}

        table.delete_item(Key={pk_field: id_val})
        return {'statusCode': 200, 'headers': headers, 'body': _dumps({'message': 'Deleted'})}

    return {'statusCode': 405, 'headers': headers, 'body': _dumps({'message': 'Method not allowed'})}


