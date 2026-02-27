// Detect intrusion from left and right sides only
export const detectMultiplePeople = async (video) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    ctx.drawImage(video, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    const w = canvas.width;
    const h = canvas.height;
    
    // Only check left and right edges
    const leftEdge = analyzeRegion(data, 0, w * 0.15, 0, h, w, h);
    const rightEdge = analyzeRegion(data, w * 0.85, w, 0, h, w, h);

    const analysis = {
        suspiciousActivity: false,
        warning: null
    };

    console.log('🔍 Detection:', { left: leftEdge.toFixed(1), right: rightEdge.toFixed(1) });

    if (leftEdge > 30) {
        analysis.suspiciousActivity = true;
        analysis.warning = 'Intrusion from Left Side';
    } else if (rightEdge > 30) {
        analysis.suspiciousActivity = true;
        analysis.warning = 'Intrusion from Right Side';
    }

    return analysis;
};

const analyzeRegion = (data, startX, endX, startY, endY, width, height) => {
    let activity = 0;
    let totalPixels = 0;
    const step = 6;
    
    for (let y = startY; y < endY; y += step) {
        for (let x = startX; x < endX; x += step) {
            const i = (y * width + x) * 4;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const brightness = (r + g + b) / 3;
            
            // Detect edges
            if (x + step < endX) {
                const nextI = (y * width + (x + step)) * 4;
                const nextBrightness = (data[nextI] + data[nextI + 1] + data[nextI + 2]) / 3;
                if (Math.abs(brightness - nextBrightness) > 30) {
                    activity += 2;
                }
            }
            
            // Detect skin tones
            if (r > 95 && g > 40 && b > 20 && r > g && r > b && Math.abs(r - g) > 15) {
                activity += 3;
            }
            
            totalPixels++;
        }
    }
    
    return (activity / totalPixels) * 100;
};
