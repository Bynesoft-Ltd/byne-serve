<div align="center">

# 📊 BYNE-SERVE 📈

</div>

---

<div align="center">

[![Slack Follow](https://img.shields.io/badge/slack-%23community-4f8eba?logo=slack)](https://join.slack.com/share/enQtNzgyMjY1MzI2NzQ3OS02YjAxOWU3YzlhY2MyOTg1ZWFhODI0YTQ2ZTg2ZGYxMjU1Y2MzNDJiZWJjYjYwOGJiMGJmYmUwNTJkNWUxZjZl)
[![GitHub Repo stars](https://img.shields.io/github/stars/BorysByne/byne-serve?style=social)](https://github.com/BorysByne/byne-serve)
[![LinkedIn Follow](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/company/bynesoftai)

</div>

---

<div align="center">

### Google Analytics for open-source models

</div>

---
<div align="center">

[![See it in action](https://cdn.loom.com/sessions/thumbnails/b7affe925e5a48c19388649551ba29e9-fd3269d87a0371e6-full-play.gif)](https://www.loom.com/embed/b7affe925e5a48c19388649551ba29e9?sid=1482cb94-ee4a-44f3-a689-e2e732554a44)

(click to open the video in Loom)

</div>

---

📫 Join our [Slack channel](https://join.slack.com/share/enQtNzgyMjY1MzI2NzQ3OS02YjAxOWU3YzlhY2MyOTg1ZWFhODI0YTQ2ZTg2ZGYxMjU1Y2MzNDJiZWJjYjYwOGJiMGJmYmUwNTJkNWUxZjZl) for updates on future releases. 📬

---

<!-- TOC -->
* [🔌 Requirements](#-requirements)
* [🐳 How to start byne-serve?](#-how-to-start-byne-serve-in-docker)
* [🏗 How byne-serve works?](#-how-byne-serve-works)
* [🔒 Privacy and data collection](#-privacy-and-data-collection)
<!-- TOC -->

---

byne-serve aims to provide Google Analytics-like user action tracking for open-source models hosted on Hugging Face, offering usage insights while respecting user privacy (as much as we can).

**The project is born out of our struggle to make sense of the "Downloaded This Month" widget on HuggingFace. Seriously, humanity has advanced enough to track every single click when you give people a web app, but the best you get when open-sourcing a model is "Downloaded This Month"?**


---

# 🔌 Requirements

- **Python 3.9++**
- Docker


# 🐳 How to start byne-serve in docker?

1. Clone and set up the repository:
   ```
   git clone https://github.com/BorysByne/byne-serve.git
   cd byne-serve
   # Fill in the .env file with your configuration
   docker compose --env-file .env -f docker-compose.yml -p byne-serve up -d --build
   ```

2. Register on the byne-serve app and create a new model.

3. Wrap your model:
   ```
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   cd scripts
   python wrap_model.py
   # Follow prompts for source repo, target repo, and deployment URL
   ```

4. Access your server to view tracking data and analytics.


# 🏗 How byne-serve works?

1. You specify a Hugging Face model repository to track.
2. byne-serve wraps the model with tracking code.
3. Users can opt-out of tracking by setting `trust_remote_code=False`.
4. The system collects usage data and error reports.
5. You can view analytics and improve your model based on real-world usage.

Under the hood, we create a custom code version of the Huggingface repo to bind AutoModel and AutoModelFor* classes to a wrapper with tracking code. Doing magic with custom code enables us to keep the experience identical to using an untracked model from the end user's perspective. 

This approach has a few important limitations: 
1. Non-auto classes will not be tracked. 
2. Models with custom code require manual integration of the tracking code. View the [Guide](/custom_code.MD) to learn more about using byne-serve with custom code models.

# 🔒 Privacy and data collection

byne-serve collects:
- Unique machine ID for user tracking
- Detailed bug reports including OS, Python, CUDA info. GPU info for non-CUDAs will be added soon. 

This stuff can sometimes include the user name / surname in the files pathes. We're dealing with this to ensure GDPR compliance. 

---

<div align="center">

### Hosted Solution Coming Soon!

Stay tuned for our fully managed, hassle-free byne-serve hosted option.

</div>
