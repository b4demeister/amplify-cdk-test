import json
import secrets
import string

def lambda_handler(event, context):
    print("Gen 2 Event:", event)
    length = 12
    try:
        if 'body' in event and event['body']:
            body = json.loads(event['body'])
            length = int(body.get('length', 12))
            length = max(8, min(length, 64))
    except:
        pass

    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    password = ''.join(secrets.choice(alphabet) for i in range(length))

    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
        'body': json.dumps({'password': password, 'length': length})
    }