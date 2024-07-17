import os
import ujson
import ubinascii


fm_500 = "HTTP/1.1 500 Internal Server Error\r\nContent-Type: text/plain\r\n\r\n"
fm_200_json = "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\n\r\n"
fm_200_text = "HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\n\r\n"


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


def file_exists(path):
        try:
            os.stat(path)
            return True
        except:
            return False


def path_exists(path):
    try:
        os.stat(path)
        return True
    except OSError:
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


def delete_path(path):
    if not path_exists(path):
        print(f"Path {path} does not exist.")
        return

    stack = [path]

    while stack:
        current_path = stack.pop()
        if is_directory(current_path):
            try:
                entries = list(os.ilistdir(current_path))
                if not entries:
                    # Directory is empty, we can delete it
                    os.rmdir(current_path)
                    #print(f"Deleted directory: {current_path}")
                else:
                    # Add directory back to stack to try again later
                    stack.append(current_path)
                    # Add entries to stack
                    for entry in entries:
                        entry_path = current_path + '/' + entry[0]
                        stack.append(entry_path)
            except Exception as e:
                print(f"Error accessing directory {current_path}: {e}")
        else:
            try:
                os.remove(current_path)
                #print(f"Deleted file: {current_path}")
            except Exception as e:
                print(f"Error deleting file {current_path}: {e}")


def handle_contents(client, path, request):
    try:
        query_params = path.split('?path=')[1] if '?path=' in path else '/'
        full_path = query_params
        
        contents = list_directory_contents(full_path)
        response = ujson.dumps({"contents": contents})
        client.send(fm_200_json)
        client.send(response)
    except Exception as e:
        print("Error:", e)
        client.send(fm_500)
        client.send("Internal Server Error")



def handle_upload(client, path, request):
    try:
        _, filepath, filesize = path.split(';')
        filesize = int(filesize) * 2
        data_read = 0
        
        #print("Upload: " + str(filepath) + "    size: "  + str(filesize))
        #print("0%")
        
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
                    #print(f"{percentage:.1f}%")
                    if not chunk:
                        break   
                except OSError as e:
                    if e.args[0] == 116:  # ETIMEDOUT
                        break
                    else:
                        raise e
           
        #print("File Saved")
        client.send(fm_200_text)
        client.send("Upload successful")
    except Exception as e:
        print("Error during file upload:", e)
        client.send(fm_500)
        client.send("Upload failed")



def handle_download(client, path, request):
    try:
        file_path = urldecode(path).split('?path=')[1]
        file_name = file_path.split('/')[-1]
        if file_exists(file_path):
            client.send(f"HTTP/1.1 200 OK\r\nContent-Type: application/octet-stream\r\nContent-Disposition: attachment; filename=\"{file_name}\"\r\n\r\n")
            with open(file_path, 'rb') as f:
                for piece in read_in_chunks(f):
                        client.write(piece)
        else:
            client.send("HTTP/1.1 404 Not Found\r\nContent-Type: text/plain\r\n\r\n")
            client.send("File not found.")
    except OSError as e:
        print("OSError:", e)
        client.send(fm_500)
        client.send("Internal Server Error")



def handle_delete(client, path, request):
    try:
        files = ujson.loads(urldecode(path).split('?files=')[1])
        for file_path in files:
            delete_path(file_path) 
        client.send(fm_200_text)
        client.send("Files deleted successfully.")
    except OSError as e:
        print("OSError:", e)
        client.send(fm_500)
        client.send("Internal Server Error")



def handle_rename(client, path, request):
    try:
        query_params = ujson.loads(urldecode(path).split('?data=')[1])
        old_name = query_params['old_name']
        new_name = query_params['new_name']
        os.rename(old_name, new_name)
        client.send(fm_200_text)
        client.send("File renamed successfully.")
    except OSError as e:
        print("OSError:", e)
        client.send(fm_500)
        client.send("Internal Server Error")



def handle_newfolder(client, path, request):
    try:
        query_params = ujson.loads(urldecode(path).split('?data=')[1])
        folderpath = query_params['foldername']
        os.mkdir(folderpath)
        client.send(fm_200_text)
        client.send("New folder created successfully.")
    except OSError as e:
        print("OSError:", e)
        client.send(fm_500)
        client.send("Internal Server Error")



def handle_move(client, path, request):
    try:
        query_params = ujson.loads(urldecode(path).split('?data=')[1])
        src_files = query_params['src']
        dest_path = query_params['dest']
        for src in src_files:
            full_src_path =  src
            full_dest_path = dest_path + '/' + src.split('/')[-1]
            os.rename(full_src_path, full_dest_path)
        client.send(fm_200_text)
        client.send("Files moved successfully.")
    except OSError as e:
        print("OSError:", e)
        client.send(fm_500)
        client.send("Internal Server Error")


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
        client.send(fm_200_text)
        client.send("Files copied successfully.")
    except OSError as e:
        print("OSError:", e)
        client.send(fm_500)
        client.send("Internal Server Error")
