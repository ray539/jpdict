from flask import Flask, url_for, request
from markupsafe import escape
import json as JSON #no name conflict with flask

# __name__
# where the script is being run from. Flask needs to know this
app = Flask(__name__)

# 'app.route' by default only answers GET requests
# there is also app.post, app.put etc.
@app.route('/')
def hello_word():
  a = 123
  
  # if we use:
  # <div>{escape(a)}</div>
  # say that value of a was <script> alert('bad')</script>
  # then when the endpoint is returned, the script will run
  # escape makes sure this doesn't happen
  return f"<div>hello, {a} </div>"


# if user visits http://127.0.0.1:5000/post/1
#   they get the msg 'Post 1'
@app.route('/post/<int:post_id>')
def show_post(post_id):
  return f"Post {post_id}"

@app.route('/projects/')
def projects():
    return 'The project page'

@app.route('/about')
def about():
    return 'The about page'
  
@app.route('/login')
def login():
    return 'login'

@app.route('/user/<username>')
def profile(username):
    return f'{username}\'s profile'

@app.get('/json')
def json():
  return {
    "msg": 'this is in a json'
  }

@app.get('/get-req')
def get_req():
  searchStr = request.args.get('searchStr', '')
  return searchStr

@app.post('/post')
def post_req():
  data = request.get_data(as_text=True)
  data = JSON.loads(data)
  return data

with app.test_request_context():
  # url_for takes in a name of a function, and other variables, which are
  #  - other variables in the url (so here, username)
  # unknown parts are given by query parameters
  # it then returns the path
  # print(url_for('profile', username='asd asd'))
  
  # STATIC FILES
  # url_for('static', filename='style.css')
  # if you have the route static/style.css
  # the following code above will generate the url for that
  pass