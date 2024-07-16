def read_in_chunks(file_object, chunk_size=1024):
    while True:
        data = file_object.read(chunk_size)
        if not data:
            break
        yield data


def urldecode(str):
    dic = {"%21":"!","%22":'"',"%23":"#","%24":"$","%26":"&","%27":"'","%28":"(","%29":")","%2A":"*","%2B":"+","%2C":",","%2F":"/","%3A":":","%3B":";","%3D":"=","%3F":"?","%40":"@","%5B":"[","%5D":"]","%7B":"{","%7D":"}"}
    for k,v in dic.items(): str=str.replace(k,v)
    return str


def parse_query_string(query_string):
    query = query_string.split('?')[1]
    params = query.split('&')
    param_dict = {}

    for param in params:
        key, value = param.split('=')
        param_dict[key] = value
    
    return param_dict




def is_directory(path):
    try:
        return os.stat(path)[0] & 0x4000 != 0
    except OSError:
        return False

def _file_exists(path):
        try:
            os.stat(path)
            return True
        except:
            return False

def list_directory_contents(base_path):
    contents = []
    try:
        for entry in os.listdir(base_path):
            
            if base_path == '/':
                entry_path = '/' + entry
            else:
                entry_path = base_path + '/' + entry
            
            #print(entry_path)
            
            if is_directory(entry_path):
                contents.append({
                    'name': entry,
                    'path': entry_path,
                    'isDirectory': True
                })
            else:
                contents.append({
                    'name': entry,
                    'path': entry_path,
                    'isDirectory': False,
                    'size': os.stat(entry_path)[6]
                })
    except OSError as e:
        print("OSError:", e)
    return contents


@webserver.handle('/contents')
def handle_contents(client, path, request):
    try:
        query_params = path.split('?path=')[1] if '?path=' in path else '/'
        full_path = query_params
        
        contents = list_directory_contents(full_path)
        response = ujson.dumps({"contents": contents})
        client.send("HTTP/1.1 200 OK\r\nContent-Type: application/json\r\n\r\n")
        client.send(response)
    except Exception as e:
        print("Error:", e)
        client.send("HTTP/1.1 500 Internal Server Error\r\nContent-Type: text/plain\r\n\r\n")
        client.send("Internal Server Error")



@webserver.handle('/upload')
def handle_upload(client, path, request):
    try:
        _, filepath, filesize = path.split(';')
        filesize = int(filesize) * 2
        data_read = 0
        
        print("Upload: " + str(filepath) + "    size: "  + str(filesize))
        print("0%")
        
        with open(filepath, 'wb') as file:
            data = request[request.find(b'\r\n\r\n') + 4:]
            
                        
            if data:
                data_read = len(data)
                if data_read % 2 == 0:
                    file.write(ubinascii.unhexlify(data))
                else:
                    data = data + client.read(1)
                    file.write(ubinascii.unhexlify(data))   
                data_read = len(data)
            

            while data_read < filesize:
                try:
                    chunk_size = min(1024, filesize - data_read)
                    chunk = client.read(chunk_size)
                    file.write(ubinascii.unhexlify(chunk))
                    data_read = data_read + chunk_size
                    percentage = (data_read / filesize) * 100
                    print(f"{percentage:.1f}%")
                    if not chunk:
                        break   
                except OSError as e:
                    if e.args[0] == 116:  # ETIMEDOUT
                        break
                    else:
                        raise e
           
        print("Ulozeno")

        client.write("HTTP/1.1 200 OK\r\nContent-Type: text/html\r\n\r\nUpload successful".encode("utf-8"))
    except Exception as e:
        print("Error during file upload:", e)
        client.write("HTTP/1.1 500 Internal Server Error\r\nContent-Type: text/html\r\n\r\nUpload failed".encode("utf-8"))




@webserver.handle('/download')
def handle_download(client, path, request):
    try:
        file_path = urldecode(path).split('?path=')[1]
        file_name = file_path.split('/')[-1]
        if _file_exists(file_path):
            client.send(f"HTTP/1.1 200 OK\r\nContent-Type: application/octet-stream\r\nContent-Disposition: attachment; filename=\"{file_name}\"\r\n\r\n")
            with open(file_path, 'rb') as f:
                for piece in read_in_chunks(f):
                        client.write(piece)
        else:
            client.send("HTTP/1.1 404 Not Found\r\nContent-Type: text/plain\r\n\r\n")
            client.send("File not found.")
    except OSError as e:
        print("OSError:", e)
        client.send("HTTP/1.1 500 Internal Server Error\r\nContent-Type: text/plain\r\n\r\n")
        client.send("Internal Server Error")


@webserver.handle('/delete')
def handle_delete(client, path, request):
    try:
        files = ujson.loads(urldecode(path).split('?files=')[1])
        for file_path in files:
            full_path = file_path
            os.remove(full_path)
        client.send("HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\n\r\n")
        client.send("Files deleted successfully.")
    except OSError as e:
        print("OSError:", e)
        client.send("HTTP/1.1 500 Internal Server Error\r\nContent-Type: text/plain\r\n\r\n")
        client.send("Internal Server Error")



@webserver.handle('/rename')
def handle_rename(client, path, request):
    try:
        query_params = ujson.loads(urldecode(path).split('?data=')[1])
        old_name = query_params['old_name']
        new_name = query_params['new_name']
        os.rename(old_name, new_name)
        client.send("HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\n\r\n")
        client.send("File renamed successfully.")
    except OSError as e:
        print("OSError:", e)
        client.send("HTTP/1.1 500 Internal Server Error\r\nContent-Type: text/plain\r\n\r\n")
        client.send("Internal Server Error")


@webserver.handle('/newfolder')
def handle_newfolder(client, path, request):
    try:
        query_params = ujson.loads(urldecode(path).split('?data=')[1])
        folderpath = query_params['foldername']
        os.mkdir(folderpath)
        client.send("HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\n\r\n")
        client.send("New folder created successfully.")
    except OSError as e:
        print("OSError:", e)
        client.send("HTTP/1.1 500 Internal Server Error\r\nContent-Type: text/plain\r\n\r\n")
        client.send("Internal Server Error")


@webserver.handle('/move')
def handle_move(client, path, request):
    try:
        query_params = ujson.loads(urldecode(path).split('?data=')[1])
        src_files = query_params['src']
        dest_path = query_params['dest']
        for src in src_files:
            full_src_path =  src
            full_dest_path = dest_path + '/' + src.split('/')[-1]
            os.rename(full_src_path, full_dest_path)
        client.send("HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\n\r\n")
        client.send("Files moved successfully.")
    except OSError as e:
        print("OSError:", e)
        client.send("HTTP/1.1 500 Internal Server Error\r\nContent-Type: text/plain\r\n\r\n")
        client.send("Internal Server Error")

@webserver.handle('/copy')
def handle_copy(client, path, request):
    try:
        query_params = ujson.loads(urldecode(path).split('?data=')[1])
        src_files = query_params['src']
        dest_path = query_params['dest']
        for src in src_files:
            full_src_path = src
            full_dest_path = dest_path + '/' + src.split('/')[-1]
            with open(full_src_path, 'rb') as f_src:
                with open(full_dest_path, 'wb') as f_dest:
                    for piece in read_in_chunks(f_src):
                        f_dest.write(piece)
        client.send("HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\n\r\n")
        client.send("Files copied successfully.")
    except OSError as e:
        print("OSError:", e)
        client.send("HTTP/1.1 500 Internal Server Error\r\nContent-Type: text/plain\r\n\r\n")
        client.send("Internal Server Error")