from flask import Flask

app = Flask(__name__)  # No need to replace __name__

@app.route('/')
def home():
    return "Hello, world!"

if __name__ == '__main__':
    app.run(debug=True)