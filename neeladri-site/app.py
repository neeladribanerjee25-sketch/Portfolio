import csv
import os
from flask import Flask, render_template

app = Flask(__name__)

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")


def load_csv(filename):
    """Read a CSV file from the data/ folder into a list of dicts."""
    path = os.path.join(DATA_DIR, filename)
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def find_profile_photo():
    """Look for a pfp.* file in static/img/ and return its filename, or None."""
    img_dir = os.path.join(app.static_folder, "img")
    if not os.path.isdir(img_dir):
        return None
    for fname in os.listdir(img_dir):
        if os.path.splitext(fname)[0].lower() == "pfp":
            return fname
    return None


@app.route("/")
def index():
    context = {
        "hobbies": load_csv("hobbies.csv"),
        "projects": load_csv("projects.csv"),
        "gallery": load_csv("gallery.csv"),
        "community_stats": load_csv("community_stats.csv"),
        "skills": load_csv("skills.csv"),
        "profile_photo": find_profile_photo(),
    }
    return render_template("index.html", **context)


if __name__ == "__main__":
    app.run(debug=True)