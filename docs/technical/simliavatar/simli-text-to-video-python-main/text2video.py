import requests
from dotenv import load_dotenv
import os
import json
import webbrowser
from urllib.parse import urljoin

# Load environment variables from .env file
load_dotenv()

url = "https://api.simli.ai/textToVideoStream"

payload = {
    "ttsAPIKey": os.getenv("ELEVENLABS_API_KEY"),
    "simliAPIKey": os.getenv("SIMLI_API_KEY"),
    "faceId": "c7451e55-ea04-41c8-ab47-bdca3e4a03d8",
    "requestBody": {
        "audioProvider": "ElevenLabs",
        "text": """Seguridad.
         Un tribunal de Manta sentenció a cuatro años de prisión, con agravantes, a cuatro personas que custodiaban a alias “Fito” durante su captura en Montecristi el 25 de junio de 2025. Los hoy condenados ocultaron información y facilitaron el escondite del líder de Los Choneros en un búnker dentro del inmueble. La Fiscalía demostró que conocían su actividad delictiva y lo protegieron, apoyándose en testimonios de agentes y peritajes técnicos. Fito fue extraditado a Estados Unidos el 20 de julio de 2025.""",
        "voiceName": "JddqVF50ZSIR7SRbJE6u",
        "model_id": "eleven_flash_v2_5",
        "voice_settings": {
            "stability": 0.1,
            "similarity_boost": 0.3,
            "style": 0.2
        }
    }
}
headers = {"Content-Type": "application/json"}

response = requests.request("POST", url, json=payload, headers=headers)
response_data = response.json()
print(response_data)

if response.status_code == 200:
    hls_url = response_data.get('hls_url')
    if hls_url:
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Video Player</title>
            <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
            <style>
                .container {{
                    max-width: 800px;
                    margin: 20px auto;
                    text-align: center;
                }}
                video {{
                    width: 100%;
                    margin: 20px 0;
                }}
                #playButton {{
                    padding: 10px 20px;
                    font-size: 16px;
                    cursor: pointer;
                    background-color: #4CAF50;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    margin-bottom: 20px;
                }}
                #playButton:hover {{
                    background-color: #45a049;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <button id="playButton">Click to Play Video</button>
                <video id="video" controls playsinline></video>
            </div>
            <script>
                document.addEventListener('DOMContentLoaded', function() {{
                    var video = document.getElementById('video');
                    var playButton = document.getElementById('playButton');
                    var videoSrc = '{hls_url}';
                    var hls;
                    
                    if (Hls.isSupported()) {{
                        hls = new Hls();
                        hls.loadSource(videoSrc);
                        hls.attachMedia(video);
                    }} else if (video.canPlayType('application/vnd.apple.mpegurl')) {{
                        video.src = videoSrc;
                    }}

                    playButton.addEventListener('click', function() {{
                        video.play()
                            .then(() => {{
                                console.log('Playback started');
                                playButton.style.display = 'none';
                            }})
                            .catch(e => console.error('Playback failed:', e));
                    }});
                }});
            </script>
        </body>
        </html>
        """
        
        # Save and open the HTML file
        with open('video_player.html', 'w') as f:
            f.write(html_content)
        
        # Open in default browser using file:// protocol for local files
        webbrowser.open('file://' + os.path.realpath('video_player.html'))
    else:
        print("No stream URL found in response")
else:
    print(f"Error: {response.status_code}")
    print(response.text)