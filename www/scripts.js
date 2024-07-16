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
                nameCell.innerHTML = `<img src="icons/up.png" class="file-icon"> ..`;

                const sizeCell = document.createElement('td');
                sizeCell.textContent = '';

                row.appendChild(selectCell);
                row.appendChild(nameCell);
                row.appendChild(sizeCell);
                fileTable.appendChild(row);
            }

            data.contents.forEach(file => {
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
                const icon = document.createElement('img');
                icon.className = 'file-icon';
                icon.src = file.isDirectory ? 'icons/folder.png' : 'icons/file.png';
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
    const file = fileInput.files[0];
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
}
