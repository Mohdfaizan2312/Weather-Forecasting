from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
import requests
import os

app = Flask(__name__, static_folder='static')
CORS(app)

API_KEY = '3b6a690ae1c9b43e3f17eb6b6e8f490c'

# Dictionary of Indian states and their districts with coordinates
STATES_AND_DISTRICTS = {
    'Maharashtra': {
        'Mumbai': {'lat': 19.0760, 'lon': 72.8777},
        'Pune': {'lat': 18.5204, 'lon': 73.8567},
        'Nagpur': {'lat': 21.1458, 'lon': 79.0882},
        'Nashik': {'lat': 19.9975, 'lon': 73.7898},
        'Aurangabad': {'lat': 19.8762, 'lon': 75.3433},
        'Solapur': {'lat': 17.6599, 'lon': 75.9064},
        'Amravati': {'lat': 20.9320, 'lon': 77.7523},
        'Kolhapur': {'lat': 16.7050, 'lon': 74.2433},
        'Thane': {'lat': 19.2183, 'lon': 72.9781}
    },
    'Delhi': {
        'New Delhi': {'lat': 28.6139, 'lon': 77.2090},
        'North Delhi': {'lat': 28.7041, 'lon': 77.1025},
        'South Delhi': {'lat': 28.5244, 'lon': 77.1855},
        'East Delhi': {'lat': 28.6279, 'lon': 77.2955},
        'West Delhi': {'lat': 28.6566, 'lon': 77.0588},
        'Central Delhi': {'lat': 28.6448, 'lon': 77.2167},
        'Shahdara': {'lat': 28.6814, 'lon': 77.2833},
        'Dwarka': {'lat': 28.5921, 'lon': 77.0460}
    },
    'Karnataka': {
        'Bangalore': {'lat': 12.9716, 'lon': 77.5946},
        'Mysore': {'lat': 12.2958, 'lon': 76.6394},
        'Hubli': {'lat': 15.3647, 'lon': 75.1240},
        'Mangalore': {'lat': 12.9141, 'lon': 74.8560},
        'Belgaum': {'lat': 15.8497, 'lon': 74.4977},
        'Gulbarga': {'lat': 17.3297, 'lon': 76.8343},
        'Shimoga': {'lat': 13.9299, 'lon': 75.5667},
        'Davanagere': {'lat': 14.4644, 'lon': 75.9218}
    },
    'Tamil Nadu': {
        'Chennai': {'lat': 13.0827, 'lon': 80.2707},
        'Coimbatore': {'lat': 11.0168, 'lon': 76.9558},
        'Madurai': {'lat': 9.9252, 'lon': 78.1198},
        'Salem': {'lat': 11.6643, 'lon': 78.1460},
        'Tiruchirappalli': {'lat': 10.7905, 'lon': 78.7047},
        'Tirunelveli': {'lat': 8.7139, 'lon': 77.7567},
        'Erode': {'lat': 11.3410, 'lon': 77.7172},
        'Vellore': {'lat': 12.9165, 'lon': 79.1325}
    },
    'Gujarat': {
        'Ahmedabad': {'lat': 23.0225, 'lon': 72.5714},
        'Surat': {'lat': 21.1702, 'lon': 72.8311},
        'Vadodara': {'lat': 22.3072, 'lon': 73.1812},
        'Rajkot': {'lat': 22.3039, 'lon': 70.8022},
        'Bhavnagar': {'lat': 21.7645, 'lon': 72.1519},
        'Jamnagar': {'lat': 22.4707, 'lon': 70.0577},
        'Gandhinagar': {'lat': 23.2156, 'lon': 72.6369},
        'Junagadh': {'lat': 21.5222, 'lon': 70.4579}
    },
    'Uttar Pradesh': {
        'Lucknow': {'lat': 26.8467, 'lon': 80.9462},
        'Kanpur': {'lat': 26.4499, 'lon': 80.3319},
        'Agra': {'lat': 27.1767, 'lon': 78.0081},
        'Varanasi': {'lat': 25.3176, 'lon': 82.9739},
        'Meerut': {'lat': 28.9845, 'lon': 77.7064},
        'Prayagraj': {'lat': 25.4358, 'lon': 81.8463},
        'Ghaziabad': {'lat': 28.6692, 'lon': 77.4538},
        'Noida': {'lat': 28.5355, 'lon': 77.3910}
    },
    'West Bengal': {
        'Kolkata': {'lat': 22.5726, 'lon': 88.3639},
        'Howrah': {'lat': 22.5958, 'lon': 88.2636},
        'Durgapur': {'lat': 23.5204, 'lon': 87.3119},
        'Asansol': {'lat': 23.6739, 'lon': 86.9524},
        'Siliguri': {'lat': 26.7271, 'lon': 88.3953},
        'Darjeeling': {'lat': 27.0410, 'lon': 88.2663},
        'Kharagpur': {'lat': 22.3460, 'lon': 87.2320},
        'Malda': {'lat': 25.0061, 'lon': 88.1389}
    },
    'Rajasthan': {
        'Jaipur': {'lat': 26.9124, 'lon': 75.7873},
        'Jodhpur': {'lat': 26.2389, 'lon': 73.0243},
        'Udaipur': {'lat': 24.5854, 'lon': 73.7125},
        'Kota': {'lat': 25.2138, 'lon': 75.8648},
        'Ajmer': {'lat': 26.4499, 'lon': 74.6399},
        'Bikaner': {'lat': 28.0229, 'lon': 73.3119},
        'Bharatpur': {'lat': 27.2152, 'lon': 77.5030},
        'Mount Abu': {'lat': 24.5926, 'lon': 72.7156}
    },
    'Kerala': {
        'Thiruvananthapuram': {'lat': 8.5241, 'lon': 76.9366},
        'Kochi': {'lat': 9.9312, 'lon': 76.2673},
        'Kozhikode': {'lat': 11.2588, 'lon': 75.7804},
        'Thrissur': {'lat': 10.5276, 'lon': 76.2144},
        'Kollam': {'lat': 8.8932, 'lon': 76.6141},
        'Alappuzha': {'lat': 9.4981, 'lon': 76.3388},
        'Kannur': {'lat': 11.8745, 'lon': 75.3704},
        'Munnar': {'lat': 10.0889, 'lon': 77.0595}
    },
    'Madhya Pradesh': {
        'Bhopal': {'lat': 23.2599, 'lon': 77.4126},
        'Indore': {'lat': 22.7196, 'lon': 75.8577},
        'Jabalpur': {'lat': 23.1815, 'lon': 79.9864},
        'Gwalior': {'lat': 26.2183, 'lon': 78.1828},
        'Ujjain': {'lat': 23.1765, 'lon': 75.7885},
        'Sagar': {'lat': 23.8388, 'lon': 78.7378},
        'Rewa': {'lat': 24.5362, 'lon': 81.3037},
        'Khajuraho': {'lat': 24.8318, 'lon': 79.9199}
    }
}

@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory(app.static_folder, path)

@app.route('/api/states')
def get_states():
    return jsonify(list(STATES_AND_DISTRICTS.keys()))

@app.route('/api/districts/<state>')
def get_districts(state):
    if state not in STATES_AND_DISTRICTS:
        return jsonify({'error': 'State not found'}), 404
    return jsonify(list(STATES_AND_DISTRICTS[state].keys()))

@app.route('/api/weather/<state>/<district>')
def get_weather(state, district):
    if state not in STATES_AND_DISTRICTS or district not in STATES_AND_DISTRICTS[state]:
        return jsonify({'error': 'Location not found'}), 404
    
    coordinates = STATES_AND_DISTRICTS[state][district]
    url = f'https://api.openweathermap.org/data/2.5/forecast'
    params = {
        'lat': coordinates['lat'],
        'lon': coordinates['lon'],
        'appid': API_KEY,
        'units': 'metric'
    }
    
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        return jsonify(response.json())
    except requests.exceptions.RequestException as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Ensure the static folder exists
    os.makedirs(app.static_folder, exist_ok=True)
    app.run(debug=True, host='0.0.0.0', port=5000) 
