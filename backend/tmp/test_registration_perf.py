import requests
import time
import uuid

BASE_URL = "http://localhost:8000/api"

def test_registration_perf(token, num_requests=5):
    cedula_base = 1000000000
    
    print(f"🚀 Iniciando prueba de rendimiento para token: {token}")
    print(f"📊 Número de solicitudes: {num_requests}")
    
    latencies = []
    
    for i in range(num_requests):
        cedula = str(cedula_base + i)
        payload = {
            "token": token,
            "cedula": cedula,
            "nombre": f"Test User {i}",
            "cargo": "Tester",
            "unidad": "QA Department",
            "correo": f"test{i}@example.com"
        }
        
        start_time = time.time()
        try:
            response = requests.post(f"{BASE_URL}/asistencia/interna", json=payload)
            latency = time.time() - start_time
            latencies.append(latency)
            
            if response.status_code == 201:
                print(f"✅ [{i+1}/{num_requests}] Éxito - Latencia: {latency:.4f}s")
            else:
                print(f"❌ [{i+1}/{num_requests}] Error {response.status_code}: {response.text}")
        except Exception as e:
            print(f"❌ [{i+1}/{num_requests}] Error de conexión: {e}")
            
    if latencies:
        avg_latency = sum(latencies) / len(latencies)
        print(f"\n📈 Resultados:")
        print(f"   Promedio: {avg_latency:.4f}s")
        print(f"   Mínimo:   {min(latencies):.4f}s")
        print(f"   Máximo:   {max(latencies):.4f}s")

if __name__ == "__main__":
    # Intentar obtener un token válido de la base de datos si es posible, 
    # o pedir al usuario que lo proporcione.
    import sys
    if len(sys.argv) > 1:
        test_registration_perf(sys.argv[1])
    else:
        print("Uso: python test_registration_perf.py <TOKEN_VALIDO>")
