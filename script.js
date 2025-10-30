const video = document.getElementById('video');
const topPhoto = document.getElementById('top-photo');
const countdown = document.getElementById('countdown');
const startBtn = document.getElementById('start');
const downloadBtn = document.getElementById('download');
const retryBtn = document.getElementById('retry');
const bgUpload = document.getElementById('bg-upload');

let canvas = document.createElement('canvas');
let ctx = canvas.getContext('2d');
let stream;
let bottomPhoto;
let bgImage = null;

// Start camera
async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    video.play();
  } catch(err) {
    alert("Please allow camera access.");
  }
}
startCamera();

// Countdown
function startCountdown(seconds) {
  return new Promise(resolve => {
    let count = seconds;
    countdown.textContent = count;
    countdown.classList.remove('hidden');
    const interval = setInterval(() => {
      count--;
      if(count <= 0){
        clearInterval(interval);
        countdown.classList.add('hidden');
        resolve();
      } else countdown.textContent = count;
    }, 1000);
  });
}

// Rounded rectangle for final canvas
function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

// Handle background upload (PNG only)
bgUpload.addEventListener('change', function(e){
  const file = e.target.files[0];
  if(file && file.type === 'image/png'){
    const reader = new FileReader();
    reader.onload = function(event){
      bgImage = new Image();
      bgImage.src = event.target.result;
    }
    reader.readAsDataURL(file);
  } else {
    alert('Only PNG files are allowed!');
  }
});

// Capture two photos
async function captureTwoPhotos() {
  startBtn.classList.add('hidden');
  downloadBtn.classList.add('hidden');
  retryBtn.classList.add('hidden');

  // First photo
  await startCountdown(3);
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const firstPhoto = canvas.toDataURL('image/png');
  topPhoto.src = firstPhoto;
  topPhoto.classList.remove('hidden');

  await new Promise(r => setTimeout(r, 500));

  // Second photo
  await startCountdown(3);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const secondPhoto = canvas.toDataURL('image/png');

  // Stop video
  video.pause();
  video.srcObject.getTracks().forEach(track => track.stop());
  video.classList.add('hidden');

  // Show second photo
  if(bottomPhoto) bottomPhoto.remove();
  bottomPhoto = document.createElement('img');
  bottomPhoto.src = secondPhoto;
  bottomPhoto.classList.add('photo');
  video.parentNode.appendChild(bottomPhoto);

  // Final canvas (4x6 portrait at 300 DPI)
  const dpi = 300;
  const finalWidth = 4 * dpi;   // 1200px
  const finalHeight = 6 * dpi;  // 1800px
  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = finalWidth;
  finalCanvas.height = finalHeight;
  const finalCtx = finalCanvas.getContext('2d');

  // White background
  finalCtx.fillStyle = '#fff';
  finalCtx.fillRect(0, 0, finalWidth, finalHeight);

  // Convert inches to pixels for photo positions
  const xPos = 0.23 * dpi;        // 69px
  const yPos1 = 0.41 * dpi;       // 123px
  const yPos2 = 3.05 * dpi;       // 915px
  const photoWidth = 3.53 * dpi;  // 1059px
  const photoHeight = 2.52 * dpi; // 756px

  // Draw captured photos first
  const img1 = new Image();
  const img2 = new Image();
  img1.src = firstPhoto;
  img2.src = secondPhoto;
  await Promise.all([
    new Promise(r => img1.onload = r),
    new Promise(r => img2.onload = r)
  ]);
  finalCtx.drawImage(img1, xPos, yPos1, photoWidth, photoHeight);
  finalCtx.drawImage(img2, xPos, yPos2, photoWidth, photoHeight);

  // Draw PNG overlay on top
  if(bgImage){
    finalCtx.drawImage(bgImage, 0, 0, finalWidth, finalHeight);
  }

  // Footer text
  finalCtx.fillStyle = '#333';
  finalCtx.font = 'bold 30px Arial';
  finalCtx.textAlign = 'center';
  finalCtx.fillText('📸 Made with Photo Booth', finalWidth / 2, finalHeight - 20);

  downloadBtn.dataset.image = finalCanvas.toDataURL('image/png');
  downloadBtn.classList.remove('hidden');
  retryBtn.classList.remove('hidden');
}


// Button events
startBtn.addEventListener('click', captureTwoPhotos);

downloadBtn.addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = 'photobooth.png';
  link.href = downloadBtn.dataset.image;
  link.click();
});

retryBtn.addEventListener('click', () => {
  topPhoto.classList.add('hidden');
  if(bottomPhoto) bottomPhoto.remove();
  video.classList.remove('hidden');
  startCamera();
  startBtn.classList.remove('hidden');
  downloadBtn.classList.add('hidden');
  retryBtn.classList.add('hidden');
});
