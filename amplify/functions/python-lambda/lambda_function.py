import json
import testlib  # <--- Das importieren wir jetzt aus dem Layer!

def lambda_handler(event, context):
    print("Event:", event)
    
    # Wir holen uns die Nachricht aus dem Layer
    layer_msg = testlib.sag_hallo()
    
    # Wir prüfen, welcher Pfad aufgerufen wurde (z.B. /generate oder /xx)
    path = event.get('rawPath', 'unbekannt')

    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({
            'message': layer_msg,  # Hier beweisen wir, dass der Layer geht
            'path_called': path    # Hier sehen wir, ob /xx aufgerufen wurde
        })
    }