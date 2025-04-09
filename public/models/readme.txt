
This folder would normally contain face-api.js models.

However, to avoid requiring downloads, the application is now configured to load models directly from the face-api.js CDN:
https://justadudewhohacks.github.io/face-api.js/models/

The models used are:
- tiny_face_detector_model
- face_expression_model
- face_landmark_68_model
- face_recognition_model

These additional models (landmarks and recognition) improve emotion detection accuracy, especially for emotions other than neutral and happy.

This approach eliminates the need to download and host the models locally.
