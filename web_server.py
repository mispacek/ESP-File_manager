import network
import usocket
import _thread
from os import stat, listdir
from time import sleep_ms

class WebServer:
    def __init__(self, web_folder='/www', port=80):
        self.WEB_FOLDER = web_folder
        self.MIMETYPES = {
            "txt"   : "text/plain",
            "htm"   : "text/html",
            "html"  : "text/html",
            "css"   : "text/css",
            "csv"   : "text/csv",
            "js"    : "application/javascript",
            "xml"   : "application/xml",
            "xhtml" : "application/xhtml+xml",
            "json"  : "application/json",
            "zip"   : "application/zip",
            "pdf"   : "application/pdf",
            "ts"    : "application/typescript",
            "ttf"   : "font/ttf",
            "jpg"   : "image/jpeg",
            "jpeg"  : "image/jpeg",
            "png"   : "image/png",
            "gif"   : "image/gif",
            "svg"   : "image/svg+xml",
            "ico"   : "image/x-icon",
            "cur"   : "application/octet-stream",
            "tar"   : "application/tar",
            "tar.gz": "application/tar+gzip",
            "gz"    : "application/gzip",
            "mp3"   : "audio/mpeg",
            "wav"   : "audio/wav",
            "ogg"   : "audio/ogg"
        }
        self.webserv_sock = None
        self.url_handlers = {}
        self.port = port

    def _file_exists(self, path):
        try:
            stat(path)
            return True
        except:
            return False

    def get_mime_type(self, filename):
        try:
            _, ext = filename.rsplit(".", 1)
            return self.MIMETYPES.get(ext, "application/octet-stream")
        except:
            return "application/octet-stream"
        
    def read_in_chunks(self, file_object, chunk_size=1024):
        while True:
            data = file_object.read(chunk_size)
            if not data:
                break
            yield data

    def serve_file(self, client, path):
        try:
            
            if path.startswith("/*GET_FILE"):
                file_path = path.replace("/*GET_FILE", "")
            else:
                if path == "/":
                    path = "/index.html"
                file_path = self.WEB_FOLDER + path
            
            mime_type = self.get_mime_type(file_path)
            filestatus = 0 # 0=Not found  1=Found  2=found in GZip

            if self._file_exists(file_path + '.gz'):
                filestatus = 2
                file_path += '.gz'
            elif self._file_exists(file_path):
                filestatus = 1
                        
            if filestatus > 0:
                with open(file_path, 'rb') as file:
                    client.write(b'HTTP/1.1 200 OK\r\n')
                    client.write(b"Content-Type: " + mime_type.encode() + b"\r\n")
                    if filestatus == 2:
                        client.write(b'Content-Encoding: gzip\r\n')
                    client.write(b'\r\n')
                    for piece in self.read_in_chunks(file):
                        client.write(piece)
            else:
                client.write(b"HTTP/1.0 404 Not Found\r\n\r\nFile not found.")
        except OSError as e:
            print("OSError:", e)
            client.write(b"HTTP/1.0 500 Internal Server Error\r\n\r\nInternal error.")
        except Exception as e:
            print("Exception:", e)
            client.write(b"HTTP/1.0 500 Internal Server Error\r\n\r\nInternal error.")

    def handle(self, pattern):
        """Decorator to register a handler for a specific URL pattern."""
        def decorator(func):
            self.url_handlers[pattern] = func
            return func
        return decorator

    def client_handler(self, client):
        try:
            request = client.recv(1024)
            if request:
                _, path, _ = request.decode("utf-8").split(" ", 2)
                for pattern, handler in self.url_handlers.items():
                    if path.startswith(pattern):
                        handler(client, path, request)
                        return
                # Default file serving if no handler matches
                self.serve_file(client, path)
        except Exception as e:
            sleep_ms(0)
        finally:
            client.close()

    def web_thread(self):
        while True:
            try:
                cl, addr = self.webserv_sock.accept()
                cl.settimeout(2)  # time in seconds
                self.client_handler(cl)
            except Exception as ex:
                sleep_ms(0)

    def start(self):
        addr = usocket.getaddrinfo('0.0.0.0', self.port)[0][-1]
        self.webserv_sock = usocket.socket()
        self.webserv_sock.setsockopt(usocket.SOL_SOCKET, usocket.SO_REUSEADDR, 1)
        self.webserv_sock.bind(addr)
        self.webserv_sock.listen(5)
        _thread.start_new_thread(self.web_thread, ())
        for interface in [network.AP_IF, network.STA_IF]:
            wlan = network.WLAN(interface)
            if not wlan.active():
                continue
            ifconfig = wlan.ifconfig()
            print("Web server spusten na adrese {}:{}".format(ifconfig[0], self.port))

    def stop(self):
        if self.webserv_sock:
            self.webserv_sock.close()

