document.addEventListener('DOMContentLoaded', function() {
    loadDirectoryContents('/');
    
    document.getElementById('upload').addEventListener('click', () => document.getElementById('file-upload').click());
    document.getElementById('file-upload').addEventListener('change', uploadFile);
    document.getElementById('download').addEventListener('click', downloadFiles);
    document.getElementById('move-to').addEventListener('click', moveTo);
    document.getElementById('copy-to').addEventListener('click', copyTo);
    document.getElementById('rename').addEventListener('click', renameFile);
    document.getElementById('new-folder').addEventListener('click', new_Folder);
    document.getElementById('delete').addEventListener('click', deleteFiles);
    document.getElementById('clear-selection').addEventListener('click', clearSelection);
    document.getElementById('popup-close').addEventListener('click', closePopup);
});

let currentPath = '/';
let selectedFiles = [];
let popup_modal = false;

let upIconBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAENklEQVR42p2WTWxUVRTH//fNR9vhTttpSwkfEogulI0L485oEBNTQxNXLmrUkLBS4mfjZ0JABGpAExokJSYS17oBwWAUhbgxGuPGFijETChlOm1npjN905n37nvv+L8zVRfaMOMkkztv3n3nd87/f86dUWjjpceXBSHgvpZWrT7T8kb98Yrs2GqwfUscF65EcN9qDdLSJn3UlcyAwaWRXiQEeP5yBb/9zEre77nr83fdoA+5kkx78s2ejLrHUVgyEeZDhZe/K+PmFCGHMup/A/SBZVHar53f09u1o8vBVDnElCvQCcCJKRy9VEH2moI7tjZkzRt6f1mky8fZvX14SDuYrIT4qUiPlSAIBN1JB/GY4NjFCuazhBzrVy0D9NtlqSc8fLkvg8e647jK4D8WI96hAVx8vmu+oKvDgRBy+mwJ5Vwc7okBdVeAfndJauLhzIsZDK9P4DpluVyIEIg04ptI4IXNdcUHutc5qAYhvriwhOpigpD1ak2AfqcsrqlhYl8fntmQwDQz/34xgm8E4gAhIYbB6wzuB7y2EK69nTGU+cX5r8owtRjc8Q3qXwD9RkmqXh2nXu/Ds5uSyC6HODsfYsUAHdS9vpq1BfirAFqBgJ1VZyW6S6FQDXDlXIkbKNfERvU3QB8uS9L3sP+FHoxsTqJKfacqEX5YCBAyUJzZe6zCBjZWJhvcfubqMoMYDQdBujuBIkv65RwrMZTrk0Gl9AdLIjGDoYeTGHpgHW7OGxQ8QQfbMMXIK+x7L5RGttFqFRbUuOa+/M07rMBBgFQjk9TGJFxKO32pjM5+DaUPlyQW+thEzYvM2mP2QSnCwH0JjO7S2NYJfH0rQMn6YD1gB5nQSsWgJFZuzCE77UXVZAdHIw6nnkCyLw7PDRCY2NpzkDlYkCPP6UabnrzhYYbwuGoaXWf6oePA0Jjq7TkUFjWyBze3Pgf2NfBRUUafSuGRPgenr3uYrQAxZQeN+pumwX6dLbtwC8uzA8iObWwP0D9WkJd2r8NOngKnrhssLFMb26qm2UmBKAR+iFohj5U/Upg5sbU9QO+RRdk7lMLj/TGcvOqhYCvAPx74HIyQAHOnCI+dOXv83vYAmQMLMmIr6HcwMUlAuSnRX7MQRgqGAP92nqtG/sM2K+h5b16eHk5hFyv4dNJHgRIp25p2DihTGNFknhn12TxUoLFwvF3AaF6eZAWPbojhs9/rKC9xszWZ7gZ2HuiBEGBycxBWUBrf3h4g/WpOntjNNt3i4MyvPkpLUfMwtcdDGEFYgW8lyuWRNGmUTm1rD6BfycnO4TQGU4JvJw0CTq1we2Sn2rap4lFtTZ7J0fw03HYBg2/mpP/BFGps/Br1dzi1hlMeBZz2aoiIwUOeXz4d1xxC9/P726xgJCu1QpGyqEb/C7Nm40NFQeNXjYcP7F8YewTpjgG4F/8b8CftPHDwwRULGgAAAABJRU5ErkJggg==";
let folderIconBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAADtElEQVR42r1V3WtcRRT/nbvZjd0k/UgqNqIPimiRqrVQQitIkRIp6IOiYBGf/B/6YouKVCzSJimxKSLWmFQJptJigvhJ6YOiD1raICmtSW2bdDfZbJrdfJo7c3rm4969KVZrig53mHvnzpzfOb/fmTOE/7jR/wJwbiexDhngpbBBmvDQJ3xbTtDAi8T1Tz2P+uad4MUFB6IZVFWF4rc9KJ48jg2fLR+EfnkWvL6lFyvubQTm8tY4WIv7hNnhIZx7cxc2nVg+lfTTDvCGd7uRvWcFeK5k3AdCDUqlMD38O357ey+a+m8D4Idm8KMHulHTWA1emLL2oRUoCFA6P4jTe/ajqubvFPzraaoCtvSB6Pvt4M0HulDbmJEIBMCIoA2KgFSvwXwxjXB2CmRkIHYOmJGlK23pZGPSfBvLZhTnpgZP40Lv+6BvtoGb2j5G3bq0AFxzANFmeag6Gxuy8wnD8ZxxiJVQ6/UTesuXLuLntvdAXz4J3traiZWNBmDSR8CWJrvYbFbRN1cMRyDaA+jEdwCURkbx4+Eu0PEt4G3tH2HVupRocM1vhDckMStV8dxSJ2Oo3Ki8Eyq0DrBfE0gGTl4examObtCxJvD29g+x0gBYDQyfsmF+QgCnAQuq3JylTblu5tL1QoeoGUgWZOpkXtaEi5LhhOKVEZzs+BTUsxncfOgIVq/V0JNnxKCALJQTOnh65J0tFRGQ6Yvyy0SwKH6lEWRWg2ruFrw7MXHpMr7rOAo6ugm8o20f1mQvQs8WHd/+LDheQ3kig95zG4V2xg2g+WdoE0BDVxBkMDm3Cl93nQJ1bgQ/0/IW6uuuQk8X4s2x15FBjkBdBFon6EqsN53EqYmxGXzVPwr64BHwc60CUDsCXR7zmXAzSpQ8CYM6Etj9Zx9RIAkwkZ9Df99V0OGHwS+0vYGGmisCkLPscJR2OinsDZQsEdw449aQ6XImCmPzONGXA7WvB7/U+joaav+ALuVtAHG4CQNLKFHJCFTFuAcyERTGF/B5Xx7U8iD4ldY9aMgOQ5XHK4fIR6BjsZXTgBOUJL9j6rRN03EB6PlCAPbfD3754G7clR2CKuXiYucoSYh4U0qUTwSf0tJSctDyBQE4JgDv3Ad+9dBurM0MyfkejfNf61vgOzTvob9DOK6uUoqQy/2Jzl7RYN8D4MeefgKPb7wDaqYgGyjOf1c2uFKTTOUMXemwnrOvUze0VIrw68AMzg6WHeZeiSIM/6HO/5srR9bKjYvXLsh9sNyb6lbbdQUO3sO94PfiAAAAAElFTkSuQmCC";
let fileIconBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAEQElEQVR42q2Wa2gcVRTH/3dmNpFo1LW1tQpVsPpBRYKCH3xBNVpFCD4o2BYrPip+KFWUSmuzSKXGVrRYFBGUNLVG66NBQY2SUgVtIKlpikhe3W7DZjfNJrvJZmdn532v585uYrYbog29szNzH7Pzu+f8zz13GOaUd9t+E4IzeD6HEAJgDArkje4MyJocKnVM2yYy2RxiSR2de19gWKCwcwFr77o1qIdCKgqGi5xVQN7yYNguJg0DU7oP03IQHTuLobMZ2CZbEFI2sOebo+LJe+uwclk4aAs6CgUHuuUjZ5rI6XmkDAcutftTaXSc6MOdN16PzqE4fn3rWXZeAN91YcIjgEozdmE5eVhkRYascjlHf2ISA/E41t99C9q6TuOveGpeSFlH06GjYsPqEsD3yQQOByosy4JpFKCbPrlLwPFdDCTS6IrGEFn/IHzHw57vOtE/Ml4BKWvsaj0inqq/rQRwIAVnigLLJ0tMFwXbg+OIwHm9sQR6h9N4e+N9SE7pGBweR3tvFD2x0TJIGeDNL46Ip++fAVjgXJWBBEGnSZFlkNie40MRPs6M5/Bjz+kAMJ3LI+8LxJNjaOuO4afjA+j7+GVWAYh83iGef+D2WQs4Lw7LEPVLECmwdJFBWnScHArGdV0gL5yg/uepUZxJjmPwk1cqAVubfxabH7ljVgNOYs48xEoQuUZytoDnOsVAsDhp5GIsa6CmRsOJ6Aj2/dCN4eatlYAtH34vXl17TwDwCOAQoKo0JkoPC9JkmqLJcVxwl7SREUagdNbCZZdWo+tUArsP/Y6Rz16rBGza2yoaNzxctADSFRzShhBdtDnPeb4Cm9swPBt2nsEVFgFMrLgijGODcfJEO0YPbqsErGtqEbufawgABs1OkAV0RTUljBD5yKc6p1RRJeseie6RBTb1ei4mcgWsWnEl/uiL45l9h5Fq3V4JaIh8Kj7Y/HgAyBgWVC6Cl2rkFpUpxXAinykqWUSC+HSa3IVHwk/oBm6+dhmO/T2Cx5oOYuLLHZWA1TuaRcuWRwPAZL4QOD6I+kBshhA5qppgjhQmBFwkgR4ja0mDnIkbrg7jZHQU9Y37kfmq8f8B5hbZVCmdqlIRjRXB9AsRdIIsXrnkYgrTBNY0HsDk14sBULuqSoNLM1YVjVyngVM6UVgxnSwJ16B7KIGHIgcwtRgAAgtUiiIC0BEiMaSXpAMdSidLay8A4N8cw0orEMGmZHIfV9VeguMEWHMhAHLWMoRZIL5MIz6uubx2YcBNL74v2ndunAWweQDyD5xE9SWCQlSlhaFpGkxKgsvDZEFJ5P8EpKZ1WqHFfuUciGlTIqTcxlSaP0WVRgtvqmCh7rrl6IkmUb99P7LfRioBS594Q/R89NLslrmYIveGuk3vIX14ZyWgtuF10d+ybdEvnymr1u2C9cs78wPk3RXSKeK8Xio/cxjlr5kyA/gHM7+cN0oReEMAAAAASUVORK5CYII=";


function allowDrop(event) {
    event.preventDefault();
}

function handleDrop(event) {
    event.preventDefault();
    let files = event.dataTransfer.files;
    if (files.length > 0) {
        uploadFiles(files);
    }
}

function uploadFiles(files) {
    Array.from(files).forEach(file => {
        const reader = new FileReader();
        let new_path = currentPath + '/' + file.name;
        new_path = new_path.replace(/\/\//g, '/');

        showLoading(" Uploading file. Please wait... ");

        reader.onload = async function(event) {
            const fileSize = event.target.result.byteLength;
            const hexData = hexEncode(event.target.result);

            // Create and send the HTTP request
            const xhr = new XMLHttpRequest();
            xhr.open("POST", `/upload;${new_path};${fileSize}`, true);
            xhr.setRequestHeader("Content-Type", "text/plain");
            xhr.onreadystatechange = function() {
                if (xhr.readyState === XMLHttpRequest.DONE) {
                    if (xhr.status === 200) {
                        showNotification("File " + file.name + " uploaded successfully!");
                        loadDirectoryContents(currentPath);
                        clearSelection();
                    } else {
                        showError("File upload failed!")
                        loadDirectoryContents(currentPath);
                        clearSelection();
                    }
                }
            };
            xhr.send(hexData);
        };
        reader.readAsArrayBuffer(file);
    });
}

function showPopup(content) {
    document.getElementById('popup-content').innerHTML = content;
    document.getElementById('popup-overlay').style.display = 'flex';
}

function closePopup() {
    document.getElementById('popup-overlay').style.display = 'none';
    popup_modal = false;
}

function showError(message) {
    popup_modal = true;
    document.getElementById('popup-close').style.display = 'block';
    showPopup('<p style="color: red;">' + message + '</p>');
}

function showNotification(message) {
    popup_modal = true;
    document.getElementById('popup-close').style.display = 'block';
    showPopup('<p style="color: green;">' + message + '</p>');
}

function showLoading(message) {
    popup_modal = false;
    document.getElementById('popup-close').style.display = 'none';
    showPopup('<p style="color: black;">' + message + '</p>');
}

function downloadAll(urls) {
    var link = document.createElement('a');
    link.setAttribute('download', null);
    link.style.display = 'none';
    document.body.appendChild(link);

    for (var i = 0; i < urls.length; i++) {
        link.setAttribute('href', urls[i]);
        link.click();
    }
    document.body.removeChild(link);
}

function loadDirectoryContents(path) {
    currentPath = path;
    updateBreadcrumb();
    
    console.log("Updatuju file list")

    if (document.getElementById('popup-overlay').style.display == 'none') {
        showLoading("  Loading...  ");
    }

    fetch('/contents?path=' + currentPath)
        .then(response => response.json())
        .then(data => {
            const fileTable = document.getElementById('file-table').querySelector('tbody');
            fileTable.innerHTML = '';

            if (path !== '/') {
                const row = document.createElement('tr');
                const selectCell = document.createElement('td');
                const nameCell = document.createElement('td');
                nameCell.style.cursor = 'pointer';
                nameCell.addEventListener('click', () => loadDirectoryContents(path.substring(0, path.lastIndexOf('/')) || '/'));
                nameCell.innerHTML = `<img src="${upIconBase64}" class="file-icon"> ..`;

                const sizeCell = document.createElement('td');
                sizeCell.textContent = '';

                row.appendChild(selectCell);
                row.appendChild(nameCell);
                row.appendChild(sizeCell);
                fileTable.appendChild(row);
            }

            // Separate and sort directories and files
            const directories = data.contents.filter(file => file.isDirectory).sort((a, b) => a.name.localeCompare(b.name));
            const files = data.contents.filter(file => !file.isDirectory).sort((a, b) => a.name.localeCompare(b.name));

            // Combine sorted directories and files
            const sortedContents = directories.concat(files);

            sortedContents.forEach(file => {
                const row = document.createElement('tr');
                const selectCell = document.createElement('td');
                const selectInput = document.createElement('input');
                selectInput.type = 'checkbox';
                selectInput.addEventListener('change', () => {
                    if (selectInput.checked) {
                        selectedFiles.push(file.path);
                    } else {
                        selectedFiles = selectedFiles.filter(f => f !== file.path);
                    }
                });
                selectCell.appendChild(selectInput);

                const nameCell = document.createElement('td');
                const iconSrc = file.isDirectory ? folderIconBase64 : fileIconBase64;
                const icon = document.createElement('img');
                icon.className = 'file-icon';
                icon.src = iconSrc;

                nameCell.appendChild(icon);
                nameCell.appendChild(document.createTextNode(file.name));

                if (file.isDirectory) {
                    nameCell.style.cursor = 'pointer';
                    nameCell.addEventListener('click', () => loadDirectoryContents(file.path));
                }

                const sizeCell = document.createElement('td');
                sizeCell.textContent = file.isDirectory ? '-' : `${file.size} B`;

                row.appendChild(selectCell);
                row.appendChild(nameCell);
                row.appendChild(sizeCell);
                fileTable.appendChild(row);
            });

            if (popup_modal == false) {
                closePopup();
            }
        })
        .catch(error => {
            showError(error.message);
        });
}


function updateBreadcrumb() {
    const breadcrumb = document.getElementById('breadcrumb');
    breadcrumb.innerHTML = '';

    const pathParts = currentPath.split('/').filter(part => part);

    const link = document.createElement('a');
    link.href = 'javascript:loadDirectoryContents("/");';
    link.textContent = "\u00A0\u00A0/\u00A0\u00A0\u00A0";
    breadcrumb.appendChild(link);

    let path = '';
    pathParts.forEach((part, index) => {
        path += `/${part}`;
        const link = document.createElement('a');
        link.href = 'javascript:loadDirectoryContents("' + path + '");';
        link.textContent = part;

        breadcrumb.appendChild(link);
        if (index < pathParts.length - 1) {
            breadcrumb.appendChild(document.createTextNode(' / '));
        }
    });
}

function downloadFiles() {
    let files = [];
    selectedFiles.forEach(file => {
        files.push(`/download?path=${file}`)
    });
    downloadAll(files)
    clearSelection();
}

function moveTo() {
    const destination = prompt('Enter destination path:');
    if (destination) {
        fetch(`/move?data=${JSON.stringify({ src: selectedFiles, dest: destination })}`, {
            method: 'POST'
        })
            .then(function(response) {
                if(response.ok) {
                    return response.text();
                }
                throw new Error('Something went wrong.');
            })  
            .then(function(text) {
                loadDirectoryContents(currentPath);
                clearSelection();
                showPopup('Files moved successfully!');
            })  
            .catch(function(error) {
                showError('Server error: ' + error);
            });
    }
}

function new_Folder() {
    const folder_name = prompt('Enter new folder name:');
    let new_path = currentPath + '/' + folder_name;
    new_path = new_path.replace(/\/\//g, '/');

    if (folder_name) {
        fetch(`/newfolder?data=${JSON.stringify({ foldername: new_path})}`, {
            method: 'POST'
        })
            .then(function(response) {
                if(response.ok) {
                    return response.text();
                }
                throw new Error('Something went wrong.');
            })  
            .then(function(text) {
                loadDirectoryContents(currentPath);
                clearSelection();
                showPopup('Directory created successfully!');
            })  
            .catch(function(error) {
                showError('Server error: ' + error);
            });
    }
}

function copyTo() {
    const destination = prompt('Enter destination path:');
    if (destination) {
        fetch(`/copy?data=${JSON.stringify({ src: selectedFiles, dest: destination })}`, {
            method: 'POST'
        })
            .then(function(response) {
                if(response.ok) {
                    return response.text();
                }
                throw new Error('Something went wrong.');
            })  
            .then(function(text) {
                loadDirectoryContents(currentPath);
                clearSelection();
                showPopup('Files copied successfully!');
            })  
            .catch(function(error) {
                showError('Server error: ' + error);
            });
    }
}

function renameFile() {
    if (selectedFiles.length !== 1) {
        alert('Please select exactly one file to rename.');
        return;
    }
    const newName = prompt('Enter new name:', selectedFiles[0].split('/').pop());

    let new_path = currentPath + '/' + newName;
    new_path = new_path.replace(/\/\//g, '/');

    if (newName) {
        fetch(`/rename?data=${JSON.stringify({ old_name: selectedFiles[0], new_name: new_path })}`, {
            method: 'POST'
        })
            .then(function(response) {
                if(response.ok) {
                    return response.text();
                }
                throw new Error('Something went wrong.');
            })  
            .then(function(text) {
                loadDirectoryContents(currentPath);
                clearSelection();
                showPopup('File renamed successfully!');
            })  
            .catch(function(error) {
                showError('Server error: ' + error);
            });
    }
}

function deleteFiles() {
    fetch(`/delete?files=${JSON.stringify(selectedFiles)}`, {
        method: 'DELETE'
    })
        .then(function(response) {
            if(response.ok) {
                return response.text();
            }
            throw new Error('Something went wrong.');
        })  
        .then(function(text) {
            loadDirectoryContents(currentPath);
            clearSelection();
            showPopup('Files deleted successfully!');
        })  
        .catch(function(error) {
            showError('Server error: ' + error);
        });
}

function clearSelection() {
    selectedFiles = [];
    document.querySelectorAll('#file-table input[type="checkbox"]').forEach(checkbox => checkbox.checked = false);
}

function hexEncode(buffer) {
    const byteArray = new Uint8Array(buffer);
    return Array.from(byteArray, byte => ('0' + (byte & 0xFF).toString(16)).slice(-2)).join('');
}

function uploadFile() {
    const fileInput = document.getElementById('file-upload');
    const files = fileInput.files;

    Array.from(files).forEach(file => {
        const reader = new FileReader();
        let new_path = currentPath + '/' + file.name;
        new_path = new_path.replace(/\/\//g, '/');

        showLoading(" Uploading file. Please wait... ");

        reader.onload = async function(event) {
            const fileSize = event.target.result.byteLength;
            const hexData = hexEncode(event.target.result);

            // Create and send the HTTP request
            const xhr = new XMLHttpRequest();
            xhr.open("POST", `/upload;${new_path};${fileSize}`, true);
            xhr.setRequestHeader("Content-Type", "text/plain");
            xhr.onreadystatechange = function() {
                if (xhr.readyState === XMLHttpRequest.DONE) {
                    if (xhr.status === 200) {
                        showNotification("File " + file.name + " uploaded successfully!");
                        loadDirectoryContents(currentPath);
                        clearSelection();
                    } else {
                        showError("File upload failed!")
                        loadDirectoryContents(currentPath);
                        clearSelection();
                    }
                }
            };
            xhr.send(hexData);
        };

        reader.readAsArrayBuffer(file);
    });
}
