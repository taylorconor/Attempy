# -*- coding: utf-8 -*-
#!flask/bin/python

# See:
# http://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-vii-unit-testing
# https://pythonhosted.org/Flask-Testing/
# http://flask.pocoo.org/docs/0.10/testing/#testing

import os
import unittest
import tempfile
import sys
sys.path.append('..')
import urllib  # cant use urllib2 in python3 :P
import sample_strings
from flask import Flask
from flask.ext.testing import TestCase
from app import app, settings
from utils import print_test_time_elapsed

class StartingTestCase(TestCase):
    def setUp(self):
        self.client = app.test_client()
        settings.WTF_CSRF_ENABLED = False

        # load sample strings
        self.small_str = sample_strings.small_text
        self.medium_str = sample_strings.medium_text
        self.large_str = sample_strings.large_text

    def tearDown(self):
        pass

    def create_app(self):
        """
        This is a requirement for Flask-Testing
        """
        app = Flask(__name__)
        # app.settings['TESTING'] = True
        self.baseURL = "http://lvh.me:5000/"
        return app

    def login(self, username, password):
        return self.client.post('/login', data=dict(
            email=username,
            password=password        
        ), follow_redirects=True)

    def logout(self):
        return self.client.get('/logout', follow_redirects=True)

    # --------------------------------------------------------------------------
    # Simple tests to make sure server is UP
    # (does NOT use LiveServer)
    # --------------------------------------------------------------------------
    @print_test_time_elapsed
    def test_real_server_is_up_and_running(self):
        response = urllib.urlopen(self.baseURL)
        self.assertEqual(response.code, 200)

    @print_test_time_elapsed
    def test_login_loads(self):
        rv = self.client.get('/login')
        assert rv.status_code == 200
        assert len(str(rv.data)) > 0

    @print_test_time_elapsed
    def test_login(self):
        rv = self.login(sample_strings.valid_user, sample_strings.valid_password)
        print(str(rv.data))
        assert 'You were logged in' in rv.data
        rv = self.logout()
        assert 'You were logged out' in rv.data
        rv = self.login('adminx', 'default')
        assert 'Invalid username' in rv.data
        rv = self.login(sample_strings.valid_user, sample_strings.valid_password)
        assert 'Invalid password' in rv.data
    # # --------------------------------------------------------------------------
    # # Testing Views with GET
    # # --------------------------------------------------------------------------
    # @print_test_time_elapsed
    # def test_view_form_resumo_get(self):
    #     rv = self.client.get('/')
    #     # print(rv.data)
    #     assert rv.status_code == 200
    #     assert 'Please enter your text:' in str(rv.data)

    # # --------------------------------------------------------------------------
    # # Testing Views with POST
    # # --------------------------------------------------------------------------
    # @print_test_time_elapsed
    # def test_view_form_resumo_post(self):
    #     post_data = {'texto': self.small_str}
    #     rv = self.client.post('/', data=post_data, follow_redirects=True)
    #     assert rv.status_code == 200
    #     assert 'Todos os direitos reservados' in str(rv.data)


    # @print_test_time_elapsed
    # def test_view_form_resumo_post_with_textrank(self):
    #     post_data = {'texto': self.small_str, 'algorithm': 'textrank'}
    #     rv = self.client.post('/', data=post_data, follow_redirects=True)
    #     assert rv.status_code == 200
    #     assert 'Todos os direitos reservados' in str(rv.data)


    # @print_test_time_elapsed
    # def test_ajax_resumo_post(self):
    #     post_data = {'texto': self.small_str}
    #     rv = self.client.post('/ajax_resumo',
    #                           data=post_data,
    #                           follow_redirects=True)
    #     assert rv.status_code == 200
    #     # the ajax view returns nothing but the string
    #     assert b'Todos os direitos reservados' == rv.data


    # @print_test_time_elapsed
    # def test_ajax_resumo_post_with_textrank(self):
    #     post_data = {'texto': self.small_str, 'algorithm': 'textrank'}
    #     rv = self.client.post('/ajax_resumo',
    #                           data=post_data,
    #                           follow_redirects=True)
    #     assert rv.status_code == 200
    #     assert b'Todos os direitos reservados' == rv.data



if __name__ == '__main__':
    unittest.main()
