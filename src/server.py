import http.server
import socketserver
import json
import os

PORT = 8000
DIRECTORY = "."

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_POST(self):
        if self.path == '/save_layout':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)

            try:
                # Parse JSON
                data = json.loads(post_data.decode('utf-8'))

                # We expect the payload to contain the updated NODES and EDGES
                filepath = os.path.join(DIRECTORY, 'data', 'courses.json')

                # We should read the existing file to preserve NODE_TYPES if not sent
                with open(filepath, 'r') as f:
                    current_data = json.load(f)

                if 'nodes' in data:
                    current_data['NODES'] = data['nodes']
                if 'edges' in data:
                    current_data['EDGES'] = data['edges']

                with open(filepath, 'w') as f:
                    json.dump(current_data, f, indent=2)

                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "success"}).encode('utf-8'))
                print("Successfully updated data/courses.json")
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
                print(f"Error updating JSON: {e}")
        else:
            self.send_response(404)
            self.end_headers()

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Serving at port {PORT}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
