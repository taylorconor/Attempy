# -*- coding: utf-8 -*-
#!flask/bin/python

import os
import unittest
import tempfile
import sys
sys.path.append('..')
import urllib  # cant use urllib2 in python3 :P
import sample_strings
from random import randint
from flask import Flask, json
from flask.ext.testing import TestCase
from app import app, settings
from utils import print_test_time_elapsed

class StartingTestCase(TestCase):
    def setUp(self):
        self.client = app.test_client()
        settings.WTF_CSRF_ENABLED = False

    def tearDown(self):
        pass

    def create_app(self):
        """
        This is a requirement for Flask-Testing
        """
        app = Flask(__name__)
        app.config['TESTING'] = True
        self.baseURL = "http://lvh.me:5000/"
        return app

    def register(self, email, name, password):
        data = {
            'email': email,
            'password': password,
            'name': name
        }
        return self.client.post('/register', data=data, follow_redirects=True)

    def login(self, email, password):
        data = {
            'email': email,
            'password': password,
            'remember-me': 'y'
        }
        return self.client.post('/login', data=data, follow_redirects=True)

    def logout(self):
        return self.client.get('/logout', follow_redirects=True)

    def handler_changed(self, handler):
        data = {
            'handler': handler
        }
        return self.client.post('/handler_changed', data=data, follow_redirects=True)

    def pml_source_submit(self, file_name):
        data = {
            'data': file_name
        }
        return self.client.post('/pml_source_submit', data=data, follow_redirects=True)

    def pml_save_file(self, path, text):
        data = {
            "path":path,
            "text":text
        }
        headers = {'contentType': 'application/json;charset=UTF-8'}
        return self.client.post('/pml_save_file', data=data, headers=headers, follow_redirects=True) 

    def pml_load_file(self, path):
        data = {
            'data': path
        }
        return self.client.post('/pml_load_file', data=data, follow_redirects=True) 

    def pml_to_json(self, file_name):
        data = {
            'data': file_name
        }
        return self.client.post('/get_pml_json', data=data)

    def createFile(self, file_name):
        data = {
            'data': file_name
        }
        return self.client.post('/createFile', data=data, follow_redirects=True) 

    def pml_load_file_sidebar(self):
        return self.client.get('/pml_load_file_sidebar')

    @print_test_time_elapsed
    def test_00_register_loads(self):
        rv = self.client.get('/register')
        assert rv.status_code == 200
        assert len(str(rv.data)) > 0

    @print_test_time_elapsed
    def test_01_register(self):
        rv = self.register(sample_strings.valid_user, sample_strings.valid_name, sample_strings.valid_password)
        assert rv.status_code == 200
        rv = self.register(sample_strings.valid_user, sample_strings.valid_name, sample_strings.valid_password)        
        assert "User already registered with that email" in rv.data
        rv = self.register(sample_strings.valid_user + str(randint(0,9999999)), sample_strings.valid_password, sample_strings.valid_name)
        assert "User successfully registered" in rv.data

    @print_test_time_elapsed
    def test_02_login_loads(self):
        rv = self.client.get('/login')
        assert rv.status_code == 200
        assert len(str(rv.data)) > 0


    @print_test_time_elapsed
    def test_03_login(self):
        rv = self.login(sample_strings.valid_user, sample_strings.valid_password)
        assert 'Logged in' in rv.data
        rv = self.logout()
        rv = self.login(sample_strings.valid_user + str(randint(0,9999999)), "fake")
        assert "No user with that email or user uses third party login" in rv.data

    @print_test_time_elapsed
    def test_04_home_loads(self):
        rv = self.login(sample_strings.valid_user, sample_strings.valid_password)
        rv = self.client.get('/')
        assert rv.status_code == 200
        assert 'id="editor"' in rv.data
        
    @print_test_time_elapsed
    def test_05_graphic_editor_loads(self):
        rv = self.login(sample_strings.valid_user, sample_strings.valid_password)
        rv = self.client.get('/graphical_editor')
        assert rv.status_code == 200
    
    @print_test_time_elapsed
    def test_06_handler_changed(self):
        rv = self.login(sample_strings.valid_user, sample_strings.valid_password)
        rv = self.handler_changed("vim")
        assert rv.status_code == 200
        assert 'Success' in rv.data 

    @print_test_time_elapsed
    def test_07_createFile(self):
        rv = self.login(sample_strings.valid_user, sample_strings.valid_password)
        rv = self.createFile("/"+sample_strings.file_name)
        assert rv.status_code == 200
        assert 'Success' in rv.data 
        assert os.path.isfile("uploads/1/"+sample_strings.file_name) 
        # writes over
        rv = self.createFile("/"+sample_strings.file_name)
        assert rv.status_code == 200
        assert 'Success' in rv.data 
        assert os.path.isfile("uploads/1/"+sample_strings.file_name) 
        # still writes over
        rv = self.createFile(sample_strings.file_name)
        assert rv.status_code == 200
        assert 'Success' in rv.data 
        assert os.path.isfile("uploads/1/"+sample_strings.file_name)

        rv = self.createFile("/")
        assert rv.status_code == 200
        assert 'Failed' in rv.data

        rv = self.createFile(sample_strings.long_name)
        assert rv.status_code == 200
        assert 'Failed' in rv.data 

        rv = self.createFile("../../..testingDir.pml")
        assert rv.status_code == 200
        assert 'Success' in rv.data
        assert os.path.isfile("uploads/1/testingDir.pml") 

    @print_test_time_elapsed
    def test_08_pml_save_file(self):
        rv = self.login(sample_strings.valid_user, sample_strings.valid_password)
        rv = self.pml_save_file(sample_strings.file_name, sample_strings.valid_pml)
        assert rv.status_code == 200
        assert 'Success' in rv.data
        assert os.path.isfile("uploads/1/"+sample_strings.file_name)
        fd = os.open("uploads/1/"+sample_strings.file_name,os.O_RDWR)
        ret = os.read(fd,len(sample_strings.valid_pml))
        os.close(fd)
        assert ret in sample_strings.valid_pml

    @print_test_time_elapsed
    def test_09_pml_load_file(self):
        rv = self.login(sample_strings.valid_user, sample_strings.valid_password)
        rv = self.pml_save_file(sample_strings.file_name, sample_strings.valid_pml)
        fd = os.open("uploads/1/"+sample_strings.file_name,os.O_RDWR)
        ret = os.read(fd,16)
        os.close(fd)
        rv = self.pml_load_file(sample_strings.file_name)
        assert ret in rv.data

    @print_test_time_elapsed
    def test_10_pml_load_file_sidebar(self):
        rv = self.login(sample_strings.valid_user, sample_strings.valid_password)
        rv = self.pml_load_file_sidebar()
        assert rv.status_code == 200
        assert sample_strings.file_name in rv.data
    
    @print_test_time_elapsed
    def test_11_pml_to_json(self):
        rv = self.pml_to_json("commit_changes_testfile.pml")
        #TODO: finish this

if __name__ == '__main__':
    unittest.main()
