# AI-Powered Cheating Detection System

## ✅ Installation Complete

The real-time AI face detection system has been successfully integrated into your FairExam platform.

## 🎯 Features Implemented

### 1. Real Face Detection
- ✅ Uses face-api.js with TinyFaceDetector
- ✅ Detects multiple faces in real-time
- ✅ Tracks face presence continuously
- ✅ Updates every 500ms

### 2. Violation Detection Rules

#### Rule 1: Multiple Faces (2+ seconds)
- **Trigger:** More than 1 face detected for 2+ seconds
- **Warning:** "⚠️ Multiple people detected. Please ensure you are alone."
- **Violation Type:** `MULTIPLE_PERSON_DETECTED`

#### Rule 2: No Face (3+ seconds)
- **Trigger:** No face detected for 3+ seconds
- **Warning:** "⚠️ Face not detected. Please stay in front of the camera."
- **Violation Type:** `FACE_NOT_VISIBLE`

#### Rule 3: Suspicious Movement
- **Trigger:** Frequent face disappearance/reappearance
- **Warning:** "⚠️ Suspicious movement detected."
- **Violation Type:** `SUSPICIOUS_MOVEMENT`

### 3. Real-Time Warning System
- Live warning banner above camera feed
- Color-coded alerts (red, orange, yellow)
- Auto-hide when issue resolved
- Toast notifications for critical violations

### 4. Violation Logging
- All violations logged with timestamp
- Violation count displayed in footer
- Console logging for debugging
- Ready for backend API integration

## 🚀 How to Use

### 1. Start the Application
```bash
cd frontend
npm run dev
```

### 2. Login as Candidate
- URL: `http://localhost:5173/candidate-login`
- ID: `DEMO123`
- Password: `pass123`

### 3. Start Exam
- Camera will activate automatically
- AI detection starts immediately
- Violations are logged in real-time

## 🎥 Camera Controls

- **OFF/ON Button:** Toggle camera temporarily (top-right of camera widget)
- **Live Indicator:** Green = AI Active, Red = Off
- **Face Count:** Shows number of faces detected
- **Violations Counter:** Shows total violations logged

## 📊 Violation Types

| Type | Description | Threshold |
|------|-------------|-----------|
| `MULTIPLE_PERSON_DETECTED` | Multiple faces in frame | 2 seconds |
| `FACE_NOT_VISIBLE` | No face detected | 3 seconds |
| `SUSPICIOUS_MOVEMENT` | Frequent face switching | Pattern-based |

## 🔧 Technical Details

### Models Used
- **tiny_face_detector**: Fast face detection
- **face_landmark_68**: Facial landmark detection
- **face_recognition**: Face recognition capabilities

### Detection Parameters
- **Input Size:** 224px
- **Score Threshold:** 0.5
- **Detection Interval:** 500ms
- **Video Mirrored:** Yes

## 🛠️ Customization

### Adjust Detection Sensitivity
Edit `LiveCameraMonitor.jsx`:
```javascript
// Change detection interval (line 500ms)
detectionIntervalRef.current = setInterval(async () => {
    await detectFaces();
}, 500); // Change to 1000 for 1 second

// Change score threshold
new faceapi.TinyFaceDetectorOptions({ 
    inputSize: 224, 
    scoreThreshold: 0.5 // Lower = more sensitive
})
```

### Adjust Violation Thresholds
```javascript
// Multiple faces threshold (currently 2000ms = 2 seconds)
if (duration > 2000) { ... }

// No face threshold (currently 3000ms = 3 seconds)
if (duration > 3000) { ... }
```

## 📝 Next Steps

### Backend Integration
1. Create violation API endpoint
2. Send violations to backend in real-time
3. Store in MongoDB
4. Display in examiner dashboard

### Advanced Features
- Head pose estimation (looking away detection)
- Eye gaze tracking
- Audio detection
- Tab switch detection
- Screenshot capture on violation

## 🐛 Troubleshooting

### Models Not Loading
- Check `frontend/public/models/` directory exists
- Verify all model files downloaded
- Check browser console for errors

### Camera Not Working
- Grant camera permissions
- Check HTTPS (required for camera access)
- Try different browser

### False Positives
- Adjust `scoreThreshold` (lower = stricter)
- Increase time thresholds
- Improve lighting conditions

## 📦 Files Modified/Created

1. `frontend/src/components/LiveCameraMonitor.jsx` - Main AI detection component
2. `frontend/src/hooks/useViolationLogger.js` - Violation logging hook
3. `frontend/public/models/` - Face detection models
4. `frontend/download-models.bat` - Model download script

## ✨ System Status

- ✅ Face-api.js installed
- ✅ AI models downloaded
- ✅ Real-time detection active
- ✅ Violation logging implemented
- ✅ Warning system functional
- ✅ Camera controls added

## 🎓 Test Scenarios

1. **Normal Exam:** Single face visible → No warnings
2. **Multiple People:** 2+ faces for 2+ seconds → Warning triggered
3. **Leave Frame:** Face disappears for 3+ seconds → Warning triggered
4. **Quick Movement:** Rapid face switching → Suspicious movement detected

Your AI-powered cheating detection system is now fully operational! 🚀
