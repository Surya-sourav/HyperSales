import firebase_admin
from firebase_admin import credentials, auth
from fastapi import HTTPException, Request
import logging

# Initialize Firebase Admin SDK
try:
    cred = credentials.Certificate("path/to/your/serviceAccountKey.json")
    firebase_admin.initialize_app(cred)
except ValueError:
    # App already initialized
    pass
except Exception as e:
    logging.error(f"Failed to initialize Firebase: {str(e)}")
    raise

async def verify_token(request: Request):
    try:
        # Get the Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            raise HTTPException(status_code=401, detail="No token provided")

        # Extract the token
        token = auth_header.split('Bearer ')[1]
        
        # Verify the token with Firebase
        try:
            decoded_token = auth.verify_id_token(token)
            return decoded_token
        except auth.InvalidIdTokenError:
            raise HTTPException(status_code=401, detail="Invalid token")
        except auth.ExpiredIdTokenError:
            raise HTTPException(status_code=401, detail="Token expired")
        except Exception as e:
            logging.error(f"Token verification error: {str(e)}")
            raise HTTPException(status_code=401, detail="Token verification failed")
            
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Authentication error: {str(e)}")
        raise HTTPException(status_code=401, detail="Authentication failed")
