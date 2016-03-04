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
import app.settings
import sample_strings
from flask import Flask
from flask.ext.testing import TestCase
from app import app
from utils import print_test_time_elapsed


class StartingTestCase(TestCase):
    def setUp(self):
        self.client = app.test_client()
        config.WTF_CSRF_ENABLED = False

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
        app.config['TESTING'] = True
        self.baseURL = "http://lvh.me:5000/"
        return app

    # --------------------------------------------------------------------------
    # Simple tests to make sure server is UP
    # (does NOT use LiveServer)
    # --------------------------------------------------------------------------
    @print_test_time_elapsed
    def test_real_server_is_up_and_running(self):
        response = urllib.request.urlopen(self.baseURL)
        self.assertEqual(response.code, 200)
        # returned source code is stored in
        # response.read()

    # --------------------------------------------------------------------------
    # Testing Views with GET
    # --------------------------------------------------------------------------
    @print_test_time_elapsed
    def test_view_form_resumo_get(self):
        rv = self.client.get('/')
        # print(rv.data)
        assert rv.status_code == 200
        assert 'Please enter your text:' in str(rv.data)

    # --------------------------------------------------------------------------
    # Testing Views with POST
    # --------------------------------------------------------------------------
    @print_test_time_elapsed
    def test_view_form_resumo_post(self):
        post_data = {'texto': self.small_str}
        rv = self.client.post('/', data=post_data, follow_redirects=True)
        assert rv.status_code == 200
        assert 'Todos os direitos reservados' in str(rv.data)


    @print_test_time_elapsed
    def test_view_form_resumo_post_with_textrank(self):
        post_data = {'texto': self.small_str, 'algorithm': 'textrank'}
        rv = self.client.post('/', data=post_data, follow_redirects=True)
        assert rv.status_code == 200
        assert 'Todos os direitos reservados' in str(rv.data)


    @print_test_time_elapsed
    def test_ajax_resumo_post(self):
        post_data = {'texto': self.small_str}
        rv = self.client.post('/ajax_resumo',
                              data=post_data,
                              follow_redirects=True)
        assert rv.status_code == 200
        # the ajax view returns nothing but the string
        assert b'Todos os direitos reservados' == rv.data


    @print_test_time_elapsed
    def test_ajax_resumo_post_with_textrank(self):
        post_data = {'texto': self.small_str, 'algorithm': 'textrank'}
        rv = self.client.post('/ajax_resumo',
                              data=post_data,
                              follow_redirects=True)
        assert rv.status_code == 200
        assert b'Todos os direitos reservados' == rv.data


if __name__ == '__main__':
    unittest.main()
