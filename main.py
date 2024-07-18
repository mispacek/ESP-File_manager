ssid = "Your Wifi SSID"
password = "Wifi Password"



import gc
import os
import time
import network
from micropython import alloc_emergency_exception_buf

alloc_emergency_exception_buf(128)

gc.collect()

def reset():
    from machine import reset
    reset()
    

def do_connect():
    sta_if = network.WLAN(network.STA_IF)
    if not sta_if.isconnected():
        print('Connecting to Wifi...')
        sta_if.active(True)
        sta_if.connect(ssid, password)
        while not sta_if.isconnected():
            pass
    print('Wifi Settings:', sta_if.ifconfig())

# Connect to wifi
do_connect()




# Start WWW serveru
from web_server import WebServer

webserver = WebServer(web_folder='/www', port=80)




# handlers for filemanager
import filemanager

@webserver.handle('/contents')
def _handle_contents(client, path, request):
    filemanager.handle_contents(client, path, request)

@webserver.handle('/upload')
def _handle_upload(client, path, request):
    filemanager.handle_upload(client, path, request)

@webserver.handle('/download')
def _handle_download(client, path, request):
    filemanager.handle_download(client, path, request)

@webserver.handle('/delete')
def _handle_delete(client, path, request):
    filemanager.handle_delete(client, path, request)

@webserver.handle('/rename')
def _handle_rename(client, path, request):
    filemanager.handle_rename(client, path, request)

@webserver.handle('/newfolder')
def _handle_newfolder(client, path, request):
    filemanager.handle_newfolder(client, path, request)

@webserver.handle('/move')
def _handle_move(client, path, request):
    filemanager.handle_move(client, path, request)

@webserver.handle('/copy')
def _handle_copy(client, path, request):
    filemanager.handle_copy(client, path, request)

@webserver.handle('/status')
def _handle_status(client, path, request):
    filemanager.handle_status(client, path, request)




webserver.start()

gc.collect()